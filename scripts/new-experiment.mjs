/**
 * new-experiment.mjs — 新增实验骨架生成器
 *
 * 用法（在工程根目录）：
 *   npm run new:exp -- --list
 *   npm run new:exp -- --id=my_lab --title="我的实验" --renderer=function
 *   npm run new:exp -- --id=my_lab --title="我的实验" --renderer=bars \
 *                       --stage=高中 --subject=数学 --chapter="概率 · 自定义" --stdout
 *
 * 生成的是一条「立刻能跑、能通过 npm run check」的完整记录，
 * 带 TODO 的文案与占位公式，改掉即可。默认自动追加到 experiments.js 并跑一次自检。
 * --stdout 只打印不写入，方便自己复制到别处。
 */
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const FILE = path.join(ROOT, 'src', 'common', 'experiments.js')

const G = "{ key: 'g', label: '重力 g', unit: 'm/s²', options: G, value: 9.8 }"

/** 每种渲染器的自洽骨架：参数键、真值、公式、预测范围 */
const PRESETS = {
  freefall: {
    keys: 'h, g', duration: 3.2,
    params: "[{ key: 'h', label: '高度 h', unit: 'm', min: 5, max: 40, step: 1, value: 20 }, " + G + ']',
    predict: "predictLabel: '你猜落地时间', predictUnit: 's', predictDefault: 2, predictMin: 0.1, predictMax: 20,",
    truth: 'p => Math.sqrt(2 * p.h / p.g)',
    formula: "'t = √(2h / g)'",
    calc: "p => '√(2 × ' + p.h + ' / ' + p.g + ')'",
    extra: ''
  },
  pendulum: {
    keys: 'L, g', duration: 3.2,
    params: "[{ key: 'L', label: '摆长 L', unit: 'm', min: 0.2, max: 2, step: 0.1, value: 1 }, " + G + ']',
    predict: "predictLabel: '你猜周期', predictUnit: 's', predictDefault: 2, predictMin: 0.1, predictMax: 20,",
    truth: 'p => 2 * PI * Math.sqrt(p.L / p.g)',
    formula: "'T = 2π√(L / g)'",
    calc: "p => '2π√(' + p.L.toFixed(1) + ' / ' + p.g + ')'",
    extra: ''
  },
  spring: {
    keys: 'm, k', duration: 3.2,
    params: "[{ key: 'm', label: '质量 m', unit: 'kg', min: 0.1, max: 2, step: 0.1, value: 0.5 }, { key: 'k', label: '劲度 k', unit: 'N/m', min: 5, max: 80, step: 5, value: 20 }]",
    predict: "predictLabel: '你猜周期', predictUnit: 's', predictDefault: 1, predictMin: 0.1, predictMax: 20,",
    truth: 'p => 2 * PI * Math.sqrt(p.m / p.k)',
    formula: "'T = 2π√(m / k)'",
    calc: "p => '2π√(' + p.m.toFixed(1) + ' / ' + p.k + ')'",
    extra: ''
  },
  projectile: {
    keys: 'v0, ang, g', duration: 3.4,
    params: "[{ key: 'v0', label: '初速 v₀', unit: 'm/s', min: 5, max: 30, step: 1, value: 15 }, { key: 'ang', label: '抛射角 θ', unit: '°', min: 10, max: 80, step: 5, value: 45 }, " + G + ']',
    predict: "predictLabel: '你猜射程', predictUnit: 'm', predictDefault: 20, predictMin: 0.1, predictMax: 500,",
    truth: 'p => p.v0 * p.v0 * Math.sin(2 * rad(p.ang)) / p.g',
    formula: "'R = v₀² sin2θ / g'",
    calc: "p => p.v0 + '² × sin(' + (2 * p.ang) + '°) / ' + p.g",
    extra: ''
  },
  wave: {
    keys: 'f, lam', duration: 3.0,
    params: "[{ key: 'f', label: '频率 f', unit: 'Hz', min: 0.5, max: 4, step: 0.5, value: 2 }, { key: 'lam', label: '波长 λ', unit: 'm', min: 0.2, max: 2, step: 0.1, value: 0.8 }]",
    predict: "predictLabel: '你猜波速', predictUnit: 'm/s', predictDefault: 2, predictMin: 0.1, predictMax: 30,",
    truth: 'p => p.f * p.lam',
    formula: "'v = fλ'",
    calc: "p => p.f + ' × ' + p.lam.toFixed(1)",
    extra: ''
  },
  doppler: {
    keys: 'f, vs', duration: 3.0,
    params: "[{ key: 'f', label: '声源频率 f', unit: 'Hz', min: 200, max: 800, step: 50, value: 400 }, { key: 'vs', label: '声源速度 vₛ', unit: 'm/s', min: 0, max: 100, step: 5, value: 30 }]",
    predict: "predictLabel: '你猜听到的频率', predictUnit: 'Hz', predictDefault: 500, predictMin: 50, predictMax: 5000,",
    truth: 'p => p.f * 340 / (340 - p.vs)',
    formula: "'f′ = f · v / (v − vₛ)'",
    calc: "p => p.f + ' × 340 / (340 − ' + p.vs + ')'",
    extra: ''
  },
  optics: {
    keys: 'a1, n2', duration: 2.4,
    params: "[{ key: 'a1', label: '入射角 θ₁', unit: '°', min: 10, max: 80, step: 5, value: 45 }, { key: 'n2', label: '进入介质', unit: '', options: [{ label: '水 1.33', value: 1.33 }, { label: '玻璃 1.50', value: 1.5 }], value: 1.33 }]",
    predict: "predictLabel: '你猜折射角', predictUnit: '°', predictDefault: 30, predictMin: 1, predictMax: 89,",
    truth: 'p => deg(Math.asin(Math.sin(rad(p.a1)) / p.n2))',
    formula: "'sinθ₁ / sinθ₂ = n₂ / n₁'",
    calc: "p => 'sinθ₂ = sin(' + p.a1 + '°) / ' + p.n2",
    extra: ''
  },
  circuit: {
    keys: 'U, R', duration: 2.4,
    params: "[{ key: 'U', label: '电压 U', unit: 'V', min: 1, max: 12, step: 1, value: 6 }, { key: 'R', label: '电阻 R', unit: 'Ω', min: 1, max: 20, step: 1, value: 6 }]",
    predict: "predictLabel: '你猜电流', predictUnit: 'A', predictDefault: 1, predictMin: 0.01, predictMax: 20,",
    truth: 'p => p.U / p.R',
    formula: "'I = U / R'",
    calc: "p => p.U + ' / ' + p.R",
    extra: ''
  },
  lever: {
    keys: 'F1, L1, L2', duration: 2.6,
    params: "[{ key: 'F1', label: '左边力 F₁', unit: 'N', min: 1, max: 20, step: 1, value: 10 }, { key: 'L1', label: '左力臂 L₁', unit: 'm', min: 0.1, max: 1, step: 0.1, value: 0.4 }, { key: 'L2', label: '右力臂 L₂', unit: 'm', min: 0.1, max: 1, step: 0.1, value: 0.8 }]",
    predict: "predictLabel: '你猜右边的力', predictUnit: 'N', predictDefault: 5, predictMin: 0.1, predictMax: 200,",
    truth: 'p => p.F1 * p.L1 / p.L2',
    formula: "'F₂ = F₁L₁ / L₂'",
    calc: "p => p.F1 + ' × ' + p.L1.toFixed(1) + ' / ' + p.L2.toFixed(1)",
    extra: ''
  },
  triangle: {
    keys: 'a, b', duration: 2.2,
    params: "[{ key: 'a', label: '直角边 a', unit: '', min: 1, max: 8, step: 1, value: 3 }, { key: 'b', label: '直角边 b', unit: '', min: 1, max: 8, step: 1, value: 4 }]",
    predict: "predictLabel: '你猜斜边 c', predictUnit: '', predictDefault: 5, predictMin: 0.1, predictMax: 30,",
    truth: 'p => Math.sqrt(p.a * p.a + p.b * p.b)',
    formula: "'c = √(a² + b²)'",
    calc: "p => '√(' + p.a + '² + ' + p.b + '²)'",
    extra: ''
  },
  function: {
    keys: '任意（示例用 a）', duration: 2.6,
    params: "[{ key: 'a', label: '系数 a', unit: '', min: 1, max: 10, step: 1, value: 2 }]",
    predict: "predictLabel: '你猜 y(2)', predictUnit: '', predictDefault: 4, predictMin: 0.1, predictMax: 100,",
    truth: 'p => p.a * 2',
    formula: "'y = ax（猜 x = 2 时的 y）'",
    calc: "p => p.a + ' × 2'",
    extra: "curve: p => x => p.a * x,\n    domain: () => [0, 5],\n    curveLabel: p => 'y = ' + p.a + 'x',"
  },
  bars: {
    keys: 'n', duration: 3.2,
    params: "[{ key: 'n', label: '模拟次数', unit: '次', min: 100, max: 2000, step: 100, value: 600 }]",
    predict: "predictLabel: '你猜概率', predictUnit: '%', predictDefault: 50, predictMin: 0.1, predictMax: 100,",
    truth: '() => 50',
    formula: "'P = 50%'",
    calc: "() => '一次试验命中概率 = 1/2'",
    extra: "mcTarget: 50,\n    trial: (p, r) => r() < 0.5,"
  },
  diagram: {
    keys: '任意（示例用 U）', duration: 2.8,
    params: "[{ key: 'U', label: '电源电压 U', unit: 'V', min: 1, max: 12, step: 1, value: 3 }]",
    predict: "predictLabel: '你猜电压表读数', predictUnit: 'V', predictDefault: 1.5, predictMin: 0, predictMax: 20,",
    truth: '() => 0',
    formula: "'开关断开 → 无电流 → U表 = 0'",
    calc: "p => '开关断开，回路电流 I = 0（电源 ' + p.U + ' V 是干扰项）'",
    extra: "diagram: p => [\n      { label: '电源', value: p.U + ' V' },\n      { label: '开关', value: '断开' },\n      { label: '电压表', value: '0 V', tone: 'warn' },\n      { label: '结论', value: '无读数', tone: 'good' }\n    ],"
  }
}

const argv = process.argv.slice(2)
const args = {}
for (const a of argv) {
  if (a === '--list' || a === '--help' || a === '--stdout') args[a.slice(2)] = true
  else if (a.startsWith('--') && a.includes('=')) {
    const i = a.indexOf('=')
    args[a.slice(2, i)] = a.slice(i + 1)
  }
}

if (args.list || args.help) {
  console.log('可用渲染器（--renderer=xxx）：\n')
  console.log('  renderer      参数 key（必须照抄）        画面')
  const desc = {
    freefall: '两球自由落体', pendulum: '单摆摆动', spring: '弹簧振子', projectile: '斜抛轨迹',
    wave: '行波波列', doppler: '波前压缩', optics: '折射光线', circuit: '电路与灯泡',
    lever: '杠杆平衡', triangle: '直角三角形', function: '函数曲线', bars: '蒙特卡洛柱状图',
    diagram: '定性装置现象（节点依次点亮）'
  }
  for (const k of Object.keys(PRESETS)) {
    console.log('  ' + k.padEnd(12) + PRESETS[k].keys.padEnd(30) + desc[k])
  }
  console.log('\n示例：npm run new:exp -- --id=coin --title="抛硬币" --renderer=bars --subject=数学 --stage=初中')
  console.log('其它参数：--chapter=... --stdout（只打印不写入）')
  process.exit(0)
}

const renderer = args.renderer || 'function'
if (!PRESETS[renderer]) {
  console.log('未知 renderer：' + renderer + '\n用 npm run new:exp -- --list 查看全部。')
  process.exit(1)
}
const id = args.id || ''
if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(id)) {
  console.log('必须给合法的 --id（字母开头，只含字母/数字/下划线），例如 --id=coin_flip')
  process.exit(1)
}
const src = fs.readFileSync(FILE, 'utf8')
const existing = Array.from(src.matchAll(/\bid:\s*'([^']+)'/g)).map(m => m[1])
if (existing.indexOf(id) >= 0) {
  console.log('id 已存在：' + id + '，换一个。')
  process.exit(1)
}

const q = PRESETS[renderer]
const block = [
  '  {',
  "    id: '" + id + "', stage: '" + (args.stage || '高中') + "', subject: '" + (args.subject || '物理') +
    "', chapter: " + JSON.stringify(args.chapter || 'TODO · 教材章节') + ',',
  '    title: ' + JSON.stringify(args.title || id) + ',',
  "    hook: 'TODO · 写一句反直觉的钩子',",
  "    question: 'TODO · 让用户先猜的问题',",
  '    ' + q.predict,
  '    params: ' + q.params + ',',
  "    renderer: '" + renderer + "', duration: " + q.duration + ',',
  q.extra ? '    ' + q.extra : null,
  '    truth: ' + q.truth + ',',
  '    formula: ' + q.formula + ',',
  '    calc: ' + q.calc + ',',
  "    insight: 'TODO · 为什么会这样',",
  "    boundary: 'TODO · 模型在哪儿会失效（这一项别省）',",
  "    next: 'TODO · 换个参数再猜一次'",
  '  }'
].filter(Boolean).join('\n')

if (args.stdout) {
  console.log('// 把下面这段粘进 EXPERIMENTS 数组：\n')
  console.log(block)
  process.exit(0)
}

const marker = '\n]\n\nexport function findExperiment'
if (src.indexOf(marker) < 0) {
  console.log('找不到数组结尾锚点，为安全起见不改写文件。请用 --stdout 手动粘贴。')
  process.exit(1)
}
const idx = src.indexOf(marker)
fs.writeFileSync(FILE, src.slice(0, idx) + ',\n' + block + src.slice(idx), 'utf8')
console.log('已插入 ' + id + '（' + renderer + '）到 src/common/experiments.js 末尾。')
console.log('接下来：改 TODO 文案与公式 → npm run check → 构建。\n')

const r = spawnSync(process.execPath,
  ['--experimental-default-type=module', path.join(ROOT, 'scripts', 'check-experiments.mjs')],
  { cwd: ROOT, stdio: 'inherit' })
process.exit(r.status === null ? 1 : r.status)
