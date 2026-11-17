/**
 * verify-h5.mjs — H5 构建产物的浏览器端验收（无第三方测试框架）
 *
 * 用法：node scripts/verify-h5.mjs [预览地址]
 * 前置：先 npm run build:h5，再 npm run preview:h5（默认 http://127.0.0.1:8767/）
 *
 * 通过 Chrome DevTools Protocol 驱动本机 headless Chrome，验证：
 *   首页统计/卡片数、学段与学科筛选、教材章节卡片、横向溢出、
 *   以及若干新实验的四步流程（猜 → 跑 → 偏差 → 公式出现）和渲染器分支。
 * 只依赖 Node 内置模块与工程里已有的 ws。
 */
import { spawn } from 'node:child_process'
import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs'
import WebSocket from 'ws'
import { EXPERIMENTS, TOPIC_ORDER } from '../src/common/experiments.js'

const BASE = process.argv[2] || 'http://127.0.0.1:8767/'
const PORT = 9223
const CHROME_CANDIDATES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe'
]
const CHROME = CHROME_CANDIDATES.find(p => fs.existsSync(p))
if (!CHROME) { console.error('未找到本机 Chrome / Edge'); process.exit(1) }

const sleep = ms => new Promise(r => setTimeout(r, ms))
let passed = 0, failed = 0
const check = (name, ok, detail = '') => {
  if (ok) { passed++; console.log('PASS  ' + name) }
  else { failed++; console.log('FAIL  ' + name + (detail ? '  → ' + detail : '')) }
}

// 期望值从实验清单动态推导：以后新增实验不必再改本脚本的数字。
const chapterCount = prefix => EXPERIMENTS.filter(e => e.chapter.indexOf(prefix) === 0).length
const EXPECT = {
  total: EXPERIMENTS.length,
  juniorPhysics: EXPERIMENTS.filter(e => e.stage === '初中' && e.subject === '物理').length,
  b8a: chapterCount('八上 ·'),
  b8b: chapterCount('八下 ·'),
  b9: chapterCount('九全 ·'),
  high: chapterCount('必修'),
  highMath: EXPERIMENTS.filter(e => e.stage === '高中' && e.subject === '数学').length
}

const profile = path.join(os.tmpdir(), 'intuition-lab-verify-chrome')
const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run',
  '--remote-debugging-port=' + PORT, '--user-data-dir=' + profile,
  '--window-size=430,900', 'about:blank'
], { stdio: 'ignore' })

let ws = null, nextId = 1
const pending = new Map()
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = nextId++
    pending.set(id, { resolve, reject })
    ws.send(JSON.stringify({ id, method, params }))
  })
}
async function evalJs(expression, awaitPromise = false) {
  const r = await send('Runtime.evaluate', {
    expression, returnByValue: true, awaitPromise, userGesture: true
  })
  if (r.exceptionDetails) {
    throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description || ''))
  }
  return r.result.value
}
async function waitFor(expression, timeout = 12000, label = '') {
  const t0 = Date.now()
  while (Date.now() - t0 < timeout) {
    try {
      const v = await evalJs('(function(){try{return !!(' + expression + ')}catch(e){return false}})()')
      if (v) return true
    } catch (_) { /* 页面切换中 */ }
    await sleep(180)
  }
  throw new Error('等待超时：' + (label || expression))
}
async function navigate(hash) {
  // uni-app H5 在 lab → lab 只换 query 时会复用组件、不重新触发 onLoad，
  // 强制整页重载，保证每个实验都走一遍完整的初始化流程。
  await evalJs('location.href = ' + JSON.stringify(BASE + hash) + '; location.reload(); true')
  await sleep(900)
}

async function main() {
  // --- 连接 CDP ---
  let target = null
  for (let i = 0; i < 50 && !target; i++) {
    try {
      const r = await fetch('http://127.0.0.1:' + PORT + '/json/new?' + encodeURIComponent(BASE), { method: 'PUT' })
      if (r.ok) target = await r.json()
    } catch (_) { /* Chrome 还在启动 */ }
    if (!target) await sleep(250)
  }
  if (!target) throw new Error('Chrome 远程调试端口未就绪')
  ws = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((res, rej) => { ws.once('open', res); ws.once('error', rej) })
  ws.on('message', buf => {
    const m = JSON.parse(String(buf))
    if (m.id && pending.has(m.id)) {
      const { resolve, reject } = pending.get(m.id)
      pending.delete(m.id)
      m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result)
    }
  })
  await send('Page.enable')
  await send('Runtime.enable')
  await waitFor('document.querySelectorAll(".exp-card").length > 0', 20000, '首页卡片渲染')

  // --- 首页 ---
  const total = await evalJs('document.querySelectorAll(".exp-card").length')
  check('首页实验卡片 = ' + EXPECT.total, total === EXPECT.total, '实际 ' + total)
  const heroTotal = await evalJs('document.querySelector(".hero .meta-v")?.textContent.trim()')
  check('首页统计实验数 = ' + EXPECT.total, heroTotal === String(EXPECT.total), '实际 ' + heroTotal)

  const cards = await evalJs('Array.from(document.querySelectorAll(".exp-card")).map(x => ({ id: x.dataset.id, topic: x.dataset.topic }))')
  check('首页顺序与主题排序清单一致',
    JSON.stringify(cards.map(c => c.id)) === JSON.stringify(EXPERIMENTS.map(e => e.id)))
  let grouped = true
  let lastRank = -1
  for (const c of cards) {
    const r = TOPIC_ORDER.indexOf(c.topic)
    if (r < 0 || r < lastRank) { grouped = false; break }
    lastRank = r
  }
  check('同主题实验连续排列', grouped)

  const chapters = await evalJs(`(function(){
    const t = Array.from(document.querySelectorAll('.exp-ch')).map(x => x.textContent)
    return { b8a: t.filter(x => x.indexOf('八上 ·') === 0).length,
             b8b: t.filter(x => x.indexOf('八下 ·') === 0).length,
             b9:  t.filter(x => x.indexOf('九全 ·') === 0).length,
             high: t.filter(x => x.indexOf('必修') === 0).length }
  })()`)
  check('八上章节卡片 = ' + EXPECT.b8a, chapters.b8a === EXPECT.b8a, JSON.stringify(chapters))
  check('八下章节卡片 = ' + EXPECT.b8b, chapters.b8b === EXPECT.b8b, JSON.stringify(chapters))
  check('九全章节卡片 = ' + EXPECT.b9, chapters.b9 === EXPECT.b9, JSON.stringify(chapters))
  check('高中教材卡片 = ' + EXPECT.high, chapters.high === EXPECT.high, JSON.stringify(chapters))

  const overflow = await evalJs('(function(){const p=document.querySelector(".page");return {sw:p.scrollWidth,iw:window.innerWidth}})()')
  check('首页无横向溢出', overflow.sw <= overflow.iw + 2, JSON.stringify(overflow))

  // --- 筛选：初中 · 物理 ---
  await evalJs(`(function(){
    const rows=document.querySelectorAll('.chip-row')
    rows[0].querySelectorAll('.chip')[1].click()
    rows[1].querySelectorAll('.chip')[1].click()
    return true
  })()`)
  await sleep(400)
  const filtered = await evalJs('document.querySelectorAll(".exp-card").length')
  check('筛选「初中·物理」= ' + EXPECT.juniorPhysics + ' 个', filtered === EXPECT.juniorPhysics, '实际 ' + filtered)
  const countLine = await evalJs('document.querySelector(".count-line")?.textContent.trim()')
  check('筛选计数文案同步', (countLine || '').indexOf(String(EXPECT.juniorPhysics)) >= 0, countLine)

  // --- 筛选：高中 · 数学（数学批次上线后新增）---
  await evalJs(`(function(){
    const rows=document.querySelectorAll('.chip-row')
    rows[0].querySelectorAll('.chip')[2].click()
    rows[1].querySelectorAll('.chip')[2].click()
    return true
  })()`)
  await sleep(400)
  const mathFiltered = await evalJs('document.querySelectorAll(".exp-card").length')
  check('筛选「高中·数学」= ' + EXPECT.highMath + ' 个', mathFiltered === EXPECT.highMath, '实际 ' + mathFiltered)
  const mathCountLine = await evalJs('document.querySelector(".count-line")?.textContent.trim()')
  check('数学筛选计数文案同步', (mathCountLine || '').indexOf(String(EXPECT.highMath)) >= 0, mathCountLine)

  // --- 新实验四步流程 ---
  async function playLab(id, title, guess, expectFormula, chapterRe, diagramNodes) {
    await navigate('#/pages/lab/lab?id=' + id)
    await waitFor('Array.from(document.querySelectorAll(".title")).some(x => x.textContent.indexOf(' + JSON.stringify(title) + ') >= 0)', 12000, id + ' 标题')
    const head = await evalJs('(function(){const t=Array.from(document.querySelectorAll(".title")).pop();const c=Array.from(document.querySelectorAll(".chapter")).pop();return {t:t&&t.textContent.trim(), c:c&&c.textContent.trim()||""}})()')
    check(id + ' 章节标签正确', (chapterRe || /八上 ·|八下 ·|九全 ·/).test(head.c), head.c)
    if (diagramNodes) {
      const nodeCount = await evalJs('document.querySelectorAll(".dg-node").length')
      check(id + ' diagram 装置节点 = ' + diagramNodes, nodeCount === diagramNodes, '实际 ' + nodeCount)
      const stageCap = await evalJs('document.querySelector(".stage-cap")?.textContent.trim()')
      check(id + ' diagram 舞台说明非空', !!stageCap, stageCap)
    }

    const inputOk = await evalJs(`(function(){
      const box=document.querySelector('.guess-input')
      const el=box && (box.querySelector('input') || (box.tagName==='INPUT'?box:null))
      if(!el) return false
      const setter=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set
      setter.call(el, ${JSON.stringify(String(guess))})
      el.dispatchEvent(new Event('input',{bubbles:true}))
      el.dispatchEvent(new Event('change',{bubbles:true}))
      return true
    })()`)
    check(id + ' 猜测输入框可写', inputOk === true)
    await sleep(250)

    await evalJs('document.querySelector(".btn").click(); true')
    await waitFor('document.querySelector(".formula-card")', 20000, id + ' 公式卡片')
    const result = await evalJs(`(function(){
      const g=x=>document.querySelector(x)?.textContent.trim()||''
      return { real:g('.res-real'), err:g('.res-err'), formula:g('.fc-f'),
               calc:g('.fc-c'), insight:g('.insight .ib-b'), boundary:g('.boundary .ib-b'),
               next:g('.next .ib-b'), again:!!document.querySelector('.btn-again'),
               stepOn:document.querySelectorAll('.step-on').length }
    })()`)
    check(id + ' 真实值/偏差出现', !!result.real && /%/.test(result.err), JSON.stringify(result))
    check(id + ' 公式与代入出现', result.formula.indexOf(expectFormula) >= 0 && !!result.calc, result.formula)
    check(id + ' 洞察/边界/下一问齐全', !!result.insight && !!result.boundary && !!result.next)
    check(id + ' 第 4 步高亮 + 再猜按钮', result.stepOn === 4 && result.again)
    if (diagramNodes) {
      const lit = await evalJs('document.querySelectorAll(".dg-on").length')
      check(id + ' diagram 跑完节点全亮', lit === diagramNodes, '实际 ' + lit)
    }
    return result
  }

  await playLab('j9_heat_cap', '同样晒一下午，海水为什么没那么烫', 5, 'Q = cmΔT')
  await playLab('j8b_buoyancy', '再往下按，浮力会变大吗', 2, 'F浮')

  // --- 牛顿运动定律补齐批次：6 条全部走一遍四步流程 ---
  const NEWTON_LABS = [
    ['b1_newton1', '撤掉推力，小车会慢慢停下吗', 1.5, 'v(t) = v₀ − a·t'],
    ['b1_newton3', '大卡车撞小轿车，谁受的力大', 10, 'F₁₂ = −F₂₁'],
    ['b1_apparent_weight', '电梯往上加速，秤会变重吗', 588, 'N = m(g + a)'],
    ['b1_newton_apply', '两个木块一起推，中间传过去多大力', 12, 'a = F/(m₁+m₂)'],
    ['j8b_newton1', '同样的速度，重书包会滑得更远吗', 2, 's = v₀²/(2μg)'],
    ['j8b_balance', '两边各拉 3 N，绳子张力是 6 N 吗', 6, '二力平衡：T = F']
  ]
  for (const [id, title, guess, formula] of NEWTON_LABS) {
    await playLab(id, title, guess, formula, /必修一 ·|八下 ·/)
  }

  // --- 高考 / 中考考点补齐批次：跨章节抽查 6 条 ---
  const EXAM_LABS = [
    ['b1_brake', '刹车后 6 秒，车走了多远', 30, 't停 = v₀/a'],
    ['b3_charge_deflect', '电子飞过偏转板，会偏多少', 4, 'y = ½·(qE/m)'],
    ['gk_momentum', '两车粘在一起，撞完还有多快', 6, 'm₁v₁ = (m₁+m₂)v'],
    ['j8b_solid_pressure', '箱子换个面放，压强变多少', 50, 'p = F/S'],
    ['j9_rated_power', '220 V 100 W 的灯泡，接 110 V 还剩几瓦', 50, 'P实 = P额·(U实/U额)²'],
    ['j9_heat_balance', '冷热水兑一起，最后是几度', 40, 'Q放 = Q吸']
  ]
  for (const [id, title, guess, formula] of EXAM_LABS) {
    await playLab(id, title, guess, formula, /必修一 ·|必修三 ·|高考专题 ·|八下 ·|九全 ·/)
  }

  // --- 2026-11-17 收尾批次：选择性必修 / 中考 / 教材定性实验栏目 ---
  const ROUND3_LABS = [
    ['gk_gas_charles', '从 20 ℃ 加热到 60 ℃，压强会变成 3 倍吗', 300, '查理定律'],
    ['gk_ac_rms', '峰值 311 V 的交流电，为什么标成 220 V', 155, '正弦式交变电流'],
    ['gk_half_life', '过了三个半衰期，还剩多少没衰变', 50, 'N = N₀·(1/2)'],
    ['j9_series_i', '串联电阻一大一小，两处电流会不一样吗', 0.2, '串联电路'],
    ['j8b_bernoulli', '管子变细流速翻倍，压强差有多大', 5, '伯努利方程'],
    ['book_induction_condition', '磁铁静静放在线圈里，电流表会动吗', 0.5, 'ε = N·ΔΦ/Δt', 6],
    ['gk_lenz', '磁铁插进线圈，线圈是推它还是拉它', -1, '楞次定律', 6],
    ['book_capacitor_charge', '电容充满电以后，回路里还有电流吗', 0.3, '充电完成', 6]
  ]
  for (const [id, title, guess, formula, nodes] of ROUND3_LABS) {
    await playLab(id, title, guess, formula,
      /高考专题 ·|教材实验 ·|必修|八上 ·|八下 ·|九全 ·/, nodes)
  }

  // --- 2026-11-17 初中物理逐章收尾批次：抽查 8 条（含 2 条 diagram）---
  const ROUND4_LABS = [
    ['j8a_thermometer', '液柱停在第 42 格，到底几度', 40, '分度值 = '],
    ['j8a_glasses', '200 度的近视镜，焦距是多少', 2, '焦度 Φ'],
    ['j8b_no_work', '提着箱子水平走 10 m，力做了多少功', 250, 'W = Fs·cosθ'],
    ['j8b_incline', '盘山公路为什么修得那么绕', 200, '功的原理'],
    ['j9_ammeter_scale', '同一根指针，换个量程读数差几倍', 0.24, '读数 = 量程'],
    ['j9_varistor_wiring', '接了上面两个接线柱，滑片还能调电阻吗', 15, '必须「一上一下」', 6],
    ['j9_safety', '36 V 为什么被定为安全电压', 1, 'I = U/R人体', 6],
    ['j9_nuclear_energy', '1 g 铀裂变，相当于烧多少煤', 1, 'E = Δm·c²']
  ]
  for (const [id, title, guess, formula, nodes] of ROUND4_LABS) {
    await playLab(id, title, guess, formula, /八上 ·|八下 ·|九全 ·/, nodes)
  }

  // --- 2026-11-17 教材定性栏目收尾批次：9 条全测（含 7 条 diagram 节点全亮）---
  const ROUND5_LABS = [
    ['j8a_noise_level', '装了隔音墙，是在哪一环节减弱噪声', 1, '控制噪声的三条途径', 6],
    ['j8a_sublimation', '霜是「冻」出来的，可它到底是吸热还是放热', 1, '升华（固→气）吸热', 6],
    ['j8a_invisible_light', '验钞机用的到底是红外线还是紫外线', 1, '红外线：热效应显著', 6],
    ['j8a_micro_telescope', '显微镜最后看到的像，是实像还是虚像', 1, '物镜成倒立放大实像', 6],
    ['j8b_force_elements', '推门推在门把手旁边，为什么省这么多力', 1, '力的三要素'],
    ['j8b_lever_types', '动力臂 30 cm、阻力臂 10 cm，这根杠杆算哪一类', 60, 'F₁l₁ = F₂l₂'],
    ['j9_internal_energy_way', '搓手让手变热，是「热传进来」了吗', -1, '改变内能的两种方式', 6],
    ['j9_circuit_read', '两个灯泡挨着画，就一定串联吗', 2, '串联：电流只有一条路径', 6],
    ['j9_energy_class', '电能是一次能源吗', 1, '一次能源 = 直接从自然界获取', 6]
  ]
  for (const [id, title, guess, formula, nodes] of ROUND5_LABS) {
    await playLab(id, title, guess, formula, /八上 ·|八下 ·|九全 ·/, nodes)
  }

  // --- 数学批次：必修一/二各抽 3 条 + 高考专题 4 条（含 diagram / bars）---
  const MATH_LABS = [
    ['m1_set_union', '两个小组人数加起来，为什么比全班还多', 55, '|A∪B|'],
    ['m1_bisection', '二分法 10 次，精度能到多少', 0.1, '每次区间长度减半'],
    ['m1_trig_period', 'sin(2026π + π/6) 到底等于多少', 1, 'sin(2mπ + θ)'],
    ['m2_vector_dot', '两个向量长度 3 和 4，点积一定是 12 吗', 12, 'a·b = |a||b|cosθ'],
    ['m2_cube_section', '一个平面截正方体，截面最多是几边形', 4, '边数 ≤ 面数', 6],
    ['m2_stats_shift', '每个数据都加 10，方差会变成多少', 14, 'D(X + c) = D(X)'],
    ['m2_prob_dice', '掷两枚骰子，至少一个 6 点是 33.3% 吗', 33.3, 'P(至少一个 6)'],
    ['mgk_sum_geo', '棋盘放麦粒，最后一格和全部相比哪个多', 100, '等比数列求和'],
    ['mgk_bayes_test', '检测准确率 99%，阳性就真的有病吗', 99, 'P(病|阳)'],
    ['mgk_normal_2sigma', '正态分布的 μ±2σ 里装了多少数据', 68, '3σ 原则']
  ]
  for (const [id, title, guess, formula, nodes] of MATH_LABS) {
    await playLab(id, title, guess, formula, /必修一 ·|必修二 ·|高考专题 ·/, nodes)
  }

  // --- 渲染器分支：波列 / 电路 ---
  await navigate('#/pages/lab/lab?id=j8a_sound_lambda')
  await waitFor('document.querySelectorAll(".wv-bar").length === 36', 12000, 'wave 渲染器')
  const waveCap = await evalJs('document.querySelector(".stage-cap")?.textContent.trim()')
  check('wave 舞台说明含真实波长', /λ = 340\/440/.test(waveCap || ''), waveCap)

  await navigate('#/pages/lab/lab?id=j9_series_r')
  await waitFor('document.querySelector(".ci-lamp")', 12000, 'circuit 渲染器')
  const circuitCap = await evalJs('document.querySelector(".stage-cap")?.textContent.trim()')
  check('circuit 舞台说明含总阻', /总阻 10 Ω/.test(circuitCap || ''), circuitCap)
  const labOverflow = await evalJs('(function(){const p=document.querySelector(".page");return {sw:p.scrollWidth,iw:window.innerWidth}})()')
  check('实验页无横向溢出', labOverflow.sw <= labOverflow.iw + 2, JSON.stringify(labOverflow))

  console.log('\n浏览器验收：' + passed + ' PASS / ' + failed + ' FAIL')
  if (failed) process.exitCode = 1
}

main().catch(e => {
  console.error('\n验证中断：' + (e && e.stack || e))
  process.exitCode = 1
}).finally(() => {
  if (ws) { try { ws.close() } catch (_) {} }
  try { chrome.kill() } catch (_) {}
})
