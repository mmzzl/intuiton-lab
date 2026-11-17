/**
 * check-experiments.mjs — 实验清单全量自检
 *
 * 用法：npm run check
 *
 * 校验：必填字段、id 唯一、渲染器合法且参数键齐全、猜测范围、
 *       默认值与边界处的真值、逐帧状态、函数曲线、蒙特卡洛收敛、文案函数。
 * 任何 FAIL 都会让进程以 1 退出，可直接放进提交前钩子 / CI。
 * 新增或修改实验后先跑它，别等构建完才发现问题。
 */
import { EXPERIMENTS, TOPIC_ORDER, STAGES, SUBJECTS, findExperiment, paramValueText } from '../src/common/experiments.js'
import { initialParams, truthValue, frameState, mcEstimate, isAnimated } from '../src/common/engine.js'

/** 渲染器 → 舞台/引擎依赖的参数 key（复用画面时必须照抄） */
export const RENDERER_KEYS = {
  freefall: ['h', 'g'],
  pendulum: ['L', 'g'],
  spring: ['m', 'k'],
  projectile: ['v0', 'ang', 'g'],
  wave: ['f', 'lam'],
  doppler: ['f', 'vs'],
  optics: ['a1', 'n2'],
  circuit: ['U', 'R'],
  lever: ['F1', 'L1', 'L2'],
  triangle: ['a', 'b'],
  function: [],
  bars: ['n'],
  diagram: []
}

/** 渲染器 → frameState 必须产出的 state 字段 */
const STATE_KEYS = {
  freefall: ['drop', 'landed'],
  pendulum: ['angle'],
  spring: ['offset'],
  projectile: ['pts', 'ball', 'flight'],
  wave: ['heights'],
  doppler: ['heights', 'compress'],
  optics: ['inAngle', 'outAngle', 'pulse'],
  circuit: ['brightness', 'current'],
  lever: ['tilt', 'F2'],
  triangle: ['aLen', 'bLen', 'cLen', 'cDeg'],
  function: ['pts', 'marker'],
  bars: ['estimate', 'trials', 'target'],
  diagram: ['nodes', 'shown']
}

const STR_FIELDS = ['id', 'stage', 'subject', 'topic', 'chapter', 'title', 'hook', 'question',
  'predictLabel', 'formula', 'insight', 'boundary', 'next']
const NUM_FIELDS = ['predictDefault', 'predictMin', 'predictMax', 'duration']
const FN_FIELDS = ['truth', 'calc']

let failed = 0
let warned = 0
const fail = (list, msg) => { list.push('FAIL  ' + msg) }
const warn = (list, msg) => { list.push('WARN  ' + msg) }

function checkOne(e, seen) {
  const issues = []
  const id = e && e.id ? e.id : '(无 id)'

  // --- 基础字段 ---
  for (const k of STR_FIELDS) {
    if (typeof e[k] !== 'string' || !e[k].trim()) fail(issues, k + ' 缺失或不是非空字符串')
  }
  // predictUnit 允许空字符串（无量纲量没有单位）
  if (typeof e.predictUnit !== 'string') fail(issues, 'predictUnit 必须是字符串（无单位可写 ""）')
  for (const k of NUM_FIELDS) {
    if (typeof e[k] !== 'number' || !isFinite(e[k])) fail(issues, k + ' 缺失或不是有限数字')
  }
  for (const k of FN_FIELDS) {
    if (typeof e[k] !== 'function') fail(issues, k + ' 缺失或不是函数')
  }
  if (!issues.length) {
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(e.id)) fail(issues, 'id 只允许字母/数字/下划线且以字母开头')
    if (seen.has(e.id)) fail(issues, 'id 重复：' + e.id)
    seen.add(e.id)
    if (e.stage !== '全部' && STAGES.indexOf(e.stage) < 0) fail(issues, 'stage 只能是 初中 / 高中')
    if (SUBJECTS.indexOf(e.subject) < 0) fail(issues, 'subject 只能是 物理 / 数学')
    if (TOPIC_ORDER.indexOf(e.topic) < 0) fail(issues, 'topic 不在 TOPIC_ORDER 中')
    if (e.duration <= 0) fail(issues, 'duration 必须 > 0')
    if (!(e.predictMin < e.predictDefault && e.predictDefault < e.predictMax)) {
      fail(issues, '预测范围必须是 min < default < max')
    }
  }

  // --- renderer ---
  const r = e.renderer
  if (!Object.prototype.hasOwnProperty.call(RENDERER_KEYS, r)) {
    fail(issues, '未知 renderer：' + r + '（需在 engine.js / lab.vue 里新加分支）')
    return issues
  }

  // --- params ---
  if (!Array.isArray(e.params) || !e.params.length) {
    fail(issues, 'params 必须是非空数组')
    return issues
  }
  const keys = new Set()
  for (const it of e.params) {
    if (!it || typeof it.key !== 'string' || !it.key) { fail(issues, 'param 缺 key'); continue }
    if (keys.has(it.key)) fail(issues, 'param key 重复：' + it.key)
    keys.add(it.key)
    if (typeof it.label !== 'string' || !it.label) fail(issues, it.key + ' 缺 label')
    if (it.options) {
      if (!Array.isArray(it.options) || !it.options.length) fail(issues, it.key + '.options 必须是非空数组')
      else if (!it.options.some(o => o && o.value === it.value)) fail(issues, it.key + '.value 不在 options 里')
      else if (it.options.some(o => !o || typeof o.label !== 'string')) fail(issues, it.key + '.options 项缺 label')
    } else {
      if (!(typeof it.min === 'number' && typeof it.max === 'number' && it.min < it.max)) {
        fail(issues, it.key + ' 的 min/max 不合法')
      }
      if (!(typeof it.step === 'number' && it.step > 0)) fail(issues, it.key + ' 的 step 必须 > 0')
      if (!(typeof it.value === 'number' && it.value >= it.min && it.value <= it.max)) {
        fail(issues, it.key + '.value 超出 min~max')
      }
    }
    try { paramValueText(it, it.value) } catch (x) { fail(issues, it.key + ' paramValueText 报错：' + x.message) }
  }
  for (const need of RENDERER_KEYS[r]) {
    if (!keys.has(need)) fail(issues, '渲染器 ' + r + ' 需要参数 key「' + need + '」')
  }

  // --- 渲染器专属字段 ---
  if (r === 'bars') {
    if (typeof e.trial !== 'function') fail(issues, 'bars 需要 trial(p, rng)')
    if (e.mcTarget !== undefined && !(typeof e.mcTarget === 'number' && isFinite(e.mcTarget))) {
      fail(issues, 'mcTarget 必须是有限数字')
    }
  }
  if (r === 'function') {
    if (typeof e.curve !== 'function') fail(issues, 'function 需要 curve(p)(x)')
    if (typeof e.domain !== 'function') fail(issues, 'function 需要 domain(p) → [x0,x1]')
  }
  if (r === 'diagram') {
    if (typeof e.diagram !== 'function') fail(issues, 'diagram 需要 diagram(p) → 装置节点数组')
    else {
      try {
        const nodes = e.diagram(initialParams(e))
        if (!Array.isArray(nodes) || !nodes.length) fail(issues, 'diagram(p) 必须返回非空数组')
        else if (nodes.some(n => !n || typeof n.label !== 'string' || typeof n.value !== 'string')) {
          fail(issues, 'diagram 节点需要字符串 label / value')
        }
      } catch (x) { fail(issues, 'diagram 抛错：' + x.message) }
    }
  }
  for (const k of ['caption', 'curveLabel']) {
    if (e[k] !== undefined && typeof e[k] !== 'function') fail(issues, k + ' 必须是函数')
  }
  if (issues.some(x => x.startsWith('FAIL'))) return issues

  // --- 真值：默认值 + 每个参数的边界 ---
  const p0 = initialParams(e)
  const checkTruth = (p, label) => {
    let v
    try { v = truthValue(e, p) } catch (x) { fail(issues, label + ' truth 抛错：' + x.message); return }
    if (!isFinite(v)) fail(issues, label + ' truth 不是有限数：' + v)
  }
  checkTruth(p0, '默认值')
  for (const it of e.params) {
    if (it.options) {
      for (const o of it.options) checkTruth({ ...p0, [it.key]: o.value }, it.key + '=' + o.value)
    } else {
      checkTruth({ ...p0, [it.key]: it.min }, it.key + '=min')
      checkTruth({ ...p0, [it.key]: it.max }, it.key + '=max')
    }
  }
  try {
    const c = e.calc(p0)
    if (typeof c !== 'string' || !c) fail(issues, 'calc(p) 必须返回非空字符串')
  } catch (x) { fail(issues, 'calc 抛错：' + x.message) }

  // --- 逐帧状态：初始帧与中间帧 ---
  let mid = null
  for (const [t, prog] of [[0, 0], [1.2, 0.5]]) {
    try {
      const s = frameState(e, p0, t, prog)
      if (!s || typeof s !== 'object') { fail(issues, 'frameState 返回非对象'); continue }
      for (const k of STATE_KEYS[r]) {
        if (s[k] === undefined) fail(issues, 'state 缺字段 ' + k + '（t=' + t + '）')
      }
      if (r === 'function') {
        if (!Array.isArray(s.pts) || s.pts.length < 2) fail(issues, 'function 曲线点不足')
        else if (s.pts.some(q => !isFinite(q.left) || !isFinite(q.bottom))) fail(issues, 'function 曲线含非法坐标')
      }
      if (r === 'projectile' && (!s.ball || !isFinite(s.ball.left) || !isFinite(s.ball.bottom))) {
        fail(issues, 'projectile 小球坐标非法')
      }
      if (t > 0) mid = s
    } catch (x) { fail(issues, 'frameState(t=' + t + ') 抛错：' + x.message) }
  }

  // --- 文案函数 ---
  try {
    if (typeof e.caption === 'function') {
      const c = e.caption(p0, mid || frameState(e, p0, 1.2, 0.5))
      if (typeof c !== 'string') fail(issues, 'caption 必须返回字符串')
    }
    if (typeof e.curveLabel === 'function' && typeof e.curveLabel(p0) !== 'string') {
      fail(issues, 'curveLabel 必须返回字符串')
    }
  } catch (x) { fail(issues, 'caption/curveLabel 抛错：' + x.message) }

  // --- function 曲线本身 ---
  if (r === 'function') {
    try {
      const d = e.domain(p0)
      if (!Array.isArray(d) || d.length !== 2 || !(d[0] < d[1]) || d.some(v => !isFinite(v))) {
        fail(issues, 'domain(p) 必须返回 [x0, x1] 且 x0 < x1')
      } else {
        const f = e.curve(p0)
        if (typeof f !== 'function') fail(issues, 'curve(p) 必须返回函数')
        else for (let i = 0; i <= 10; i++) {
          const y = f(d[0] + (d[1] - d[0]) * i / 10)
          if (!isFinite(y)) { fail(issues, 'curve 在定义域内出现非有限值'); break }
        }
      }
    } catch (x) { fail(issues, 'curve/domain 抛错：' + x.message) }
  }

  // --- 蒙特卡洛收敛 ---
  if (r === 'bars' && typeof e.trial === 'function') {
    try {
      const est = mcEstimate(e, p0, 700)
      const real = e.mcTarget !== undefined ? e.mcTarget : truthValue(e, p0)
      if (!isFinite(est)) fail(issues, 'mcEstimate 返回非有限数')
      else if (Math.abs(est - real) > 12) {
        warn(issues, '700 次模拟 ' + est.toFixed(1) + '% 与真值 ' + real.toFixed(1) + '% 相差过大，检查 trial 写对没')
      }
    } catch (x) { fail(issues, 'trial 抛错：' + x.message) }
  }

  if (typeof isAnimated(r) !== 'boolean') fail(issues, 'isAnimated 返回值异常')
  if (findExperiment(e.id) !== e) fail(issues, 'findExperiment 找不到自身（id 冲突？）')

  return issues
}

const seen = new Set()
let pass = 0
console.log('直觉实验室 · 实验清单自检')
console.log('共 ' + EXPERIMENTS.length + ' 个实验\n')
for (const e of EXPERIMENTS) {
  const issues = checkOne(e, seen)
  const f = issues.filter(x => x.startsWith('FAIL')).length
  const w = issues.filter(x => x.startsWith('WARN')).length
  failed += f
  warned += w
  if (!issues.length) { pass++; console.log('PASS  ' + String(e.id).padEnd(12) + e.stage + '·' + e.subject + '  ' + e.title) }
  else {
    console.log((f ? 'FAIL  ' : 'WARN  ') + String(e && e.id).padEnd(12) + '  ' + (f + w) + ' 项')
    for (const x of issues) console.log('        ' + x)
  }
}
for (let i = 1; i < EXPERIMENTS.length; i++) {
  const prev = TOPIC_ORDER.indexOf(EXPERIMENTS[i - 1].topic)
  const cur = TOPIC_ORDER.indexOf(EXPERIMENTS[i].topic)
  if (cur < prev) {
    failed++
    console.log('FAIL  主题分组顺序错误：' + EXPERIMENTS[i].id + '（' + EXPERIMENTS[i].topic + '）出现在 ' + EXPERIMENTS[i - 1].topic + ' 之后')
  }
}
console.log('\n通过 ' + pass + ' / ' + EXPERIMENTS.length + '，错误 ' + failed + '，提醒 ' + warned)
if (failed) { console.log('自检未通过，请修复上面标 FAIL 的项再构建。'); process.exit(1) }
console.log('全部通过，可以构建。')
