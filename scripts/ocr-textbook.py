#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ocr-textbook.py — 给「整页图片扫描版」教材补一份可读的目录/栏目索引（只读）

背景：D:/textbook 里的三本人教版初中物理是扫描图片 PDF，pypdf 抽出的文字为 0，
extract-textbook.py 对它们只能给出 0 章 0 节。本脚本把每页内嵌的 JPEG 直接喂给
本地中文 OCR，输出每页的文字行，据此确认章节编排与教材版本。

用法：
  python scripts/ocr-textbook.py                      # 扫三本的前 8 页（封面+目录）
  python scripts/ocr-textbook.py --pages 12          # 多扫几页
  python scripts/ocr-textbook.py --book 八年级下册    # 只扫文件名含关键字的书
  npm run textbook:ocr

输出：scripts/textbook-ocr.json（含每页 OCR 行文本、置信度、纵坐标）
只读取源 PDF，绝不修改、移动或删除它们。

依赖（一次性，装到脚本同级 vendor/ocr 即可长期复用）：
  python -m pip install --target scripts/vendor/ocr rapidocr-onnxruntime==1.2.3
本机已装好一套在 ~/.workbuddy/tools/intuition-ocr-deps，脚本会自动找到。
若本机 CPU 不支持 X86_V2 指令集导致 numpy 报 baseline optimizations 错，
把该目录里的 numpy 改名为 _numpy_disabled，改用系统 numpy 即可（本机已处理）。
脚本依次尝试：--deps 指定目录 → scripts/vendor/ocr → ~/.workbuddy/tools/intuition-ocr-deps
→ 系统临时目录 TEMP/intuition-ocr/pydeps。
"""
import sys, os, re, json, glob, argparse, tempfile, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(HERE, 'vendor'))
try:
    from pypdf import PdfReader
except ImportError:
    sys.exit('缺少 pypdf：确认 scripts/vendor/pypdf 存在')

DEFAULT_SRC = 'D:/textbook'
OUT = os.path.join(HERE, 'textbook-ocr.json')

# 初中三本用短名做临时文件前缀，避免中文路径带来的编码问题
SLUGS = [
    ('义务教育教科书物理八年级上册', 'j8a', '八上'),
    ('物理八年级下册', 'j8b', '八下'),
    ('物理九年级全一册', 'j9', '九全'),
]


def load_ocr(explicit=None):
    """返回依赖目录；引擎每次新建，避免长任务里 ONNX 显存/内存碎片累积。"""
    candidates = []
    if explicit:
        candidates.append(explicit)
    candidates.append(os.path.join(HERE, 'vendor', 'ocr'))
    candidates.append(os.path.join(os.path.expanduser('~'), '.workbuddy', 'tools', 'intuition-ocr-deps'))
    candidates.append(os.path.join(tempfile.gettempdir(), 'intuition-ocr', 'pydeps'))
    for c in candidates:
        if os.path.isdir(os.path.join(c, 'rapidocr_onnxruntime')):
            sys.path.insert(0, c)
            try:
                from rapidocr_onnxruntime import RapidOCR
                load_ocr.RapidOCR = RapidOCR
                return c
            except Exception as e:
                print('OCR 依赖加载失败（%s）：%s' % (c, e), file=sys.stderr)
    sys.exit('未找到可用 OCR 依赖。请先执行：\n'
             '  python -m pip install --target scripts/vendor/ocr rapidocr-onnxruntime==1.2.3')


def new_engine():
    return load_ocr.RapidOCR()


def has_text_layer(reader):
    """已有文本层的教材交给 extract-textbook.py，OCR 只处理扫描图片版。"""
    n = 0
    for pg in reader.pages[:3]:
        try:
            n += len(pg.extract_text() or '')
        except Exception:
            pass
    return n > 300


def slug_of(filename):
    for key, slug, label in SLUGS:
        if key in filename:
            return slug, label
    stem = re.sub(r'[^\w\u4e00-\u9fff]+', '_', os.path.splitext(filename)[0])[:18]
    return stem, stem


def page_jpegs(reader, page_no, cache_dir, slug, max_w=1000):
    """扫描页通常只有一张 /DCTDecode 大图；等比缩到 1000px 宽再 OCR，
    既避免老机器上 ONNX ConvTranspose 的 bad allocation，也明显更快。"""
    src = os.path.join(cache_dir, '%s_p%d.jpg' % (slug, page_no))
    dest = os.path.join(cache_dir, '%s_p%d_s%d.jpg' % (slug, page_no, max_w))
    if os.path.isfile(dest):
        return dest
    if not os.path.isfile(src):
        try:
            pg = reader.pages[page_no - 1]
            xo = pg['/Resources'].get('/XObject')
            if not xo:
                return None
            for ref in xo.values():
                obj = ref.get_object()
                if obj.get('/Subtype') == '/Image' and obj.get('/Filter') == '/DCTDecode':
                    with open(src, 'wb') as fh:
                        fh.write(obj._data)
                    break
        except Exception as e:
            print('  跳过 p%d：%s' % (page_no, e), file=sys.stderr)
            return None
        if not os.path.isfile(src):
            return None
    try:
        from PIL import Image
        with Image.open(src) as im:
            im = im.convert('RGB')
            if im.width > max_w:
                im = im.resize((max_w, round(im.height * max_w / im.width)), Image.LANCZOS)
            im.save(dest, 'JPEG', quality=88)
        return dest
    except Exception as e:
        print('  缩图失败 p%d：%s（改用原图）' % (page_no, e), file=sys.stderr)
        return src


def dump(data, out):
    with open(out, 'w', encoding='utf-8') as fh:
        json.dump(data, fh, ensure_ascii=False, indent=2)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src', nargs='?', default=DEFAULT_SRC)
    ap.add_argument('--pages', type=int, default=8, help='每本扫描前 N 页，默认 8')
    ap.add_argument('--only-pages', default='', help='只扫指定页，逗号分隔，如 6,7,8')
    ap.add_argument('--book', default='', help='只扫文件名含该关键字的书')
    ap.add_argument('--deps', default='', help='OCR 依赖目录')
    ap.add_argument('--out', default=OUT)
    a = ap.parse_args()

    files = sorted(glob.glob(os.path.join(a.src, '*.pdf')))
    if a.book:
        files = [f for f in files if a.book in os.path.basename(f)]
    if not files:
        sys.exit('目录里没有匹配的 PDF：' + a.src)

    cache = os.path.join(tempfile.gettempdir(), 'intuition-ocr', 'pages')
    os.makedirs(cache, exist_ok=True)
    deps_dir = load_ocr(a.deps)
    only = [int(x) for x in a.only_pages.split(',') if x.strip().isdigit()] or None
    print('OCR 依赖：%s\n候选 %d 本（自动跳过已有文本层的）\n' % (deps_dir, len(files)))

    books = []
    data = {
        'generatedAt': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'sourceDir': a.src.replace('\\', '/'),
        'engine': 'rapidocr-onnxruntime 1.2.3 (本地离线中文 OCR)',
        'note': '只读扫描结果：页码为 PDF 页序；lines 的 y 是行中心纵坐标，便于还原目录层级。',
        'books': books,
    }
    for f in files:
        name = os.path.basename(f)
        slug, label = slug_of(name)
        reader = PdfReader(f)
        if has_text_layer(reader):
            print('%-6s %s：已有文本层，交给 extract-textbook.py，跳过' % (label, name))
            continue
        numbers = only or list(range(1, min(a.pages, len(reader.pages)) + 1))
        engine = new_engine()
        pages = []
        for n in numbers:
            if n < 1 or n > len(reader.pages):
                continue
            jpg = page_jpegs(reader, n, cache, slug)
            if not jpg:
                pages.append({'page': n, 'lines': [], 'text': '', 'error': '页面无内嵌 JPEG'})
                continue
            try:
                try:
                    result, _ = engine(jpg)
                except Exception:
                    engine = new_engine()   # 老机器上偶发 bad allocation，重建后重试一次
                    result, _ = engine(jpg)
                lines = []
                for box, text, score in (result or []):
                    try:
                        y = round(sum(pt[1] for pt in box) / len(box), 1)
                        x = round(min(pt[0] for pt in box), 1)
                    except Exception:
                        x, y = 0.0, 0.0
                    lines.append({'x': x, 'y': y, 't': str(text).strip(), 'c': round(float(score), 3)})
                lines.sort(key=lambda z: (z['y'], z['x']))
                pages.append({'page': n, 'lines': lines,
                              'text': '\n'.join(z['t'] for z in lines)})
                print('%-6s p%-3d %2d 行 | %s' % (label, n, len(lines),
                      ' / '.join(z['t'] for z in lines[:6])[:100]))
            except Exception as e:
                print('%-6s p%-3d 识别失败：%s' % (label, n, e), file=sys.stderr)
                pages.append({'page': n, 'lines': [], 'text': '', 'error': str(e)[:200]})
        books.append({'file': name, 'slug': slug, 'label': label,
                      'pagesTotal': len(reader.pages), 'scannedPages': pages})
        dump(data, a.out)   # 每本落盘一次，中途失败也不丢已识别结果
    print('\n已写入', a.out)


if __name__ == '__main__':
    main()
