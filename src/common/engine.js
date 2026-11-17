/**
 * engine.js — 通用模拟器内核
 *
 * 只负责算，不负责画：把「实验数据 + 当前参数 + 时间 t」变成一个状态对象，
 * 页面里的渲染器池按 renderer 字段挑自己需要的字段来画。
 * 全部用纯 view + CSS 定位实现，不用 canvas / SVG，保证 H5 / 小程序 / App 三端一致。
 */

const PI = Math.PI
const rad = d => d * PI / 180

export function initialParams(exp) {
  const p = {}
  for (const item of exp.params) p[item.key] = item.value
  return p
}

export function truthValue(exp, p) {
  return exp.truth(p)
}

export function relativeError(guess, actual) {
  // 对称相对误差：真值为 0 时若仍除以 |actual|，偏差会放大成上亿 %（例如
  // 「电容充满后电流 = 0」猜 0.3 mA）。以两者中较大的量级为基准，
  // 普通实验的结果不变，0 真值也能得到可读的 0~100%。
  const base = Math.max(Math.abs(actual), Math.abs(guess), 1e-6)
  return Math.abs(guess - actual) / base * 100
}

export function fmt(v) {
  if (!isFinite(v)) return '—'
  const a = Math.abs(v)
  if (a >= 1000) return v.toFixed(0)
  if (a >= 100) return v.toFixed(1)
  if (a >= 1) return v.toFixed(2)
  return v.toFixed(3)
}

/** mulberry32：固定种子，保证同一实验的蒙特卡洛曲线每次运行一致、可复现 */
function makeRng(seed) {
  let a = seed >>> 0 || 1
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function seedOf(id) {
  let s = 2166136261
  for (let i = 0; i < id.length; i++) s = Math.imul(s ^ id.charCodeAt(i), 16777619)
  return s >>> 0
}

/** 跑 n 次独立试验，返回命中频率（%） */
export function mcEstimate(exp, p, n) {
  if (!exp.trial || n <= 0) return 0
  const r = makeRng(seedOf(exp.id))
  let hit = 0
  for (let i = 0; i < n; i++) if (exp.trial(p, r)) hit++
  return hit / n * 100
}

/** 抛体轨迹（归一化成百分比坐标，left 0-100，bottom 0-100） */
function projectilePath(p) {
  const v = p.v0, a = rad(p.ang), g = p.g
  const tf = 2 * v * Math.sin(a) / g
  const R = v * v * Math.sin(2 * a) / g
  const H = (v * Math.sin(a)) ** 2 / (2 * g)
  const scaleX = 100 / Math.max(R, 1e-6)
  const scaleY = 90 / Math.max(H, 1e-6)
  const pts = []
  for (let i = 0; i <= 28; i++) {
    const t = tf * i / 28
    pts.push({
      left: Math.min(100, v * Math.cos(a) * t * scaleX),
      bottom: Math.max(0, (v * Math.sin(a) * t - 0.5 * g * t * t) * scaleY)
    })
  }
  return { pts, tf, R, H }
}

/** 函数曲线（自动按值域缩放，返回 0-100 的百分比点列） */
function functionPath(exp, p) {
  const [x0, x1] = exp.domain(p)
  const ys = []
  for (let i = 0; i <= 40; i++) ys.push(exp.curve(p)(x0 + (x1 - x0) * i / 40))
  const lo = Math.min(...ys, 0), hi = Math.max(...ys, 1)
  return ys.map((y, i) => ({
    left: i / 40 * 100,
    bottom: Math.max(0, Math.min(100, (y - lo) / Math.max(hi - lo, 1e-6) * 92))
  }))
}

/** 波列：36 根竖条的高度（百分比） */
function waveHeights(p, t, compress) {
  const out = []
  const k = compress || 1
  for (let i = 0; i < 36; i++) {
    const phase = 2 * PI * (i / 12 * k * (1 / Math.max(p.lam || 1, 0.1)) - (p.f || 1) * t)
    out.push(50 + 42 * Math.sin(phase))
  }
  return out
}

/**
 * 逐帧状态。t 为已运行秒数，progress 为 0..1。
 * 返回对象里各字段按需使用，页面按 renderer 取值。
 */
export function frameState(exp, p, t, progress) {
  const s = { t, progress }
  switch (exp.renderer) {
    case 'freefall': {
      const T = exp.truth(p)
      const k = Math.min(1, t / Math.max(T, 0.01))
      s.drop = k * k * 100
      s.landed = k >= 1
      break
    }
    case 'pendulum': {
      const T = exp.truth(p)
      s.angle = 20 * Math.cos(2 * PI * t / Math.max(T, 0.01))
      break
    }
    case 'spring': {
      const T = exp.truth(p)
      s.offset = 26 * Math.cos(2 * PI * t / Math.max(T, 0.01))
      break
    }
    case 'projectile': {
      const path = projectilePath(p)
      s.pts = path.pts
      const loop = path.tf > 0 ? (t % (path.tf * 1.25)) : 0
      const k = Math.min(1, loop / Math.max(path.tf, 0.01))
      const v = p.v0, a = rad(p.ang), g = p.g
      const x = v * Math.cos(a) * loop
      const y = v * Math.sin(a) * loop - 0.5 * g * loop * loop
      s.ball = {
        left: Math.min(100, x * 100 / Math.max(path.R, 1e-6)),
        bottom: Math.max(0, y * 90 / Math.max(path.H, 1e-6))
      }
      s.flight = path.tf
      break
    }
    case 'wave':
      s.heights = waveHeights(p, t)
      break
    case 'doppler': {
      const ratio = 340 / (340 - p.vs)
      const fVis = 0.5 + (p.f - 200) / 600 * 1.5
      s.heights = waveHeights({ f: fVis, lam: 1 }, t, ratio)
      s.compress = ratio
      break
    }
    case 'optics': {
      const a2 = Math.asin(Math.sin(rad(p.a1)) / p.n2) * 180 / PI
      s.inAngle = p.a1
      s.outAngle = a2
      s.pulse = Math.min(100, progress * 100)
      break
    }
    case 'circuit': {
      const I = exp.truth(p)
      s.brightness = Math.max(0.12, Math.min(1, I / 2))
      s.current = I
      break
    }
    case 'lever': {
      s.tilt = 7 * Math.cos(2 * PI * t / 0.9) * Math.exp(-2.2 * t)
      s.F2 = exp.truth(p)
      break
    }
    case 'triangle': {
      const c = exp.truth(p)
      const scale = 100 / Math.max(p.a, p.b, c, 1)
      s.aLen = p.a * scale
      s.bLen = p.b * scale
      s.cLen = c * scale
      s.cDeg = Math.atan2(p.b, p.a) * 180 / PI
      break
    }
    case 'function':
      s.pts = functionPath(exp, p)
      s.marker = { left: 50, bottom: 0 }
      break
    case 'bars': {
      const target = exp.mcTarget !== undefined ? exp.mcTarget : exp.truth(p)
      const maxTrials = Math.min(p.n || 600, 700)
      const trials = Math.floor(progress * maxTrials)
      s.estimate = mcEstimate(exp, p, trials)
      s.trials = trials
      s.target = target
      break
    }
    case 'diagram': {
      // 定性实验：装置节点按现象发生顺序依次点亮，数据完全由实验自身提供。
      const nodes = exp.diagram(p)
      const shown = Math.max(1, Math.ceil(progress * nodes.length))
      s.nodes = nodes.map((n, i) => ({ ...n, on: i < shown }))
      s.shown = shown
      break
    }
    default:
      break
  }
  return s
}

/** 渲染器是否需要在运行期间持续动画（静态的只画一次） */
export function isAnimated(renderer) {
  return ['freefall', 'pendulum', 'spring', 'projectile', 'wave', 'doppler', 'lever', 'diagram'].indexOf(renderer) >= 0
}
