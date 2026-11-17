/**
 * profile.js — 直觉档案
 *
 * 记录每次「我猜 vs 真实」的偏差，攒成一条可见的校准曲线。
 * uni-app 走 uni.storage；普通浏览器走 localStorage；Node 自检走内存。
 * 学习的对象因此从「公式」变成「我自己的脑子」。
 */

const KEY = 'intuition_profile_v1'
const memory = { data: null }

function backend() {
  if (typeof uni !== 'undefined' && uni && typeof uni.getStorageSync === 'function') return 'uni'
  if (typeof localStorage !== 'undefined') return 'local'
  return 'memory'
}

function raw() {
  const b = backend()
  try {
    const s = b === 'uni' ? uni.getStorageSync(KEY) : (b === 'local' ? localStorage.getItem(KEY) : memory.data)
    if (!s) return { attempts: [] }
    const o = typeof s === 'string' ? JSON.parse(s) : s
    return { attempts: Array.isArray(o.attempts) ? o.attempts : [] }
  } catch (e) { return { attempts: [] } }
}

function save(o) {
  const str = JSON.stringify(o)
  const b = backend()
  try {
    if (b === 'uni') uni.setStorageSync(KEY, str)
    else if (b === 'local') localStorage.setItem(KEY, str)
    else memory.data = str
  } catch (e) { /* 存储不可用时本次会话有效 */ }
}

export function loadProfile() { return raw() }

export function recordAttempt(expId, guess, actual, err) {
  const o = raw()
  o.attempts.push({
    id: expId, guess: Number(guess), actual: Number(actual),
    err: Number(err), at: Date.now()
  })
  if (o.attempts.length > 300) o.attempts = o.attempts.slice(-300)
  save(o)
  return o
}

export function stats() {
  const a = raw().attempts
  if (!a.length) return { total: 0, avgErr: 0, best: 0, played: 0, recent: [], byExp: {} }
  const byExp = {}
  for (const x of a) {
    if (!byExp[x.id]) byExp[x.id] = { n: 0, sum: 0, last: 0 }
    byExp[x.id].n++
    byExp[x.id].sum += x.err
    byExp[x.id].last = x.err
  }
  const avg = a.reduce((s, x) => s + x.err, 0) / a.length
  return {
    total: a.length,
    avgErr: Math.min(999, Math.round(avg)),
    best: Math.round(Math.min(...a.map(x => x.err))),
    played: Object.keys(byExp).length,
    recent: a.slice(-10),
    byExp
  }
}

export function resetProfile() {
  save({ attempts: [] })
  return stats()
}
