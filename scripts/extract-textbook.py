#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
extract-textbook.py — 扫描教材 PDF 的目录与实验栏目，生成索引 JSON（只读）

用法：
  python scripts/extract-textbook.py                 # 默认扫 D:/textbook
  python scripts/extract-textbook.py E:/books       # 指定目录
  npm run textbook:scan                            # 等价

输出：scripts/textbook-outline.json
依赖：pypdf（已随工程放在 scripts/vendor，开箱即用）

只读取源 PDF，绝不修改、移动或删除它们。以后往教材目录里丢新书，
重跑一次即可得到新的章节/栏目索引，据此往 experiments.js 批量补实验。
"""
import sys, os, re, json, glob, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, 'vendor'))
try:
    from pypdf import PdfReader
except ImportError:
    sys.exit('缺少 pypdf：运行 pip install pypdf，或确认 scripts/vendor/pypdf 存在')

SRC = sys.argv[1] if len(sys.argv) > 1 else 'D:/textbook'
OUT = os.path.join(HERE, 'textbook-outline.json')
OCR_FILE = os.path.join(HERE, 'textbook-ocr.json')

CH_RE = re.compile(r'^第[一二三四五六七八九十百]+章[\s\u3000]*(.*)$')
SEC_RE = re.compile(r'^(\d+)\.[\s\u3000]*(.+)$')
LAB_RE = re.compile(r'^(实验\s*[:：]\s*.{2,40}|探究.{2,36}|演示.{2,36})$')
BAD_PUNCT = re.compile(r'[，。；？！]')


def clean(s):
    return re.sub(r'[\s\u3000]+', ' ', s).strip()


def scan_pages(reader):
    pages = []
    for pg in reader.pages:
        try:
            pages.append(pg.extract_text() or '')
        except Exception:
            pages.append('')
    return pages


def find_toc(pages):
    """在前 8 页里挑「章标题最多、节标题最多」的一页当目录页。"""
    best, best_score, best_idx = None, -1, -1
    for i, t in enumerate(pages[:8]):
        lines = [clean(x) for x in t.split('\n')]
        ch = sum(1 for x in lines if CH_RE.match(x))
        sec = sum(1 for x in lines if SEC_RE.match(x))
        score = ch * 4 + sec + (2 if ('目' in t and '录' in t) else 0)
        if score > best_score:
            best, best_score, best_idx = lines, score, i + 1
    return best or [], best_idx


def parse_toc(lines):
    chapters, front, cur = [], [], None
    for x in lines:
        m = CH_RE.match(x)
        if m:
            cur = {'name': clean('第' + x.split('章')[0].split('第')[-1] + '章 ' + m.group(1)), 'sections': []}
            chapters.append(cur)
            continue
        m = SEC_RE.match(x)
        if m and cur is not None:
            cur['sections'].append(m.group(1) + '. ' + clean(m.group(2)))
            continue
        if cur is None and x and not x.isdigit() and len(x) < 40 and not BAD_PUNCT.search(x):
            front.append(x)
    # 目录页页眉可能重复出现章名（且不带节），按章名合并、保留节最多的一条
    merged, order = {}, []
    for c in chapters:
        if c['name'] not in merged:
            merged[c['name']] = c
            order.append(c['name'])
        elif len(c['sections']) > len(merged[c['name']]['sections']):
            merged[c['name']] = c
    return front, [merged[n] for n in order]


def parse_labs(pages):
    out = []
    for i, t in enumerate(pages):
        for raw in t.split('\n'):
            x = clean(raw)
            if not (4 <= len(x) <= 42) or BAD_PUNCT.search(x):
                continue
            if not LAB_RE.match(x):
                continue
            x = re.sub(r'\d+$', '', x).strip()
            if not any(o['title'] == x for o in out):
                out.append({'page': i + 1, 'title': x})
    return out


def read_implemented():
    """从 experiments.js 里读出已落地的教材实验（id → chapter），供索引对照。"""
    js = os.path.join(os.path.dirname(HERE), 'src', 'common', 'experiments.js')
    if not os.path.isfile(js):
        return []
    out, cur = [], {}
    for line in open(js, encoding='utf-8').read().splitlines():
        # m1_ / m2_ 是人教A版数学必修一/二批次；gk_ / mgk_ 是教材外高考专题，故意不计入。
        m = re.search(r"id: '((?:b[123]|j8a|j8b|j9|m1|m2)_[A-Za-z0-9_]+)'", line)
        if m:
            cur = {'id': m.group(1)}
        m = re.search(r"chapter: '([^']+)'", line)
        if m and cur.get('id'):
            cur['chapter'] = m.group(1)
        if line.strip() in ('},', '}') and cur.get('id') and cur.get('chapter'):
            out.append(cur)
            cur = {}
    return out


def load_ocr_toc():
    """扫描图片版教材没有文本层，目录由 ocr-textbook.py 提供。"""
    if not os.path.isfile(OCR_FILE):
        return {}
    try:
        with open(OCR_FILE, encoding='utf-8') as fh:
            data = json.load(fh)
        return {b['file']: b for b in data.get('books', [])}
    except Exception as e:
        print('读取 OCR 索引失败：%s' % e, file=sys.stderr)
        return {}


def ocr_summary(book):
    """把 OCR 目录页整理成章标题清单 + 每页可读行文本。"""
    chapters, toc_pages = [], []
    for pg in book.get('scannedPages', []):
        if pg.get('error'):
            continue
        lines = [x['t'] for x in pg.get('lines', []) if x.get('t')]
        if lines:
            toc_pages.append({'page': pg['page'], 'lines': lines})
        for t in lines:
            m = CH_RE.match(t)
            if m:
                name = clean(t).split('章')[0] + '章' + ((' ' + m.group(1)) if m.group(1) else '')
                if name not in chapters:
                    chapters.append(name)
    return chapters, toc_pages


def main():
    files = sorted(glob.glob(os.path.join(SRC, '*.pdf')))
    if not files:
        sys.exit('目录里没有 PDF：' + SRC)
    ocr = load_ocr_toc()
    books = []
    implemented = read_implemented()
    for f in files:
        r = PdfReader(f)
        pages = scan_pages(r)
        toc_lines, toc_page = find_toc(pages)
        front, chapters = parse_toc(toc_lines)
        labs = parse_labs(pages)
        text_chars = sum(len(t) for t in pages)
        has_text = text_chars > len(pages) * 100
        scan_type = 'text' if has_text else 'image'
        book = {
            'file': os.path.basename(f),
            'pages': len(pages),
            'textChars': text_chars,
            'hasTextLayer': has_text,
            'scanType': scan_type,
            'tocPage': toc_page if has_text else None,
            'front': front[:12],
            'chapters': chapters,
            'labSections': labs
        }
        if scan_type == 'image':
            ob = ocr.get(book['file'])
            if ob:
                ch, toc = ocr_summary(ob)
                book['ocrChapters'] = ch
                book['ocrTocPages'] = toc
                book['ocrNote'] = '整页扫描版：文字层为 0，目录由本地中文 OCR 抽取（textbook-ocr.json）'
            else:
                book['ocrChapters'] = []
                book['ocrTocPages'] = []
                book['ocrNote'] = '整页扫描版：尚未运行 npm run textbook:ocr'
        books.append(book)
        print('%-28s %3d 页  %s  文字 %6d 字  章 %d  节 %d  栏目 %d  OCR章 %d'
              % (book['file'], book['pages'], scan_type, text_chars,
                 len(chapters), sum(len(c['sections']) for c in chapters), len(labs),
                 len(book.get('ocrChapters', []))))

    data = {
        'generatedAt': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'sourceDir': SRC.replace('\\', '/'),
        'note': '只读扫描结果：有文本层的书，章节/节来自目录页、栏目来自正文标题；扫描图片版的书，目录由 textbook-ocr.json 的中文 OCR 结果补上。页码为 PDF 页序，非印刷页码。',
        'books': books,
        'implemented': implemented,
        'summary': {
            'books': len(books),
            'pages': sum(b['pages'] for b in books),
            'textBooks': sum(1 for b in books if b['scanType'] == 'text'),
            'scannedBooks': sum(1 for b in books if b['scanType'] == 'image'),
            'ocrIndexedBooks': sum(1 for b in books if b.get('ocrChapters')),
            'chapters': sum(len(b['chapters']) for b in books),
            'sections': sum(sum(len(c['sections']) for c in b['chapters']) for b in books),
            'labSections': sum(len(b['labSections']) for b in books),
            'implementedPhysics': sum(1 for x in implemented if x['id'].startswith(('b1_', 'b2_', 'b3_', 'j8a_', 'j8b_', 'j9_'))),
            'implementedMath': sum(1 for x in implemented if x['id'].startswith(('m1_', 'm2_'))),
            'implementedExperiments': len(implemented)
        }
    }
    with open(OUT, 'w', encoding='utf-8') as fh:
        json.dump(data, fh, ensure_ascii=False, indent=2)
    print('\n已写入', OUT)
    print('汇总:', json.dumps(data['summary'], ensure_ascii=False))


if __name__ == '__main__':
    main()
