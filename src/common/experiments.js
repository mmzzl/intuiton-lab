/**
 * experiments.js — 实验清单（纯数据 / 唯一扩展点）
 *
 * 新增一个实验 = 往 EXPERIMENTS 里加一条记录，页面、四步框架、渲染器、
 * 直觉档案全部自动接上。绝大多数情况不需要改 lab.vue 或 engine.js。
 *
 * 推荐流程：
 *   1) npm run new:exp -- --id=my_lab --title="我的实验" --renderer=function
 *      （生成一条自洽骨架并插入本文件末尾；--list 可看全部渲染器）
 *   2) 改文案与公式（骨架里标了 TODO 的字段）
 *   3) npm run check          ← 全量自检，不通过会明确告诉你哪条错了
 *   4) npm run build:h5 / build:mp-weixin / build:app，App 需重新云打包 APK
 *
 * ── 必填字段 ────────────────────────────────────────────────
 *   id            唯一英文标识，如 'freefall'；直觉档案按它存，别改老 id
 *   stage         '初中' | '高中'        subject   '物理' | '数学'
 *   chapter       教材章节，如 '力学 · 单摆'（首页展示用）
 *   title / hook  标题 / 一句反直觉钩子
 *   question      让用户先猜的问题
 *   predictLabel / predictUnit / predictDefault / predictMin / predictMax
 *                 猜测输入框（允许 0 与负数；须满足 min < default < max）
 *   params        [ { key, label, unit, min, max, step, value } ]
 *                 或 { key, label, options:[{label,value}], value } 做离散选项
 *   renderer      见下表，决定舞台画什么
 *   duration      模拟时长（秒），通常 2.2 ~ 3.4
 *   truth(p)      真值函数，返回有限正数 —— 用来算「我的偏差」
 *   formula       公式文字（跑完才出现）
 *   calc(p)       把当前参数代进公式的字符串
 *   insight / boundary / next
 *                 为什么会这样 / 模型在哪里失效 / 下一问（boundary 别省）
 *
 * ── 渲染器 → 参数 key 必须照抄（舞台与引擎按这些键取值）──────
 *   freefall    h, g              pendulum    L, g
 *   spring      m, k              projectile  v0, ang, g
 *   wave        f, lam            doppler     f, vs
 *   optics      a1, n2            circuit     U, R
 *   lever       F1, L1, L2        triangle    a, b
 *   function    任意键 + curve, domain（画曲线）
 *   bars        n + trial, mcTarget（蒙特卡洛柱状图）
 *   diagram     任意键 + diagram(p) → [{ label, value, tone }]（定性装置节点依次点亮）
 *
 * ── 可选字段 ────────────────────────────────────────────────
 *   caption(p, state)  自定义舞台底部说明；不写则按 renderer 出默认文案
 *   curveLabel(p)      function 渲染器的默认说明（不写则显示 formula）
 *   curve / domain     function 渲染器必填：curve(p)(x) → y，domain(p) → [x0,x1]
 *   trial(p, rng)      bars 渲染器必填：一次试验返回 true/false
 *   mcTarget           bars 的真实值；不写则用 truth(p)
 *   diagram(p)         diagram 渲染器必填：节点数组，tone 取 'warn' / 'good' / 缺省
 *
 * 只有「现有 13 种画面都不够用」时才需要动代码：
 *   engine.js 的 frameState 加一个 case 产出 state 字段，
 *   lab.vue 舞台区加一个 v-else-if 分支消费它，并把它加进 isAnimated（若需动画）。
 *
 * ── 教材批次 ────────────────────────────────────────────────
 *   b1_ / b2_ / b3_ 基础 18 条 → 人教版高中物理必修一/二/三册（PDF 自带文本层）
 *   j8a_ / j8b_ / j9_ 基础 20 条 → 人教版初中物理八上/八下/九全（整页扫描版，先 OCR）
 *   2026-11-16 另补 6 条牛顿运动定律专题（b1_newton1 / b1_newton3 /
 *   b1_apparent_weight / b1_newton_apply / j8b_newton1 / j8b_balance），
 *   把定性定律改造成可猜数的定量反直觉题，仍全部复用 function 渲染器。
 *   另补 27 条高考 / 中考高频考点（见文件末尾「考点补齐批次」注释），
 *   其中 gk_ 前缀来自选择性必修（用户未提供该教材，按高考考纲补，
 *   chapter 标「高考专题 ·」，不计入 textbook:scan 的教材落地数）。
 *   2026-11-17 再补 31 条「选择性必修 / 中考收尾」考点，并新增 diagram 渲染器
 *   承接教材里明确标注的定性实验栏目（chapter 标「教材实验 ·」，同样不计入索引）。
 *   同日下午按人教版初中三册逐章对照，再补 20 条初中物理缺口
 *   （八上 7 / 八下 6 / 九全 7，其中第二十二章此前 0 条）。
 *   再补 9 条教材定性栏目收尾（噪声等级、升华凝华、看不见的光、
 *   显微镜望远镜、力的三要素、杠杆分类、内能改变方式、电路图识别、
 *   能源分类）：7 条用 diagram 做方向 / 分类编码且真值随选项变化，
 *   2 条改造成 function 定量曲线。
 *   2026-11-17 晚间：用户补入 6 本人教数学教材，以 A 版必修一/二为主线
 *   新增 20 条（m1_ / m2_），另补 10 条高考数学专题（mgk_：数列、导数、
 *   圆锥曲线、计数、概率统计）。mgk_ 与 gk_ 一样不计入教材落地数。
 *   当前共 176 个实验。
 *   2026-11-17 下午：首页改为按主题分组排序（力学 → 热学 → 电磁 → 光学 →
 *   声与波动 → 近代物理 → 数学各主题），同主题内再按学段、章节排；
 *   原始录入顺序保留在 RAW_EXPERIMENTS，新增实验追加进去会自动归位。
 *   chapter 字段直接写教材章节。目录索引见 scripts/textbook-outline.json，
 *   扫描版教材的 OCR 目录见 scripts/textbook-ocr.json。
 *   往 D:/textbook 放入新教材后重跑：
 *     npm run textbook:scan   （有文本层的 PDF，抽目录 + 实验栏目）
 *     npm run textbook:ocr    （扫描图片版 PDF，需本地中文 OCR 依赖）
 */

const PI = Math.PI
const rad = d => d * PI / 180
const deg = r => r * 180 / PI
const G = [
  { label: '地球 9.8', value: 9.8 },
  { label: '月球 1.6', value: 1.6 },
  { label: '木星 24.8', value: 24.8 }
]

/** 刹车位移：t 超过停车时间后位移封顶，避免匀变速公式算出「车倒退」 */
const brakeDist = (v0, a, t) => v0 * v0 / (2 * a) - 0.5 * a * Math.max(0, v0 / a - t) ** 2

export const STAGES = ['全部', '初中', '高中']
export const SUBJECTS = ['全部', '物理', '数学']

/*
 * 原始录入数组。首页展示用的是下面按 topic 排序后的 EXPERIMENTS，
 * 新增实验仍可往这里追加，排序会自动生效。
 */
const RAW_EXPERIMENTS = [
  // ------------------------------------------------------------ 初中 · 物理
  {
    id: 'freefall', stage: '初中', subject: '物理', chapter: '力学 · 自由落体',
    title: '铁球和木球，谁先落地',
    hook: '直觉常说「重的先落地」。真的吗？',
    question: '从高处同时松手，落地要几秒？两个球谁先到？',
    predictLabel: '你猜落地时间', predictUnit: 's', predictDefault: 3.0, predictMin: 0.1, predictMax: 20,
    params: [
      { key: 'h', label: '高度 h', unit: 'm', min: 5, max: 40, step: 1, value: 20 },
      { key: 'g', label: '重力 g', unit: 'm/s²', options: G, value: 9.8 }
    ],
    renderer: 'freefall', duration: 3.2,
    truth: p => Math.sqrt(2 * p.h / p.g),
    formula: 't = √(2h / g)',
    calc: p => '√(2 × ' + p.h + ' / ' + p.g + ')',
    insight: '落地时间只由高度和重力决定，与质量无关。两个球会同时撞地。',
    boundary: '忽略了空气阻力。羽毛在空气里确实慢，那是阻力造成的，不是重力偏心。',
    next: '把重力换成月球再猜一次——时间会变成几倍？'
  },
  {
    id: 'pendulum', stage: '初中', subject: '物理', chapter: '力学 · 单摆',
    title: '单摆：摆长与周期',
    hook: '绳子加长 4 倍，一个来回会慢 4 倍吗？',
    question: '一个完整来回要几秒？',
    predictLabel: '你猜周期', predictUnit: 's', predictDefault: 2.0, predictMin: 0.1, predictMax: 20,
    params: [
      { key: 'L', label: '摆长 L', unit: 'm', min: 0.2, max: 2, step: 0.1, value: 1 },
      { key: 'g', label: '重力 g', unit: 'm/s²', options: G, value: 9.8 }
    ],
    renderer: 'pendulum', duration: 3.2,
    truth: p => 2 * PI * Math.sqrt(p.L / p.g),
    formula: 'T = 2π√(L / g)',
    calc: p => '2π√(' + p.L.toFixed(1) + ' / ' + p.g + ')',
    insight: '周期与摆幅、摆锤质量都无关，只跟 √(L/g) 走。',
    boundary: '小角近似（摆角 < 15°）。摆角拉大后周期会略变长，公式开始失准。',
    next: '把摆长调到 4 倍再猜一次——多数人第一反应是 4 倍，其实是 2 倍。'
  },
  {
    id: 'lever', stage: '初中', subject: '物理', chapter: '力学 · 杠杆平衡',
    title: '杠杆：力臂比力气更重要',
    hook: '大人坐近一点，小孩也能撬起来。',
    question: '右边要用多大力，杠杆才平衡？',
    predictLabel: '你猜右边的力', predictUnit: 'N', predictDefault: 10, predictMin: 0.1, predictMax: 200,
    params: [
      { key: 'F1', label: '左边力 F₁', unit: 'N', min: 1, max: 20, step: 1, value: 10 },
      { key: 'L1', label: '左力臂 L₁', unit: 'm', min: 0.1, max: 1, step: 0.1, value: 0.4 },
      { key: 'L2', label: '右力臂 L₂', unit: 'm', min: 0.1, max: 1, step: 0.1, value: 0.8 }
    ],
    renderer: 'lever', duration: 2.6,
    truth: p => p.F1 * p.L1 / p.L2,
    formula: 'F₂ = F₁L₁ / L₂',
    calc: p => p.F1 + ' × ' + p.L1.toFixed(1) + ' / ' + p.L2.toFixed(1),
    insight: '决定转动效果的是「力 × 力臂」，不是单纯的力气。',
    boundary: '假设杠杆自身无重量、支点无摩擦、处于静止平衡。',
    next: '把右力臂缩到一半再猜——需要的力会翻几倍？'
  },
  {
    id: 'refraction', stage: '初中', subject: '物理', chapter: '光学 · 折射',
    title: '光拐弯：折射角有多大',
    hook: '筷子插进水里「断了」，其实是光在拐弯。',
    question: '光从空气斜射入介质，折射角是多少度？',
    predictLabel: '你猜折射角', predictUnit: '°', predictDefault: 30, predictMin: 1, predictMax: 89,
    params: [
      { key: 'a1', label: '入射角 θ₁', unit: '°', min: 10, max: 80, step: 5, value: 45 },
      { key: 'n2', label: '进入介质', unit: '', options: [
        { label: '水 1.33', value: 1.33 }, { label: '玻璃 1.50', value: 1.5 }, { label: '钻石 2.42', value: 2.42 }
      ], value: 1.33 }
    ],
    renderer: 'optics', duration: 2.4,
    truth: p => deg(Math.asin(Math.sin(rad(p.a1)) / p.n2)),
    formula: 'sinθ₁ / sinθ₂ = n₂ / n₁（斯涅尔定律）',
    calc: p => 'sinθ₂ = sin(' + p.a1 + '°) / ' + p.n2,
    insight: '进入更「密」的介质，光会向法线偏折；介质折射率越大，折得越狠。',
    boundary: '只模拟空气→密介质。反过来（密→疏）且角度过大时会发生全反射，光根本出不来。',
    next: '把入射角拉到 80° 再猜——折射角会不会也接近 80°？'
  },
  {
    id: 'ohm', stage: '初中', subject: '物理', chapter: '电学 · 欧姆定律',
    title: '灯泡有多亮：电流从哪来',
    hook: '电压推着电流跑，电阻在后面拽着。',
    question: '这个电路里的电流有多大？',
    predictLabel: '你猜电流', predictUnit: 'A', predictDefault: 1.0, predictMin: 0.01, predictMax: 20,
    params: [
      { key: 'U', label: '电压 U', unit: 'V', min: 1, max: 12, step: 1, value: 6 },
      { key: 'R', label: '电阻 R', unit: 'Ω', min: 1, max: 20, step: 1, value: 6 }
    ],
    renderer: 'circuit', duration: 2.4,
    truth: p => p.U / p.R,
    formula: 'I = U / R',
    calc: p => p.U + ' / ' + p.R,
    insight: '电压加倍电流加倍，电阻加倍电流减半。灯泡亮度跟功率 I²R 走。',
    boundary: '只适用于纯电阻且温度不变。真实灯丝发热后电阻会升高，电流并不严格成正比。',
    next: '把电阻减到一半再猜——电流翻倍，但亮度会翻几倍？'
  },

  // ------------------------------------------------------------ 高中 · 物理
  {
    id: 'projectile', stage: '高中', subject: '物理', chapter: '力学 · 抛体运动',
    title: '斜抛：什么角度扔得最远',
    hook: '45° 最远，但 30° 和 60° 呢？',
    question: '以这个初速和角度抛出，水平射程多少米？',
    predictLabel: '你猜射程', predictUnit: 'm', predictDefault: 20, predictMin: 0.1, predictMax: 500,
    params: [
      { key: 'v0', label: '初速 v₀', unit: 'm/s', min: 5, max: 30, step: 1, value: 15 },
      { key: 'ang', label: '抛射角 θ', unit: '°', min: 10, max: 80, step: 5, value: 45 },
      { key: 'g', label: '重力 g', unit: 'm/s²', options: G, value: 9.8 }
    ],
    renderer: 'projectile', duration: 3.4,
    truth: p => p.v0 * p.v0 * Math.sin(2 * rad(p.ang)) / p.g,
    formula: 'R = v₀² sin2θ / g',
    calc: p => p.v0 + '² × sin(' + (2 * p.ang) + '°) / ' + p.g,
    insight: '45° 射程最大；30° 和 60° 射程相同（互补角），但飞行时间和最高点不同。',
    boundary: '忽略空气阻力，且落点与抛出点等高。真实棒球受阻力影响，最远角度会小于 45°。',
    next: '把角度改成 30°，再改成 60°——射程会怎么变？'
  },
  {
    id: 'spring', stage: '高中', subject: '物理', chapter: '力学 · 简谐振动',
    title: '弹簧振子：越重越慢',
    hook: '挂更重的砝码，来回一次要多久？',
    question: '一个完整来回要几秒？',
    predictLabel: '你猜周期', predictUnit: 's', predictDefault: 1.5, predictMin: 0.1, predictMax: 20,
    params: [
      { key: 'm', label: '质量 m', unit: 'kg', min: 0.1, max: 2, step: 0.1, value: 0.5 },
      { key: 'k', label: '劲度 k', unit: 'N/m', min: 5, max: 80, step: 5, value: 20 }
    ],
    renderer: 'spring', duration: 3.2,
    truth: p => 2 * PI * Math.sqrt(p.m / p.k),
    formula: 'T = 2π√(m / k)',
    calc: p => '2π√(' + p.m.toFixed(1) + ' / ' + p.k + ')',
    insight: '越重越慢、弹簧越硬越快，与振幅无关——这叫等时性。',
    boundary: '要求弹簧在胡克定律范围内（F = −kx）。拉过头超过弹性限度，公式就失效。',
    next: '把质量调到 4 倍再猜一次——和单摆的平方根是不是同一个味道？'
  },
  {
    id: 'wave', stage: '高中', subject: '物理', chapter: '波动 · 波速公式',
    title: '行波：频率与波长谁决定波速',
    hook: '抖得更快，波会跑得更快吗？',
    question: '这列波的传播速度是多少？',
    predictLabel: '你猜波速', predictUnit: 'm/s', predictDefault: 2.0, predictMin: 0.1, predictMax: 30,
    params: [
      { key: 'f', label: '频率 f', unit: 'Hz', min: 0.5, max: 4, step: 0.5, value: 2 },
      { key: 'lam', label: '波长 λ', unit: 'm', min: 0.2, max: 2, step: 0.1, value: 0.8 }
    ],
    renderer: 'wave', duration: 3.0,
    truth: p => p.f * p.lam,
    formula: 'v = fλ',
    calc: p => p.f + ' × ' + p.lam.toFixed(1),
    insight: '频率由波源决定，波速由介质决定；两者一确定，波长自动跟着变。',
    boundary: '假设介质均匀、无色散。浅水波、光在玻璃里会发生色散，不同频率跑得不一样快。',
    next: '把频率翻倍、波长不动——现实里哪个量其实会自己变？'
  },
  {
    id: 'doppler', stage: '高中', subject: '物理', chapter: '波动 · 多普勒效应',
    title: '救护车驶过，警笛为何变调',
    hook: '靠近时音调变高，是声源变了吗？',
    question: '声源迎面靠近，你听到的频率是多少？',
    predictLabel: '你猜听到的频率', predictUnit: 'Hz', predictDefault: 500, predictMin: 50, predictMax: 5000,
    params: [
      { key: 'f', label: '声源频率 f', unit: 'Hz', min: 200, max: 800, step: 50, value: 400 },
      { key: 'vs', label: '声源速度 vₛ', unit: 'm/s', min: 0, max: 100, step: 5, value: 30 }
    ],
    renderer: 'doppler', duration: 3.0,
    truth: p => p.f * 340 / (340 - p.vs),
    formula: 'f′ = f · v / (v − vₛ)，v = 340 m/s',
    calc: p => p.f + ' × 340 / (340 − ' + p.vs + ')',
    insight: '声源靠近时波前被压扁，波长变短、频率变高；驶离时相反。',
    boundary: '声源速度必须远小于声速。vₛ 接近 340 m/s 时分母趋零，公式失效（音障）。',
    next: '把速度拉到 100 m/s 再猜——频率会高得超出直觉。'
  },

  // ------------------------------------------------------------ 初中 · 数学
  {
    id: 'pythagoras', stage: '初中', subject: '数学', chapter: '几何 · 直角三角形',
    title: '勾股定理：斜边到底多长',
    hook: '两条直角边相加？不，是平方相加。',
    question: '这个直角三角形的斜边有多长？',
    predictLabel: '你猜斜边 c', predictUnit: '', predictDefault: 6, predictMin: 0.1, predictMax: 30,
    params: [
      { key: 'a', label: '直角边 a', unit: '', min: 1, max: 8, step: 1, value: 3 },
      { key: 'b', label: '直角边 b', unit: '', min: 1, max: 8, step: 1, value: 4 }
    ],
    renderer: 'triangle', duration: 2.2,
    truth: p => Math.sqrt(p.a * p.a + p.b * p.b),
    formula: 'c = √(a² + b²)',
    calc: p => '√(' + p.a + '² + ' + p.b + '²)',
    insight: '这是面积关系：以三边为边长作正方形，两个小的面积之和等于大的。',
    boundary: '必须是直角三角形，且在平面（欧氏几何）上。球面上的三角形不成立。',
    next: '把两条边各翻一倍，斜边会变成几倍？'
  },
  {
    id: 'monty', stage: '初中', subject: '数学', chapter: '概率 · 条件概率',
    title: '三门问题：换还是不换',
    hook: '主持人打开一扇羊门后，换门会不会提高胜率？',
    question: '坚持「换门」，赢的概率是多少？',
    predictLabel: '你猜换门胜率', predictUnit: '%', predictDefault: 50, predictMin: 0.1, predictMax: 100,
    params: [
      { key: 'n', label: '模拟次数', unit: '次', min: 100, max: 2000, step: 100, value: 600 }
    ],
    renderer: 'bars', duration: 3.2, mcTarget: 100 * 2 / 3,
    trial: (p, r) => {
      const car = Math.floor(r() * 3)
      const pick = Math.floor(r() * 3)
      return pick !== car // 第一次选到羊时，换门必赢
    },
    truth: () => 100 * 2 / 3,
    formula: 'P(换门赢) = 2/3',
    calc: () => '第一次选错的概率 = 2/3，此时换门必赢',
    insight: '主持人「知道答案且必定开羊门」这个动作带来了信息，把 2/3 集中到了剩下的那扇门上。',
    boundary: '前提是主持人知道门后是什么、必定开羊门、且必定给你换的机会。规则一变，答案就变。',
    next: '如果主持人是随机开门、恰好开到羊，答案还是 2/3 吗？'
  },
  {
    id: 'parabola', stage: '初中', subject: '数学', chapter: '函数 · 二次函数',
    title: '抛物线：a、b、c 各管什么',
    hook: '三个数字，各自把曲线往哪儿拽？',
    question: '当 x = 2 时，y 等于多少？',
    predictLabel: '你猜 y(2)', predictUnit: '', predictDefault: 5, predictMin: -100, predictMax: 100,
    params: [
      { key: 'a', label: '二次项 a', unit: '', min: 0.5, max: 4, step: 0.5, value: 1 },
      { key: 'b', label: '一次项 b', unit: '', min: -4, max: 4, step: 1, value: 0 },
      { key: 'c', label: '常数 c', unit: '', min: -4, max: 4, step: 1, value: 0 }
    ],
    renderer: 'function', duration: 2.4,
    curveLabel: p => 'y = ' + p.a + 'x² + ' + p.b + 'x + ' + p.c,
    curve: p => x => p.a * x * x + p.b * x + p.c,
    domain: () => [-5, 5],
    truth: p => p.a * 4 + p.b * 2 + p.c,
    formula: 'y = ax² + bx + c',
    calc: p => p.a + ' × 2² + ' + p.b + ' × 2 + ' + p.c,
    insight: 'a 管开口方向和胖瘦，b 与 a 一起移动对称轴，c 是 y 轴截距。',
    boundary: '这里固定 a > 0。a = 0 时曲线退化成直线；定义域只画 −5 到 5。',
    next: '把 a 变成负数看看——预测公式还成立吗？'
  },

  // ------------------------------------------------------------ 高中 · 数学
  {
    id: 'birthday', stage: '高中', subject: '数学', chapter: '概率 · 生日悖论',
    title: '生日悖论：23 个人就过半',
    hook: '一间教室里有人同天生日，概率比你想的高得多。',
    question: 'n 个人里，至少两人生日相同的概率是多少？',
    predictLabel: '你猜概率', predictUnit: '%', predictDefault: 20, predictMin: 0.1, predictMax: 100,
    params: [
      { key: 'n', label: '人数 n', unit: '人', min: 10, max: 60, step: 5, value: 23 }
    ],
    renderer: 'bars', duration: 3.2,
    trial: (p, r) => {
      const seen = new Set()
      for (let i = 0; i < p.n; i++) {
        const d = Math.floor(r() * 365)
        if (seen.has(d)) return true
        seen.add(d)
      }
      return false
    },
    truth: p => {
      let q = 1
      for (let i = 0; i < p.n; i++) q *= (365 - i) / 365
      return (1 - q) * 100
    },
    formula: 'P = 1 − 365! / (365ⁿ · (365−n)!)',
    calc: p => '1 − ∏(i=0..' + (p.n - 1) + ') (365 − i)/365',
    insight: '比的是「配对数」n(n−1)/2，不是人数 n。23 人的配对数已经超过 250。',
    boundary: '假设生日在 365 天上均匀分布、忽略闰年与现实中的季节性出生偏差。',
    next: '把人数调到 50 再猜——几乎必然会发生，和直觉差多少？'
  },
  {
    id: 'exponential', stage: '高中', subject: '数学', chapter: '函数 · 指数增长',
    title: '复利翻倍：72 法则从哪来',
    hook: '前期慢得骗人，后期快得吓人。',
    question: '年化 r%，多少年能涨到 K 倍？',
    predictLabel: '你猜年数', predictUnit: '年', predictDefault: 10, predictMin: 0.1, predictMax: 200,
    params: [
      { key: 'r', label: '年化 r', unit: '%', min: 1, max: 20, step: 1, value: 6 },
      { key: 'K', label: '目标倍数', unit: '倍', options: [
        { label: '2 倍', value: 2 }, { label: '4 倍', value: 4 }, { label: '8 倍', value: 8 }
      ], value: 2 }
    ],
    renderer: 'function', duration: 2.6,
    curveLabel: p => 'y = (1 + ' + (p.r / 100).toFixed(2) + ')ˣ',
    curve: p => x => Math.pow(1 + p.r / 100, x),
    domain: p => [0, Math.max(6, Math.log(p.K) / Math.log(1 + p.r / 100) * 1.4)],
    truth: p => Math.log(p.K) / Math.log(1 + p.r / 100),
    formula: 'n = ln K / ln(1 + r)',
    calc: p => 'ln ' + p.K + ' / ln(1 + ' + (p.r / 100).toFixed(2) + ')',
    insight: '翻倍年数约等于 72 ÷ (100r)，这就是「72 法则」；指数增长没有「差不多线性」这回事。',
    boundary: '假设利率恒定、按期复利。现实里利率会变，还有通胀和税费。',
    next: '把 r 翻倍再猜——年数会不会正好减半？（接近，但不精确）'
  },
  {
    id: 'pi_mc', stage: '高中', subject: '数学', chapter: '概率 · 蒙特卡洛',
    title: '撒点估 π：随机也能量面积',
    hook: '不用圆规，撒一把点就能量出 π。',
    question: '往正方形里均匀撒点，落在 1/4 圆内的比例是多少？',
    predictLabel: '你猜落入比例', predictUnit: '%', predictDefault: 50, predictMin: 0.1, predictMax: 100,
    params: [
      { key: 'n', label: '撒点个数', unit: '个', min: 100, max: 3000, step: 100, value: 800 }
    ],
    renderer: 'bars', duration: 3.2, mcTarget: 100 * PI / 4,
    trial: (p, r) => {
      const x = r(), y = r()
      return x * x + y * y <= 1
    },
    truth: () => 100 * PI / 4,
    formula: 'P = (πr²/4) / r² = π/4 ≈ 78.54%',
    calc: () => 'π / 4，于是 π ≈ 4 × 落入比例',
    insight: '频率收敛到面积比，再用面积反推 π。样本越多越准，误差大约按 1/√n 下降。',
    boundary: '要求随机数真正均匀且独立。伪随机数质量差、样本太少时波动会很明显。',
    next: '把撒点数调到 100 再看一次——为什么少的时候跳得厉害？'
  },
  // ------------------------------- 人教版高中物理必修 · 教材批次 --------------
  // 来源：D:/textbook/物理_必修_第一册.pdf / 第二册 / 第三册
  // 章节字段直接对应教材目录；全部复用现有渲染器，未改动 lab.vue / engine.js
  {
    id: 'b1_cart_vt', stage: '高中', subject: '物理', chapter: '必修一 · 第二章 · 小车速度',
    title: '打点计时器：速度随时间怎么变',
    hook: '小车确实越滑越快，但速度是「均匀」变大的吗？',
    question: '加速度 2 m/s² 的小车从静止出发，5 s 末速度是多少？',
    predictLabel: '你猜 5 s 末速度', predictUnit: 'm/s', predictDefault: 5, predictMin: 0.1, predictMax: 40,
    params: [
      { key: 'a', label: '加速度 a', unit: 'm/s²', min: 0.5, max: 6, step: 0.5, value: 2 }
    ],
    renderer: 'function', duration: 2.6,
    curve: p => x => p.a * x,
    domain: () => [0, 5],
    truth: p => p.a * 5,
    formula: 'v = v₀ + at（从静止出发时 v₀ = 0）',
    calc: p => 'v = ' + p.a + ' × 5 = ' + (p.a * 5).toFixed(1) + ' m/s',
    insight: '匀加速的标志不是「越来越快」，而是 v–t 图是一条直线；这条直线的斜率就是加速度 a。教材用打点计时器逐段算平均速度，正是在逼近这条直线。',
    boundary: '要求合力恒定、质量不变。真实小车有摩擦和空气阻力，长轨道上加速度会逐渐变小，纸带末端会偏离直线。',
    next: '把加速度调到 4 再猜一次——斜率翻倍，5 s 末速度也翻倍吗？',
    curveLabel: p => 'v(t) = ' + p.a + 't，5 s 末 v = ' + (p.a * 5).toFixed(1) + ' m/s'
  },
  {
    id: 'b1_uniform_s', stage: '高中', subject: '物理', chapter: '必修一 · 第二章 · 匀变速位移',
    title: '位移为什么是时间的平方',
    hook: '时间变成 2 倍，位移只变 2 倍吗？',
    question: '加速度 2 m/s²，从静止出发 5 s 内走了多远？',
    predictLabel: '你猜 5 s 内位移', predictUnit: 'm', predictDefault: 12, predictMin: 0.1, predictMax: 100,
    params: [
      { key: 'a', label: '加速度 a', unit: 'm/s²', min: 0.5, max: 6, step: 0.5, value: 2 }
    ],
    renderer: 'function', duration: 2.6,
    curve: p => x => 0.5 * p.a * x * x,
    domain: () => [0, 5],
    truth: p => 0.5 * p.a * 25,
    formula: 's = v₀t + ½at²（从静止出发时 v₀ = 0）',
    calc: p => 's = ½ × ' + p.a + ' × 5² = ' + (12.5 * p.a).toFixed(1) + ' m',
    insight: 'v–t 图下的面积就是位移：三角形面积 = ½ × 底(t) × 高(at) = ½at²。平方来自「速度本身也在线性长大」。',
    boundary: '从静止出发且 a 恒定。有初速度时还要加 v₀t 项；变加速运动不能直接用这个式子。',
    next: '把时间想成 10 s——位移会是 5 s 的 2 倍还是 4 倍？',
    curveLabel: p => 's(t) = ' + (0.5 * p.a).toFixed(2) + 't²，5 s 内 s = ' + (12.5 * p.a).toFixed(1) + ' m'
  },
  {
    id: 'b1_freefall_t', stage: '高中', subject: '物理', chapter: '必修一 · 第二章 · 自由落体',
    title: '从 2 倍高度落下，时间是 2 倍吗',
    hook: '高度翻倍，下落时间并不会翻倍。',
    question: '从 20 m 高处自由落下，需要几秒？',
    predictLabel: '你猜落地时间', predictUnit: 's', predictDefault: 3.0, predictMin: 0.1, predictMax: 20,
    params: [
      { key: 'h', label: '高度 h', unit: 'm', min: 5, max: 80, step: 5, value: 20 },
      { key: 'g', label: '重力 g', unit: 'm/s²', options: G, value: 9.8 }
    ],
    renderer: 'freefall', duration: 2.8,
    truth: p => Math.sqrt(2 * p.h / p.g),
    formula: 't = √(2h/g)',
    calc: p => '√(2 × ' + p.h + ' / ' + p.g + ') = ' + Math.sqrt(2 * p.h / p.g).toFixed(2) + ' s',
    insight: '位移按 t² 增长，所以时间只与高度的平方根成正比：高度变 4 倍，时间才变 2 倍。伽利略当年正是靠斜面把时间「拉长」来量出这一点的。',
    boundary: '初速度为零、忽略空气阻力、g 视为恒定。羽毛或高空落体不成立；g 还会随纬度和海拔略变。',
    next: '把重力换成月球 1.6 再猜一次——时间会变成几倍？',
    caption: p => 'h = ' + p.h + ' m，g = ' + p.g + ' m/s² → t = ' + Math.sqrt(2 * p.h / p.g).toFixed(2) + ' s'
  },
  {
    id: 'b1_hooke', stage: '高中', subject: '物理', chapter: '必修一 · 第三章 · 弹簧弹力',
    title: '弹簧拉长 2 倍，力也 2 倍吗',
    hook: '在弹性限度内，力与形变量严格成正比。',
    question: '劲度系数 20 N/m 的弹簧拉长 0.3 m，弹力多大？',
    predictLabel: '你猜弹力', predictUnit: 'N', predictDefault: 4, predictMin: 0.1, predictMax: 60,
    params: [
      { key: 'k', label: '劲度系数 k', unit: 'N/m', min: 5, max: 60, step: 5, value: 20 },
      { key: 'x0', label: '形变量 x', unit: 'm', min: 0.1, max: 1, step: 0.1, value: 0.3 }
    ],
    renderer: 'function', duration: 2.4,
    curve: p => x => p.k * x,
    domain: p => [0, Math.max(1, p.x0 * 2)],
    truth: p => p.k * p.x0,
    formula: 'F = kx（胡克定律）',
    calc: p => 'F = ' + p.k + ' × ' + p.x0.toFixed(1) + ' = ' + (p.k * p.x0).toFixed(1) + ' N',
    insight: 'F–x 图是过原点的直线，斜率就是 k。教材「探究弹簧弹力与形变量的关系」逐次挂钩码，画出来的正是这条直线。',
    boundary: '只在弹性限度内成立。拉过头会发生塑性形变，卸载后回不到原长，直线末端会明显弯掉。',
    next: '把 x 调到 1.0 m 再猜——真实弹簧还能这么算吗？',
    curveLabel: p => 'F(x) = ' + p.k + 'x，x = ' + p.x0.toFixed(1) + ' m 时 F = ' + (p.k * p.x0).toFixed(1) + ' N'
  },
  {
    id: 'b1_force_add', stage: '高中', subject: '物理', chapter: '必修一 · 第三章 · 力的合成',
    title: '两个 3 N 的力，合力是 6 N 吗',
    hook: '互相垂直的两个力，合力反而比 3 + 3 小。',
    question: '两个互相垂直、都是 3 N 的力，合力多大？',
    predictLabel: '你猜合力', predictUnit: 'N', predictDefault: 5, predictMin: 0.1, predictMax: 20,
    params: [
      { key: 'a', label: '分力 F₁', unit: 'N', min: 1, max: 10, step: 1, value: 3 },
      { key: 'b', label: '分力 F₂', unit: 'N', min: 1, max: 10, step: 1, value: 3 }
    ],
    renderer: 'triangle', duration: 2.2,
    truth: p => Math.hypot(p.a, p.b),
    formula: 'F = √(F₁² + F₂²)（两分力互相垂直时）',
    calc: p => '√(' + p.a + '² + ' + p.b + '²) = ' + Math.hypot(p.a, p.b).toFixed(2) + ' N',
    insight: '力是矢量，合成遵循平行四边形定则；夹角 90° 时它退化成勾股定理，舞台上的斜边就是合力。教材「探究两个互成角度的力的合成规律」用弹簧测力计验证的正是它。',
    boundary: '这里只处理夹角 90°。一般夹角要用 F = √(F₁² + F₂² + 2F₁F₂cosθ)；夹角变大，合力会变小。',
    next: '两个力方向相反（θ = 180°）时，合力还剩多少？',
    caption: p => '两直角边 ' + p.a + ' N、' + p.b + ' N → 斜边（合力）' + Math.hypot(p.a, p.b).toFixed(2) + ' N'
  },
  {
    id: 'b1_newton2', stage: '高中', subject: '物理', chapter: '必修一 · 第四章 · 牛顿第二定律',
    title: '力加倍、质量加倍，加速度怎么变',
    hook: 'a 与 F 成正比，却与 m 成反比——教材那个探究实验要同时控制两个量。',
    question: '质量 2 kg 的小车受 10 N 合力，加速度多大？',
    predictLabel: '你猜加速度', predictUnit: 'm/s²', predictDefault: 4, predictMin: 0.1, predictMax: 30,
    params: [
      { key: 'm', label: '质量 m', unit: 'kg', min: 0.5, max: 8, step: 0.5, value: 2 },
      { key: 'F0', label: '恒定合力 F', unit: 'N', min: 2, max: 30, step: 2, value: 10 }
    ],
    renderer: 'function', duration: 2.6,
    curve: p => x => x / p.m,
    domain: p => [0, Math.max(20, p.F0 * 1.6)],
    truth: p => p.F0 / p.m,
    formula: 'a = F/m',
    calc: p => 'a = ' + p.F0 + ' / ' + p.m + ' = ' + (p.F0 / p.m).toFixed(2) + ' m/s²',
    insight: 'a–F 图是过原点的直线，斜率是 1/m；质量越大，同一条直线越平。教材「探究加速度与力、质量的关系」必须分两轮做：先固定 m 变 F，再固定 F 变 m。',
    boundary: 'F 指合外力，且 m 恒定、低速宏观。有摩擦要先扣掉摩擦力；接近光速时牛顿力学不再适用。',
    next: '把质量调到 4 kg 再猜——a 会恰好减半吗？',
    curveLabel: p => 'a(F) = F/' + p.m + '，F = ' + p.F0 + ' N 时 a = ' + (p.F0 / p.m).toFixed(2) + ' m/s²'
  },

  // --------------------------------------------- 牛顿运动定律补齐批次
  // 2026-11-16：补第一定律（惯性）、第三定律（作用力与反作用力）、
  // 超重和失重、牛顿运动定律的应用。定性概念改造成「先猜一个数」的
  // 定量反直觉题，全部复用 function 渲染器，只改本文件。
  {
    id: 'b1_newton1', stage: '高中', subject: '物理', chapter: '必修一 · 第四章 · 牛顿第一定律',
    title: '撤掉推力，小车会慢慢停下吗',
    hook: '直觉说「没有力就会停」，伽利略说「没有力就一直走」。',
    question: '完全光滑的轨道上，以 6 m/s 滑行的小车撤去推力，3 s 后速度是多少？',
    predictLabel: '你猜 3 s 后的速度', predictUnit: 'm/s', predictDefault: 1.5, predictMin: 0, predictMax: 20,
    params: [
      { key: 'v0', label: '初速度 v₀', unit: 'm/s', min: 2, max: 15, step: 1, value: 6 },
      { key: 'a', label: '阻力加速度 a', unit: 'm/s²', min: 0, max: 3, step: 0.1, value: 0 },
      { key: 'm', label: '小车质量 m', unit: 'kg', min: 0.5, max: 8, step: 0.5, value: 2 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => t => Math.max(0, p.v0 - p.a * t),
    domain: () => [0, 5],
    truth: p => Math.max(0, p.v0 - p.a * 3),
    formula: 'v(t) = v₀ − a·t；合外力为零（a = 0）时 v = v₀ 恒定',
    calc: p => 'v(3) = ' + p.v0 + ' − ' + p.a.toFixed(1) + '×3 = ' + Math.max(0, p.v0 - p.a * 3).toFixed(2) + ' m/s',
    insight: '牛顿第一定律：合外力为零时物体保持匀速直线运动。力不是维持速度的原因，而是改变速度的原因。伽利略理想斜面实验就是把摩擦一点点抽掉、把结论推到 a = 0。注意质量 m 根本不出现在式子里。',
    boundary: '只在惯性参考系、低速宏观下成立；现实中不存在严格 a = 0 的轨道，气垫导轨也只是接近。速度接近光速时要用相对论。',
    next: '把阻力加速度拖到 1 m/s² 再猜——这时才是「摩擦让它停」，不是「没有力所以停」。',
    curveLabel: p => '横轴是时间 t，v(t) = ' + p.v0 + ' − ' + p.a.toFixed(1) + 't；质量 ' + p.m + ' kg 不进入公式，拖它曲线不动'
  },
  {
    id: 'b1_newton3', stage: '高中', subject: '物理', chapter: '必修一 · 第三章 · 牛顿第三定律',
    title: '大卡车撞小轿车，谁受的力大',
    hook: '小车被撞得更惨，但两边受的力其实一样大。',
    question: '24 t 卡车撞上 1.2 t 小车，卡车给小车的力是小车给卡车的力的几倍？',
    predictLabel: '你猜受力倍数', predictUnit: '倍', predictDefault: 10, predictMin: 0.01, predictMax: 100,
    params: [
      { key: 'm1', label: '卡车质量 m₁', unit: 't', min: 1, max: 40, step: 1, value: 24 },
      { key: 'm2', label: '小车质量 m₂', unit: 't', min: 0.5, max: 5, step: 0.1, value: 1.2 },
      { key: 'v', label: '碰撞相对速度 v', unit: 'm/s', min: 1, max: 30, step: 1, value: 10 }
    ],
    renderer: 'function', duration: 2.8,
    curve: () => () => 1,
    domain: () => [1, 40],
    truth: () => 1,
    formula: 'F₁₂ = −F₂₁ ⇒ |F₁₂| / |F₂₁| = 1（与质量、速度都无关）',
    calc: p => '|F₁₂|/|F₂₁| = 1；但 a₂/a₁ = m₁/m₂ = ' + (p.m1 / p.m2).toFixed(1) + '，小车加速度大 ' + (p.m1 / p.m2).toFixed(1) + ' 倍',
    insight: '作用力与反作用力总是等大、反向、共线，同时产生同时消失，分别作用在两个物体上，因此不能相互抵消。小车「更惨」是因为 a = F/m 里 m 小，不是 F 更大。马拉车、走路蹬地、火箭喷气都是这条定律。',
    boundary: '经典力学中的瞬时相互作用；涉及场的传播延迟或相对论情形要更小心。碰撞力随时间剧烈变化，这里比的是同一时刻的瞬时值。',
    next: '把卡车质量拉到 40 t 再猜——倍数会跟着变大吗？',
    curveLabel: p => '横轴是质量比 m₁/m₂，|F₁₂|/|F₂₁| 恒为 1 的水平线（拖质量、速度滑块都不动）；当前 m₁/m₂ = ' + (p.m1 / p.m2).toFixed(1)
  },
  {
    id: 'b1_apparent_weight', stage: '高中', subject: '物理', chapter: '必修一 · 第四章 · 超重和失重',
    title: '电梯往上加速，秤会变重吗',
    hook: '秤称的不是重力，是它顶住你的那股力。',
    question: '60 kg 的人站在电梯里的秤上，电梯以 2 m/s² 向上加速，秤读数是多少 N？',
    predictLabel: '你猜秤的读数', predictUnit: 'N', predictDefault: 588, predictMin: 0, predictMax: 5000,
    params: [
      { key: 'm', label: '人体质量 m', unit: 'kg', min: 30, max: 120, step: 5, value: 60 },
      { key: 'a', label: '电梯加速度 a', unit: 'm/s²', options: [
        { label: '自由下落 −9.8', value: -9.8 },
        { label: '向下 −5.0', value: -5 },
        { label: '向下 −2.0', value: -2 },
        { label: '静止 0', value: 0 },
        { label: '向上 +2.0', value: 2 },
        { label: '向上 +5.0', value: 5 }
      ], value: 2 },
      { key: 'g', label: '重力加速度 g', unit: 'm/s²', options: G, value: 9.8 }
    ],
    renderer: 'function', duration: 3.0,
    curve: p => x => p.m * (p.g + x),
    domain: p => [-p.g, 6],
    truth: p => Math.max(0, p.m * (p.g + p.a)),
    formula: 'N = m(g + a)（a 向上取正；N 是支持力，即「视重」）',
    calc: p => 'N = ' + p.m + '×(' + p.g + ' + ' + p.a.toFixed(1) + ') = ' + Math.max(0, p.m * (p.g + p.a)).toFixed(0) + ' N',
    insight: '重力 mg 一直没变，变的是秤必须提供的支持力。a > 0 超重、a < 0 失重；自由下落 a = −g 时 N = 0（完全失重），人飘起来但重力仍在。',
    boundary: '秤只在接触时才有读数；a < −g 时人已经离开秤面，公式给出的负值没有物理意义（这里截断为 0）。忽略电梯加速度变化与空气浮力。',
    next: '把加速度拖到 −9.8 再猜——读数是 0，可人并没有「没有重力」。',
    curveLabel: p => '横轴是电梯加速度 a，N(a) = ' + p.m + '(' + p.g + '+a)；当前 a = ' + p.a.toFixed(1) + ' → ' + Math.max(0, p.m * (p.g + p.a)).toFixed(0) + ' N'
  },
  {
    id: 'b1_newton_apply', stage: '高中', subject: '物理', chapter: '必修一 · 第四章 · 牛顿运动定律的应用',
    title: '两个木块一起推，中间传过去多大力',
    hook: '推力 12 N，后面那块感受到的却不是 12 N。',
    question: '光滑水平面上用 12 N 推 m₁ = 2 kg 的木块，它顶着 m₂ = 4 kg 的木块。m₁ 推 m₂ 的力是多大？',
    predictLabel: '你猜接触力', predictUnit: 'N', predictDefault: 12, predictMin: 0.01, predictMax: 100,
    params: [
      { key: 'F', label: '水平推力 F', unit: 'N', min: 2, max: 30, step: 1, value: 12 },
      { key: 'm1', label: '前块质量 m₁', unit: 'kg', min: 0.5, max: 8, step: 0.5, value: 2 },
      { key: 'm2', label: '后块质量 m₂', unit: 'kg', min: 0.5, max: 8, step: 0.5, value: 4 }
    ],
    renderer: 'function', duration: 3.0,
    curve: p => x => p.F * x / (p.m1 + x),
    domain: () => [0.5, 8],
    truth: p => p.F * p.m2 / (p.m1 + p.m2),
    formula: 'a = F/(m₁+m₂)，F₁→₂ = m₂a = F·m₂/(m₁+m₂)',
    calc: p => 'a = ' + p.F + '/(' + p.m1 + '+' + p.m2 + ') = ' + (p.F / (p.m1 + p.m2)).toFixed(2) + ' m/s²；F₁→₂ = ' + (p.F * p.m2 / (p.m1 + p.m2)).toFixed(2) + ' N',
    insight: '整体法先求共同加速度，再用隔离法只看 m₂。接触力永远小于 F（推力还要负责加速 m₁），也不是按质量「平分」推力。这正是教材里连接体问题的核心。',
    boundary: '假设水平面光滑、两物块始终接触且无相对滑动。有摩擦、推力过大导致分离、或物块叠放时，方程要重写。',
    next: '把 m₂ 调到 0.5 kg 再猜——接触力会趋近 0 还是趋近 F？',
    curveLabel: p => '横轴是后块质量 m₂，F₁→₂ = ' + p.F + 'm₂/(' + p.m1 + '+m₂)；当前 ' + (p.F * p.m2 / (p.m1 + p.m2)).toFixed(2) + ' N'
  },
  {
    id: 'b2_flat_traj', stage: '高中', subject: '物理', chapter: '必修二 · 第五章 · 平抛运动',
    title: '平抛的落点：水平与竖直各管各的',
    hook: '飞得更快只会飞得更远，落地时间一点不变。',
    question: '从 5 m 高以 10 m/s 水平抛出，落地点离抛出点多远？',
    predictLabel: '你猜水平射程', predictUnit: 'm', predictDefault: 8, predictMin: 0.1, predictMax: 60,
    params: [
      { key: 'v0', label: '水平初速 v₀', unit: 'm/s', min: 2, max: 25, step: 1, value: 10 },
      { key: 'h', label: '抛出高度 h', unit: 'm', min: 1, max: 20, step: 1, value: 5 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => 9.8 * x * x / (2 * p.v0 * p.v0),
    domain: p => [0, p.v0 * Math.sqrt(2 * p.h / 9.8) * 1.15],
    truth: p => p.v0 * Math.sqrt(2 * p.h / 9.8),
    formula: 'x = v₀t，y = ½gt²；消去 t 得 y = gx²/(2v₀²)',
    calc: p => 't = √(2×' + p.h + '/9.8) = ' + Math.sqrt(2 * p.h / 9.8).toFixed(2) + ' s，x = ' + (p.v0 * Math.sqrt(2 * p.h / 9.8)).toFixed(1) + ' m',
    insight: '竖直方向就是自由落体，和水平初速度完全无关。教材「探究平抛运动的特点」用小锤同时打出一平抛球和一自由落体球，听它们是否同时落地。',
    boundary: '忽略空气阻力、地面水平、初速度严格水平。高速或轻质物体（羽毛球）轨迹会明显偏离抛物线。',
    next: '把高度调到 20 m 再猜——射程会变成 2 倍还是 4 倍？',
    curveLabel: p => 'y = 9.8x²/(2×' + p.v0 + '²)，落点 x = ' + (p.v0 * Math.sqrt(2 * p.h / 9.8)).toFixed(1) + ' m'
  },
  {
    id: 'b2_centripetal', stage: '高中', subject: '物理', chapter: '必修二 · 第六章 · 向心力',
    title: '转得更快，向心力涨得有多猛',
    hook: '速度翻倍，向心力不是翻倍，是 4 倍。',
    question: '1 kg 物体以 4 m/s 在半径 2 m 的圆周上运动，需要多大向心力？',
    predictLabel: '你猜向心力', predictUnit: 'N', predictDefault: 6, predictMin: 0.1, predictMax: 100,
    params: [
      { key: 'm', label: '质量 m', unit: 'kg', min: 0.5, max: 4, step: 0.5, value: 1 },
      { key: 'v', label: '线速度 v', unit: 'm/s', min: 1, max: 10, step: 1, value: 4 },
      { key: 'r0', label: '半径 r', unit: 'm', min: 0.5, max: 5, step: 0.5, value: 2 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => p.m * p.v * p.v / x,
    domain: () => [0.5, 6],
    truth: p => p.m * p.v * p.v / p.r0,
    formula: 'F = mv²/r',
    calc: p => 'F = ' + p.m + ' × ' + p.v + '² / ' + p.r0 + ' = ' + (p.m * p.v * p.v / p.r0).toFixed(2) + ' N',
    insight: 'F–r 是双曲线（半径越大越省力），F–v 却是抛物线。教材「探究向心力大小的表达式」用向心力演示器分别控制 m、r、ω 三个量，逐条验证。',
    boundary: '只适用于匀速圆周运动，F 是合外力沿半径方向的分量。变速圆周运动还需要额外的切向力。',
    next: '把速度调到 8 m/s 再猜——F 会变成 2 倍还是 4 倍？',
    curveLabel: p => 'F(r) = ' + (p.m * p.v * p.v).toFixed(1) + '/r，r = ' + p.r0 + ' m 时 F = ' + (p.m * p.v * p.v / p.r0).toFixed(2) + ' N'
  },
  {
    id: 'b2_gravity', stage: '高中', subject: '物理', chapter: '必修二 · 第七章 · 万有引力',
    title: '离地面越远，重力还剩多少',
    hook: '到 2 倍地球半径处，重力只剩四分之一。',
    question: '距地心 2 倍地球半径处，重力是地表的百分之几？',
    predictLabel: '你猜重力占比', predictUnit: '%', predictDefault: 50, predictMin: 1, predictMax: 100,
    params: [
      { key: 'r0', label: '距地心 r/R', unit: '倍', min: 1, max: 6, step: 0.5, value: 2 }
    ],
    renderer: 'function', duration: 2.6,
    curve: p => x => 100 / (x * x),
    domain: () => [1, 6],
    truth: p => 100 / (p.r0 * p.r0),
    formula: 'g(r) = GM/r²，于是 g/g₀ = (R/r)²',
    calc: p => 'g/g₀ = 1/' + p.r0 + '² = ' + (100 / (p.r0 * p.r0)).toFixed(1) + '%',
    insight: '平方反比：距离变 2 倍，引力变 1/4。教材从「月—地检验」入手，证明让苹果落地的力和让月亮绕地球的力是同一个。',
    boundary: '把地球当球对称质量分布，且 r ≥ R。钻到地球内部时 g 反而随 r 线性减小，这个式子不再适用。',
    next: '把倍数调到 3 再猜——是 1/3 还是 1/9？',
    curveLabel: p => 'g/g₀ = 100/r²，r = ' + p.r0 + 'R 时 ' + (100 / (p.r0 * p.r0)).toFixed(1) + '%'
  },
  {
    id: 'b2_orbit_v', stage: '高中', subject: '物理', chapter: '必修二 · 第七章 · 宇宙航行',
    title: '轨道越高，卫星飞得越慢',
    hook: '要飞得更高，反而需要更小的环绕速度。',
    question: '在离地 6400 km（恰等于一个地球半径）的圆轨道上，环绕速度约多少？',
    predictLabel: '你猜环绕速度', predictUnit: 'km/s', predictDefault: 6, predictMin: 0.5, predictMax: 12,
    params: [
      { key: 'h', label: '轨道高度 h', unit: 'km', min: 0, max: 40000, step: 1000, value: 6400 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => 7.9 * Math.sqrt(6400 / (6400 + x)),
    domain: () => [0, 40000],
    truth: p => 7.9 * Math.sqrt(6400 / (6400 + p.h)),
    formula: 'v = √(GM/r)，r = R + h；地表第一宇宙速度 7.9 km/s',
    calc: p => 'v = 7.9√(6400/(6400+' + p.h + ')) = ' + (7.9 * Math.sqrt(6400 / (6400 + p.h))).toFixed(2) + ' km/s',
    insight: '引力提供向心力：GMm/r² = mv²/r，卫星质量 m 被约掉，所以快慢与自身质量无关。高轨卫星虽然「更高」，却跑得更慢、周期更长。',
    boundary: '只适用于圆轨道且只受地球引力。椭圆轨道上速度沿轨道变化；低轨还有大气阻力会持续减速。',
    next: '把高度调到 0 再猜——为什么 7.9 km/s 叫「第一宇宙速度」？',
    curveLabel: p => 'v(h) = 7.9√(6400/(6400+h))，h = ' + p.h + ' km → ' + (7.9 * Math.sqrt(6400 / (6400 + p.h))).toFixed(2) + ' km/s'
  },
  {
    id: 'b2_kepler', stage: '高中', subject: '物理', chapter: '必修二 · 第七章 · 行星的运动',
    title: '轨道半径变 4 倍，一年变多长',
    hook: '周期不是 4 倍，是 8 倍——开普勒第三定律藏在 3/2 次方里。',
    question: '一颗小行星的轨道半长轴是地球的 4 倍，公转周期约多少年？',
    predictLabel: '你猜公转周期', predictUnit: '年', predictDefault: 4, predictMin: 0.1, predictMax: 30,
    params: [
      { key: 'a0', label: '半长轴 a', unit: 'AU', min: 0.5, max: 8, step: 0.5, value: 4 }
    ],
    renderer: 'function', duration: 2.6,
    curve: p => x => Math.pow(x, 1.5),
    domain: () => [0.3, 8],
    truth: p => Math.pow(p.a0, 1.5),
    formula: 'T²/a³ = 常量（同一中心天体），即 T = a^(3/2)',
    calc: p => 'T = ' + p.a0 + '^1.5 = ' + Math.pow(p.a0, 1.5).toFixed(2) + ' 年',
    insight: 'a 变 4 倍，T 变 4^1.5 = 8 倍。教材从行星观测数据归纳出它，牛顿再用万有引力把它推了出来——这是「经验定律升格为理论结论」的经典案例。',
    boundary: '要求中心天体相同（这里都是太阳），且行星质量远小于太阳。换成绕地球的卫星，常量必须重新定标。',
    next: '把 a 调到 2 再猜——周期是 2 倍还是 2.83 倍？',
    curveLabel: p => 'T(a) = a^1.5，a = ' + p.a0 + ' AU → T = ' + Math.pow(p.a0, 1.5).toFixed(2) + ' 年'
  },
  {
    id: 'b2_energy_v', stage: '高中', subject: '物理', chapter: '必修二 · 第八章 · 机械能守恒',
    title: '从高处落下，速度与高度不是正比',
    hook: '高度变 4 倍，落地速度只变 2 倍。',
    question: '从 5 m 高处自由下落，落地瞬间速度多大？',
    predictLabel: '你猜落地速度', predictUnit: 'm/s', predictDefault: 10, predictMin: 0.1, predictMax: 40,
    params: [
      { key: 'H', label: '下落高度 H', unit: 'm', min: 1, max: 40, step: 1, value: 5 }
    ],
    renderer: 'function', duration: 2.6,
    curve: p => x => Math.sqrt(19.6 * x),
    domain: p => [0, Math.max(1, p.H)],
    truth: p => Math.sqrt(19.6 * p.H),
    formula: 'mgh = ½mv² → v = √(2gh)',
    calc: p => 'v = √(2×9.8×' + p.H + ') = ' + Math.sqrt(19.6 * p.H).toFixed(2) + ' m/s',
    insight: '质量 m 在等式两边约掉，所以轻重物体落地速度相同。教材「验证机械能守恒定律」用纸带比较减少的 mgh 与增加的 ½mv²。',
    boundary: '只有重力做功、忽略空气阻力与纸带摩擦。有阻力时部分机械能变成内能，实测 v 总是偏小一些。',
    next: '把高度调到 20 m 再猜——速度是 2 倍还是 4 倍？',
    curveLabel: p => 'v = √(19.6h)，h = ' + p.H + ' m → v = ' + Math.sqrt(19.6 * p.H).toFixed(2) + ' m/s'
  },
  {
    id: 'b3_coulomb', stage: '高中', subject: '物理', chapter: '必修三 · 第九章 · 库仑定律',
    title: '电荷拉远 3 倍，力剩几分之一',
    hook: '和万有引力长得一模一样：都是平方反比。',
    question: '两点电荷距离变为原来的 3 倍，静电力变成原来的百分之几？',
    predictLabel: '你猜静电力占比', predictUnit: '%', predictDefault: 33, predictMin: 1, predictMax: 100,
    params: [
      { key: 'q', label: '距离倍数 r/r₀', unit: '倍', min: 1, max: 8, step: 0.5, value: 3 }
    ],
    renderer: 'function', duration: 2.6,
    curve: p => x => 100 / (x * x),
    domain: () => [1, 8],
    truth: p => 100 / (p.q * p.q),
    formula: 'F = kq₁q₂/r²',
    calc: p => 'F/F₀ = 1/' + p.q + '² = ' + (100 / (p.q * p.q)).toFixed(1) + '%',
    insight: '库仑用扭秤测出平方反比，形式上与 F = Gm₁m₂/r² 完全同构。差别在于电荷有正负，所以既能相吸也能相斥。',
    boundary: '适用于真空中静止的点电荷。带电体尺寸不可忽略、存在介质或电荷运动时，需引入介电常数与延迟效应。',
    next: '把距离调到 2 再猜——和万有引力那一题的答案一样吗？',
    curveLabel: p => 'F/F₀ = 100/r²，r = ' + p.q + 'r₀ 时 ' + (100 / (p.q * p.q)).toFixed(1) + '%'
  },
  {
    id: 'b3_capacitor', stage: '高中', subject: '物理', chapter: '必修三 · 第十章 · 电容器的电容',
    title: '极板拉远，电容怎么变',
    hook: '板间距加倍，电容不是「小一点」，而是精确减半。',
    question: '板间距 2 mm 时，电容是 1 mm 时的百分之几？',
    predictLabel: '你猜电容占比', predictUnit: '%', predictDefault: 60, predictMin: 1, predictMax: 100,
    params: [
      { key: 'd0', label: '板间距 d', unit: 'mm', min: 0.5, max: 8, step: 0.5, value: 2 }
    ],
    renderer: 'function', duration: 2.6,
    curve: p => x => 100 / x,
    domain: () => [0.5, 8],
    truth: p => 100 / p.d0,
    formula: 'C = εS/(4πkd)（平行板），即 C ∝ 1/d',
    calc: p => 'C/C₁ = 1/' + p.d0 + ' = ' + (100 / p.d0).toFixed(1) + '%',
    insight: '教材「探究电容器两极板间电势差跟所带电荷量的关系」先得到 C = Q/U，再改变板间距、正对面积与介质，逐项看 C 怎么变。',
    boundary: '忽略边缘效应、极板面积远大于间距、介质均匀。极板很小或插入电介质时，公式要重新修正。',
    next: '把板间距调到 0.5 mm 再猜——电容会翻几倍？',
    curveLabel: p => 'C(d) ∝ 1/d，d = ' + p.d0 + ' mm → C/C₁ = ' + (100 / p.d0).toFixed(1) + '%'
  },
  {
    id: 'b3_resistivity', stage: '高中', subject: '物理', chapter: '必修三 · 第十一章 · 导体的电阻',
    title: '导线拉长 2 倍，电阻也 2 倍吗',
    hook: '拉长的同时还会变细，电阻其实涨 4 倍。',
    question: '把一根均匀导线等体积拉长到 2 倍，电阻变成原来的几倍？',
    predictLabel: '你猜电阻倍数', predictUnit: '倍', predictDefault: 2, predictMin: 0.1, predictMax: 20,
    params: [
      { key: 'k', label: '拉长倍数 k', unit: '倍', min: 1, max: 5, step: 0.5, value: 2 }
    ],
    renderer: 'function', duration: 2.6,
    curve: p => x => x * x,
    domain: () => [1, 5],
    truth: p => p.k * p.k,
    formula: 'R = ρL/S；等体积拉伸时 S ∝ 1/L，故 R ∝ L²',
    calc: p => 'R/R₀ = ' + p.k + '² = ' + (p.k * p.k).toFixed(2) + ' 倍',
    insight: '教材「导体电阻率的测量」里 R = ρL/S 同时含 L 和 S 两个变量。等体积拉长时横截面积一起变小，两个因素叠加成平方。',
    boundary: '假设体积不变、电阻率 ρ 不随温度与形变改变。实际拉伸会发热、晶格变化，ρ 本身也会变。',
    next: '如果只把长度加倍而保持粗细不变，答案又是几倍？',
    curveLabel: p => 'R/R₀ = k²，k = ' + p.k + ' → ' + (p.k * p.k).toFixed(2) + ' 倍'
  },
  {
    id: 'b3_closed_ohm', stage: '高中', subject: '物理', chapter: '必修三 · 第十二章 · 闭合电路欧姆定律',
    title: '接上灯泡，电流为什么小于 E/R',
    hook: '电池自己也有电阻，悄悄吃掉了一部分电压。',
    question: '电动势 6 V、内阻 1 Ω、外接 5 Ω 电阻，电流多大？',
    predictLabel: '你猜电流', predictUnit: 'A', predictDefault: 1.5, predictMin: 0.01, predictMax: 10,
    params: [
      { key: 'U', label: '电动势 E', unit: 'V', min: 1, max: 12, step: 1, value: 6 },
      { key: 'R', label: '外电阻 R', unit: 'Ω', min: 1, max: 20, step: 1, value: 5 },
      { key: 'r', label: '内阻 r', unit: 'Ω', min: 0.5, max: 4, step: 0.5, value: 1 }
    ],
    renderer: 'circuit', duration: 2.6,
    truth: p => p.U / (p.R + p.r),
    formula: 'I = E/(R + r)',
    calc: p => 'I = ' + p.U + '/(' + p.R + '+' + p.r + ') = ' + (p.U / (p.R + p.r)).toFixed(2) + ' A',
    insight: '路端电压 U外 = E − Ir 会随电流增大而下降。教材「电池电动势和内阻的测量」正是靠改变外阻 R、画 U–I 直线，从截距和斜率反推出 E 与 r。',
    boundary: '把内阻 r 当常数、忽略温度影响。大电流下电池发热、r 会变化，且电源本身有最大输出电流限制。',
    next: '把外电阻调到 1 Ω 再猜——电流会变成 6 A 吗？',
    caption: p => 'E = ' + p.U + ' V，R = ' + p.R + ' Ω，r = ' + p.r + ' Ω → I = ' + (p.U / (p.R + p.r)).toFixed(2) + ' A（灯泡亮度随电流变化）'
  },
  {
    id: 'b3_maxpower', stage: '高中', subject: '物理', chapter: '必修三 · 第十二章 · 电能',
    title: '外电阻越小，输出功率越大吗',
    hook: '功率有个峰值，恰好落在外阻等于内阻的地方。',
    question: 'E = 6 V、r = 2 Ω 的电池，最大输出功率是多少？',
    predictLabel: '你猜最大输出功率', predictUnit: 'W', predictDefault: 6, predictMin: 0.1, predictMax: 30,
    params: [
      { key: 'E', label: '电动势 E', unit: 'V', min: 2, max: 12, step: 1, value: 6 },
      { key: 'r', label: '内阻 r', unit: 'Ω', min: 0.5, max: 5, step: 0.5, value: 2 }
    ],
    renderer: 'function', duration: 3.0,
    curve: p => x => p.E * p.E * x / ((x + p.r) * (x + p.r)),
    domain: () => [0.1, 20],
    truth: p => p.E * p.E / (4 * p.r),
    formula: 'P出 = E²R/(R+r)²，最大值 Pmax = E²/(4r)，在 R = r 时取得',
    calc: p => 'Pmax = ' + p.E + '²/(4×' + p.r + ') = ' + (p.E * p.E / (4 * p.r)).toFixed(2) + ' W（此时 R = ' + p.r + ' Ω）',
    insight: 'R→0 时电流虽大但路端电压趋近 0；R→∞ 时电压虽大但电流趋近 0。两头都不行，峰值卡在 R = r，这叫「阻抗匹配」。',
    boundary: '假设 r 恒定、电源可长期输出。峰值点效率只有 50%，实际电池大电流下 r 会上升，工程上常刻意避开这个点。',
    next: '把内阻调到 1 Ω 再猜——Pmax 会变大还是变小？',
    curveLabel: p => 'P(R) = ' + p.E + '²R/(R+' + p.r + ')²，峰值 ' + (p.E * p.E / (4 * p.r)).toFixed(2) + ' W @ R = ' + p.r + ' Ω'
  },
  {
    id: 'b3_emwave', stage: '高中', subject: '物理', chapter: '必修三 · 第十三章 · 电磁波',
    title: '频率翻倍，波长怎么变',
    hook: '电磁波速 c 是固定的，频率和波长只能一个涨一个落。',
    question: '频率 f = 1（即 100 MHz）的电磁波，波长是多少米？',
    predictLabel: '你猜波长', predictUnit: 'm', predictDefault: 2, predictMin: 0.1, predictMax: 20,
    params: [
      { key: 'f', label: '频率 f', unit: '100 MHz', min: 0.5, max: 5, step: 0.5, value: 1 },
      { key: 'lam', label: '舞台波长 λ', unit: 'm', min: 0.5, max: 6, step: 0.5, value: 3 }
    ],
    renderer: 'wave', duration: 3.0,
    truth: p => 3 / p.f,
    formula: 'c = λf，真空中 c ≈ 3×10⁸ m/s；f 以 100 MHz 为单位时 λ(m) = 3/f',
    calc: p => 'λ = 3/' + p.f + ' = ' + (3 / p.f).toFixed(2) + ' m',
    insight: '教材「电磁波的发现及应用」里，赫兹用火花隙测出波长与频率满足 c = λf，从而验证麦克斯韦关于电磁波速等于光速的预言。',
    boundary: 'c 是真空光速；在介质中 v = c/n，波长变短而频率不变。舞台波长是独立滑块，只有调到 3/f 才与真实一致。',
    next: '把频率调到 2 再猜——波长是 1.5 m 还是 6 m？',
    caption: p => '真实 λ = 3/' + p.f + ' = ' + (3 / p.f).toFixed(2) + ' m；舞台按 ' + p.lam + ' m 画波' + (Math.abs(p.lam - 3 / p.f) < 0.3 ? '（一致）' : '（不一致，这个滑块只改画面）')
  },

  // ------------------------------------------------- 教材批次 · 初中（八上 / 八下 / 九全）
  // 人教版义务教育教科书物理三册，章节按教材目录编排。三册为扫描图片版，
  // 目录由 scripts/ocr-textbook.py 本地 OCR 抽取，索引见 scripts/textbook-ocr.json。
  {
    id: 'j8a_avg_speed', stage: '初中', subject: '物理', chapter: '八上 · 第一章 · 速度的测量',
    title: '前半程 20，后半程 60，平均是 40 吗',
    hook: '慢的那段花的时间更久，它说了算。',
    question: '两段路程相等，前段 20 km/h、后段 60 km/h，全程平均速度是多少？',
    predictLabel: '你猜全程平均速度', predictUnit: 'km/h', predictDefault: 40, predictMin: 1, predictMax: 100,
    params: [
      { key: 'v1', label: '前段速度 v₁', unit: 'km/h', min: 10, max: 60, step: 5, value: 20 },
      { key: 'v2', label: '后段速度 v₂', unit: 'km/h', min: 10, max: 80, step: 5, value: 60 },
      { key: 's', label: '每段路程 s', unit: 'km', min: 10, max: 100, step: 5, value: 30 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => 2 * p.v1 * x / (p.v1 + x),
    domain: () => [10, 80],
    truth: p => 2 * p.v1 * p.v2 / (p.v1 + p.v2),
    formula: '等路程两段：v̄ = 2v₁v₂/(v₁+v₂)（调和平均）',
    calc: p => '2×' + p.v1 + '×' + p.v2 + '/(' + p.v1 + '+' + p.v2 + ') = ' + (2 * p.v1 * p.v2 / (p.v1 + p.v2)).toFixed(1) + ' km/h',
    insight: '平均速度是总路程除以总时间，不是两段速度取平均。慢的那段用时更长、权重更大，结果被拉向 20。',
    boundary: '只适用于两段路程相等。若改成「时间各一半」，才是算术平均 (v₁+v₂)/2；途中加减速与停车也没算进来。',
    next: '把 v₂ 调到 80 再猜——平均速度会到 50 吗？',
    curveLabel: p => '横轴是后段速度 v₂，曲线 v̄ = 2v₁v₂/(v₁+v₂)；当前 ' + (2 * p.v1 * p.v2 / (p.v1 + p.v2)).toFixed(1) + ' km/h',
    caption: p => '每段 ' + p.s + ' km：慢段用时更长，所以平均速度不等于速度的平均（s 不影响结果）'
  },
  {
    id: 'j8a_sound_lambda', stage: '初中', subject: '物理', chapter: '八上 · 第二章 · 声音的特性',
    title: '音调翻一倍，声波怎么变',
    hook: '声音跑得一样快，变的是波长。',
    question: '频率 440 Hz 的音叉，在空气中发出的声波波长是多少？',
    predictLabel: '你猜波长', predictUnit: 'm', predictDefault: 1, predictMin: 0.05, predictMax: 5,
    params: [
      { key: 'f', label: '频率 f', unit: 'Hz', min: 100, max: 1000, step: 50, value: 440 },
      { key: 'lam', label: '舞台波长 λ', unit: 'm', min: 0.2, max: 3, step: 0.1, value: 0.8 }
    ],
    renderer: 'wave', duration: 3.0,
    truth: p => 340 / p.f,
    formula: 'v = λf，空气中声速 v ≈ 340 m/s；λ = v/f',
    calc: p => 'λ = 340/' + p.f + ' = ' + (340 / p.f).toFixed(2) + ' m',
    insight: '音调由频率决定，响度由振幅决定。声速在同一介质里基本固定，所以频率越高波长越短。',
    boundary: '340 m/s 是 15 ℃ 空气近似值，声速随温度变（v ≈ 331 + 0.6t），在水和钢铁里更快；舞台波长滑块只改画面。',
    next: '把频率调到 880 Hz 再猜——波长会正好减半吗？',
    caption: p => '真实 λ = 340/' + p.f + ' = ' + (340 / p.f).toFixed(2) + ' m；舞台按 ' + p.lam.toFixed(1) + ' m 画波' + (Math.abs(p.lam - 340 / p.f) < 0.1 ? '（一致）' : '（不一致，滑块只改画面）')
  },
  {
    id: 'j8a_echo', stage: '初中', subject: '物理', chapter: '八上 · 第二章 · 声的利用',
    title: '喊一声 1 秒后听到回声，山有多远',
    hook: '声音跑了一个来回，不是单程。',
    question: '对着山崖喊话，1 秒后听到回声，山崖离你多远？（先猜往返时间对应的距离）',
    predictLabel: '你猜回声往返时间', predictUnit: 's', predictDefault: 1, predictMin: 0.01, predictMax: 10,
    params: [
      { key: 'd', label: '距山崖 d', unit: 'm', min: 10, max: 500, step: 10, value: 170 },
      { key: 'v', label: '介质中声速 v', unit: 'm/s', options: [
        { label: '空气 340', value: 340 }, { label: '水 1500', value: 1500 }, { label: '钢 5100', value: 5100 }
      ], value: 340 }
    ],
    renderer: 'function', duration: 2.6,
    curve: p => x => 2 * x / p.v,
    domain: () => [10, 500],
    truth: p => 2 * p.d / p.v,
    formula: 't = 2d/v（声波往返一次）',
    calc: p => 't = 2×' + p.d + '/' + p.v + ' = ' + (2 * p.d / p.v).toFixed(2) + ' s；对应单程距离 ' + (p.v * (2 * p.d / p.v) / 2).toFixed(0) + ' m',
    insight: '回声测距、声呐、超声测厚都是同一件事：测出往返时间再除以 2。听到 1 s 回声时山崖只有 170 m，不是 340 m。',
    boundary: '忽略人的反应时间与声速随温度、湿度的变化；回声间隔小于约 0.1 s 时会与原声混在一起，人耳分辨不出。',
    next: '把介质换成水再猜——同样距离的回声会快多少？',
    curveLabel: p => '横轴是距离 d，直线 t = 2d/v；当前 d = ' + p.d + ' m → ' + (2 * p.d / p.v).toFixed(2) + ' s'
  },
  {
    id: 'j8a_melt', stage: '初中', subject: '物理', chapter: '八上 · 第三章 · 熔化和凝固',
    title: '一直加热，冰为什么还是 0 ℃',
    hook: '火力全开，温度却卡在原地不动。',
    question: '0 ℃ 的冰 0.5 kg，用 500 W 加热，全部熔化要多久？',
    predictLabel: '你猜熔化时间', predictUnit: 's', predictDefault: 120, predictMin: 1, predictMax: 5000,
    params: [
      { key: 'm', label: '冰的质量 m', unit: 'kg', min: 0.1, max: 2, step: 0.1, value: 0.5 },
      { key: 'P', label: '加热功率 P', unit: 'W', min: 100, max: 2000, step: 100, value: 500 }
    ],
    renderer: 'function', duration: 3.0,
    curve: p => x => {
      const tm = p.m * 334000 / p.P
      return x <= tm ? 0 : (x - tm) * p.P / (p.m * 4200)
    },
    domain: p => [0, 2 * p.m * 334000 / p.P + 1],
    truth: p => p.m * 334000 / p.P,
    formula: '晶体熔化：Q = mL，t = mL/P；冰的 L = 3.34×10⁵ J/kg',
    calc: p => 't = ' + p.m.toFixed(1) + '×3.34×10⁵/' + p.P + ' = ' + (p.m * 334000 / p.P).toFixed(0) + ' s',
    insight: '熔化时吸收的热量用来拆开晶格，而不是升高温度，所以温度-时间曲线上出现一段平台。加大火力只缩短平台，不会让冰在熔化中途变热。',
    boundary: '只适用于晶体；石蜡、玻璃等非晶体没有固定熔点。还假设冰初温正好 0 ℃、没有热损失、容器不吸热。',
    next: '把功率调到 1000 W 再猜——熔化时间减半了吗？熔化期间温度会升高吗？',
    curveLabel: p => '横轴是加热时间，温度曲线先出现一段 0 ℃ 平台，平台长 ' + (p.m * 334000 / p.P).toFixed(0) + ' s'
  },
  {
    id: 'j8a_mirror', stage: '初中', subject: '物理', chapter: '八上 · 第四章 · 平面镜成像',
    title: '照全身的镜子，要和人一样高吗',
    hook: '后退几步也不会让需要的镜子变矮。',
    question: '身高 1.6 m 的人要看到全身，竖直的平面镜至少多高？',
    predictLabel: '你猜最小镜高', predictUnit: 'm', predictDefault: 1.6, predictMin: 0.1, predictMax: 3,
    params: [
      { key: 'h', label: '身高 h', unit: 'm', min: 1, max: 2.2, step: 0.1, value: 1.6 },
      { key: 'd', label: '离镜距离 d', unit: 'm', min: 0.5, max: 5, step: 0.5, value: 2 }
    ],
    renderer: 'function', duration: 2.6,
    curve: p => x => p.h / 2,
    domain: () => [0.5, 5],
    truth: p => p.h / 2,
    formula: '镜高 ≥ h/2（与离镜距离无关）',
    calc: p => 'h/2 = ' + p.h.toFixed(1) + '/2 = ' + (p.h / 2).toFixed(2) + ' m',
    insight: '按相似三角形，来自头顶与脚尖的光线在镜面上正好落在「眼睛到头顶中点」和「眼睛到脚中点」之间，两段合起来恰好是身高的一半。',
    boundary: '假设人直立、镜面竖直、地面水平。镜子挂的高度很关键：必须对准眼睛与头顶/脚的中线，挂歪了再高也照不全。',
    next: '把离镜距离调到 5 m 再猜——需要的镜高会变吗？',
    curveLabel: p => '横轴是离镜距离 d，曲线是一条水平线：镜高恒为 ' + (p.h / 2).toFixed(2) + ' m'
  },
  {
    id: 'j8a_lens', stage: '初中', subject: '物理', chapter: '八上 · 第五章 · 凸透镜成像的规律',
    title: '物体靠近焦点，像会跑多远',
    hook: '只挪一点点，像距就能翻好几倍。',
    question: '焦距 10 cm 的凸透镜，物体放在 30 cm 处，像成在多远？',
    predictLabel: '你猜像距', predictUnit: 'cm', predictDefault: 20, predictMin: 1, predictMax: 300,
    params: [
      { key: 'f', label: '焦距 f', unit: 'cm', min: 5, max: 15, step: 1, value: 10 },
      { key: 'u', label: '物距 u', unit: 'cm', min: 16, max: 40, step: 1, value: 30 }
    ],
    renderer: 'function', duration: 3.0,
    curve: p => x => p.f * x / (x - p.f),
    domain: p => [p.f + 1, 45],
    truth: p => p.f * p.u / (p.u - p.f),
    formula: '薄透镜：1/f = 1/u + 1/v → v = fu/(u−f)',
    calc: p => 'v = ' + p.f + '×' + p.u + '/(' + p.u + '−' + p.f + ') = ' + (p.f * p.u / (p.u - p.f)).toFixed(1) + ' cm',
    insight: '教材里的规律「物近像远像变大」其实就是这条双曲线：u 从 2f 往 f 靠近时 v 迅速涨大；u = 2f 时 v = 2f，正好等大。',
    boundary: '教材只要求定性规律，这条公式是薄透镜近轴模型；实际镜头有像差。u ≤ f 时公式给出负像距，代表虚像（放大镜），光屏接不到。',
    next: '把物距调到 20 cm（正好 2f）再猜——像距等于多少？',
    curveLabel: p => '横轴是物距 u，曲线 v = fu/(u−f)；当前 u = ' + p.u + ' cm → v = ' + (p.f * p.u / (p.u - p.f)).toFixed(1) + ' cm'
  },
  {
    id: 'j8a_density', stage: '初中', subject: '物理', chapter: '八上 · 第六章 · 质量与密度',
    title: '100 g 酒精，体积比水大多少',
    hook: '密度是物质说了算，跟你取多少没关系。',
    question: '100 g 水换成同质量的酒精，体积是多少？',
    predictLabel: '你猜体积', predictUnit: 'cm³', predictDefault: 100, predictMin: 1, predictMax: 1000,
    params: [
      { key: 'm', label: '质量 m', unit: 'g', min: 50, max: 500, step: 10, value: 100 },
      { key: 'rho', label: '物质', unit: 'g/cm³', options: [
        { label: '水 1.0', value: 1 }, { label: '酒精 0.8', value: 0.8 },
        { label: '铝 2.7', value: 2.7 }, { label: '水银 13.6', value: 13.6 }
      ], value: 1 }
    ],
    renderer: 'function', duration: 2.6,
    curve: p => x => p.m / x,
    domain: () => [0.5, 14],
    truth: p => p.m / p.rho,
    formula: 'ρ = m/V → V = m/ρ',
    calc: p => 'V = ' + p.m + '/' + p.rho + ' = ' + (p.m / p.rho).toFixed(1) + ' cm³',
    insight: '同种物质取多取少，m 与 V 同比例变，ρ 不变。同质量下密度越小体积越大，所以酒精比水「占地方」。',
    boundary: '密度随温度、压强会变（水在 4 ℃ 最密），这里取常温常压近似值；混合液体、多孔材料不能直接套用。',
    next: '换成水银再猜——同样 100 g 只有几 cm³？',
    curveLabel: p => '横轴是密度 ρ，曲线 V = m/ρ；当前 ' + p.m + ' g → ' + (p.m / p.rho).toFixed(1) + ' cm³'
  },
  {
    id: 'j8b_gravity_mass', stage: '初中', subject: '物理', chapter: '八下 · 第七章 · 重力',
    title: '到了月球，1 kg 还是 1 kg 吗',
    hook: '质量是自己的，重力是星球给的。',
    question: '2 kg 的物体在地球上受到的重力有多大？',
    predictLabel: '你猜重力', predictUnit: 'N', predictDefault: 10, predictMin: 0.1, predictMax: 300,
    params: [
      { key: 'm', label: '质量 m', unit: 'kg', min: 0.5, max: 10, step: 0.5, value: 2 },
      { key: 'g', label: '重力 g', unit: 'm/s²', options: G, value: 9.8 }
    ],
    renderer: 'function', duration: 2.6,
    curve: p => x => p.m * x,
    domain: () => [1, 25],
    truth: p => p.m * p.g,
    formula: 'G = mg',
    calc: p => 'G = ' + p.m.toFixed(1) + '×' + p.g + ' = ' + (p.m * p.g).toFixed(1) + ' N',
    insight: '质量是物体含多少物质，到哪儿都不变；重力是星球对它的吸引，g 变了 G 就跟着变。月球上 2 kg 只有约 3.2 N。',
    boundary: 'g 随纬度、海拔略有差别；公式给的是重力，不是秤显示的「视重」——在电梯、失重环境里两者会不一样。',
    next: '把重力换成月球再猜——质量会跟着变小吗？',
    curveLabel: p => '横轴是 g，直线 G = mg；当前 m = ' + p.m.toFixed(1) + ' kg → ' + (p.m * p.g).toFixed(1) + ' N'
  },
  {
    id: 'j8b_friction', stage: '初中', subject: '物理', chapter: '八下 · 第八章 · 摩擦力',
    title: '把砖放平，摩擦力会变小吗',
    hook: '接触面积变大，摩擦力却纹丝不动。',
    question: '5 kg 的木块在水平面上滑动，μ = 0.3，摩擦力多大？',
    predictLabel: '你猜滑动摩擦力', predictUnit: 'N', predictDefault: 10, predictMin: 0.1, predictMax: 200,
    params: [
      { key: 'mu', label: '动摩擦因数 μ', unit: '', min: 0.1, max: 0.8, step: 0.05, value: 0.3 },
      { key: 'm', label: '质量 m', unit: 'kg', min: 1, max: 20, step: 1, value: 5 },
      { key: 'A', label: '接触面积 A', unit: 'cm²', min: 10, max: 200, step: 10, value: 50 }
    ],
    renderer: 'function', duration: 2.6,
    curve: p => x => p.mu * p.m * 9.8,
    domain: () => [10, 200],
    truth: p => p.mu * p.m * 9.8,
    formula: 'f = μN = μmg（水平面滑动）',
    calc: p => 'f = ' + p.mu + '×' + p.m + '×9.8 = ' + (p.mu * p.m * 9.8).toFixed(1) + ' N',
    insight: '面积变大时单位面积上的压强变小，两者正好抵消，总正压力 N 没变，摩擦力就不变。教材实验里把木块侧放、平放，测力计读数相同。',
    boundary: '只适用于刚性干滑动摩擦。橡胶、软材料、润滑面或极高压强下 μ 会随面积、速度变化；静摩擦力则是另一套规则。',
    next: '把质量翻倍再猜——摩擦力会翻倍吗？',
    curveLabel: p => '横轴是接触面积 A，曲线是水平线：f = μmg = ' + (p.mu * p.m * 9.8).toFixed(1) + ' N',
    caption: p => '接触面积 A = ' + p.A + ' cm² 只是干扰滑块，不进入公式'
  },
  {
    id: 'j8b_newton1', stage: '初中', subject: '物理', chapter: '八下 · 第八章 · 牛顿第一定律',
    title: '同样的速度，重书包会滑得更远吗',
    hook: '很多人觉得「沉的东西冲得远」，公式里质量直接消失了。',
    question: '在水泥地上以 6 m/s 推出一个滑块（μ = 0.4），它能滑多远？多装几本书会改变结果吗？',
    predictLabel: '你猜滑行距离', predictUnit: 'm', predictDefault: 2, predictMin: 0.01, predictMax: 1000,
    params: [
      { key: 'v0', label: '推出速度 v₀', unit: 'm/s', min: 1, max: 15, step: 1, value: 6 },
      { key: 'mu', label: '接触面 μ', unit: '', options: [
        { label: '冰面 0.02', value: 0.02 },
        { label: '木板 0.20', value: 0.2 },
        { label: '水泥 0.40', value: 0.4 },
        { label: '沥青 0.80', value: 0.8 }
      ], value: 0.4 },
      { key: 'm', label: '滑块质量 m', unit: 'kg', min: 0.5, max: 10, step: 0.5, value: 2 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => x * x / (2 * p.mu * 9.8),
    domain: () => [0, 15],
    truth: p => p.v0 * p.v0 / (2 * p.mu * 9.8),
    formula: 's = v₀²/(2μg)（由 0 − v₀² = 2as，且 a = −μg）',
    calc: p => 's = ' + p.v0 + '²/(2×' + p.mu.toFixed(2) + '×9.8) = ' + (p.v0 * p.v0 / (2 * p.mu * 9.8)).toFixed(2) + ' m；与 m = ' + p.m + ' kg 无关',
    insight: '惯性大小只由质量决定，但「能滑多远」由摩擦把动能耗光决定：a = μmg/m = μg，质量被约掉了。物体停下来不是因为「冲劲用完」，而是摩擦力一直在改变它的速度——这正是牛顿第一定律要纠正的直觉。',
    boundary: '假设水平面、动摩擦因数恒定、无空气阻力且只滑不滚。速度很高时空气阻力随 v² 增长，冰面的 μ 也会随温度变化。',
    next: '把表面换成冰面再猜——距离会变成多少倍？再把质量拖到 10 kg 呢？',
    curveLabel: p => '横轴是初速度 v₀，s = v₀²/(2μg)；μ = ' + p.mu.toFixed(2) + ' → ' + (p.v0 * p.v0 / (2 * p.mu * 9.8)).toFixed(2) + ' m；质量 ' + p.m + ' kg 是干扰滑块'
  },
  {
    id: 'j8b_balance', stage: '初中', subject: '物理', chapter: '八下 · 第八章 · 二力平衡',
    title: '两边各拉 3 N，绳子张力是 6 N 吗',
    hook: '把两个力加起来，是学平衡时最常见的错。',
    question: '一根轻绳两端各用 3 N 的力向两边拉，绳中张力是多少？',
    predictLabel: '你猜绳中张力', predictUnit: 'N', predictDefault: 6, predictMin: 0.01, predictMax: 100,
    params: [
      { key: 'F', label: '每端拉力 F', unit: 'N', min: 0.5, max: 10, step: 0.5, value: 3 },
      { key: 'L', label: '绳长 L', unit: 'm', min: 0.2, max: 3, step: 0.1, value: 1 },
      { key: 'm', label: '悬挂物质量 m', unit: 'kg', min: 0.5, max: 5, step: 0.5, value: 1 }
    ],
    renderer: 'function', duration: 2.6,
    curve: () => x => x,
    domain: () => [0, 10],
    truth: p => p.F,
    formula: '二力平衡：T = F（一端拉多大，绳中张力就是多大，不是 2F）',
    calc: p => 'T = F = ' + p.F.toFixed(1) + ' N；两端各 ' + p.F.toFixed(1) + ' N 是平衡条件，不是相加',
    insight: '绳子静止时任取一小段，两侧拉力必须等大反向才能平衡，所以张力处处等于一端拉力。两个 3 N 分别作用在绳子两端，不能像同向力那样相加；弹簧测力计的读数也是一端的力。这为后面学牛顿第三定律做铺垫。',
    boundary: '要求轻绳（质量可忽略）、静止或匀速、绳不伸长。绳有质量或系统在加速时，各段张力不再相等。',
    next: '把两端拉力都调到 6 N 再猜——会不会有人答 12 N？',
    curveLabel: p => '横轴是每端拉力 F，T(F) = F（不是 2F）；当前 T = ' + p.F.toFixed(1) + ' N；绳长 L、质量 m 只是干扰滑块'
  },
  {
    id: 'j8b_pressure', stage: '初中', subject: '物理', chapter: '八下 · 第九章 · 液体的压强',
    title: '细管里几米水，能撑裂木桶吗',
    hook: '压强只看深度，不管桶有多粗。',
    question: '水面下 2 m 处，水产生的压强有多大？',
    predictLabel: '你猜液体压强', predictUnit: 'kPa', predictDefault: 10, predictMin: 0.1, predictMax: 2000,
    params: [
      { key: 'rho', label: '液体', unit: 'kg/m³', options: [
        { label: '水 1000', value: 1000 }, { label: '盐水 1100', value: 1100 }, { label: '水银 13600', value: 13600 }
      ], value: 1000 },
      { key: 'h', label: '深度 h', unit: 'm', min: 0.1, max: 10, step: 0.1, value: 2 },
      { key: 'S', label: '容器底面积 S', unit: 'm²', min: 0.1, max: 5, step: 0.1, value: 1 }
    ],
    renderer: 'function', duration: 2.6,
    curve: p => x => p.rho * 9.8 * x / 1000,
    domain: () => [0.1, 10],
    truth: p => p.rho * 9.8 * p.h / 1000,
    formula: 'p = ρgh',
    calc: p => 'p = ' + p.rho + '×9.8×' + p.h.toFixed(1) + ' = ' + (p.rho * 9.8 * p.h / 1000).toFixed(1) + ' kPa',
    insight: '帕斯卡桶裂实验：一根细长管灌几米水，桶底压强就足够大。压力 F = pS 会随面积变，但压强 p 与容器形状、总水量无关。',
    boundary: '只适用于静止、密度均匀的液体。开口容器还要叠加大气压 p₀；流动液体得用伯努利方程，深度极大时液体可压缩性也不能忽略。',
    next: '换成水银、同样深度再猜——压强会大多少倍？',
    curveLabel: p => '横轴是深度 h，直线 p = ρgh；当前 h = ' + p.h.toFixed(1) + ' m → ' + (p.rho * 9.8 * p.h / 1000).toFixed(1) + ' kPa',
    caption: p => '底面积 S = ' + p.S.toFixed(1) + ' m² 只影响总压力 F = pS，不影响压强 p'
  },
  {
    id: 'j8b_buoyancy', stage: '初中', subject: '物理', chapter: '八下 · 第十章 · 阿基米德原理',
    title: '再往下按，浮力会变大吗',
    hook: '只要全浸没了，深度就与浮力无关。',
    question: '500 cm³ 的物体完全浸没在水中，受到的浮力多大？',
    predictLabel: '你猜浮力', predictUnit: 'N', predictDefault: 2, predictMin: 0.01, predictMax: 100,
    params: [
      { key: 'V', label: '排开体积 V', unit: 'cm³', min: 100, max: 2000, step: 50, value: 500 },
      { key: 'rho', label: '液体', unit: 'kg/m³', options: [
        { label: '水 1000', value: 1000 }, { label: '盐水 1100', value: 1100 }, { label: '酒精 800', value: 800 }
      ], value: 1000 },
      { key: 'z', label: '浸没深度 z', unit: 'm', min: 0.1, max: 10, step: 0.1, value: 2 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => p.rho * 9.8 * p.V / 1e6,
    domain: () => [0.1, 10],
    truth: p => p.rho * 9.8 * p.V / 1e6,
    formula: 'F浮 = ρ液 g V排',
    calc: p => 'F浮 = ' + p.rho + '×9.8×' + p.V + '×10⁻⁶ = ' + (p.rho * 9.8 * p.V / 1e6).toFixed(2) + ' N',
    insight: '浮力来自物体上下表面的压力差，等于被排开那部分液体的重力。完全浸没后 V排 不再增加，往下按也不会让浮力变大。',
    boundary: '要求物体完全浸没、液体密度均匀。贴住容器底、被绳子拉住、物体吸水或部分露出液面时都不成立；浮沉还要再比较 G。',
    next: '把体积调到 1000 cm³ 再猜——浮力会翻倍吗？',
    curveLabel: p => '横轴是浸没深度 z，曲线是水平线：F浮 = ' + (p.rho * 9.8 * p.V / 1e6).toFixed(2) + ' N',
    caption: p => '深度 z = ' + p.z.toFixed(1) + ' m 只是干扰滑块；未完全浸没时 V排 才会随深度变'
  },
  {
    id: 'j8b_power', stage: '初中', subject: '物理', chapter: '八下 · 第十一章 · 功率',
    title: '慢慢搬和快跑搬，差别在哪',
    hook: '做的功一样多，功率能差好几倍。',
    question: '把 20 kg 的物体匀速提升 5 m，用时 5 s，功率多大？',
    predictLabel: '你猜功率', predictUnit: 'W', predictDefault: 100, predictMin: 1, predictMax: 10000,
    params: [
      { key: 'm', label: '质量 m', unit: 'kg', min: 10, max: 100, step: 5, value: 20 },
      { key: 'h', label: '提升高度 h', unit: 'm', min: 1, max: 10, step: 0.5, value: 5 },
      { key: 't', label: '用时 t', unit: 's', min: 1, max: 30, step: 1, value: 5 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => p.m * 9.8 * p.h / x,
    domain: () => [1, 30],
    truth: p => p.m * 9.8 * p.h / p.t,
    formula: 'P = W/t = mgh/t',
    calc: p => 'P = ' + p.m + '×9.8×' + p.h.toFixed(1) + '/' + p.t + ' = ' + (p.m * 9.8 * p.h / p.t).toFixed(0) + ' W',
    insight: '功 W = mgh 只由起终点决定，慢慢搬和快跑搬做功相同；功率描述的是做功的快慢，时间越短功率越大。',
    boundary: '这里算平均功率，瞬时功率在加速阶段会不同；还忽略了人体效率、摩擦与空气阻力。',
    next: '把时间改成 2 s 再猜——功率会变成几倍？',
    curveLabel: p => '横轴是用时 t，曲线 P = mgh/t；当前 t = ' + p.t + ' s → ' + (p.m * 9.8 * p.h / p.t).toFixed(0) + ' W'
  },
  {
    id: 'j8b_pulley', stage: '初中', subject: '物理', chapter: '八下 · 第十二章 · 滑轮与机械效率',
    title: '多绕几股绳，能省多少力',
    hook: '省了力，却要多拉好几倍绳子。',
    question: '60 N 的重物用 2 股绳的滑轮组匀速提起，理想情况下拉力多大？',
    predictLabel: '你猜拉力', predictUnit: 'N', predictDefault: 40, predictMin: 0.1, predictMax: 300,
    params: [
      { key: 'G', label: '物重 G', unit: 'N', min: 10, max: 200, step: 10, value: 60 },
      { key: 'n', label: '承重绳股数 n', unit: '股', min: 1, max: 6, step: 1, value: 2 }
    ],
    renderer: 'function', duration: 2.6,
    curve: p => x => p.G / x,
    domain: () => [1, 6],
    truth: p => p.G / p.n,
    formula: '理想滑轮组：F = G/n',
    calc: p => 'F = ' + p.G + '/' + p.n + ' = ' + (p.G / p.n).toFixed(1) + ' N',
    insight: '省力必费距离：自由端要拉 n 倍长度，总功 Fs = (G/n)(nh) = Gh 一点没少。天下没有省功的机械。',
    boundary: '忽略绳重、摩擦与动滑轮自重。实际 F = (G + G动)/n，机械效率 η = G/(nF) 总是小于 1。',
    next: '把股数调到 4 再猜——拉力减半了，绳子要多拉几倍？',
    curveLabel: p => '横轴是绳股数 n，曲线 F = G/n；当前 n = ' + p.n + ' → ' + (p.G / p.n).toFixed(1) + ' N'
  },
  {
    id: 'j9_heat_cap', stage: '初中', subject: '物理', chapter: '九全 · 第十三章 · 比热容',
    title: '同样晒一下午，海水为什么没那么烫',
    hook: '水的比热容大，温度特别难推动。',
    question: '给 1 kg 水通入 42 kJ 热量，温度升高多少？',
    predictLabel: '你猜升温', predictUnit: '℃', predictDefault: 5, predictMin: 0.01, predictMax: 300,
    params: [
      { key: 'c', label: '物质', unit: 'J/(kg·℃)', options: [
        { label: '水 4200', value: 4200 }, { label: '铝 880', value: 880 },
        { label: '沙石 920', value: 920 }, { label: '铁 460', value: 460 }
      ], value: 4200 },
      { key: 'm', label: '质量 m', unit: 'kg', min: 0.5, max: 5, step: 0.5, value: 1 },
      { key: 'Q', label: '吸收热量 Q', unit: 'kJ', min: 10, max: 200, step: 2, value: 42 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => p.Q * 1000 / (x * p.m),
    domain: () => [400, 4500],
    truth: p => p.Q * 1000 / (p.c * p.m),
    formula: 'Q = cmΔT → ΔT = Q/(cm)',
    calc: p => 'ΔT = ' + p.Q + '×1000/(' + p.c + '×' + p.m.toFixed(1) + ') = ' + (p.Q * 1000 / (p.c * p.m)).toFixed(1) + ' ℃',
    insight: '比热容可以理解为「改变温度的阻力」。水的值约为沙石的 4.6 倍，所以沿海昼夜温差小，水也常被用作冷却剂与蓄热体。',
    boundary: '假设无相变、比热容不随温度变、热量全部被物体吸收；实际还有容器吸热与向环境散热。',
    next: '换成沙石再猜——同样 42 kJ 能升温多少度？',
    curveLabel: p => '横轴是比热容 c，曲线 ΔT = Q/(cm)；当前 ' + p.Q + ' kJ → ' + (p.Q * 1000 / (p.c * p.m)).toFixed(1) + ' ℃'
  },
  {
    id: 'j9_engine_eff', stage: '初中', subject: '物理', chapter: '九全 · 第十四章 · 热机的效率',
    title: '烧掉 10 MJ 汽油，能做多少有用功',
    hook: '能量没丢，只是大部分变成了没用的热。',
    question: '燃料放出 10 MJ 热量，效率 25% 的热机能输出多少有用功？',
    predictLabel: '你猜有用功', predictUnit: 'MJ', predictDefault: 8, predictMin: 0.1, predictMax: 30,
    params: [
      { key: 'Q', label: '燃料放热 Q', unit: 'MJ', min: 1, max: 20, step: 1, value: 10 },
      { key: 'eta', label: '热机效率 η', unit: '%', min: 10, max: 45, step: 5, value: 25 }
    ],
    renderer: 'function', duration: 2.6,
    curve: p => x => p.Q * x / 100,
    domain: () => [10, 45],
    truth: p => p.Q * p.eta / 100,
    formula: 'η = W有用/Q放 → W = ηQ',
    calc: p => 'W = ' + p.Q + '×' + p.eta + '% = ' + (p.Q * p.eta / 100).toFixed(1) + ' MJ',
    insight: '能量守恒说的是总量不变，但废气、冷却水和摩擦带走的热量没法再用来做功。汽油机效率通常只有 20%~30%。',
    boundary: '这里把效率当常数；实际 η 随转速、负荷、温度变，而且受热力学第二定律约束，卡诺极限由高低温热源温度决定，永远到不了 100%。',
    next: '把效率调到 40% 再猜——剩下那 60% 去哪了？',
    curveLabel: p => '横轴是效率 η，直线 W = ηQ；当前 η = ' + p.eta + '% → ' + (p.Q * p.eta / 100).toFixed(1) + ' MJ'
  },
  {
    id: 'j9_series_r', stage: '初中', subject: '物理', chapter: '九全 · 第十七章 · 欧姆定律的应用',
    title: '再串一个电阻，灯泡会变暗多少',
    hook: '串联像把路变窄，总阻是两者相加。',
    question: '6 V 电源串两个 5 Ω 电阻，电路里的电流多大？',
    predictLabel: '你猜电流', predictUnit: 'A', predictDefault: 1, predictMin: 0.001, predictMax: 20,
    params: [
      { key: 'U', label: '电源电压 U', unit: 'V', min: 1, max: 12, step: 1, value: 6 },
      { key: 'R', label: '灯泡电阻 R₁', unit: 'Ω', min: 1, max: 20, step: 1, value: 5 },
      { key: 'R2', label: '串联电阻 R₂', unit: 'Ω', min: 1, max: 20, step: 1, value: 5 }
    ],
    renderer: 'circuit', duration: 2.8,
    truth: p => p.U / (p.R + p.R2),
    formula: 'R串 = R₁ + R₂，I = U/(R₁+R₂)',
    calc: p => 'I = ' + p.U + '/(' + p.R + '+' + p.R2 + ') = ' + (p.U / (p.R + p.R2)).toFixed(2) + ' A',
    insight: '串联电路各处电流相同，多串一个电阻就让总阻变大、电流变小，灯泡随之变暗。教材里用电流表在不同位置测，读数一致。',
    boundary: '假设电源无内阻、导线电阻为零、灯丝电阻恒定；实际灯丝冷态电阻小得多，刚通电时电流会明显偏大。',
    next: '把 R₂ 调到 1 Ω 再猜——电流会翻倍吗？',
    caption: p => 'U = ' + p.U + ' V，总阻 ' + (p.R + p.R2) + ' Ω → I = ' + (p.U / (p.R + p.R2)).toFixed(2) + ' A（灯泡亮度随电流变化）'
  },
  {
    id: 'j9_parallel_r', stage: '初中', subject: '物理', chapter: '九全 · 第十七章 · 并联电路的电阻',
    title: '两个电阻并联，总阻比最小的还小',
    hook: '并联等于多开了一条路，越并越通。',
    question: '6 Ω 与 3 Ω 并联，等效电阻是多少？',
    predictLabel: '你猜总电阻', predictUnit: 'Ω', predictDefault: 4, predictMin: 0.1, predictMax: 30,
    params: [
      { key: 'R1', label: '电阻 R₁', unit: 'Ω', min: 2, max: 20, step: 1, value: 6 },
      { key: 'R2', label: '电阻 R₂', unit: 'Ω', min: 2, max: 20, step: 1, value: 3 },
      { key: 'U', label: '电源电压 U', unit: 'V', min: 1, max: 12, step: 1, value: 6 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => p.R1 * x / (p.R1 + x),
    domain: () => [2, 20],
    truth: p => p.R1 * p.R2 / (p.R1 + p.R2),
    formula: '1/R = 1/R₁ + 1/R₂ → R = R₁R₂/(R₁+R₂)',
    calc: p => 'R = ' + p.R1 + '×' + p.R2 + '/(' + p.R1 + '+' + p.R2 + ') = ' + (p.R1 * p.R2 / (p.R1 + p.R2)).toFixed(2) + ' Ω',
    insight: '并联总阻永远小于任一支路电阻；再并上一个很大的电阻，总阻也只会略微下降。家用电器并联在 220 V 上正是这个道理。',
    boundary: '理想电阻、导线与电源内阻为零。支路很多时电源内阻开始主导，实际总电流不能无限增大。',
    next: '把 R₂ 调到 20 Ω 再猜——总阻会超过 3 Ω 吗？',
    curveLabel: p => '横轴是 R₂，曲线 R并 = R₁R₂/(R₁+R₂)，当前 ' + (p.R1 * p.R2 / (p.R1 + p.R2)).toFixed(2) + ' Ω',
    caption: p => '电压 U = ' + p.U + ' V 不改变等效电阻，只影响总电流'
  },
  {
    id: 'j9_elec_power', stage: '初中', subject: '物理', chapter: '九全 · 第十八章 · 电功率',
    title: '电阻越大越费电吗',
    hook: '家里电压是固定的，功率大的电器电阻反而小。',
    question: '220 V 电压接在 100 Ω 电阻上，电功率多大？',
    predictLabel: '你猜电功率', predictUnit: 'W', predictDefault: 100, predictMin: 0.1, predictMax: 10000,
    params: [
      { key: 'U', label: '电压 U', unit: 'V', min: 5, max: 220, step: 5, value: 220 },
      { key: 'R', label: '电阻 R', unit: 'Ω', min: 10, max: 1000, step: 10, value: 100 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => p.U * p.U / x,
    domain: () => [10, 1000],
    truth: p => p.U * p.U / p.R,
    formula: 'P = UI = U²/R（纯电阻、电压恒定）',
    calc: p => 'P = ' + p.U + '²/' + p.R + ' = ' + (p.U * p.U / p.R).toFixed(0) + ' W',
    insight: '恒压条件下 I = U/R，代进 P = UI 得到 P = U²/R——电阻越小电流越大，功率反而越大。铭牌上 1000 W 的电热水壶，电阻比 40 W 灯泡小得多。',
    boundary: '只适用于纯电阻且电压恒定；电机、LED 等非欧姆元件不适用，灯丝电阻还会随温度明显上升。恒流条件下结论正好相反（P = I²R）。',
    next: '把电阻减半再猜——功率会翻倍吗？',
    curveLabel: p => '横轴是电阻 R，曲线 P = U²/R；当前 R = ' + p.R + ' Ω → ' + (p.U * p.U / p.R).toFixed(0) + ' W'
  },
  {
    id: 'j9_joule', stage: '初中', subject: '物理', chapter: '九全 · 第十八章 · 焦耳定律',
    title: '电流翻倍，导线发热变成几倍',
    hook: '平方关系，正是电网要高压输电的原因。',
    question: '2 A 电流通过 10 Ω 导线 60 s，产生多少热量？',
    predictLabel: '你猜产生的热量', predictUnit: 'kJ', predictDefault: 5, predictMin: 0.001, predictMax: 10000,
    params: [
      { key: 'I', label: '电流 I', unit: 'A', min: 0.5, max: 10, step: 0.5, value: 2 },
      { key: 'R', label: '电阻 R', unit: 'Ω', min: 1, max: 50, step: 1, value: 10 },
      { key: 't', label: '通电时间 t', unit: 's', min: 1, max: 600, step: 10, value: 60 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => x * x * p.R * p.t / 1000,
    domain: () => [0.5, 10],
    truth: p => p.I * p.I * p.R * p.t / 1000,
    formula: 'Q = I²Rt',
    calc: p => 'Q = ' + p.I + '²×' + p.R + '×' + p.t + ' = ' + (p.I * p.I * p.R * p.t / 1000).toFixed(2) + ' kJ',
    insight: '热量与电流的平方成正比：电流翻倍，发热变成 4 倍。输送同样功率时先升压、把电流降下来，线损能大幅减少。',
    boundary: '假设 R 不随温度变化、电能全部转成内能；实际导线发热后 R 会上升，同时不断向环境散热，电机里还有机械功输出。',
    next: '把电流调到 4 A 再猜——发热是 2 倍还是 4 倍？',
    curveLabel: p => '横轴是电流 I，抛物线 Q = I²Rt；当前 I = ' + p.I + ' A → ' + (p.I * p.I * p.R * p.t / 1000).toFixed(2) + ' kJ'
  },
  {
    id: 'j9_electromagnet', stage: '初中', subject: '物理', chapter: '九全 · 第二十章 · 电磁铁',
    title: '匝数和电流都翻倍，吸力会变几倍',
    hook: '两个因素各自翻倍，结果不是 4 倍那么简单。',
    question: '以「100 匝、1 A」的吸力为 1 倍，200 匝、2 A 时大约是多少倍？',
    predictLabel: '你猜吸力倍数', predictUnit: '倍', predictDefault: 2, predictMin: 0.01, predictMax: 100,
    params: [
      { key: 'n', label: '线圈匝数 n', unit: '匝', min: 50, max: 500, step: 50, value: 100 },
      { key: 'I', label: '电流 I', unit: 'A', min: 0.2, max: 3, step: 0.1, value: 1 },
      { key: 'S', label: '铁芯截面积 S', unit: 'cm²', min: 1, max: 20, step: 1, value: 4 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => (x * p.I / 100) * (x * p.I / 100),
    domain: () => [50, 500],
    truth: p => (p.n * p.I / 100) * (p.n * p.I / 100),
    formula: '简化模型：B ∝ nI，吸力 F ∝ B² ∝ (nI)²',
    calc: p => 'F/F₀ = (' + p.n + '×' + p.I.toFixed(1) + '/100)² = ' + ((p.n * p.I / 100) ** 2).toFixed(2) + ' 倍',
    insight: '教材实验只要求定性结论「匝数越多、电流越大，电磁铁磁性越强」。把 B ∝ nI 与吸力 ∝ B² 合起来，两个因素各翻倍会叠成 16 倍。',
    boundary: '这是强简化：铁芯会磁饱和，nI 大到一定程度后 B 不再线性增长；吸力还受气隙、漏磁、铁芯形状影响。定量结果只能看趋势，不能当设计值。',
    next: '把匝数和电流都翻倍再猜——是 4 倍还是 16 倍？',
    curveLabel: p => '横轴是匝数 n，抛物线 F/F₀ = (nI/100)²；当前 ' + ((p.n * p.I / 100) ** 2).toFixed(2) + ' 倍',
    caption: p => '基准：100 匝 / 1 A = 1 倍。铁芯截面积 S = ' + p.S + ' cm² 未进入这个简化模型'
  },

  // ==================== 高考 / 中考考点补齐批次（2026-11-16）====================
  // 按考试权重挑的高频定量考点，全部复用 function 渲染器，只改本文件。
  // gk_ 前缀为教材外的高考必考模块：用户只提供了必修一二三 + 初中三册，
  // 选择性必修的动量 / 磁场 / 交变电流 / 近代物理按高考考纲补，chapter 标明出处。
  {
    id: 'b1_brake', stage: '高中', subject: '物理', chapter: '必修一 · 第二章 · 匀变速位移',
    title: '刹车后 6 秒，车走了多远',
    hook: '直接套 s = v₀t − ½at²，会算出车倒着走。',
    question: '汽车以 20 m/s 行驶，刹车减速度 5 m/s²，从刹车算起 6 s 内走了多远？',
    predictLabel: '你猜 6 s 内位移', predictUnit: 'm', predictDefault: 30, predictMin: 0, predictMax: 500,
    params: [
      { key: 'v0', label: '初速度 v₀', unit: 'm/s', min: 5, max: 40, step: 1, value: 20 },
      { key: 'a', label: '减速度 a', unit: 'm/s²', min: 1, max: 10, step: 0.5, value: 5 },
      { key: 't', label: '观察时间 t', unit: 's', min: 1, max: 12, step: 0.5, value: 6 }
    ],
    renderer: 'function', duration: 3.0,
    curve: p => x => brakeDist(p.v0, p.a, x),
    domain: () => [0, 12],
    truth: p => brakeDist(p.v0, p.a, p.t),
    formula: 't停 = v₀/a；当 t > t停 时车已静止，s = v₀²/(2a)',
    calc: p => 't停 = ' + (p.v0 / p.a).toFixed(2) + ' s；' + (p.t > p.v0 / p.a ? 't > t停，车已停稳，位移封顶在 v₀²/(2a)' : 't ≤ t停，用 s = v₀t − ½at²') + ' → ' + brakeDist(p.v0, p.a, p.t).toFixed(2) + ' m',
    insight: '匀变速公式只在车还在动的时候有效。t = 6 s 直接代入会得到 120 − 90 = 30 m，比 4 s 时的 40 m 还小——等于说车在倒退，物理上不可能。高考最经典的「刹车陷阱」就是它。',
    boundary: '假设减速度恒定、停稳后不倒车、路面水平。实际 ABS 会让减速度随速度变化，还要另算驾驶员反应时间内的匀速段。',
    next: '把观察时间拖到 2 s 再猜——这时公式才可以直接套。',
    curveLabel: p => '横轴是观察时间 t，s(t) 先增后水平；t停 = ' + (p.v0 / p.a).toFixed(2) + ' s，最大位移 ' + (p.v0 * p.v0 / (2 * p.a)).toFixed(2) + ' m'
  },
  {
    id: 'b1_static_friction', stage: '高中', subject: '物理', chapter: '必修一 · 第三章 · 摩擦力',
    title: '推不动的箱子，摩擦力有多大',
    hook: '很多人一上来就算 μN，其实静摩擦是「你要多少给多少」。',
    question: '2 kg 箱子放在 μs = 0.4 的地面上，用 5 N 水平推它不动，摩擦力多大？',
    predictLabel: '你猜摩擦力', predictUnit: 'N', predictDefault: 8, predictMin: 0, predictMax: 200,
    params: [
      { key: 'F', label: '水平推力 F', unit: 'N', min: 0, max: 20, step: 0.5, value: 5 },
      { key: 'm', label: '质量 m', unit: 'kg', min: 0.5, max: 10, step: 0.5, value: 2 },
      { key: 'mu', label: '最大静摩擦因数 μs', unit: '', min: 0.1, max: 0.9, step: 0.05, value: 0.4 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => Math.min(x, p.mu * p.m * 9.8),
    domain: () => [0, 20],
    truth: p => Math.min(p.F, p.mu * p.m * 9.8),
    formula: '静止时 f静 = F（≤ fmax = μsN）；超过 fmax 后变成 f滑 = μkN',
    calc: p => 'fmax = ' + p.mu + '×' + p.m + '×9.8 = ' + (p.mu * p.m * 9.8).toFixed(2) + ' N；F = ' + p.F + ' N → f = ' + Math.min(p.F, p.mu * p.m * 9.8).toFixed(2) + ' N',
    insight: '静摩擦是被动力，会按外力「按需」匹配，μsN 只是它的天花板，不是默认值。推力从 0 慢慢增大时，摩擦力先跟着线性增大，到 fmax 后箱子启动，摩擦力还会略微下降（μk < μs）。',
    boundary: '水平面、无其他水平力、接触面干燥。若同时受多个水平力，静摩擦平衡的是它们的合力；斜面或加速参考系里 N ≠ mg。',
    next: '把推力拖到 10 N 再猜——摩擦力还会跟着涨吗？',
    curveLabel: p => '横轴是推力 F，f(F) 先线性上升后在 ' + (p.mu * p.m * 9.8).toFixed(2) + ' N 处封顶（超过就滑动）'
  },
  {
    id: 'b1_equilibrium', stage: '高中', subject: '物理', chapter: '必修一 · 第三章 · 共点力的平衡',
    title: '斜面上的球，绳要拉多紧',
    hook: '倾角变大一点，绳张力不是线性变大。',
    question: '重 10 N 的光滑球用水平绳拉住，停在倾角 30° 的斜面上，绳张力多大？',
    predictLabel: '你猜绳张力', predictUnit: 'N', predictDefault: 5, predictMin: 0.01, predictMax: 200,
    params: [
      { key: 'G', label: '球重 G', unit: 'N', min: 2, max: 30, step: 1, value: 10 },
      { key: 'ang', label: '斜面倾角 θ', unit: '°', min: 10, max: 60, step: 1, value: 30 },
      { key: 'r', label: '球半径 r', unit: 'cm', min: 5, max: 30, step: 1, value: 10 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => p.G * Math.tan(rad(x)),
    domain: () => [0, 60],
    truth: p => p.G * Math.tan(rad(p.ang)),
    formula: '三力平衡：T = G·tanθ，N = G/cosθ',
    calc: p => 'T = ' + p.G + '×tan(' + p.ang + '°) = ' + (p.G * Math.tan(rad(p.ang))).toFixed(2) + ' N（球半径 ' + p.r + ' cm 不影响）',
    insight: '把重力沿斜面和垂直斜面分解：水平绳的张力同时有沿斜面和垂直斜面的分量，解出来是 G·tanθ 而不是 G·sinθ。θ 趋近 90° 时 tanθ 暴涨，绳会被拉断——这正是动态平衡问题的核心。',
    boundary: '假设斜面光滑、绳水平、球可视为质点。有摩擦时解不唯一；绳方向改变要重新分解；θ 接近 90° 时球已无法贴住斜面。',
    next: '把倾角拖到 60° 再猜——张力是 30° 时的 3 倍吗？',
    curveLabel: p => '横轴是倾角 θ，T(θ) = ' + p.G + '·tanθ；当前 θ = ' + p.ang + '° → ' + (p.G * Math.tan(rad(p.ang))).toFixed(2) + ' N'
  },
  {
    id: 'b1_incline', stage: '高中', subject: '物理', chapter: '必修一 · 第四章 · 牛顿运动定律的应用',
    title: '斜面变陡，下滑会快几倍',
    hook: '倾角翻倍，加速度既不是 2 倍，也不是单纯按 sinθ 走。',
    question: '倾角 30°、μ = 0.2 的斜面上，物块从静止下滑的加速度多大？',
    predictLabel: '你猜下滑加速度', predictUnit: 'm/s²', predictDefault: 4.9, predictMin: 0, predictMax: 20,
    params: [
      { key: 'ang', label: '倾角 θ', unit: '°', min: 5, max: 60, step: 1, value: 30 },
      { key: 'mu', label: '动摩擦因数 μ', unit: '', min: 0, max: 0.6, step: 0.05, value: 0.2 },
      { key: 'm', label: '质量 m', unit: 'kg', min: 0.5, max: 10, step: 0.5, value: 2 }
    ],
    renderer: 'function', duration: 3.0,
    curve: p => x => Math.max(0, 9.8 * (Math.sin(rad(x)) - p.mu * Math.cos(rad(x)))),
    domain: () => [0, 60],
    truth: p => Math.max(0, 9.8 * (Math.sin(rad(p.ang)) - p.mu * Math.cos(rad(p.ang)))),
    formula: 'a = g(sinθ − μcosθ)，与质量无关；tanθ ≤ μ 时不会下滑',
    calc: p => 'a = 9.8×(sin' + p.ang + '° − ' + p.mu + '×cos' + p.ang + '°) = ' + Math.max(0, 9.8 * (Math.sin(rad(p.ang)) - p.mu * Math.cos(rad(p.ang)))).toFixed(2) + ' m/s²',
    insight: '沿斜面方向只有重力分量 mg sinθ 往下、摩擦力 μmg cosθ 往上，质量 m 被约掉。摩擦项带 cosθ，所以倾角变大时「阻力同时还在变小」，加速度涨得比 sinθ 更快。',
    boundary: '假设物块已在滑动、μ 恒定、斜面固定不动。tanθ ≤ μ 时物块静止，这里截断为 0；斜面本身可动或 μ 随速度变化时公式失效。',
    next: '把 μ 拖到 0.6 再猜——30° 时还滑得动吗？',
    curveLabel: p => '横轴是倾角 θ，a(θ) = 9.8(sinθ − ' + p.mu + 'cosθ)；质量 ' + p.m + ' kg 不进入公式'
  },
  {
    id: 'b2_work_angle', stage: '高中', subject: '物理', chapter: '必修二 · 第八章 · 功与功率',
    title: '斜着拉箱子，力做了多少功',
    hook: '力乘位移不等于功——方向不对的那部分力白费了。',
    question: '用 20 N 的力斜向上 30° 拉箱子水平走 6 m，这个力做了多少功？',
    predictLabel: '你猜做功', predictUnit: 'J', predictDefault: 120, predictMin: 0, predictMax: 2000,
    params: [
      { key: 'F', label: '拉力 F', unit: 'N', min: 5, max: 50, step: 1, value: 20 },
      { key: 's', label: '水平位移 s', unit: 'm', min: 1, max: 20, step: 0.5, value: 6 },
      { key: 'ang', label: '拉力与水平夹角 θ', unit: '°', min: 0, max: 90, step: 1, value: 30 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => p.F * p.s * Math.cos(rad(x)),
    domain: () => [0, 90],
    truth: p => p.F * p.s * Math.cos(rad(p.ang)),
    formula: 'W = F·s·cosθ（只有沿位移方向的分量做功）',
    calc: p => 'W = ' + p.F + '×' + p.s + '×cos' + p.ang + '° = ' + (p.F * p.s * Math.cos(rad(p.ang))).toFixed(2) + ' J',
    insight: '垂直位移方向的分量 F sinθ 不做功（它只减小了正压力，间接影响摩擦）。θ = 90° 时 W = 0——提着水桶水平走，手对桶不做功。',
    boundary: '恒力、直线位移、质点模型。力随位置变化要积分 W = ∫F·ds；有摩擦时还要单独算摩擦做的负功。',
    next: '把夹角拖到 90° 再猜——功正好是 0 吗？',
    curveLabel: p => '横轴是夹角 θ，W(θ) = ' + p.F + '×' + p.s + '×cosθ；当前 ' + (p.F * p.s * Math.cos(rad(p.ang))).toFixed(2) + ' J'
  },
  {
    id: 'b2_work_energy', stage: '高中', subject: '物理', chapter: '必修二 · 第八章 · 动能和动能定理',
    title: '推力做的功，换来多少速度',
    hook: '功翻倍，速度只涨 √2 倍。',
    question: '2 kg 物体以 1 m/s 起步，被 10 N 的合力推了 5 m，末速度多大？',
    predictLabel: '你猜末速度', predictUnit: 'm/s', predictDefault: 25, predictMin: 0, predictMax: 100,
    params: [
      { key: 'F', label: '合外力 F', unit: 'N', min: 1, max: 40, step: 1, value: 10 },
      { key: 's', label: '位移 s', unit: 'm', min: 0.5, max: 20, step: 0.5, value: 5 },
      { key: 'm', label: '质量 m', unit: 'kg', min: 0.5, max: 10, step: 0.5, value: 2 },
      { key: 'v0', label: '初速度 v₀', unit: 'm/s', min: 0, max: 10, step: 0.5, value: 1 }
    ],
    renderer: 'function', duration: 3.0,
    curve: p => x => Math.sqrt(p.v0 * p.v0 + 2 * p.F * x / p.m),
    domain: () => [0, 20],
    truth: p => Math.sqrt(p.v0 * p.v0 + 2 * p.F * p.s / p.m),
    formula: 'W合 = Fs = ½mv² − ½mv₀² ⇒ v = √(v₀² + 2Fs/m)',
    calc: p => 'v = √(' + p.v0 + '² + 2×' + p.F + '×' + p.s + '/' + p.m + ') = ' + Math.sqrt(p.v0 * p.v0 + 2 * p.F * p.s / p.m).toFixed(2) + ' m/s',
    insight: '动能与速度平方成正比，所以功和速度不是正比：位移或力翻倍，速度只变成 √2 倍。动能定理只关心始末状态，不管中间是匀加速还是变加速。',
    boundary: 'F 是合外力（若还有摩擦要先扣掉）、与位移同向且恒定。涉及转动、形变或相对论速度时不适用。',
    next: '把位移拖到 10 m 再猜——速度会翻倍吗？',
    curveLabel: p => '横轴是位移 s，v(s) = √(v₀² + 2Fs/m) 是凹曲线，增速越来越慢'
  },
  {
    id: 'b2_circle_critical', stage: '高中', subject: '物理', chapter: '必修二 · 第六章 · 生活中的圆周运动',
    title: '过山车到最高点，最慢能多慢',
    hook: '速度再小一点，车就脱离轨道掉下来了。',
    question: '半径 10 m 的圆轨道，过山车通过最高点的最小速度是多少？',
    predictLabel: '你猜最小速度', predictUnit: 'm/s', predictDefault: 20, predictMin: 0, predictMax: 50,
    params: [
      { key: 'R', label: '轨道半径 R', unit: 'm', min: 2, max: 40, step: 1, value: 10 },
      { key: 'g', label: '重力加速度 g', unit: 'm/s²', options: G, value: 9.8 },
      { key: 'm', label: '车与乘客质量 m', unit: 't', min: 0.5, max: 5, step: 0.5, value: 1 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => Math.sqrt(p.g * x),
    domain: () => [2, 40],
    truth: p => Math.sqrt(p.g * p.R),
    formula: '最高点临界：N = 0 ⇒ mg = mv²/R ⇒ v_min = √(gR)',
    calc: p => 'v_min = √(' + p.g + '×' + p.R + ') = ' + Math.sqrt(p.g * p.R).toFixed(2) + ' m/s（质量 ' + p.m + ' t 被约掉）',
    insight: '最高点重力和轨道支持力一起提供向心力；速度越小需要的向心力越小，支持力 N 就越小，小到 0 时刚好只靠重力，再慢就脱离轨道。质量被约掉，空车和满车临界速度一样。',
    boundary: '把车当质点、轨道刚性、忽略摩擦与空气阻力。实际过山车有安全系数和压轨车轮，最高点速度还要由能量守恒从出发高度推出来。',
    next: '把轨道半径调到 4 倍再猜——临界速度会翻倍吗？',
    curveLabel: p => '横轴是半径 R，v_min = √(gR) 是条凹曲线；当前 R = ' + p.R + ' m → ' + Math.sqrt(p.g * p.R).toFixed(2) + ' m/s'
  },
  {
    id: 'b3_field_strength', stage: '高中', subject: '物理', chapter: '必修三 · 第九章 · 电场强度',
    title: '把试探电荷拿走，场强还在吗',
    hook: '场强是场自己的属性，跟放不放试探电荷没关系。',
    question: '距点电荷 Q = 2 μC 0.3 m 处的电场强度有多大？',
    predictLabel: '你猜电场强度', predictUnit: 'N/C', predictDefault: 100000, predictMin: 0, predictMax: 10000000,
    params: [
      { key: 'Q', label: '源电荷 Q', unit: 'μC', min: 0.5, max: 8, step: 0.5, value: 2 },
      { key: 'r', label: '距离 r', unit: 'm', min: 0.1, max: 1, step: 0.05, value: 0.3 },
      { key: 'q', label: '试探电荷 q', unit: 'nC', min: 1, max: 100, step: 1, value: 10 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => 9e9 * p.Q * 1e-6 / (x * x),
    domain: () => [0.1, 1],
    truth: p => 9e9 * p.Q * 1e-6 / (p.r * p.r),
    formula: 'E = kQ/r²（k = 9×10⁹ N·m²/C²），与试探电荷 q 无关',
    calc: p => 'E = 9×10⁹×' + p.Q + '×10⁻⁶/' + p.r + '² = ' + (9e9 * p.Q * 1e-6 / (p.r * p.r)).toFixed(0) + ' N/C',
    insight: '定义式 E = F/q 里的 q 只是「探针」，除完之后只剩源电荷 Q 和距离 r。把试探电荷翻倍，受力 F 翻倍而 E 不变；把 q 拿走，场依然存在。距离翻倍 E 只剩 1/4。',
    boundary: '点电荷、真空（空气近似）、静止电荷。q 大到会扰动源电荷分布时就不再是「试探」；介质中 k 要换成 1/(4πε)。',
    next: '把距离拖到 0.6 m 再猜——场强会减半吗？',
    curveLabel: p => '横轴是距离 r，E(r) = kQ/r² 双曲线下降；试探电荷 q = ' + p.q + ' nC 不进入公式'
  },
  {
    id: 'b3_potential_diff', stage: '高中', subject: '物理', chapter: '必修三 · 第十章 · 电势差',
    title: '沿电场走一段，电势降多少',
    hook: '电势差只由场和距离决定，跟搬的是谁无关。',
    question: '匀强电场 E = 200 V/m，沿电场方向走 0.4 m，两点电势差是多少？',
    predictLabel: '你猜电势差', predictUnit: 'V', predictDefault: 160, predictMin: 0, predictMax: 5000,
    params: [
      { key: 'E', label: '电场强度 E', unit: 'V/m', min: 50, max: 800, step: 10, value: 200 },
      { key: 'd', label: '沿场方向距离 d', unit: 'm', min: 0.05, max: 1, step: 0.05, value: 0.4 },
      { key: 'q', label: '移动电荷 q', unit: 'μC', min: 1, max: 50, step: 1, value: 5 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => p.E * x,
    domain: () => [0, 1],
    truth: p => p.E * p.d,
    formula: 'U = Ed（d 必须是沿电场线方向的距离）',
    calc: p => 'U = ' + p.E + '×' + p.d + ' = ' + (p.E * p.d).toFixed(1) + ' V（与 q = ' + p.q + ' μC 无关）',
    insight: '电势差是电场本身的性质；q 只影响电场力做功 W = qU 和电势能变化。若移动方向与电场成 θ 角，要用 d = s·cosθ，垂直电场走电势不变。',
    boundary: '只适用于匀强电场；非匀强场要积分 U = ∫E·dl。忽略边缘效应与电荷自身对场的扰动。',
    next: '把 E 调到 400 V/m 再猜——电势差会正好翻倍吗？',
    curveLabel: p => '横轴是沿场方向距离 d，U(d) = ' + p.E + 'd 是过原点直线；当前 ' + (p.E * p.d).toFixed(1) + ' V'
  },
  {
    id: 'b3_charge_deflect', stage: '高中', subject: '物理', chapter: '必修三 · 第十章 · 带电粒子在电场中的运动',
    title: '电子飞过偏转板，会偏多少',
    hook: '速度翻倍，偏移量不是减半，是剩四分之一。',
    question: '电子以 1×10⁶ m/s 垂直射入 E = 100 V/m 的匀强电场，穿过 0.1 m 长的极板后偏移多少？',
    predictLabel: '你猜侧向偏移', predictUnit: 'cm', predictDefault: 4, predictMin: 0, predictMax: 100,
    params: [
      { key: 'E', label: '电场强度 E', unit: 'V/m', min: 50, max: 500, step: 10, value: 100 },
      { key: 'L', label: '极板长度 L', unit: 'm', min: 0.05, max: 0.3, step: 0.01, value: 0.1 },
      { key: 'v0', label: '入射速度 v₀', unit: '10⁶ m/s', min: 0.5, max: 3, step: 0.1, value: 1 }
    ],
    renderer: 'function', duration: 3.0,
    curve: p => x => 0.5 * 1.76e11 * p.E * (p.L / (x * 1e6)) ** 2 * 100,
    domain: () => [0.5, 3],
    truth: p => 0.5 * 1.76e11 * p.E * (p.L / (p.v0 * 1e6)) ** 2 * 100,
    formula: '类平抛：y = ½·(qE/m)·(L/v₀)²（电子比荷 q/m = 1.76×10¹¹ C/kg）',
    calc: p => 'y = ½×1.76×10¹¹×' + p.E + '×(' + p.L + '/' + p.v0 + '×10⁶)² = ' + (0.5 * 1.76e11 * p.E * (p.L / (p.v0 * 1e6)) ** 2 * 100).toFixed(2) + ' cm',
    insight: '水平方向匀速、竖直方向匀加速，和重力场里的平抛完全同构，只是把 g 换成 qE/m。飞行时间 t = L/v₀，所以 y ∝ 1/v₀²：速度翻倍，偏移只剩 1/4。示波管、喷墨打印都靠这个。',
    boundary: '忽略边缘电场、重力（电子重力比电场力小 10¹⁰ 量级）、相对论效应；电子不能打到极板，否则公式只到打出点为止。',
    next: '把入射速度调到 2×10⁶ m/s 再猜——偏移会减半吗？',
    curveLabel: p => '横轴是入射速度 v₀（10⁶ m/s），y ∝ 1/v₀²；当前 ' + (0.5 * 1.76e11 * p.E * (p.L / (p.v0 * 1e6)) ** 2 * 100).toFixed(2) + ' cm'
  },
  {
    id: 'b3_meter_modify', stage: '高中', subject: '物理', chapter: '必修三 · 第十一章 · 串联电路和并联电路',
    title: '把表头改成电压表，要串多大电阻',
    hook: '量程扩得越大，串的电阻越大——和改电流表正好反过来。',
    question: '满偏电流 100 μA、内阻 1 kΩ 的表头，改成 3 V 电压表要串联多大电阻？',
    predictLabel: '你猜串联电阻', predictUnit: 'kΩ', predictDefault: 10, predictMin: 0, predictMax: 500,
    params: [
      { key: 'U', label: '目标量程 U', unit: 'V', min: 1, max: 15, step: 0.5, value: 3 },
      { key: 'Ig', label: '满偏电流 Ig', unit: 'μA', min: 100, max: 500, step: 10, value: 100 },
      { key: 'Rg', label: '表头内阻 Rg', unit: 'kΩ', min: 0.2, max: 3, step: 0.1, value: 1 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => x / (p.Ig * 1e-6) / 1000 - p.Rg,
    domain: () => [1, 15],
    truth: p => p.U / (p.Ig * 1e-6) / 1000 - p.Rg,
    formula: '串联分压：R串 = U/Ig − Rg',
    calc: p => 'R串 = ' + p.U + '/(' + p.Ig + '×10⁻⁶)/1000 − ' + p.Rg + ' = ' + (p.U / (p.Ig * 1e-6) / 1000 - p.Rg).toFixed(2) + ' kΩ',
    insight: '满偏时表头只承受 Ig·Rg = 0.1 V，剩下 2.9 V 全靠串联电阻分掉。改电流表则要在表头两端并联一个小电阻分流，量程越大并联电阻越小——两者方向相反。',
    boundary: '假设表头内阻恒定、电阻精度理想。实际还要考虑电阻温漂与表头非线性；交流电压表另需整流。',
    next: '把量程调到 6 V 再猜——串联电阻会正好翻倍吗？（注意要减掉 Rg）',
    curveLabel: p => '横轴是目标量程 U，R串 = U/Ig − Rg 是直线（不过原点）；当前 ' + (p.U / (p.Ig * 1e-6) / 1000 - p.Rg).toFixed(2) + ' kΩ'
  },
  {
    id: 'b3_induction_emf', stage: '高中', subject: '物理', chapter: '必修三 · 第十三章 · 电磁感应现象及应用',
    title: '导体棒切得越快，电动势多大',
    hook: '开路也能有电动势，但没有感应电流。',
    question: '0.2 T 匀强磁场里，0.5 m 长的导体棒以 4 m/s 垂直切割磁感线，感应电动势多大？',
    predictLabel: '你猜感应电动势', predictUnit: 'V', predictDefault: 1, predictMin: 0, predictMax: 500,
    params: [
      { key: 'B', label: '磁感应强度 B', unit: 'T', min: 0.05, max: 1, step: 0.05, value: 0.2 },
      { key: 'L', label: '导体棒有效长度 L', unit: 'm', min: 0.1, max: 1, step: 0.05, value: 0.5 },
      { key: 'v', label: '切割速度 v', unit: 'm/s', min: 0.5, max: 10, step: 0.5, value: 4 },
      { key: 'N', label: '线圈匝数 N', unit: '匝', min: 1, max: 20, step: 1, value: 1 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => p.N * p.B * p.L * x,
    domain: () => [0, 10],
    truth: p => p.N * p.B * p.L * p.v,
    formula: 'ε = NBLv（B、L、v 两两垂直；一般情形 ε = NBLv·sinθ）',
    calc: p => 'ε = ' + p.N + '×' + p.B + '×' + p.L + '×' + p.v + ' = ' + (p.N * p.B * p.L * p.v).toFixed(2) + ' V',
    insight: '本质是法拉第定律 ε = N·ΔΦ/Δt：棒每秒扫过的面积是 Lv，磁通量就每秒增加 BLv。电动势与速度成正比；开路时照样有电动势，只是没有闭合回路就没有电流。',
    boundary: 'B 均匀、棒与 B 和 v 都垂直、忽略自感与棒电阻。若成角度要乘 sinθ；B 随位置变化或棒在转动时要积分。',
    next: '把速度调到 8 m/s 再猜——电动势会翻倍吗？再把 N 调到 10 呢？',
    curveLabel: p => '横轴是切割速度 v，ε = ' + p.N + '×' + p.B + '×' + p.L + '×v 是直线；当前 ' + (p.N * p.B * p.L * p.v).toFixed(2) + ' V'
  },
  {
    id: 'b3_flux', stage: '高中', subject: '物理', chapter: '必修三 · 第十三章 · 磁感应强度 磁通量',
    title: '线圈转到什么角度，磁通量最大',
    hook: '线圈平面与磁场「垂直」时磁通量反而最大，说法最容易混。',
    question: 'B = 0.5 T、面积 0.2 m² 的线圈，法线与 B 成 60° 时磁通量是多少？',
    predictLabel: '你猜磁通量', predictUnit: 'Wb', predictDefault: 0.1, predictMin: 0, predictMax: 50,
    params: [
      { key: 'B', label: '磁感应强度 B', unit: 'T', min: 0.1, max: 2, step: 0.1, value: 0.5 },
      { key: 'S', label: '线圈面积 S', unit: 'm²', min: 0.05, max: 1, step: 0.05, value: 0.2 },
      { key: 'ang', label: '法线与 B 夹角 θ', unit: '°', min: 0, max: 90, step: 1, value: 60 },
      { key: 'N', label: '匝数 N', unit: '匝', min: 1, max: 20, step: 1, value: 1 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => p.N * p.B * p.S * Math.cos(rad(x)),
    domain: () => [0, 90],
    truth: p => p.N * p.B * p.S * Math.cos(rad(p.ang)),
    formula: 'Φ = NBS·cosθ（θ 为线圈法线与 B 的夹角）',
    calc: p => 'Φ = ' + p.N + '×' + p.B + '×' + p.S + '×cos' + p.ang + '° = ' + (p.N * p.B * p.S * Math.cos(rad(p.ang))).toFixed(3) + ' Wb',
    insight: 'θ 是「法线」与 B 的夹角，不是线圈平面与 B 的夹角。法线与 B 平行（线圈平面⊥B）时 Φ 最大 = NBS；线圈平面与 B 平行时 Φ = 0。转动线圈产生感应电流，靠的正是 Φ 随 cosθ 变化。',
    boundary: '匀强磁场、平面线圈、B 全部穿过线圈面积。非匀强场要积分 Φ = ∫B·dS；多匝时乘 N 得到的是磁链。',
    next: '把夹角拖到 0° 再猜——磁通量会变成最大还是 0？',
    curveLabel: p => '横轴是法线与 B 的夹角 θ，Φ = ' + p.N + '×' + p.B + '×' + p.S + '×cosθ；当前 ' + (p.N * p.B * p.S * Math.cos(rad(p.ang))).toFixed(3) + ' Wb'
  },
  {
    id: 'gk_momentum', stage: '高中', subject: '物理', chapter: '高考专题 · 动量守恒定律',
    title: '两车粘在一起，撞完还有多快',
    hook: '动量守恒，动能却不守恒——损失的那部分去哪了？',
    question: '2 kg 的小车以 6 m/s 撞上静止的 3 kg 小车并粘在一起，共同速度多大？',
    predictLabel: '你猜碰后共同速度', predictUnit: 'm/s', predictDefault: 6, predictMin: 0, predictMax: 30,
    params: [
      { key: 'm1', label: '入射小车 m₁', unit: 'kg', min: 0.5, max: 10, step: 0.5, value: 2 },
      { key: 'm2', label: '被撞小车 m₂', unit: 'kg', min: 0.5, max: 10, step: 0.5, value: 3 },
      { key: 'v1', label: '入射速度 v₁', unit: 'm/s', min: 1, max: 20, step: 0.5, value: 6 }
    ],
    renderer: 'function', duration: 3.0,
    curve: p => x => p.m1 * p.v1 / (p.m1 + x),
    domain: () => [0.5, 10],
    truth: p => p.m1 * p.v1 / (p.m1 + p.m2),
    formula: '完全非弹性碰撞：m₁v₁ = (m₁+m₂)v',
    calc: p => 'v = ' + p.m1 + '×' + p.v1 + '/(' + p.m1 + '+' + p.m2 + ') = ' + (p.m1 * p.v1 / (p.m1 + p.m2)).toFixed(2) + ' m/s',
    insight: '系统不受外力（或内力远大于外力）时动量守恒，但完全非弹性碰撞损失的动能最多：ΔEk = ½·m₁m₂/(m₁+m₂)·v₁²，变成内能、形变和声。弹性碰撞要同时守恒动能，解完全不同。',
    boundary: '碰撞时间极短、外力冲量可忽略、两车粘在一起不再分开。若地面摩擦大或有弹簧 / 挡板参与，系统动量不再守恒。',
    next: '把 m₂ 调到 8 kg 再猜——速度会掉到原来的几分之一？',
    curveLabel: p => '横轴是被撞小车质量 m₂，v(m₂) = ' + p.m1 + '×' + p.v1 + '/(' + p.m1 + '+m₂)；当前 ' + (p.m1 * p.v1 / (p.m1 + p.m2)).toFixed(2) + ' m/s'
  },
  {
    id: 'gk_lorentz_period', stage: '高中', subject: '物理', chapter: '高考专题 · 带电粒子在磁场中的运动',
    title: '粒子跑得更快，转一圈会更快吗',
    hook: '速度变大，轨道半径变大，周期居然纹丝不动。',
    question: '质子垂直射入 B = 0.5 T 的匀强磁场，回旋一周要多久？把速度翻倍会怎样？',
    predictLabel: '你猜回旋周期', predictUnit: 'ns', predictDefault: 60, predictMin: 0, predictMax: 1000,
    params: [
      { key: 'B', label: '磁感应强度 B', unit: 'T', min: 0.1, max: 2, step: 0.1, value: 0.5 },
      { key: 'v', label: '入射速度 v', unit: '10⁶ m/s', min: 0.5, max: 5, step: 0.1, value: 1 },
      { key: 'q', label: '电荷量 q', unit: 'e', min: 1, max: 3, step: 1, value: 1 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => () => 2 * PI * 1.67e-27 / (p.q * 1.6e-19 * p.B) * 1e9,
    domain: () => [0.5, 5],
    truth: p => 2 * PI * 1.67e-27 / (p.q * 1.6e-19 * p.B) * 1e9,
    formula: 'T = 2πm/(qB)，与速度 v 无关（r = mv/qB 随 v 变大）',
    calc: p => 'T = 2π×1.67×10⁻²⁷/(' + p.q + '×1.6×10⁻¹⁹×' + p.B + ') = ' + (2 * PI * 1.67e-27 / (p.q * 1.6e-19 * p.B) * 1e9).toFixed(1) + ' ns',
    insight: '洛伦兹力提供向心力 qvB = mv²/r ⇒ r = mv/qB；代入 T = 2πr/v 后 v 被约掉。跑得快的粒子只是绕更大的圈，周期不变——回旋加速器能用一个固定频率的交变电场反复加速，靠的正是这一点。',
    boundary: '非相对论、匀强磁场、v 与 B 垂直、忽略能量损失。速度接近光速时质量变大，周期会变长（同步回旋加速器要调频）。',
    next: '把速度滑块拖到 5×10⁶ m/s 再猜——周期会变吗？把 B 翻倍呢？',
    curveLabel: p => '横轴是入射速度 v，T 恒为 ' + (2 * PI * 1.67e-27 / (p.q * 1.6e-19 * p.B) * 1e9).toFixed(1) + ' ns 的水平线（拖速度滑块不动）'
  },
  {
    id: 'gk_transmission', stage: '高中', subject: '物理', chapter: '高考专题 · 交变电流与远距离输电',
    title: '输电电压提高 10 倍，线损剩多少',
    hook: '损耗不是降到 1/10，是降到 1/100。',
    question: '输送 100 kW、线路电阻 10 Ω，用 10 kV 输电时线路损耗功率是多少？',
    predictLabel: '你猜线路损耗', predictUnit: 'kW', predictDefault: 10, predictMin: 0, predictMax: 20000,
    params: [
      { key: 'P', label: '输送功率 P', unit: 'kW', min: 10, max: 500, step: 10, value: 100 },
      { key: 'U', label: '输电电压 U', unit: 'kV', min: 1, max: 100, step: 1, value: 10 },
      { key: 'R', label: '线路总电阻 R', unit: 'Ω', min: 1, max: 50, step: 1, value: 10 }
    ],
    renderer: 'function', duration: 3.0,
    curve: p => x => (p.P * 1000 / (x * 1000)) ** 2 * p.R / 1000,
    domain: () => [1, 100],
    truth: p => (p.P * 1000 / (p.U * 1000)) ** 2 * p.R / 1000,
    formula: 'P损 = I²R = (P/U)²R（P 为输送功率，U 为输电电压）',
    calc: p => 'I = ' + p.P + '×1000/(' + p.U + '×1000) = ' + (p.P / p.U).toFixed(2) + ' A，P损 = I²×' + p.R + ' = ' + ((p.P / p.U) ** 2 * p.R / 1000).toFixed(3) + ' kW',
    insight: '输送功率一定时 I = P/U，电压提高 n 倍电流降到 1/n，而线损按 I² 走，于是降到 1/n²。10 kV → 100 kV，线损从 1 kW 降到 0.01 kW，正好 100 倍——这就是高压输电的全部理由。',
    boundary: '理想变压器、功率因数 1、线路电阻恒定、不考虑电晕损耗与绝缘成本。实际电压越高绝缘与电晕越贵，存在经济电压。',
    next: '把电压拖到 100 kV 再猜——损耗是 10 kV 时的 1/10 吗？',
    curveLabel: p => '横轴是输电电压 U（kV），P损 ∝ 1/U² 是陡降双曲线；当前 ' + ((p.P / p.U) ** 2 * p.R / 1000).toFixed(3) + ' kW'
  },
  {
    id: 'gk_photoelectric', stage: '高中', subject: '物理', chapter: '高考专题 · 光电效应',
    title: '把光调亮，电子会飞得更快吗',
    hook: '光强只管电子「有多少」，不管「飞多快」。',
    question: '用频率 8×10¹⁴ Hz 的光照射逸出功 2.0 eV 的金属，光电子最大初动能是多少？',
    predictLabel: '你猜最大初动能', predictUnit: 'eV', predictDefault: 3, predictMin: 0, predictMax: 20,
    params: [
      { key: 'f', label: '入射光频率 f', unit: '10¹⁴ Hz', min: 1, max: 20, step: 0.5, value: 8 },
      { key: 'W', label: '金属逸出功 W₀', unit: 'eV', min: 0.5, max: 5, step: 0.1, value: 2 },
      { key: 'I0', label: '光强 I', unit: 'a.u.', min: 1, max: 10, step: 1, value: 5 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => Math.max(0, 4.136e-15 * x * 1e14 - p.W),
    domain: () => [1, 20],
    truth: p => Math.max(0, 4.136e-15 * p.f * 1e14 - p.W),
    formula: 'Ek = hν − W₀（h = 4.136×10⁻¹⁵ eV·s），低于截止频率 ν₀ = W₀/h 时无光电子',
    calc: p => 'Ek = 4.136×10⁻¹⁵×' + p.f + '×10¹⁴ − ' + p.W + ' = ' + Math.max(0, 4.136e-15 * p.f * 1e14 - p.W).toFixed(2) + ' eV（光强 ' + p.I0 + ' 不进入公式）',
    insight: '一个光子把全部能量给一个电子，所以单个电子的最大动能只由频率决定。增大光强只是每秒光子更多、光电子数更多、饱和电流更大；频率低于截止频率时，再强的光也打不出电子。这是光量子假说最直接的证据。',
    boundary: '假设单光子吸收、金属表面干净、无空间电荷效应。极强激光下会出现多光子电离；逸出功随表面状态变化。',
    next: '把光强拖到 10 再猜——最大初动能会变吗？把频率降到 3×10¹⁴ Hz 呢？',
    curveLabel: p => '横轴是频率 f（10¹⁴ Hz），Ek = hf − ' + p.W + ' 是直线，低于 ' + (p.W / 0.4136).toFixed(1) + '×10¹⁴ Hz 时为 0'
  },
  {
    id: 'j8a_light_reflect', stage: '初中', subject: '物理', chapter: '八上 · 第四章 · 光的反射',
    title: '镜子转 10°，反射光转几度',
    hook: '镜子转一点，反射光跑两倍——微小角度就是这么被放大的。',
    question: '平面镜绕入射点转过 10°，反射光线一共偏转多少度？',
    predictLabel: '你猜反射光偏转角', predictUnit: '°', predictDefault: 10, predictMin: 0, predictMax: 180,
    params: [
      { key: 'ang', label: '镜面转角 Δφ', unit: '°', min: 1, max: 45, step: 1, value: 10 },
      { key: 'i', label: '初始入射角 i', unit: '°', min: 0, max: 60, step: 1, value: 20 },
      { key: 'L', label: '镜面长度 L', unit: 'cm', min: 5, max: 40, step: 1, value: 10 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => 2 * x,
    domain: () => [0, 45],
    truth: p => 2 * p.ang,
    formula: 'Δθ反射光 = 2·Δφ镜面（法线跟着镜面一起转）',
    calc: p => 'Δθ = 2×' + p.ang + '° = ' + (2 * p.ang).toFixed(0) + '°（初始入射角 ' + p.i + '°、镜长 ' + p.L + ' cm 都不影响）',
    insight: '镜面转 Δφ，法线也转 Δφ，入射角变化 Δφ，反射角再跟着变 Δφ，两处叠加就是 2Δφ。光杠杆、检流计的小镜、激光测微小形变都靠这个把角度放大一倍。',
    boundary: '假设入射光方向固定、光斑始终打在同一块平面镜上、转角不大。转角过大时光斑会跑出镜面；镜面不平整时反射不再遵守单一法线。',
    next: '把镜面转角拖到 30° 再猜——反射光会转 60° 吗？',
    curveLabel: p => '横轴是镜面转角 Δφ，反射光偏转角 = 2Δφ 是条直线；当前 ' + (2 * p.ang).toFixed(0) + '°'
  },
  {
    id: 'j8b_solid_pressure', stage: '初中', subject: '物理', chapter: '八下 · 第九章 · 压强',
    title: '箱子换个面放，压强变多少',
    hook: '压力一点没变，压强却能翻倍。',
    question: '5 kg 的箱子以 0.2 m² 的面放在地上，对地面的压强是多少？',
    predictLabel: '你猜压强', predictUnit: 'Pa', predictDefault: 50, predictMin: 0, predictMax: 100000,
    params: [
      { key: 'm', label: '质量 m', unit: 'kg', min: 1, max: 50, step: 1, value: 5 },
      { key: 'S', label: '接触面积 S', unit: 'm²', min: 0.02, max: 1, step: 0.02, value: 0.2 },
      { key: 'g', label: '重力加速度 g', unit: 'm/s²', options: G, value: 9.8 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => p.m * p.g / x,
    domain: () => [0.02, 1],
    truth: p => p.m * p.g / p.S,
    formula: 'p = F/S = mg/S（水平面、无其他竖直外力）',
    calc: p => 'p = ' + p.m + '×' + p.g + '/' + p.S + ' = ' + (p.m * p.g / p.S).toFixed(1) + ' Pa',
    insight: '压力 F 是「总共压了多少」，压强 p 是「单位面积上压了多少」。把箱子侧放，重力没变、压力没变，但面积减半压强翻倍——刀刃、图钉、雪橇都是这个道理。注意压力不是重力：斜面上或有人往上提时两者不等。',
    boundary: '水平刚性面、物体静止、接触面积就是受力面积。软地面会下陷使实际接触面积变化；物体叠放时压力要算总重。',
    next: '把接触面积拖到 0.1 m² 再猜——压强会翻倍吗？',
    curveLabel: p => '横轴是接触面积 S，p = ' + p.m + '×' + p.g + '/S 是双曲线；当前 ' + (p.m * p.g / p.S).toFixed(1) + ' Pa'
  },
  {
    id: 'j8b_float', stage: '初中', subject: '物理', chapter: '八下 · 第十章 · 物体的浮沉条件',
    title: '木块浮在水上，露出来多少',
    hook: '露出多少只看密度比，跟木块做多大没关系。',
    question: '体积 100 cm³、密度 0.8 g/cm³ 的木块浮在水上，露出水面的体积是多少？',
    predictLabel: '你猜露出体积', predictUnit: 'cm³', predictDefault: 50, predictMin: 0, predictMax: 1000,
    params: [
      { key: 'V', label: '物体总体积 V', unit: 'cm³', min: 20, max: 500, step: 10, value: 100 },
      { key: 'rho', label: '物体密度 ρ物', unit: 'g/cm³', min: 0.2, max: 1.3, step: 0.05, value: 0.8 },
      { key: 'rhoL', label: '液体密度 ρ液', unit: 'g/cm³', min: 0.8, max: 1.5, step: 0.05, value: 1 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => p.V * Math.max(0, 1 - Math.min(1, x / p.rhoL)),
    domain: () => [0.2, 1.5],
    truth: p => p.V * Math.max(0, 1 - Math.min(1, p.rho / p.rhoL)),
    formula: '漂浮时 F浮 = G ⇒ V浸/V = ρ物/ρ液，V露 = V(1 − ρ物/ρ液)',
    calc: p => 'V露 = ' + p.V + '×(1 − ' + p.rho + '/' + p.rhoL + ') = ' + (p.V * Math.max(0, 1 - Math.min(1, p.rho / p.rhoL))).toFixed(1) + ' cm³',
    insight: '漂浮条件是二力平衡，把 ρ液gV排 = ρ物gV 一约，剩下的只有密度比。木块做大一倍，露出体积也大一倍，但比例不变；ρ物 ≥ ρ液 时会下沉，露出体积为 0（此时浮力小于重力）。',
    boundary: '物体不吸水、不溶解、液体足够深、静止漂浮。若物体被按住或容器很浅触底，就要另算支持力；盐水密度随浓度变化。',
    next: '把物体密度拖到 1.2 g/cm³ 再猜——还能露出水面吗？',
    curveLabel: p => '横轴是物体密度 ρ物，V露 = ' + p.V + '(1 − ρ物/' + p.rhoL + ')，到 ρ物 = ρ液 时降到 0'
  },
  {
    id: 'j8b_atmosphere', stage: '初中', subject: '物理', chapter: '八下 · 第九章 · 大气压强',
    title: '大气压能托起多高的水柱',
    hook: '换成水银只要 76 cm，换成水要十米多。',
    question: '标准大气压约 1.01×10⁵ Pa 能托起多高的水柱？',
    predictLabel: '你猜水柱高度', predictUnit: 'm', predictDefault: 1, predictMin: 0, predictMax: 200,
    params: [
      { key: 'p0', label: '大气压 p₀', unit: 'kPa', min: 50, max: 110, step: 5, value: 101 },
      { key: 'rho', label: '液体密度 ρ', unit: 'g/cm³', min: 0.8, max: 13.6, step: 0.1, value: 1 },
      { key: 'g', label: '重力加速度 g', unit: 'm/s²', options: G, value: 9.8 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => p.p0 * 1000 / (x * 1000 * p.g),
    domain: () => [0.8, 13.6],
    truth: p => p.p0 * 1000 / (p.rho * 1000 * p.g),
    formula: 'p₀ = ρgh ⇒ h = p₀/(ρg)',
    calc: p => 'h = ' + p.p0 + '×1000/(' + p.rho + '×1000×' + p.g + ') = ' + (p.p0 / (p.rho * p.g)).toFixed(2) + ' m',
    insight: '托里拆利用密度 13.6 g/cm³ 的水银，把 10 m 高的水柱压缩成 76 cm 的实验台尺寸。抽水机「吸」水其实是大气压把水压上去，所以吸水扬程理论上限就是这 10.3 m。',
    boundary: '管顶真空、液体静止、忽略液体蒸气压与毛细作用。海拔越高 p₀ 越小，水柱越矮；管内进气后立刻塌下来。',
    next: '把密度换成 13.6（水银）再猜——高度会变成多少？',
    curveLabel: p => '横轴是液体密度 ρ，h = p₀/(ρg) 是双曲线；当前 ρ = ' + p.rho + ' g/cm³ → ' + (p.p0 / (p.rho * p.g)).toFixed(2) + ' m'
  },
  {
    id: 'j9_parallel_v', stage: '初中', subject: '物理', chapter: '九全 · 第十六章 · 串、并联电路中电压的规律',
    title: '再并一个用电器，原来的灯会变暗吗',
    hook: '支路越并越多，各支路两端电压一点不掉。',
    question: '220 V 电源上已并联一个 100 Ω 用电器，再并一个 50 Ω 的，100 Ω 那个两端电压是多少？',
    predictLabel: '你猜支路电压', predictUnit: 'V', predictDefault: 110, predictMin: 0, predictMax: 500,
    params: [
      { key: 'U', label: '电源电压 U', unit: 'V', min: 3, max: 220, step: 1, value: 220 },
      { key: 'R1', label: '原支路电阻 R₁', unit: 'Ω', min: 10, max: 500, step: 10, value: 100 },
      { key: 'R2', label: '新并支路电阻 R₂', unit: 'Ω', min: 10, max: 500, step: 10, value: 50 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => () => p.U,
    domain: () => [10, 500],
    truth: p => p.U,
    formula: '并联电路：U₁ = U₂ = U电源（各支路电压都相等）',
    calc: p => 'U₁ = U电源 = ' + p.U + ' V（R₂ = ' + p.R2 + ' Ω 只改变干路总电流，不改支路电压）',
    insight: '并联的本质是各支路两端接在同一对节点上，电压自然相同。再并一个用电器，原支路的电流 I₁ = U/R₁ 完全不变、亮度不变；变的是干路总电流 I = I₁ + I₂ 变大——这就是家里同时开大功率电器会跳闸的原因。',
    boundary: '假设电源是理想电压源、导线电阻忽略。实际电源有内阻，接入大功率负载时端电压会略降（正是「开空调灯暗一下」的原因）。',
    next: '把 R₂ 拖到 10 Ω 再猜——原支路电压会掉吗？',
    curveLabel: p => '横轴是新支路电阻 R₂，U₁ 恒为 ' + p.U + ' V 的水平线；拖 R₂ 只改干路电流'
  },
  {
    id: 'j9_volt_divider', stage: '初中', subject: '物理', chapter: '九全 · 第十六章 · 变阻器',
    title: '滑动变阻器滑到头，定值电阻还剩几伏',
    hook: '变阻器阻值翻倍，定值电阻的电压不是减半。',
    question: '12 V 电源、定值电阻 20 Ω 与滑动变阻器 20 Ω 串联，定值电阻两端电压是多少？',
    predictLabel: '你猜定值电阻电压', predictUnit: 'V', predictDefault: 9, predictMin: 0, predictMax: 50,
    params: [
      { key: 'U', label: '电源电压 U', unit: 'V', min: 3, max: 24, step: 1, value: 12 },
      { key: 'R', label: '定值电阻 R', unit: 'Ω', min: 5, max: 100, step: 5, value: 20 },
      { key: 'Rv', label: '变阻器接入阻值 Rv', unit: 'Ω', min: 0, max: 100, step: 5, value: 20 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => p.U * p.R / (p.R + x),
    domain: () => [0, 100],
    truth: p => p.U * p.R / (p.R + p.Rv),
    formula: '串联分压：U_R = U·R/(R + Rv)（电压按电阻比例分配）',
    calc: p => 'U_R = ' + p.U + '×' + p.R + '/(' + p.R + '+' + p.Rv + ') = ' + (p.U * p.R / (p.R + p.Rv)).toFixed(2) + ' V',
    insight: '串联电流 I = U/(R+Rv) 相同，各电阻分到的电压与阻值成正比。把 Rv 从 20 Ω 调到 40 Ω，总电阻从 40 变 60 Ω，U_R 从 6 V 掉到 4 V——不是 3 V。动态电路题要按「电阻 → 总电流 → 分压」的顺序判，不能跳步。',
    boundary: '理想电源、电阻不随温度变化、电压表内阻极大不分流。若变阻器接成分压式（电位器）而非限流式，公式完全不同。',
    next: '把 Rv 拖到 0 Ω 再猜——定值电阻会拿到全部 12 V 吗？',
    curveLabel: p => '横轴是变阻器阻值 Rv，U_R = ' + p.U + '×' + p.R + '/(' + p.R + '+Rv) 是递减双曲线；当前 ' + (p.U * p.R / (p.R + p.Rv)).toFixed(2) + ' V'
  },
  {
    id: 'j9_rated_power', stage: '初中', subject: '物理', chapter: '九全 · 第十八章 · 电功率',
    title: '220 V 100 W 的灯泡，接 110 V 还剩几瓦',
    hook: '电压减半，亮度不是减半，功率只剩四分之一。',
    question: '标着「220 V 100 W」的灯泡接到 110 V 电源上，实际功率是多少？',
    predictLabel: '你猜实际功率', predictUnit: 'W', predictDefault: 50, predictMin: 0, predictMax: 100000,
    params: [
      { key: 'Ue', label: '额定电压 U额', unit: 'V', min: 36, max: 380, step: 2, value: 220 },
      { key: 'Pe', label: '额定功率 P额', unit: 'W', min: 5, max: 500, step: 5, value: 100 },
      { key: 'U', label: '实际电压 U实', unit: 'V', min: 0, max: 380, step: 2, value: 110 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => p.Pe * (x / p.Ue) ** 2,
    domain: () => [0, 380],
    truth: p => p.Pe * (p.U / p.Ue) ** 2,
    formula: 'P实 = P额·(U实/U额)²（先由额定值求电阻 R = U额²/P额）',
    calc: p => 'R = ' + p.Ue + '²/' + p.Pe + ' = ' + (p.Ue * p.Ue / p.Pe).toFixed(1) + ' Ω，P实 = ' + p.U + '²/R = ' + (p.Pe * (p.U / p.Ue) ** 2).toFixed(2) + ' W',
    insight: '灯丝电阻近似不变时 P = U²/R，电压减半功率就剩 1/4 = 25 W。很多人按「电压一半功率一半」答 50 W，错在忘了功率与电压是平方关系。电压超过额定值同理会平方级变亮，也更容易烧断。',
    boundary: '假设灯丝电阻恒定。真实灯丝冷态电阻远小于热态，通电瞬间冲击电流很大；长时间欠压时电阻变小，实际功率会比这个公式算的略高。',
    next: '把实际电压拖到 220 V 再猜——这时才等于额定功率；再往 380 V 拖会怎样？',
    curveLabel: p => '横轴是实际电压 U实，P = ' + p.Pe + '(U/' + p.Ue + ')² 是抛物线；当前 ' + (p.Pe * (p.U / p.Ue) ** 2).toFixed(2) + ' W'
  },
  {
    id: 'j9_household', stage: '初中', subject: '物理', chapter: '九全 · 第十九章 · 家庭电路',
    title: '同时开两个大功率电器，干路电流多大',
    hook: '用电器是并联的，功率直接相加，电流也直接相加。',
    question: '220 V 家庭电路里同时开 1000 W 电热水壶和 200 W 电视，干路总电流是多少？',
    predictLabel: '你猜干路总电流', predictUnit: 'A', predictDefault: 8, predictMin: 0, predictMax: 100,
    params: [
      { key: 'P1', label: '电器 1 功率 P₁', unit: 'W', min: 0, max: 3000, step: 100, value: 1000 },
      { key: 'P2', label: '电器 2 功率 P₂', unit: 'W', min: 0, max: 3000, step: 100, value: 200 },
      { key: 'U', label: '家庭电路电压 U', unit: 'V', options: [
        { label: '中国 220 V', value: 220 },
        { label: '日本 100 V', value: 100 },
        { label: '美国 120 V', value: 120 }
      ], value: 220 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => (p.P1 + p.P2) / x,
    domain: () => [100, 240],
    truth: p => (p.P1 + p.P2) / p.U,
    formula: 'I总 = P总/U = (P₁+P₂)/U（并联用电器功率相加）',
    calc: p => 'P总 = ' + p.P1 + '+' + p.P2 + ' = ' + (p.P1 + p.P2) + ' W，I总 = ' + (p.P1 + p.P2) + '/' + p.U + ' = ' + ((p.P1 + p.P2) / p.U).toFixed(2) + ' A',
    insight: '家庭电路所有用电器并联在 220 V 上，各支路独立工作，总功率就是各功率之和。干路电流 I = P总/U 超过空气开关额定电流（常见 16 A / 25 A）就会跳闸；保险丝必须串联在干路上，且不能用铜丝代替。',
    boundary: '假设电压恒为额定值、用电器都是纯电阻且工作在额定状态。空调、冰箱等带电动机的电器启动瞬间电流可达运行电流的数倍。',
    next: '把电压换成 100 V 再猜——同样的电器电流会变成几倍？',
    curveLabel: p => '横轴是供电电压 U，I总 = ' + (p.P1 + p.P2) + '/U；当前 ' + ((p.P1 + p.P2) / p.U).toFixed(2) + ' A'
  },
  {
    id: 'j9_heat_balance', stage: '初中', subject: '物理', chapter: '九全 · 第十三章 · 比热容',
    title: '冷热水兑一起，最后是几度',
    hook: '不是把两个温度一加除以二——要看谁「更能装热」。',
    question: '1 kg、20 ℃ 的水和 2 kg、80 ℃ 的水混合，不计热损失，末温是多少？',
    predictLabel: '你猜混合末温', predictUnit: '℃', predictDefault: 40, predictMin: 0, predictMax: 200,
    params: [
      { key: 'm1', label: '冷水质量 m₁', unit: 'kg', min: 0.2, max: 5, step: 0.1, value: 1 },
      { key: 't1', label: '冷水温度 t₁', unit: '℃', min: 0, max: 60, step: 1, value: 20 },
      { key: 'm2', label: '热水质量 m₂', unit: 'kg', min: 0.2, max: 5, step: 0.1, value: 2 },
      { key: 't2', label: '热水温度 t₂', unit: '℃', min: 40, max: 100, step: 1, value: 80 }
    ],
    renderer: 'function', duration: 3.0,
    curve: p => x => (p.m1 * p.t1 + x * p.t2) / (p.m1 + x),
    domain: () => [0.2, 5],
    truth: p => (p.m1 * p.t1 + p.m2 * p.t2) / (p.m1 + p.m2),
    formula: 'Q放 = Q吸 ⇒ t = (m₁t₁ + m₂t₂)/(m₁ + m₂)（同种液体，c 约掉）',
    calc: p => 't = (' + p.m1 + '×' + p.t1 + ' + ' + p.m2 + '×' + p.t2 + ')/(' + p.m1 + '+' + p.m2 + ') = ' + ((p.m1 * p.t1 + p.m2 * p.t2) / (p.m1 + p.m2)).toFixed(1) + ' ℃',
    insight: '热平衡是「高温物体放出的热量 = 低温物体吸收的热量」，同种液体比热容 c 被约掉，剩下的是按质量加权的平均，不是算术平均。这里热水质量是冷水的 2 倍，末温被拉到 60 ℃ 而不是 50 ℃。',
    boundary: '不计容器吸热与向环境散热、无物态变化、两液体比热容相同。若掺入金属块或冰，c 不同或存在熔化潜热，方程要重写。',
    next: '把冷水质量调到 2 kg 再猜——末温会正好落在 50 ℃ 吗？',
    curveLabel: p => '横轴是热水质量 m₂，t = (' + p.m1 + '×' + p.t1 + ' + m₂×' + p.t2 + ')/(' + p.m1 + '+m₂)；当前 ' + ((p.m1 * p.t1 + p.m2 * p.t2) / (p.m1 + p.m2)).toFixed(1) + ' ℃'
  },
  {
    id: 'j9_voltmeter', stage: '初中', subject: '物理', chapter: '九全 · 第十七章 · 电阻的测量',
    title: '电压表也会「偷」电流，测出的电阻偏多少',
    hook: '电表不是理想的，接法不同系统误差方向相反。',
    question: '待测电阻 100 Ω、电压表内阻 3 kΩ，用电流表外接法测得的阻值是多少？',
    predictLabel: '你猜测得阻值', predictUnit: 'Ω', predictDefault: 80, predictMin: 0, predictMax: 500,
    params: [
      { key: 'R', label: '待测电阻真实值 R', unit: 'Ω', min: 5, max: 500, step: 5, value: 100 },
      { key: 'Rv', label: '电压表内阻 Rv', unit: 'kΩ', min: 0.5, max: 20, step: 0.5, value: 3 },
      { key: 'U', label: '电压表读数 U', unit: 'V', min: 1, max: 12, step: 0.5, value: 3 }
    ],
    renderer: 'function', duration: 3.0,
    curve: p => x => p.R * x * 1000 / (p.R + x * 1000),
    domain: () => [0.5, 20],
    truth: p => p.R * p.Rv * 1000 / (p.R + p.Rv * 1000),
    formula: '外接法：R测 = U/I = R∥Rv = R·Rv/(R+Rv) < R',
    calc: p => 'R测 = ' + p.R + '∥' + p.Rv + ' kΩ = ' + (p.R * p.Rv * 1000 / (p.R + p.Rv * 1000)).toFixed(2) + ' Ω（偏小 ' + (100 * (1 - p.Rv * 1000 / (p.R + p.Rv * 1000))).toFixed(1) + '%）',
    insight: '外接时电压表与待测电阻并联，电流表读到的是两路电流之和，比流过 R 的真实电流大，于是 R测 = U/I 偏小，本质是测到了 R 与电压表内阻的并联值。R 远小于 Rv 时误差可忽略；测大电阻要改用电流表内接法（此时偏大）。',
    boundary: '忽略电流表内阻、电源内阻与读数误差；电压表内阻按常数处理。数字电压表内阻通常 10 MΩ，误差比指针表小得多。',
    next: '把待测电阻调到 500 Ω 再猜——测量值会偏得更明显吗？',
    curveLabel: p => '横轴是电压表内阻 Rv（kΩ），R测 = R∥Rv 随 Rv 增大逼近真实值 ' + p.R + ' Ω'
  },

  // ══════════════ 2026-11-17 · 批次 D：高考选择性必修（14 条）══════════════
  // 热学 / 交变电流 / 光学 / 原子物理 / 场与动量，用户未提供选择性必修教材，
  // chapter 标「高考专题 ·」按考纲补，不计入 textbook:scan 的教材落地数。
  {
    id: 'gk_gas_boyle', stage: '高中', subject: '物理', chapter: '高考专题 · 气体实验定律',
    title: '把气体压到一半体积，压强会翻几倍',
    hook: '堵住注射器口往里推，压强不是慢慢涨，是照着 1/V 涨。',
    question: '100 kPa、2 L 的气体等温压缩到 1 L，压强是多少 kPa？',
    predictLabel: '你猜压缩后压强', predictUnit: 'kPa', predictDefault: 150, predictMin: 0, predictMax: 2000,
    params: [
      { key: 'p1', label: '初始压强 p₁', unit: 'kPa', min: 50, max: 300, step: 10, value: 100 },
      { key: 'V1', label: '初始体积 V₁', unit: 'L', min: 0.5, max: 5, step: 0.1, value: 2 },
      { key: 'V2', label: '压缩后体积 V₂', unit: 'L', min: 0.2, max: 5, step: 0.1, value: 1 },
      { key: 't', label: '环境温度 t', unit: '℃', min: 0, max: 100, step: 5, value: 20 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => p.p1 * p.V1 / x,
    domain: () => [0.2, 5],
    truth: p => p.p1 * p.V1 / p.V2,
    formula: '玻意耳定律：p₁V₁ = p₂V₂（等温、一定质量）',
    calc: p => 'p₂ = ' + p.p1 + ' × ' + p.V1.toFixed(1) + ' / ' + p.V2.toFixed(1) + ' = ' + (p.p1 * p.V1 / p.V2).toFixed(1) + ' kPa（温度 ' + p.t + ' ℃ 只要不变就不进公式）',
    insight: '分子数不变、平均动能不变；体积减半意味着单位时间撞到单位面积上的分子数加倍，压强就加倍。p–V 图是双曲线，不是直线。',
    boundary: '要求温度恒定、气体质量不变、可视为理想气体。快速压缩会升温（绝热过程 pV^γ = C），高压下分子自身体积不可忽略，都会偏离。',
    next: '把 V₂ 拖到 0.5 L 再猜——压强会正好变成 4 倍吗？',
    curveLabel: p => '横轴是压缩后体积 V₂，p₂ = ' + p.p1 + '×' + p.V1.toFixed(1) + '/V₂；当前 ' + (p.p1 * p.V1 / p.V2).toFixed(1) + ' kPa'
  },
  {
    id: 'gk_gas_charles', stage: '高中', subject: '物理', chapter: '高考专题 · 气体实验定律',
    title: '从 20 ℃ 加热到 60 ℃，压强会变成 3 倍吗',
    hook: '摄氏度翻三倍，压强只涨一成多——因为公式里根本不用摄氏度。',
    question: '密闭容器里 100 kPa、20 ℃ 的气体加热到 60 ℃，压强是多少 kPa？',
    predictLabel: '你猜加热后压强', predictUnit: 'kPa', predictDefault: 300, predictMin: 0, predictMax: 1000,
    params: [
      { key: 'p1', label: '初始压强 p₁', unit: 'kPa', min: 50, max: 300, step: 10, value: 100 },
      { key: 't1', label: '初始温度 t₁', unit: '℃', min: 0, max: 100, step: 5, value: 20 },
      { key: 't2', label: '加热后温度 t₂', unit: '℃', min: 20, max: 200, step: 5, value: 60 },
      { key: 'V', label: '容器体积 V', unit: 'L', min: 0.5, max: 5, step: 0.1, value: 2 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => p.p1 * (x + 273.15) / (p.t1 + 273.15),
    domain: () => [0, 200],
    truth: p => p.p1 * (p.t2 + 273.15) / (p.t1 + 273.15),
    formula: '查理定律：p/T = C，T = t + 273.15（必须用开尔文）',
    calc: p => 'p₂ = ' + p.p1 + ' × (' + p.t2 + '+273.15)/(' + p.t1 + '+273.15) = ' + (p.p1 * (p.t2 + 273.15) / (p.t1 + 273.15)).toFixed(1) + ' kPa（体积 ' + p.V.toFixed(1) + ' L 固定，不进公式）',
    insight: '温度衡量的是分子平均动能，零点在 −273.15 ℃，所以 20→60 ℃ 只是 293→333 K，涨了 13.6% 而不是 200%。这是高考最经典的单位陷阱之一。',
    boundary: '体积不变、气体质量不变、理想气体。容器受热膨胀、气体接近液化、温度极高时分子解离，都会让 p/T 不再恒定。',
    next: '把 t₂ 拖到 200 ℃ 再猜——压强会到 200 kPa 吗？',
    curveLabel: p => '横轴是 t₂（℃），p₂ = p₁(t₂+273.15)/(' + p.t1 + '+273.15)；当前 ' + (p.p1 * (p.t2 + 273.15) / (p.t1 + 273.15)).toFixed(1) + ' kPa'
  },
  {
    id: 'gk_gas_state', stage: '高中', subject: '物理', chapter: '高考专题 · 理想气体状态方程',
    title: '又升温又压缩，压强到底听谁的',
    hook: '两个因素同时变，别急着相乘——先把温度换成开尔文。',
    question: '100 kPa、2 L、20 ℃ 的气体变成 1 L、60 ℃，压强是多少 kPa？',
    predictLabel: '你猜末态压强', predictUnit: 'kPa', predictDefault: 250, predictMin: 0, predictMax: 3000,
    params: [
      { key: 'p1', label: '初始压强 p₁', unit: 'kPa', min: 50, max: 300, step: 10, value: 100 },
      { key: 'V1', label: '初始体积 V₁', unit: 'L', min: 0.5, max: 5, step: 0.1, value: 2 },
      { key: 'V2', label: '末态体积 V₂', unit: 'L', min: 0.2, max: 5, step: 0.1, value: 1 },
      { key: 't1', label: '初始温度 t₁', unit: '℃', min: 0, max: 100, step: 5, value: 20 },
      { key: 't2', label: '末态温度 t₂', unit: '℃', min: 0, max: 200, step: 5, value: 60 }
    ],
    renderer: 'function', duration: 3.0,
    curve: p => x => p.p1 * p.V1 * (x + 273.15) / ((p.t1 + 273.15) * p.V2),
    domain: () => [0, 200],
    truth: p => p.p1 * p.V1 * (p.t2 + 273.15) / ((p.t1 + 273.15) * p.V2),
    formula: 'p₁V₁/T₁ = p₂V₂/T₂ → p₂ = p₁V₁T₂/(T₁V₂)',
    calc: p => 'p₂ = ' + p.p1 + '×' + p.V1.toFixed(1) + '×' + (p.t2 + 273.15).toFixed(2) + '/(' + (p.t1 + 273.15).toFixed(2) + '×' + p.V2.toFixed(1) + ') = ' + (p.p1 * p.V1 * (p.t2 + 273.15) / ((p.t1 + 273.15) * p.V2)).toFixed(1) + ' kPa',
    insight: '体积减半贡献 2 倍，升温贡献 1.136 倍，合起来约 2.27 倍而不是 6 倍。把三个状态量放进一个不变量 pV/T，就不会漏项。',
    boundary: '一定质量理想气体、平衡态之间的比较。真实气体在高压低温需用范德瓦耳斯方程；过程中漏气、相变都会让这个不变量失效。',
    next: '把 V₂ 拖回 2 L 再猜——是不是只剩温度那 1.136 倍？',
    curveLabel: p => '横轴是末态温度 t₂，p₂ = p₁V₁(t₂+273.15)/[(' + p.t1 + '+273.15)V₂]；当前 ' + (p.p1 * p.V1 * (p.t2 + 273.15) / ((p.t1 + 273.15) * p.V2)).toFixed(1) + ' kPa'
  },
  {
    id: 'gk_thermo_first', stage: '高中', subject: '物理', chapter: '高考专题 · 热力学第一定律',
    title: '一边压缩一边加热，内能涨了多少',
    hook: '做功和传热是两条路，但它们对内能的效果可以直接相加。',
    question: '气体吸热 200 J，同时外界对它做功 150 J，内能增加多少 J？',
    predictLabel: '你猜内能增量', predictUnit: 'J', predictDefault: 100, predictMin: 0, predictMax: 2000,
    params: [
      { key: 'Q', label: '气体吸收的热量 Q', unit: 'J', min: 0, max: 500, step: 10, value: 200 },
      { key: 'W', label: '外界对气体做功 W', unit: 'J', min: 0, max: 500, step: 10, value: 150 },
      { key: 'm', label: '气体质量 m', unit: 'g', min: 1, max: 50, step: 1, value: 10 }
    ],
    renderer: 'function', duration: 2.6,
    curve: p => x => p.Q + x,
    domain: () => [0, 500],
    truth: p => p.Q + p.W,
    formula: '热力学第一定律：ΔU = Q + W（W 为外界对气体做的功）',
    calc: p => 'ΔU = ' + p.Q + ' + ' + p.W + ' = ' + (p.Q + p.W) + ' J（气体质量 ' + p.m + ' g 不进入能量收支式）',
    insight: '改变内能只有两条途径：传热与做功，两者在效果上等价，所以直接相加。符号约定是易错点：气体对外做功时 W 取负，放热时 Q 取负。',
    boundary: '只统计内能，不含气体整体的动能与重力势能；理想气体的内能只由温度决定，但真实气体还与体积有关。宏观过程还受第二定律的方向限制。',
    next: '把 W 拖到 0 再猜——内能增量是不是就等于吸收的热量？',
    curveLabel: p => '横轴是外界做功 W，ΔU = Q + W 是斜率为 1 的直线；当前 ΔU = ' + (p.Q + p.W) + ' J'
  },
  {
    id: 'gk_ac_rms', stage: '高中', subject: '物理', chapter: '高考专题 · 交变电流',
    title: '峰值 311 V 的交流电，为什么标成 220 V',
    hook: '铭牌上的电压不是最大值，也不是平均值——平均值其实是 0。',
    question: '正弦交流电峰值 311 V，它的有效值是多少 V？',
    predictLabel: '你猜有效值', predictUnit: 'V', predictDefault: 155, predictMin: 0, predictMax: 1000,
    params: [
      { key: 'Um', label: '电压峰值 Um', unit: 'V', min: 10, max: 400, step: 10, value: 311 },
      { key: 'f', label: '频率 f', unit: 'Hz', min: 10, max: 100, step: 5, value: 50 },
      { key: 'R', label: '负载电阻 R', unit: 'Ω', min: 10, max: 500, step: 10, value: 100 }
    ],
    renderer: 'function', duration: 2.6,
    curve: p => x => x / Math.sqrt(2),
    domain: () => [0, 400],
    truth: p => p.Um / Math.sqrt(2),
    formula: '正弦式交变电流：U有效 = Um/√2 ≈ 0.707·Um',
    calc: p => 'U = ' + p.Um + '/√2 = ' + (p.Um / Math.sqrt(2)).toFixed(1) + ' V（频率 ' + p.f + ' Hz、负载 ' + p.R + ' Ω 都不改变这个换算）',
    insight: '有效值按「相同时间、相同电阻、产生相同热量」定义：对 u² 取平均再开方，所以是均方根而不是算术平均。正弦波一个周期的算术平均恰好为 0。',
    boundary: '只对正弦波成立；方波 U有效 = Um，三角波 = Um/√3。非纯电阻负载还要考虑功率因数；电表读数一般已是有效值。',
    next: '把 Um 拖到 400 V 再猜——有效值会超过 280 V 吗？',
    curveLabel: p => '横轴是峰值 Um，U有效 = Um/√2 是过原点的直线；当前 ' + (p.Um / Math.sqrt(2)).toFixed(1) + ' V'
  },
  {
    id: 'gk_transformer', stage: '高中', subject: '物理', chapter: '高考专题 · 变压器',
    title: '1000 匝变 200 匝，220 V 会变成多少',
    hook: '变压器能改电压，却改不了频率，也改不了功率。',
    question: '原线圈 1000 匝接 220 V，副线圈 200 匝，输出电压是多少 V？',
    predictLabel: '你猜副线圈电压', predictUnit: 'V', predictDefault: 110, predictMin: 0, predictMax: 1000,
    params: [
      { key: 'U1', label: '原线圈电压 U₁', unit: 'V', min: 10, max: 500, step: 10, value: 220 },
      { key: 'n1', label: '原线圈匝数 n₁', unit: '匝', min: 100, max: 2000, step: 100, value: 1000 },
      { key: 'n2', label: '副线圈匝数 n₂', unit: '匝', min: 50, max: 2000, step: 50, value: 200 },
      { key: 'P', label: '负载功率 P', unit: 'W', min: 10, max: 500, step: 10, value: 100 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => p.U1 * x / p.n1,
    domain: () => [50, 2000],
    truth: p => p.U1 * p.n2 / p.n1,
    formula: '理想变压器：U₂/U₁ = n₂/n₁，I₁/I₂ = n₂/n₁，P₁ = P₂',
    calc: p => 'U₂ = ' + p.U1 + ' × ' + p.n2 + '/' + p.n1 + ' = ' + (p.U1 * p.n2 / p.n1).toFixed(1) + ' V（负载 ' + p.P + ' W 改变电流，不改变电压比）',
    insight: '每匝线圈感受到相同的磁通变化率，所以电压与匝数成正比。升压必然降流，功率守恒；频率由原边电源决定，变压器不改变它。',
    boundary: '理想变压器：无漏磁、无铜损铁损、铁芯未饱和。实际有空载电流与效率损失；直流电不产生交变磁通，不能变压；负载过重会压降。',
    next: '把 n₂ 拖到 2000 匝再猜——电压会翻倍吗？此时电流呢？',
    curveLabel: p => '横轴是副线圈匝数 n₂，U₂ = ' + p.U1 + '·n₂/' + p.n1 + '；当前 ' + (p.U1 * p.n2 / p.n1).toFixed(1) + ' V'
  },
  {
    id: 'gk_half_life', stage: '高中', subject: '物理', chapter: '高考专题 · 原子核与半衰期',
    title: '过了三个半衰期，还剩多少没衰变',
    hook: '不是「每期少一半再少一半」的直觉减法，是指数衰减。',
    question: '100 个放射性原子核，半衰期 5 天，15 天后还剩多少个未衰变？',
    predictLabel: '你猜剩余核数', predictUnit: '个', predictDefault: 50, predictMin: 0, predictMax: 1000,
    params: [
      { key: 'N0', label: '初始核数 N₀', unit: '个', min: 10, max: 1000, step: 10, value: 100 },
      { key: 'T', label: '半衰期 T', unit: '天', min: 1, max: 20, step: 1, value: 5 },
      { key: 't', label: '经过时间 t', unit: '天', min: 0, max: 60, step: 1, value: 15 },
      { key: 'temp', label: '环境温度', unit: '℃', min: -50, max: 500, step: 10, value: 20 }
    ],
    renderer: 'function', duration: 3.0,
    curve: p => x => p.N0 * Math.pow(0.5, x / p.T),
    domain: () => [0, 60],
    truth: p => p.N0 * Math.pow(0.5, p.t / p.T),
    formula: 'N = N₀·(1/2)^(t/T半) = N₀·e^(−λt)',
    calc: p => 'N = ' + p.N0 + ' × (1/2)^(' + p.t + '/' + p.T + ') = ' + (p.N0 * Math.pow(0.5, p.t / p.T)).toFixed(2) + ' 个（温度 ' + p.temp + ' ℃ 不影响半衰期）',
    insight: '每个核的衰变是独立随机的，没有「活久了更容易衰变」的记忆；整体按固定比例递减，于是指数曲线。三个半衰期剩 1/8 而不是 1/3。',
    boundary: '这是大量原子核的统计规律，样本很少时涨落明显；半衰期由核内部结构决定，几乎不受温度、压强、化学状态影响。衰变产物也可能有放射性。',
    next: '把 t 拖到 30 天再猜——是 6.25 个还是 0 个？',
    curveLabel: p => '横轴是时间 t（天），N = ' + p.N0 + '·(1/2)^(t/' + p.T + ') 指数衰减；当前 ' + (p.N0 * Math.pow(0.5, p.t / p.T)).toFixed(2) + ' 个'
  },
  {
    id: 'gk_total_reflection', stage: '高中', subject: '物理', chapter: '高考专题 · 光的折射与全反射',
    title: '玻璃里的光，多大角度就出不去了',
    hook: '入射角越大越出不去，临界角只由折射率决定。',
    question: '光从折射率 1.5 的玻璃射向空气，全反射临界角是多少度？',
    predictLabel: '你猜临界角', predictUnit: '°', predictDefault: 60, predictMin: 0, predictMax: 90,
    params: [
      { key: 'n', label: '玻璃折射率 n', unit: '', min: 1.1, max: 2.5, step: 0.05, value: 1.5 },
      { key: 'i', label: '当前入射角 i', unit: '°', min: 0, max: 89, step: 1, value: 30 },
      { key: 'lam', label: '光的波长 λ', unit: 'nm', min: 380, max: 760, step: 10, value: 590 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => deg(Math.asin(1 / x)),
    domain: () => [1.1, 2.5],
    truth: p => deg(Math.asin(1 / p.n)),
    formula: 'sin C = 1/n（光从光密介质射向光疏介质）',
    calc: p => 'C = arcsin(1/' + p.n.toFixed(2) + ') = ' + deg(Math.asin(1 / p.n)).toFixed(1) + '°（当前入射角 ' + p.i + '° ' + (p.i >= deg(Math.asin(1 / p.n)) ? '≥' : '<') + ' C；波长 ' + p.lam + ' nm 在无色散模型里不参与）',
    insight: '折射角先到 90°，再增大入射角就没有折射光了。n 越大，临界角越小，光越容易被「关」在介质里——光纤通信正是靠这个。',
    boundary: '必须从光密射向光疏，反过来永远不会全反射；n 是相对外侧介质的比值。实际材料有色散，不同颜色临界角略有差别；入射角接近 90° 时几何光学近似误差变大。',
    next: '把 n 拖到 2.5 再猜——临界角会小于 25° 吗？',
    curveLabel: p => '横轴是折射率 n，C = arcsin(1/n) 单调下降；当前 n = ' + p.n.toFixed(2) + ' → C = ' + deg(Math.asin(1 / p.n)).toFixed(1) + '°'
  },
  {
    id: 'gk_double_slit', stage: '高中', subject: '物理', chapter: '高考专题 · 光的干涉',
    title: '双缝靠得更近，条纹会更密还是更疏',
    hook: '缝越窄，条纹反而越宽——这是光的波动性最直观的一处反直觉。',
    question: 'L = 2 m、缝距 0.2 mm、波长 600 nm，相邻亮纹间距是多少 mm？',
    predictLabel: '你猜条纹间距', predictUnit: 'mm', predictDefault: 2, predictMin: 0, predictMax: 100,
    params: [
      { key: 'L', label: '缝到屏距离 L', unit: 'm', min: 0.5, max: 5, step: 0.1, value: 2 },
      { key: 'd', label: '双缝间距 d', unit: 'mm', min: 0.05, max: 1, step: 0.05, value: 0.2 },
      { key: 'lam', label: '光的波长 λ', unit: 'nm', min: 380, max: 760, step: 10, value: 600 },
      { key: 'I0', label: '光源强度 I₀', unit: '', min: 1, max: 10, step: 1, value: 5 }
    ],
    renderer: 'function', duration: 3.0,
    curve: p => x => p.L * x * 1e-9 / (p.d * 1e-3) * 1000,
    domain: () => [380, 760],
    truth: p => p.L * p.lam * 1e-9 / (p.d * 1e-3) * 1000,
    formula: '双缝干涉：Δx = Lλ/d',
    calc: p => 'Δx = ' + p.L.toFixed(1) + ' × ' + p.lam + '×10⁻⁹ / (' + p.d.toFixed(2) + '×10⁻³) = ' + (p.L * p.lam * 1e-9 / (p.d * 1e-3) * 1000).toFixed(2) + ' mm（光源强度 ' + p.I0 + ' 只改变亮度，不改变间距）',
    insight: '亮纹位置来自两束光的光程差等于整数倍波长。缝距 d 越小，同样的光程差需要更大的偏角，条纹被「拉开」；波长越长、屏越远也一样变宽。',
    boundary: '远场近似 L ≫ d 且小角度；要求单色相干光、两缝等宽。实际每条缝自身有衍射包络，会调制亮纹亮度；白光会产生彩色条纹并很快重叠。',
    next: '把 d 拖到 0.05 mm 再猜——条纹间距会变成 4 倍吗？',
    curveLabel: p => '横轴是波长 λ（nm），Δx = Lλ/d 是直线；当前 ' + (p.L * p.lam * 1e-9 / (p.d * 1e-3) * 1000).toFixed(2) + ' mm'
  },
  {
    id: 'gk_momentum_theorem', stage: '高中', subject: '物理', chapter: '高考专题 · 动量定理',
    title: '为什么要安全气囊，缓冲 0.1 秒够吗',
    hook: '同样的速度变化，停得越慢，平均冲力越小。',
    question: '60 kg 的人以 10 m/s 撞停，若缓冲时间 0.1 s，平均冲力是多少 N？',
    predictLabel: '你猜平均冲力', predictUnit: 'N', predictDefault: 600, predictMin: 0, predictMax: 200000,
    params: [
      { key: 'm', label: '质量 m', unit: 'kg', min: 1, max: 100, step: 1, value: 60 },
      { key: 'v', label: '初速度 v', unit: 'm/s', min: 1, max: 30, step: 1, value: 10 },
      { key: 'dt', label: '缓冲时间 Δt', unit: 's', min: 0.01, max: 2, step: 0.01, value: 0.1 },
      { key: 'h', label: '身高 h', unit: 'cm', min: 100, max: 200, step: 5, value: 170 }
    ],
    renderer: 'function', duration: 3.0,
    curve: p => x => p.m * p.v / x,
    domain: () => [0.01, 2],
    truth: p => p.m * p.v / p.dt,
    formula: '动量定理：F̄·Δt = Δp = mv → F̄ = mv/Δt',
    calc: p => 'F̄ = ' + p.m + ' × ' + p.v + ' / ' + p.dt.toFixed(2) + ' = ' + (p.m * p.v / p.dt).toFixed(0) + ' N（身高 ' + p.h + ' cm 不进入动量收支）',
    insight: '动量变化量 mv 是固定的，能调的只有作用时间。把 0.01 s 拉长到 0.1 s，平均力就降到十分之一——安全气囊、缓冲垫、落地屈膝都是这个道理。',
    boundary: '算出的是时间平均力；真实碰撞力随时间剧烈变化，峰值远高于平均值。假设匀减速到静止、无反弹、忽略重力在极短时间的冲量。',
    next: '把 Δt 拖到 0.01 s 再猜——平均力会到 60000 N 吗？',
    curveLabel: p => '横轴是缓冲时间 Δt，F̄ = ' + (p.m * p.v).toFixed(0) + '/Δt 是双曲线；当前 ' + (p.m * p.v / p.dt).toFixed(0) + ' N'
  },
  {
    id: 'gk_elastic_collision', stage: '高中', subject: '物理', chapter: '高考专题 · 弹性碰撞',
    title: '等质量两球正碰，撞完前一个球会怎样',
    hook: '不是「一起往前」，而是速度整个交出去，自己停下。',
    question: '2 kg 的球以 6 m/s 正碰静止的 1 kg 球，完全弹性碰撞后 2 kg 球的速度是多少？',
    predictLabel: '你猜碰后 v₁′', predictUnit: 'm/s', predictDefault: 4, predictMin: -20, predictMax: 20,
    params: [
      { key: 'm1', label: '入射球质量 m₁', unit: 'kg', min: 0.5, max: 10, step: 0.5, value: 2 },
      { key: 'm2', label: '被碰球质量 m₂', unit: 'kg', min: 0.5, max: 10, step: 0.5, value: 1 },
      { key: 'v1', label: '入射速度 v₁', unit: 'm/s', min: 1, max: 20, step: 1, value: 6 },
      { key: 'e', label: '恢复系数 e', unit: '', min: 0.5, max: 1, step: 0.05, value: 1 }
    ],
    renderer: 'function', duration: 3.0,
    curve: p => x => (p.m1 - x) / (p.m1 + x) * p.v1,
    domain: () => [0.5, 10],
    truth: p => (p.m1 - p.m2) / (p.m1 + p.m2) * p.v1,
    formula: '一维完全弹性正碰：v₁′ = (m₁−m₂)v₁/(m₁+m₂)',
    calc: p => 'v₁′ = (' + p.m1.toFixed(1) + '−' + p.m2.toFixed(1) + ')/(' + p.m1.toFixed(1) + '+' + p.m2.toFixed(1) + ') × ' + p.v1 + ' = ' + ((p.m1 - p.m2) / (p.m1 + p.m2) * p.v1).toFixed(2) + ' m/s（完全弹性时 e = 1）',
    insight: '同时满足动量守恒与动能守恒，才有这个结果。m₁ = m₂ 时 v₁′ = 0，速度完全交换——牛顿摆里停下的那颗球就是它。m₂ 远大于 m₁ 时 v₁′ 变负，球被弹回去。',
    boundary: '一维正碰、完全弹性（无动能损失）、无外力冲量。实际碰撞恢复系数 e < 1，公式要改成 v₁′ = (m₁−e·m₂)v₁/(m₁+m₂)；斜碰需分解到连心线方向。',
    next: '把 m₂ 拖到 2 kg 再猜——v₁′ 会正好变成 0 吗？',
    curveLabel: p => '横轴是被碰球质量 m₂，v₁′ = (' + p.m1.toFixed(1) + '−m₂)/(' + p.m1.toFixed(1) + '+m₂)·' + p.v1 + '；当前 ' + ((p.m1 - p.m2) / (p.m1 + p.m2) * p.v1).toFixed(2) + ' m/s'
  },
  {
    id: 'gk_ampere_angle', stage: '高中', subject: '物理', chapter: '高考专题 · 安培力',
    title: '导线斜着放进磁场，力会打几折',
    hook: '不是「放进去就受力」，只有垂直于磁场的那部分电流才出力。',
    question: 'B = 0.5 T、I = 2 A、导线长 0.5 m，与磁场成 30° 时安培力多大？',
    predictLabel: '你猜安培力', predictUnit: 'N', predictDefault: 0.5, predictMin: 0, predictMax: 20,
    params: [
      { key: 'B', label: '磁感应强度 B', unit: 'T', min: 0.1, max: 2, step: 0.1, value: 0.5 },
      { key: 'I', label: '电流 I', unit: 'A', min: 0.5, max: 10, step: 0.5, value: 2 },
      { key: 'L', label: '导线长度 L', unit: 'm', min: 0.1, max: 2, step: 0.1, value: 0.5 },
      { key: 'ang', label: '电流与 B 夹角 θ', unit: '°', min: 0, max: 90, step: 5, value: 30 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => p.B * p.I * p.L * Math.sin(rad(x)),
    domain: () => [0, 90],
    truth: p => p.B * p.I * p.L * Math.sin(rad(p.ang)),
    formula: 'F = BIL·sinθ（θ 为电流方向与 B 的夹角）',
    calc: p => 'F = ' + p.B.toFixed(1) + ' × ' + p.I.toFixed(1) + ' × ' + p.L.toFixed(1) + ' × sin' + p.ang + '° = ' + (p.B * p.I * p.L * Math.sin(rad(p.ang))).toFixed(3) + ' N',
    insight: '可以把磁场分解成平行与垂直于电流的两分量，平行的那部分不产生力。θ = 0（电流与 B 平行）时 F = 0，θ = 90° 时最大。方向另用左手定则判断。',
    boundary: '匀强磁场、直导线、电流恒定；导线弯曲或磁场不均匀时要沿长度积分。忽略导线自身磁场与边缘效应；θ 用电流方向而非导线摆放的视觉角度。',
    next: '把 θ 拖到 0° 再猜——公式会给出 0 吗？这时导线真的完全不受力吗？',
    curveLabel: p => '横轴是夹角 θ，F = ' + (p.B * p.I * p.L).toFixed(2) + '·sinθ；当前 ' + (p.B * p.I * p.L * Math.sin(rad(p.ang))).toFixed(3) + ' N'
  },
  {
    id: 'gk_velocity_selector', stage: '高中', subject: '物理', chapter: '高考专题 · 带电粒子在复合场中',
    title: '电场磁场正交，哪种速度的粒子能直着过去',
    hook: '筛选速度居然和电荷量、正负号都无关。',
    question: 'E = 3000 V/m、B = 0.05 T 正交，粒子不偏转直线通过的速度是多少 m/s？',
    predictLabel: '你猜通过速度', predictUnit: 'm/s', predictDefault: 30000, predictMin: 0, predictMax: 5000000,
    params: [
      { key: 'E', label: '电场强度 E', unit: 'V/m', min: 500, max: 10000, step: 500, value: 3000 },
      { key: 'B', label: '磁感应强度 B', unit: 'T', min: 0.01, max: 0.2, step: 0.01, value: 0.05 },
      { key: 'q', label: '粒子电荷量 q', unit: 'e', min: 1, max: 10, step: 1, value: 1 },
      { key: 'm', label: '粒子质量 m', unit: '×10⁻²⁷ kg', min: 1, max: 40, step: 1, value: 9 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => p.E / x,
    domain: () => [0.01, 0.2],
    truth: p => p.E / p.B,
    formula: '速度选择器：qE = qvB → v = E/B',
    calc: p => 'v = ' + p.E + '/' + p.B.toFixed(2) + ' = ' + (p.E / p.B).toFixed(0) + ' m/s（电荷量 ' + p.q + 'e、质量 ' + p.m + '×10⁻²⁷ kg 都被约掉）',
    insight: '电场力 qE 与洛伦兹力 qvB 方向相反，相等时合力为零。q 和 m 同时出现在两边被消掉，所以正负粒子、不同质量只要速度相同都能直着过——这正是质谱仪挑速度的原理。',
    boundary: '要求 E 与 B 严格正交、粒子速度沿指定方向、匀强场，且忽略重力。速度接近光速需相对论修正；场的边缘效应会让实际通过速度有一个窄带。',
    next: '把 B 拖到 0.01 T 再猜——能通过的速度会变成 5 倍吗？',
    curveLabel: p => '横轴是磁感应强度 B，v = ' + p.E + '/B 是双曲线；当前 ' + (p.E / p.B).toFixed(0) + ' m/s'
  },
  {
    id: 'gk_energy_level', stage: '高中', subject: '物理', chapter: '高考专题 · 能级跃迁与光谱',
    title: '能级差 2 eV，放出来的光是什么颜色',
    hook: '能量差越大，波长反而越短——线状光谱就是能级分立的指纹。',
    question: '原子两能级相差 2.0 eV，跃迁辐射的光子波长是多少 nm？',
    predictLabel: '你猜光子波长', predictUnit: 'nm', predictDefault: 300, predictMin: 0, predictMax: 3000,
    params: [
      { key: 'dE', label: '能级差 ΔE', unit: 'eV', min: 0.5, max: 10, step: 0.1, value: 2 },
      { key: 'n', label: '上能级序号 n', unit: '', min: 2, max: 8, step: 1, value: 3 },
      { key: 'Z', label: '原子序数 Z', unit: '', min: 1, max: 30, step: 1, value: 1 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => 1240 / x,
    domain: () => [0.5, 10],
    truth: p => 1240 / p.dE,
    formula: 'ΔE = hν = hc/λ → λ(nm) = 1240/ΔE(eV)',
    calc: p => 'λ = 1240/' + p.dE.toFixed(1) + ' = ' + (1240 / p.dE).toFixed(0) + ' nm（能级序号 ' + p.n + '、原子序数 ' + p.Z + ' 已体现在 ΔE 里，不再单独出现）',
    insight: 'hc ≈ 1240 eV·nm，把能量直接换成波长很方便。ΔE = 2 eV 对应 620 nm 橙红光；能级是分立的，所以只能放出若干特定波长，形成线状光谱而不是连续彩虹。',
    boundary: '只适用于两个定态之间发射/吸收单个光子；hc 用真空波长，进入介质后波长会变短而频率不变。精细结构、塞曼效应、多普勒展宽会让谱线分裂或变宽。',
    next: '把 ΔE 拖到 3.1 eV 再猜——波长会落到紫光（400 nm）附近吗？',
    curveLabel: p => '横轴是能级差 ΔE（eV），λ = 1240/ΔE 是双曲线；当前 ' + (1240 / p.dE).toFixed(0) + ' nm'
  },
  // ══════════════ 2026-11-17 · 批次 E：中考剩余高频考点（12 条）══════════════
  {
    id: 'j9_series_i', stage: '初中', subject: '物理', chapter: '九全 · 第十五章 · 串、并联电路中电流的规律',
    title: '串联电阻一大一小，两处电流会不一样吗',
    hook: '10 Ω 和 30 Ω 串在一起，电流却处处相等。',
    question: '串联电路中 A₁ 处电流 0.5 A，电阻更大的 R₂ 后面的 A₂ 读数是多少？',
    predictLabel: '你猜 A₂ 读数', predictUnit: 'A', predictDefault: 0.2, predictMin: 0, predictMax: 10,
    params: [
      { key: 'I1', label: 'A₁ 处电流 I₁', unit: 'A', min: 0.1, max: 3, step: 0.1, value: 0.5 },
      { key: 'R1', label: '电阻 R₁', unit: 'Ω', min: 1, max: 50, step: 1, value: 10 },
      { key: 'R2', label: '电阻 R₂', unit: 'Ω', min: 1, max: 50, step: 1, value: 30 },
      { key: 'U', label: '电源电压 U', unit: 'V', min: 1, max: 24, step: 1, value: 20 }
    ],
    renderer: 'function', duration: 2.6,
    curve: p => () => p.I1,
    domain: () => [1, 50],
    truth: p => p.I1,
    formula: '串联电路：I₁ = I₂ = I（各处电流相等）',
    calc: p => 'I₂ = I₁ = ' + p.I1.toFixed(1) + ' A（R₁ = ' + p.R1 + ' Ω、R₂ = ' + p.R2 + ' Ω 只决定总电流有多大，不改变「处处相等」）',
    insight: '稳恒电流里电荷不会在某处堆积，否则该处电场会立刻把堆积推走。电阻大只让整个回路的电流变小，不会在下游「少掉」一部分电流。',
    boundary: '稳恒直流、单一回路无分支、导线不漏电。含电容的充放电暂态、有分支的并联电路都不适用这条结论。',
    next: '把 R₂ 拖到 50 Ω 再猜——A₂ 会变小吗？',
    curveLabel: p => '横轴是 R₂（Ω），I₂ = I₁ = ' + p.I1.toFixed(1) + ' A 是一条水平线，与电阻大小无关'
  },
  {
    id: 'j9_parallel_i', stage: '初中', subject: '物理', chapter: '九全 · 第十五章 · 串、并联电路中电流的规律',
    title: '两条支路汇到一起，干路电流是多少',
    hook: '并联不是「分流后变小」，干路反而是两路之和。',
    question: '并联两支路电流分别为 0.3 A 和 0.6 A，干路电流是多少 A？',
    predictLabel: '你猜干路电流', predictUnit: 'A', predictDefault: 0.5, predictMin: 0, predictMax: 10,
    params: [
      { key: 'I1', label: '支路 1 电流 I₁', unit: 'A', min: 0.1, max: 3, step: 0.1, value: 0.3 },
      { key: 'I2', label: '支路 2 电流 I₂', unit: 'A', min: 0.1, max: 3, step: 0.1, value: 0.6 },
      { key: 'U', label: '电源电压 U', unit: 'V', min: 1, max: 24, step: 1, value: 6 }
    ],
    renderer: 'function', duration: 2.6,
    curve: p => x => p.I1 + x,
    domain: () => [0.1, 3],
    truth: p => p.I1 + p.I2,
    formula: '并联电路：I干 = I₁ + I₂（节点处电荷守恒）',
    calc: p => 'I干 = ' + p.I1.toFixed(1) + ' + ' + p.I2.toFixed(1) + ' = ' + (p.I1 + p.I2).toFixed(1) + ' A（电源电压 ' + p.U + ' V 已经体现在各支路电流里）',
    insight: '这就是基尔霍夫电流定律的初中版：单位时间流进节点的电荷必须等于流出的。多开一盏灯，干路电流就增加那一路的量，所以家里电器开多了总闸会跳。',
    boundary: '稳恒直流、节点不积累电荷。交流电里各支路电流有相位差，要用矢量（相量）相加，不能直接把有效值代数相加。',
    next: '把 I₂ 拖到 3 A 再猜——干路电流会超过 3 A 吗？',
    curveLabel: p => '横轴是支路电流 I₂，I干 = ' + p.I1.toFixed(1) + ' + I₂ 是斜率为 1 的直线；当前 ' + (p.I1 + p.I2).toFixed(1) + ' A'
  },
  {
    id: 'j8a_boil', stage: '初中', subject: '物理', chapter: '八上 · 第三章 · 汽化和液化',
    title: '高压锅里 150 kPa，水几度才开',
    hook: '气压越高，水越「赖着」不肯沸腾。',
    question: '锅内气压 150 kPa 时，水的沸点大约是多少 ℃？',
    predictLabel: '你猜沸点', predictUnit: '℃', predictDefault: 150, predictMin: 80, predictMax: 200,
    params: [
      { key: 'p', label: '锅内气压 p', unit: 'kPa', min: 70, max: 200, step: 5, value: 150 },
      { key: 'V', label: '水的体积 V', unit: 'L', min: 0.5, max: 5, step: 0.5, value: 2 },
      { key: 'P', label: '加热功率 P', unit: 'W', min: 200, max: 2000, step: 100, value: 1000 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => 100 + 0.22 * (x - 101),
    domain: () => [70, 200],
    truth: p => 100 + 0.22 * (p.p - 101),
    formula: '近似式：t沸 ≈ 100 + 0.22·(p − 101) ℃（p 单位 kPa）',
    calc: p => 't沸 ≈ 100 + 0.22×(' + p.p + '−101) = ' + (100 + 0.22 * (p.p - 101)).toFixed(1) + ' ℃（水量 ' + p.V.toFixed(1) + ' L、功率 ' + p.P + ' W 只影响烧开所需时间）',
    insight: '沸腾的条件是水的饱和蒸气压等于外界气压。外压越大，就要把水加热到更高温度才能满足；高原气压低，水不到 100 ℃ 就开，饭反而煮不熟。',
    boundary: '这条 0.22 ℃/kPa 只是 70~200 kPa 附近的线性近似，真实关系由克劳修斯–克拉珀龙方程给出、是指数型的，精确值要查饱和蒸气压表。水量与火力不改变沸点，只改变升温快慢。',
    next: '把气压拖到 70 kPa（高原）再猜——沸点会低于 95 ℃ 吗？',
    curveLabel: p => '横轴是气压 p（kPa），本模型用线性近似；当前 ' + (100 + 0.22 * (p.p - 101)).toFixed(1) + ' ℃，真实曲线会更陡'
  },
  {
    id: 'j9_heat_value', stage: '初中', subject: '物理', chapter: '九全 · 第十四章 · 热机的效率',
    title: '烧 2 kg 燃料，理论上能放出多少热',
    hook: '热值是燃料的「身份」，跟烧多少、烧没烧完是两回事。',
    question: '热值 3×10⁷ J/kg 的燃料完全燃烧 2 kg，放出多少 MJ？',
    predictLabel: '你猜放出热量', predictUnit: 'MJ', predictDefault: 20, predictMin: 0, predictMax: 1000,
    params: [
      { key: 'm', label: '燃料质量 m', unit: 'kg', min: 0.1, max: 5, step: 0.1, value: 2 },
      { key: 'q', label: '热值 q', unit: '10⁷ J/kg', min: 1, max: 5, step: 0.1, value: 3 },
      { key: 'eta', label: '炉子效率 η', unit: '%', min: 10, max: 100, step: 5, value: 40 }
    ],
    renderer: 'function', duration: 2.6,
    curve: p => x => x * p.q * 10,
    domain: () => [0.1, 5],
    truth: p => p.m * p.q * 10,
    formula: 'Q放 = mq（q 单位 10⁷ J/kg 时，结果换算成 MJ 为 10mq）',
    calc: p => 'Q放 = ' + p.m.toFixed(1) + ' × ' + p.q.toFixed(1) + '×10⁷ = ' + (p.m * p.q * 10).toFixed(1) + ' MJ（炉子效率 ' + p.eta + '% 只影响「用得上」多少，不影响放出的总量）',
    insight: '热值是单位质量完全燃烧放出的热量，是燃料本身的属性，与质量和是否烧尽无关。真正被水吸收的是 Q有用 = η·mq， 把「放出的」和「用得上的」混为一谈，是热机效率题最常见的失分点。',
    boundary: '假设完全燃烧、热值取表值不变。实际存在不完全燃烧、散热、烟气带走热量；气体燃料常用 J/m³ 作单位，公式要换成 Q = Vq。',
    next: '把效率拖到 100% 再猜——放出的总热量会变吗？',
    curveLabel: p => '横轴是燃料质量 m，Q放 = 10·m·' + p.q.toFixed(1) + ' 是过原点的直线；当前 ' + (p.m * p.q * 10).toFixed(1) + ' MJ'
  },
  {
    id: 'j8b_bernoulli', stage: '初中', subject: '物理', chapter: '八下 · 第九章 · 流体压强与流速的关系',
    title: '管子变细流速翻倍，压强差有多大',
    hook: '流速大的地方压强小——机翼和喷雾器都靠这句反直觉的话。',
    question: '水流从 2 m/s 加速到 8 m/s，两处压强差 p₁ − p₂ 是多少 kPa？',
    predictLabel: '你猜压强差', predictUnit: 'kPa', predictDefault: 5, predictMin: -500, predictMax: 500,
    params: [
      { key: 'v1', label: '粗管流速 v₁', unit: 'm/s', min: 0.5, max: 10, step: 0.5, value: 2 },
      { key: 'v2', label: '细管流速 v₂', unit: 'm/s', min: 0.5, max: 20, step: 0.5, value: 8 },
      { key: 'rho', label: '流体密度 ρ', unit: 'kg/m³', min: 1, max: 1200, step: 10, value: 1000 },
      { key: 'h', label: '两测点高度差', unit: 'cm', min: 0, max: 50, step: 5, value: 0 }
    ],
    renderer: 'function', duration: 3.0,
    curve: p => x => 0.5 * p.rho * (x * x - p.v1 * p.v1) / 1000,
    domain: () => [0.5, 20],
    truth: p => 0.5 * p.rho * (p.v2 * p.v2 - p.v1 * p.v1) / 1000,
    formula: '伯努利方程（等高）：p + ½ρv² = C → p₁ − p₂ = ½ρ(v₂² − v₁²)',
    calc: p => 'Δp = ½×' + p.rho + '×(' + p.v2.toFixed(1) + '²−' + p.v1.toFixed(1) + '²)/1000 = ' + (0.5 * p.rho * (p.v2 * p.v2 - p.v1 * p.v1) / 1000).toFixed(2) + ' kPa（等高，高度差 ' + p.h + ' cm 未计入）',
    insight: '流速增大时动能项 ½ρv² 变大，压力项必须变小才能保持总机械能不变。地铁站的安全线、飞机机翼升力、两张纸中间吹气会贴拢，都是这个效应。',
    boundary: '理想流体：不可压、无黏性、定常流动、同一流线且等高。实际有黏性损失与湍流，两测点有高度差时还要加 ρgΔh 项；本模型把高度差当干扰滑块。',
    next: '把 v₂ 调到小于 v₁ 再猜——压强差会变成负的吗？',
    curveLabel: p => '横轴是细管流速 v₂，Δp = ½ρ(v₂²−' + p.v1.toFixed(1) + '²) 是抛物线；当前 ' + (0.5 * p.rho * (p.v2 * p.v2 - p.v1 * p.v1) / 1000).toFixed(2) + ' kPa'
  },
  {
    id: 'j8a_pinhole', stage: '初中', subject: '物理', chapter: '八上 · 第四章 · 光的直线传播',
    title: '小孔成像，像会跟物体一样高吗',
    hook: '像是倒立的，而且大小只由两段距离的比决定。',
    question: '20 cm 高的物体离小孔 100 cm，孔到光屏 25 cm，像高多少 cm？',
    predictLabel: '你猜像高', predictUnit: 'cm', predictDefault: 20, predictMin: 0, predictMax: 200,
    params: [
      { key: 'h', label: '物体高度 h', unit: 'cm', min: 5, max: 50, step: 1, value: 20 },
      { key: 'u', label: '物到孔距离 u', unit: 'cm', min: 10, max: 200, step: 5, value: 100 },
      { key: 'v', label: '孔到屏距离 v', unit: 'cm', min: 5, max: 100, step: 5, value: 25 },
      { key: 'd', label: '小孔直径 d', unit: 'mm', min: 1, max: 20, step: 1, value: 2 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => p.h * x / p.u,
    domain: () => [5, 100],
    truth: p => p.h * p.v / p.u,
    formula: '相似三角形：h像/h物 = v/u，即 h像 = h物·v/u',
    calc: p => 'h像 = ' + p.h + ' × ' + p.v + '/' + p.u + ' = ' + (p.h * p.v / p.u).toFixed(1) + ' cm（孔径 ' + p.d + ' mm 只影响清晰度，不进入比例式）',
    insight: '光沿直线传播，物体顶端与底端的光穿过小孔后交叉，形成倒立实像；两个相似三角形给出距离比。把屏拉远，像就变大但变暗。',
    boundary: '要求孔足够小，才能把每一点近似成一条光线；孔变大后多个光斑叠加，像会模糊甚至只剩一个亮斑。这里忽略衍射与照度变化。',
    next: '把 v 拖到 100 cm 再猜——像会和物体一样高吗？',
    curveLabel: p => '横轴是孔到屏距离 v，h像 = ' + p.h + '·v/' + p.u + ' 是直线；当前 ' + (p.h * p.v / p.u).toFixed(1) + ' cm'
  },
  {
    id: 'j8b_energy_conv', stage: '初中', subject: '物理', chapter: '八下 · 第十一章 · 动能和势能',
    title: '从 20 m 落下，重球会比轻球快吗',
    hook: '质量在方程两边被约掉，落地速度只看高度。',
    question: '从 20 m 高处自由下落，落地速度是多少 m/s？',
    predictLabel: '你猜落地速度', predictUnit: 'm/s', predictDefault: 40, predictMin: 0, predictMax: 100,
    params: [
      { key: 'h', label: '下落高度 h', unit: 'm', min: 1, max: 50, step: 1, value: 20 },
      { key: 'm', label: '物体质量 m', unit: 'kg', min: 0.1, max: 10, step: 0.1, value: 2 },
      { key: 'g', label: '重力加速度 g', unit: 'm/s²', options: G, value: 9.8 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => Math.sqrt(2 * p.g * x),
    domain: () => [1, 50],
    truth: p => Math.sqrt(2 * p.g * p.h),
    formula: '机械能守恒：mgh = ½mv² → v = √(2gh)',
    calc: p => 'v = √(2×' + p.g + '×' + p.h + ') = ' + Math.sqrt(2 * p.g * p.h).toFixed(1) + ' m/s（质量 ' + p.m.toFixed(1) + ' kg 被约掉）',
    insight: '重力势能和动能里都含 m，等式两边一除就没了。这正是伽利略比萨斜塔故事的核心：忽略空气阻力时，轻重物体同时落地。',
    boundary: '忽略空气阻力、物体不转动、初速度为零。羽毛或纸片受阻力显著，速度会更小且与质量、形状有关；高度很大时 g 也会随高度变化。',
    next: '把 g 换成月球 1.6 再猜——速度会降到多少？',
    curveLabel: p => '横轴是高度 h，v = √(2·' + p.g + '·h) 是根号曲线；当前 ' + Math.sqrt(2 * p.g * p.h).toFixed(1) + ' m/s'
  },
  {
    id: 'j9_emwave_lambda', stage: '初中', subject: '物理', chapter: '九全 · 第二十一章 · 信息的传递',
    title: '100 MHz 的广播，波长有多长',
    hook: '频率越高波长越短，而且换介质时频率坚决不变。',
    question: '频率 100 MHz 的电磁波在真空中波长是多少 m？',
    predictLabel: '你猜波长', predictUnit: 'm', predictDefault: 30, predictMin: 0, predictMax: 1000,
    params: [
      { key: 'f', label: '频率 f', unit: 'MHz', min: 1, max: 1000, step: 10, value: 100 },
      { key: 'c', label: '传播速度 c', unit: 'm/s', options: [
        { label: '真空 3×10⁸', value: 3e8 },
        { label: '水中 2.25×10⁸', value: 2.25e8 }
      ], value: 3e8 },
      { key: 'P', label: '发射功率 P', unit: 'kW', min: 1, max: 100, step: 1, value: 10 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => p.c / (x * 1e6),
    domain: () => [1, 1000],
    truth: p => p.c / (p.f * 1e6),
    formula: 'c = λf → λ = c/f（f 用 Hz，c 用 m/s）',
    calc: p => 'λ = ' + p.c.toExponential(2) + '/(' + p.f + '×10⁶) = ' + (p.c / (p.f * 1e6)).toFixed(2) + ' m（发射功率 ' + p.P + ' kW 只影响信号强弱）',
    insight: '频率由波源决定，穿进任何介质都不变；变的是波速，波长跟着一起变。调频广播 100 MHz 对应约 3 m，手机 2.4 GHz 就只有 12.5 cm——天线尺寸就是这么来的。',
    boundary: '真空或均匀介质、无色散的近似。色散介质里 c 随频率变化；题目给的「水中光速」只是可见光近似值，电磁波在水中的传播还涉及吸收与电导率。',
    next: '把介质换成水再猜——波长会变，频率会变吗？',
    curveLabel: p => '横轴是频率 f（MHz），λ = c/f 是双曲线；当前 ' + (p.c / (p.f * 1e6)).toFixed(2) + ' m'
  },
  {
    id: 'j9_fault_short', stage: '初中', subject: '物理', chapter: '九全 · 第十七章 · 电路故障分析',
    title: '一个电阻被短接，另一个两端电压是多少',
    hook: '不是按阻值分压了——电源电压全跑到剩下的那个电阻上。',
    question: 'R₁ = 20 Ω 与 R₂ = 30 Ω 串联接 6 V，R₁ 被导线短接后，R₂ 两端电压是多少 V？',
    predictLabel: '你猜 R₂ 两端电压', predictUnit: 'V', predictDefault: 3.6, predictMin: 0, predictMax: 20,
    params: [
      { key: 'U', label: '电源电压 U', unit: 'V', min: 1, max: 12, step: 0.5, value: 6 },
      { key: 'R1', label: '被短接的电阻 R₁', unit: 'Ω', min: 5, max: 100, step: 5, value: 20 },
      { key: 'R2', label: '剩余电阻 R₂', unit: 'Ω', min: 5, max: 100, step: 5, value: 30 },
      { key: 'L', label: '导线长度 L', unit: 'cm', min: 5, max: 100, step: 5, value: 20 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => () => p.U,
    domain: () => [5, 100],
    truth: p => p.U,
    formula: 'R₁ 被短路 → U_R₁ = 0，U_R₂ = U电源',
    calc: p => 'U_R₂ = ' + p.U.toFixed(1) + ' V（短接后回路只剩 R₂ = ' + p.R2 + ' Ω；R₁ = ' + p.R1 + ' Ω 与导线长度 ' + p.L + ' cm 都不参与分压）',
    insight: '导线把 R₁ 两端变成等电位，电流全部绕开它；此时整个回路只有 R₂，电源电压几乎全落在它上面。故障题的判断顺序是「先看有没有电流，再看谁被旁路」。',
    boundary: '理想导线电阻为 0、电源无内阻。实际短路电流极大，会触发保险丝或使电源端电压下降，不能长时间短接；电源内阻不可忽略时 U_R₂ 会略小于 U。',
    next: '把 R₂ 拖到 100 Ω 再猜——电压会跟着变小吗？',
    curveLabel: p => '横轴是 R₂（Ω），U_R₂ = ' + p.U.toFixed(1) + ' V 是水平线：短路后与阻值无关'
  },
  {
    id: 'j9_induction_current', stage: '初中', subject: '物理', chapter: '九全 · 第二十章 · 电磁感应',
    title: '导线切磁感线快一倍，电流会怎样',
    hook: '不切割就没有电流，切得越快电流越大。',
    question: 'B = 0.4 T、有效长度 0.5 m 的导线以 2 m/s 切割磁感线，回路电阻 5 Ω，感应电流是多少 mA？',
    predictLabel: '你猜感应电流', predictUnit: 'mA', predictDefault: 20, predictMin: 0, predictMax: 2000,
    params: [
      { key: 'B', label: '磁感应强度 B', unit: 'T', min: 0.1, max: 1, step: 0.1, value: 0.4 },
      { key: 'L', label: '有效长度 L', unit: 'm', min: 0.1, max: 2, step: 0.1, value: 0.5 },
      { key: 'v', label: '切割速度 v', unit: 'm/s', min: 0.5, max: 10, step: 0.5, value: 2 },
      { key: 'R', label: '回路电阻 R', unit: 'Ω', min: 1, max: 20, step: 1, value: 5 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => p.B * p.L * x / p.R * 1000,
    domain: () => [0.5, 10],
    truth: p => p.B * p.L * p.v / p.R * 1000,
    formula: 'ε = BLv，I = ε/R = BLv/R（闭合回路、垂直切割）',
    calc: p => 'I = ' + p.B.toFixed(1) + '×' + p.L.toFixed(1) + '×' + p.v.toFixed(1) + '/' + p.R + ' = ' + (p.B * p.L * p.v / p.R * 1000).toFixed(0) + ' mA',
    insight: '发电机的基本关系：感应电动势与「单位时间扫过的磁通量」成正比，B、L、v 各自加倍电流都加倍。导线顺着磁感线走（平行）时 v 的有效分量为 0，一点电流也没有。',
    boundary: 'B 匀强、导线与 B 垂直、回路闭合、导线电阻计入 R。实际还有自感、接触电阻与电刷损耗；若不闭合，只有电动势而没有持续电流。',
    next: '把 v 拖到 10 m/s 再猜——电流会正好变成 5 倍吗？',
    curveLabel: p => '横轴是切割速度 v，I = ' + (p.B * p.L / p.R * 1000).toFixed(0) + '·v 是直线；当前 ' + (p.B * p.L * p.v / p.R * 1000).toFixed(0) + ' mA'
  },
  {
    id: 'j8a_sound_pitch', stage: '初中', subject: '物理', chapter: '八上 · 第二章 · 声音的特性',
    title: '弦缩短一半，音调会高多少',
    hook: '不是「高一点」，是频率翻倍。',
    question: '同样张力与粗细的弦，30 cm 时基频 440 Hz，长度变成 60 cm 时频率是多少 Hz？',
    predictLabel: '你猜基频', predictUnit: 'Hz', predictDefault: 880, predictMin: 0, predictMax: 5000,
    params: [
      { key: 'L', label: '弦的有效长度 L', unit: 'cm', min: 10, max: 100, step: 5, value: 60 },
      { key: 'T', label: '弦的张力 T', unit: 'N', min: 10, max: 100, step: 5, value: 50 },
      { key: 'd', label: '弦的直径 d', unit: 'mm', min: 0.2, max: 2, step: 0.1, value: 0.5 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => 440 * 30 / x,
    domain: () => [10, 100],
    truth: p => 440 * 30 / p.L,
    formula: 'f = (1/2L)·√(T/μ)：T 与线密度 μ 固定时 f ∝ 1/L',
    calc: p => 'f = 440 × 30/' + p.L + ' = ' + (440 * 30 / p.L).toFixed(0) + ' Hz（张力 ' + p.T + ' N、直径 ' + p.d.toFixed(1) + ' mm 在本实验中固定不变）',
    insight: '弦上驻波的波长是 2L，波速由张力和线密度决定；L 减半则波长减半，频率翻倍。吉他按弦、二胡换把位改变的都是有效长度。',
    boundary: '假设张力与线密度不变、只取基频；真实弦有刚度，按弦也会略微改变张力，高把位会偏音。管乐器的边界条件不同（开管/闭管），关系不是这一条。',
    next: '把 L 拖到 15 cm 再猜——频率会超过 800 Hz 吗？',
    curveLabel: p => '横轴是弦长 L，f = 13200/L 是双曲线；当前 ' + (440 * 30 / p.L).toFixed(0) + ' Hz'
  },
  {
    id: 'j9_bulb_resistance', stage: '初中', subject: '物理', chapter: '九全 · 第十八章 · 测量小灯泡的电功率',
    title: '灯泡冷着量 4 Ω，点亮后还是 4 Ω 吗',
    hook: '电压加倍，电流却不到两倍——灯丝越热越「挡」。',
    question: '额定 6 V 的小灯泡，正常工作时的热态电阻约 40 Ω，冷态只有 4 Ω。接 6 V 时它的电阻是多少 Ω？',
    predictLabel: '你猜工作时电阻', predictUnit: 'Ω', predictDefault: 10, predictMin: 0, predictMax: 500,
    params: [
      { key: 'U', label: '实际电压 U', unit: 'V', min: 1, max: 12, step: 0.5, value: 6 },
      { key: 'Ue', label: '额定电压 U额', unit: 'V', min: 1, max: 12, step: 0.5, value: 6 },
      { key: 'Re', label: '额定热态电阻 R额', unit: 'Ω', min: 10, max: 100, step: 5, value: 40 },
      { key: 'Rc', label: '冷态电阻 R冷', unit: 'Ω', min: 1, max: 20, step: 1, value: 4 }
    ],
    renderer: 'function', duration: 3.0,
    curve: p => x => p.Re * Math.pow(x / p.Ue, 0.45),
    domain: () => [1, 12],
    truth: p => p.Re * Math.pow(p.U / p.Ue, 0.45),
    formula: '经验式：R热 ≈ R额·(U/U额)^0.45（钨丝电阻随温度升高而增大）',
    calc: p => 'R ≈ ' + p.Re + '×(' + p.U.toFixed(1) + '/' + p.Ue.toFixed(1) + ')^0.45 = ' + (p.Re * Math.pow(p.U / p.Ue, 0.45)).toFixed(1) + ' Ω（冷态只有 ' + p.Rc + ' Ω，通电后灯丝升温才涨上来）',
    insight: '金属电阻率随温度升高，电压升高 → 电流增大 → 灯丝更热 → 电阻变大 → 电流增长慢于电压，I–U 图线向下弯。所以伏安法测小灯泡电阻不能把几次结果取平均，也不能用欧姆表冷态读数去算功率。',
    boundary: '0.45 次幂是钨丝灯泡在额定电压附近的经验拟合，不是物理定律，不同灯泡指数不同，低压段偏差明显；LED、定值电阻、热敏电阻完全不适用这条曲线。',
    next: '把 U 拖到 12 V 再猜——电阻会变成 2 倍还是不到 1.4 倍？',
    curveLabel: p => '横轴是电压 U，R = ' + p.Re + '·(U/' + p.Ue.toFixed(1) + ')^0.45 是上凸曲线；当前 ' + (p.Re * Math.pow(p.U / p.Ue, 0.45)).toFixed(1) + ' Ω'
  },
  // ══════════════ 2026-11-17 · 批次 F：教材定性实验栏目（5 条，diagram 渲染器）══
  // 教材里明确标「实验」的栏目大多是定性观察，过去因「猜一个数」的框架被跳过。
  // 本批次把它们数值化（猜读数、猜倍数、猜方向编码），并用 diagram 依次点亮装置节点。
  // chapter 标「教材实验 ·」，不计入 textbook:scan 的教材落地数。
  {
    id: 'book_multimeter', stage: '高中', subject: '物理', chapter: '教材实验 · 必修三第十一章 · 多用电表的使用',
    title: '欧姆挡红黑表笔接反，读数会变吗',
    hook: '欧姆挡里藏着一节电池，可纯电阻偏偏没有极性。',
    question: '用多用电表欧姆挡测 100 Ω 的定值电阻，把红黑表笔互换后读数是多少 Ω？',
    predictLabel: '你猜互换后读数', predictUnit: 'Ω', predictDefault: 20, predictMin: 0, predictMax: 2000,
    params: [
      { key: 'R', label: '待测电阻 R', unit: 'Ω', min: 5, max: 500, step: 5, value: 100 },
      { key: 'range', label: '欧姆挡倍率', unit: '', options: [
        { label: '×1', value: 1 }, { label: '×10', value: 10 }, { label: '×100', value: 100 }
      ], value: 10 },
      { key: 'dir', label: '表笔接法', unit: '', options: [
        { label: '红接 A 端', value: 1 }, { label: '红黑互换', value: -1 }
      ], value: 1 }
    ],
    renderer: 'diagram', duration: 2.8,
    diagram: p => [
      { label: '待测元件', value: '定值电阻 ' + p.R + ' Ω' },
      { label: '挡位', value: '欧姆 ×' + p.range },
      { label: '表笔', value: p.dir > 0 ? '红接 A 端' : '红黑互换', tone: 'warn' },
      { label: '内部电池', value: '电流方向反了' },
      { label: '表头读数', value: p.R + ' Ω', tone: 'good' },
      { label: '结论', value: '无极性，读数不变', tone: 'good' }
    ],
    truth: p => p.R,
    formula: '欧姆挡测无极性线性电阻：读数与红黑表笔接法无关',
    calc: p => '互换表笔后仍读 ' + p.R + ' Ω；倍率 ×' + p.range + ' 只改刻度换算，不改变被测阻值',
    insight: '欧姆挡内部有电池，红表笔接的是内部电池负极，所以电流确实反向了；但纯电阻的伏安关系是过原点的直线，方向反过来比值 |U/I| 不变。测二极管、三极管、电解电容时结论完全相反。',
    boundary: '只适用于无极性线性电阻；带电电路不能直接用欧姆挡（会烧表且读数无意义）；每次换挡都要重新欧姆调零。半导体元件有单向导电性，互换表笔读数差别很大。',
    next: '把表笔换成「红黑互换」再跑一次——读数真的分毫不动吗？',
    caption: p => '装置：多用电表 → 表笔 → 待测电阻；节点按「接法 → 内部电流 → 读数」依次点亮'
  },
  {
    id: 'book_induction_condition', stage: '高中', subject: '物理', chapter: '教材实验 · 必修三第十三章 · 探究感应电流的产生条件',
    title: '磁铁静静放在线圈里，电流表会动吗',
    hook: '磁场再强也没用，关键是磁通量「正在变」。',
    question: '200 匝线圈、B = 50 mT，磁铁以 4 cm/s 插入时感应电流是多少 mA？（有效长度 5 cm，回路 10 Ω）',
    predictLabel: '你猜感应电流', predictUnit: 'mA', predictDefault: 0.5, predictMin: 0, predictMax: 100,
    params: [
      { key: 'v', label: '磁铁插入速度 v', unit: 'cm/s', min: 0, max: 10, step: 1, value: 4 },
      { key: 'B', label: '磁感应强度 B', unit: 'mT', min: 10, max: 200, step: 10, value: 50 },
      { key: 'N', label: '线圈匝数 N', unit: '匝', min: 50, max: 500, step: 50, value: 200 },
      { key: 'R', label: '回路电阻 R', unit: 'Ω', min: 1, max: 20, step: 1, value: 10 }
    ],
    renderer: 'diagram', duration: 3.0,
    diagram: p => [
      { label: '磁铁状态', value: p.v === 0 ? '静止在线圈内' : '以 ' + p.v + ' cm/s 插入' },
      { label: '穿过线圈的 Φ', value: p.v === 0 ? '不变' : '正在增大', tone: p.v === 0 ? 'warn' : 'good' },
      { label: '感应电动势', value: (p.N * (p.B / 1000) * 0.05 * (p.v / 100)).toFixed(3) + ' V', tone: 'good' },
      { label: '电流表', value: p.v === 0 ? '0 mA · 不偏转' : (p.N * (p.B / 1000) * 0.05 * (p.v / 100) / p.R * 1000).toFixed(2) + ' mA · 偏转', tone: p.v === 0 ? 'warn' : 'good' },
      { label: '判定条件', value: 'ΔΦ/Δt ≠ 0 才有 I', tone: 'good' },
      { label: '装置参数', value: p.N + ' 匝 · ' + p.B + ' mT · ' + p.R + ' Ω' }
    ],
    truth: p => p.N * (p.B / 1000) * 0.05 * (p.v / 100) / p.R * 1000,
    formula: 'ε = N·ΔΦ/Δt = N·B·L·v，I = ε/R（回路闭合）',
    calc: p => 'ε = ' + p.N + '×' + (p.B / 1000).toFixed(3) + ' T×0.05 m×' + (p.v / 100).toFixed(2) + ' m/s = ' + (p.N * (p.B / 1000) * 0.05 * (p.v / 100)).toFixed(3) + ' V；I = ε/' + p.R + ' = ' + (p.N * (p.B / 1000) * 0.05 * (p.v / 100) / p.R * 1000).toFixed(2) + ' mA',
    insight: '实验栏目真正在问的是「什么时候有电流」：磁铁不动、线圈不动、磁场再强，Φ 不变就没有任何偏转。插入、拔出、移动线圈、改变电流都能让 Φ 变化，这才是唯一的判据。',
    boundary: '模型把磁场简化为匀强、导线有效长度固定 5 cm、回路闭合且忽略自感。磁铁靠近线圈时 B 并不均匀，实际电流是一个随时间起伏的脉冲，不是恒定值；线圈开路时只有电动势没有持续电流。',
    next: '把 v 拖到 0 再跑一次——节点会告诉你为什么电流表纹丝不动。',
    caption: p => '装置：条形磁铁 → 线圈 → 电流表；节点按「动作 → 磁通变化 → 电动势 → 偏转」依次点亮'
  },
  {
    id: 'book_ampere_lab', stage: '高中', subject: '物理', chapter: '教材实验 · 必修三第十三章 · 通电导线在磁场中受力',
    title: '把电源正负极对调，导线受力会变小吗',
    hook: '方向翻了，大小一点没变——左手定则管方向，公式管大小。',
    question: 'B = 0.4 T、I = 2 A、导线 0.3 m，把电流方向反过来后，安培力的大小是多少 N？',
    predictLabel: '你猜力的大小', predictUnit: 'N', predictDefault: 0.1, predictMin: 0, predictMax: 20,
    params: [
      { key: 'B', label: '磁感应强度 B', unit: 'T', min: 0.1, max: 1, step: 0.1, value: 0.4 },
      { key: 'I', label: '电流 I', unit: 'A', min: 0.5, max: 5, step: 0.5, value: 2 },
      { key: 'L', label: '导线有效长度 L', unit: 'm', min: 0.1, max: 1, step: 0.1, value: 0.3 },
      { key: 'dir', label: '电流方向', unit: '', options: [
        { label: '正向', value: 1 }, { label: '反向', value: -1 }
      ], value: 1 }
    ],
    renderer: 'diagram', duration: 2.8,
    diagram: p => [
      { label: '磁场 B', value: p.B.toFixed(1) + ' T · 垂直纸面' },
      { label: '通电导线', value: p.I.toFixed(1) + ' A · ' + p.L.toFixed(1) + ' m' },
      { label: '电流方向', value: p.dir > 0 ? '正向' : '反向（已对调）', tone: 'warn' },
      { label: '受力方向', value: p.dir > 0 ? '向上' : '向下', tone: 'warn' },
      { label: '力的大小', value: (p.B * p.I * p.L).toFixed(3) + ' N', tone: 'good' },
      { label: '结论', value: '反向只翻方向', tone: 'good' }
    ],
    truth: p => p.B * p.I * p.L,
    formula: 'F = BIL（大小与电流方向无关；方向由左手定则判定）',
    calc: p => 'F = ' + p.B.toFixed(1) + '×' + p.I.toFixed(1) + '×' + p.L.toFixed(1) + ' = ' + (p.B * p.I * p.L).toFixed(3) + ' N（' + (p.dir > 0 ? '正向' : '反向') + '只改变受力方向）',
    insight: '教材这个实验要观察的是「改变电流方向 / 改变磁场方向，导线运动方向反转」。但 F = BIL 里的 I 是大小，方向信息交给左手定则，所以对调电源后大小分毫不变。',
    boundary: '匀强磁场、导线与 B 垂直、支架摩擦可忽略。若导线与 B 有夹角要乘 sinθ；电流过大时导线发热、电源内阻压降会让实际 B 与 I 都变化。',
    next: '把电流方向切到「反向」再跑——节点里只有方向那两格变了。',
    caption: p => '装置：U 形磁铁 → 水平导轨 → 通电导线；节点按「磁场 → 电流 → 方向 → 大小」依次点亮'
  },
  {
    id: 'gk_lenz', stage: '高中', subject: '物理', chapter: '高考专题 · 楞次定律',
    title: '磁铁插进线圈，线圈是推它还是拉它',
    hook: '「来拒去留」不是口诀，是能量守恒逼出来的。',
    question: '条形磁铁 N 极插入闭合线圈时，线圈对磁铁是排斥还是吸引？填 +1 表示排斥、−1 表示吸引。',
    predictLabel: '你猜作用力', predictUnit: '', predictDefault: -1, predictMin: -2, predictMax: 2,
    params: [
      { key: 'act', label: '磁铁动作', unit: '', options: [
        { label: 'N 极插入', value: 1 }, { label: 'N 极拔出', value: -1 }
      ], value: 1 },
      { key: 'v', label: '动作速度 v', unit: 'cm/s', min: 1, max: 20, step: 1, value: 5 },
      { key: 'B', label: '磁铁磁场 B', unit: 'mT', min: 10, max: 200, step: 10, value: 50 }
    ],
    renderer: 'diagram', duration: 3.0,
    diagram: p => [
      { label: '磁铁动作', value: p.act > 0 ? 'N 极插入线圈' : 'N 极从线圈拔出' },
      { label: '穿过线圈的 Φ', value: p.act > 0 ? '增大' : '减小', tone: 'warn' },
      { label: '感应电流磁场', value: p.act > 0 ? '反抗增大' : '补偿减小' },
      { label: '靠近磁铁那端', value: p.act > 0 ? '变成 N 极' : '变成 S 极' },
      { label: '线圈对磁铁', value: p.act > 0 ? '排斥 +1' : '吸引 −1', tone: 'good' },
      { label: '能量去向', value: '机械能 → 焦耳热', tone: 'good' }
    ],
    truth: p => p.act > 0 ? 1 : -1,
    formula: '楞次定律：感应电流的磁场总要阻碍引起它的磁通量变化（来拒去留）',
    calc: p => (p.act > 0 ? '插入 → Φ 增大 → 线圈推回去（+1）' : '拔出 → Φ 减小 → 线圈拉回来（−1）') + '；与速度 ' + p.v + ' cm/s、磁场 ' + p.B + ' mT 的大小无关',
    insight: '如果反过来变成「来留去拒」，磁铁会被越吸越快、电流还越来越大，能量就凭空产生了。楞次定律本质是能量守恒在电磁感应里的表现：外力必须做功，这些功变成回路的焦耳热。',
    boundary: '线圈必须闭合才有感应电流和明显的机械力；开路时仍有感应电动势但几乎没有电流，阻力可忽略。这里只看方向，磁铁自身涡流、线圈自感与摩擦会影响力的大小。',
    next: '把动作换成「N 极拔出」再猜——答案会变成 −1 吗？',
    caption: p => '装置：条形磁铁 ↔ 闭合线圈；节点按「动作 → Φ 变化 → 感应磁场 → 受力」依次点亮'
  },
  {
    id: 'book_capacitor_charge', stage: '高中', subject: '物理', chapter: '教材实验 · 必修三第十章 · 观察电容器的充、放电现象',
    title: '电容充满电以后，回路里还有电流吗',
    hook: '刚接通时电流最大，等一会儿反而归零——直流被「隔」住了。',
    question: '6 V 电源经 10 kΩ 给 100 μF 电容充电，充满后回路中的稳定电流是多少 mA？',
    predictLabel: '你猜稳态电流', predictUnit: 'mA', predictDefault: 0.3, predictMin: 0, predictMax: 100,
    params: [
      { key: 'U', label: '电源电压 U', unit: 'V', min: 1, max: 12, step: 0.5, value: 6 },
      { key: 'C', label: '电容 C', unit: 'μF', min: 10, max: 1000, step: 10, value: 100 },
      { key: 'R', label: '充电电阻 R', unit: 'kΩ', min: 1, max: 100, step: 1, value: 10 },
      { key: 't', label: '观察时刻 t', unit: 's', min: 0, max: 20, step: 1, value: 5 }
    ],
    renderer: 'diagram', duration: 3.0,
    diagram: p => [
      { label: '开关', value: '闭合 · t = 0' },
      { label: '充电初始', value: 'I₀ = U/R = ' + (p.U / p.R).toFixed(2) + ' mA', tone: 'warn' },
      { label: '电荷积累', value: 'Q = CU = ' + (p.C * p.U).toFixed(0) + ' μC' },
      { label: '电容电压 U_C', value: '→ ' + p.U.toFixed(1) + ' V', tone: 'good' },
      { label: '稳定后', value: 'I = 0 mA', tone: 'good' },
      { label: '结论', value: '电容隔直流', tone: 'good' }
    ],
    truth: () => 0,
    formula: '充电完成 U_C = U → I = (U − U_C)/R = 0',
    calc: p => 'Q = ' + p.C + ' μF×' + p.U.toFixed(1) + ' V = ' + (p.C * p.U).toFixed(0) + ' μC；稳态 I = (' + p.U.toFixed(1) + '−' + p.U.toFixed(1) + ')/' + p.R + ' kΩ = 0 mA（τ = RC = ' + (p.R * p.C / 1000).toFixed(2) + ' s 只决定快慢）',
    insight: '刚接通时电容两端电压为 0，电流最大；随着电荷堆积，U_C 顶住电源，电流按指数衰减到 0。所谓「通交流、隔直流」，隔的就是这个稳态；过程中一直有短暂的充电电流。',
    boundary: '理想电容无漏电流，稳态电流才严格为 0；实际电容有漏电阻，会有微小漏电流。时间常数 τ = RC 决定充电快慢（约 5τ 视为充满），观察时刻 t 太早时电流还没衰减到 0。',
    next: '把 R 拖到 100 kΩ 再猜——稳态电流会变大吗？变的是哪个量？',
    caption: p => '装置：电源 → 电阻 R → 电容器 C → 电流表；节点按充电时序依次点亮'
  },

  // ══════════════ 2026-11-17 · 批次 G：初中八上 / 八下收尾（13 条）══════════════
  // 逐章对照人教版八上六章、八下六章后，补上仍空的节；chapter 均带教材前缀，
  // 会被 textbook:scan 计入教材落地数。
  {
    id: 'j8a_reference', stage: '初中', subject: '物理', chapter: '八上 · 第一章 · 运动的描述',
    title: '两辆车都往前开，为什么看着像没动',
    hook: '说「快」还是「慢」，先得说清是相对谁。',
    question: '前车 60 km/h、后车 40 km/h 同向行驶，以后车为参照物，前车速度是多少 km/h？',
    predictLabel: '你猜相对速度', predictUnit: 'km/h', predictDefault: 100, predictMin: 0, predictMax: 300,
    params: [
      { key: 'v1', label: '前车速度 v₁', unit: 'km/h', min: 0, max: 120, step: 5, value: 60 },
      { key: 'v2', label: '后车速度 v₂', unit: 'km/h', min: 0, max: 120, step: 5, value: 40 },
      { key: 'dir', label: '两车方向', unit: '', options: [
        { label: '同向', value: 1 }, { label: '相向', value: -1 }
      ], value: 1 },
      { key: 't', label: '观察时间 t', unit: 's', min: 1, max: 60, step: 1, value: 10 }
    ],
    renderer: 'function', duration: 2.6,
    curve: p => x => p.dir > 0 ? Math.abs(p.v1 - x) : p.v1 + x,
    domain: () => [0, 120],
    truth: p => p.dir > 0 ? Math.abs(p.v1 - p.v2) : p.v1 + p.v2,
    formula: '共线相对速度：同向 v相 = |v₁ − v₂|，相向 v相 = v₁ + v₂',
    calc: p => (p.dir > 0 ? 'v相 = |' + p.v1 + '−' + p.v2 + '| = ' + Math.abs(p.v1 - p.v2) + ' km/h' : 'v相 = ' + p.v1 + '+' + p.v2 + ' = ' + (p.v1 + p.v2) + ' km/h') + '（观察 ' + p.t + ' s 不改变相对速度）',
    insight: '并排同速的两辆车互看是静止的，路边的人却看它们都在飞驰——运动和静止取决于参照物。加油机给战机空中加油，就是先把相对速度调到 0。',
    boundary: '经典低速的伽利略速度变换、两车共线。速度接近光速时要用相对论速度合成；有夹角时要用矢量相减。',
    next: '把方向切到「相向」再猜——相对速度会变成两车之和吗？',
    curveLabel: p => (p.dir > 0 ? '横轴是 v₂，同向时 v相 = |' + p.v1 + '−v₂| 是 V 形折线' : '横轴是 v₂，相向时 v相 = ' + p.v1 + '+v₂ 是直线') + '；当前 ' + (p.dir > 0 ? Math.abs(p.v1 - p.v2) : p.v1 + p.v2) + ' km/h'
  },
  {
    id: 'j8a_lightning', stage: '初中', subject: '物理', chapter: '八上 · 第二章 · 声音的产生与传播',
    title: '看到闪电 3 秒后听到雷声，雷有多远',
    hook: '先看见后听见，不是雷声「慢半拍」，是光速快得离谱。',
    question: '看到闪电后 3 s 听到雷声，打雷处离你大约多少 km？',
    predictLabel: '你猜距离', predictUnit: 'km', predictDefault: 3, predictMin: 0, predictMax: 20,
    params: [
      { key: 'dt', label: '光与声的时间差 Δt', unit: 's', min: 0.5, max: 10, step: 0.5, value: 3 },
      { key: 'v', label: '声速 v', unit: 'm/s', options: [
        { label: '空气 340', value: 340 }, { label: '水 1500', value: 1500 }
      ], value: 340 },
      { key: 'T', label: '气温 T', unit: '℃', min: -20, max: 40, step: 5, value: 20 }
    ],
    renderer: 'function', duration: 2.6,
    curve: p => x => p.v * x / 1000,
    domain: () => [0.5, 10],
    truth: p => p.v * p.dt / 1000,
    formula: 's ≈ v声·Δt（光速 3×10⁸ m/s，传播时间可忽略）',
    calc: p => 's = ' + p.v + ' × ' + p.dt.toFixed(1) + ' / 1000 = ' + (p.v * p.dt / 1000).toFixed(2) + ' km（气温 ' + p.T + ' ℃ 会让声速略变，本模型当常数）',
    insight: '闪电的光几乎瞬间到达，所以 3 秒全是声音在路上花的时间。真空不能传声——月球上就算有闪电也听不见。',
    boundary: '声速随温度变化（v ≈ 331 + 0.6T m/s），这里取 340 m/s；忽略风、湿度与光传播时间；回声测距要再除以 2。',
    next: '把介质换成水再猜——同样的时间差对应多远？',
    curveLabel: p => '横轴是时间差 Δt，s = ' + p.v + '·Δt/1000 是直线；当前 ' + (p.v * p.dt / 1000).toFixed(2) + ' km'
  },
  {
    id: 'j8a_thermometer', stage: '初中', subject: '物理', chapter: '八上 · 第三章 · 温度',
    title: '液柱停在第 42 格，到底几度',
    hook: '读数要从量程下限数起，不是从 0 数起。',
    question: '量程 −20~100 ℃、共 60 小格的温度计，液柱在第 42 格时读数是多少 ℃？',
    predictLabel: '你猜温度', predictUnit: '℃', predictDefault: 40, predictMin: -50, predictMax: 200,
    params: [
      { key: 't0', label: '量程下限 t₀', unit: '℃', min: -30, max: 0, step: 5, value: -20 },
      { key: 't1', label: '量程上限 t₁', unit: '℃', min: 50, max: 150, step: 10, value: 100 },
      { key: 'n', label: '总小格数 n', unit: '格', options: [
        { label: '60 格', value: 60 }, { label: '100 格', value: 100 }
      ], value: 60 },
      { key: 'k', label: '液柱所在格 k', unit: '格', min: 1, max: 60, step: 1, value: 42 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => p.t0 + (p.t1 - p.t0) * x / p.n,
    domain: () => [1, 60],
    truth: p => p.t0 + (p.t1 - p.t0) * p.k / p.n,
    formula: '分度值 = (t₁−t₀)/n；读数 t = t₀ + 分度值×k',
    calc: p => '分度值 = (' + p.t1 + '−(' + p.t0 + '))/' + p.n + ' = ' + ((p.t1 - p.t0) / p.n).toFixed(1) + ' ℃/格；t = ' + p.t0 + ' + ' + ((p.t1 - p.t0) / p.n).toFixed(1) + '×' + p.k + ' = ' + (p.t0 + (p.t1 - p.t0) * p.k / p.n).toFixed(1) + ' ℃',
    insight: '先把量程跨度除以格数得到分度值，再从下限往上数。中考实验题最常考的就是「看错分度值」和「把零下读成正数」。',
    boundary: '假设液体均匀膨胀、刻度线性、视线与液柱顶端平齐。体温计量程 35~42 ℃、分度值 0.1 ℃ 且有缩口，可以离开人体读数，规则不同。',
    next: '把总格数换成 100 格再猜——同一位置的读数会变高还是变低？',
    curveLabel: p => '横轴是液柱格数 k，t = ' + p.t0 + ' + ' + ((p.t1 - p.t0) / p.n).toFixed(1) + '·k；当前 ' + (p.t0 + (p.t1 - p.t0) * p.k / p.n).toFixed(1) + ' ℃'
  },
  {
    id: 'j8a_dispersion', stage: '初中', subject: '物理', chapter: '八上 · 第四章 · 光的色散',
    title: '白光穿过三棱镜，哪头是红哪头是紫',
    hook: '同一种玻璃，对不同颜色「拐弯的力气」并不一样。',
    question: '白光经三棱镜色散，红光和紫光谁偏折得更少？填 +1 表示红光、−1 表示紫光。',
    predictLabel: '你猜偏折更小', predictUnit: '', predictDefault: -1, predictMin: -2, predictMax: 2,
    params: [
      { key: 'n', label: '棱镜折射率 n', unit: '', min: 1.3, max: 1.9, step: 0.05, value: 1.5 },
      { key: 'ang', label: '入射角', unit: '°', min: 10, max: 70, step: 5, value: 40 },
      { key: 'pick', label: '你关注的颜色', unit: '', options: [
        { label: '红光', value: 1 }, { label: '紫光', value: -1 }
      ], value: 1 }
    ],
    renderer: 'diagram', duration: 2.8,
    diagram: p => [
      { label: '入射光', value: '白光 · ' + p.ang + '°' },
      { label: '三棱镜', value: 'n ≈ ' + p.n.toFixed(2), tone: 'warn' },
      { label: '折射率与波长', value: '紫光 n 更大' },
      { label: '偏折最小', value: '红光（+1）', tone: 'good' },
      { label: '偏折最大', value: '紫光', tone: 'good' },
      { label: '光屏', value: '红 → 紫 彩色光带' }
    ],
    truth: () => 1,
    formula: '正常色散：n紫 > n红 → 紫光偏折更多；说明白光是复色光',
    calc: p => '玻璃对波长越短的光折射率越大，紫光（约 400 nm）比红光（约 700 nm）偏折更多；答案 +1，与棱镜 n = ' + p.n.toFixed(2) + '、入射角 ' + p.ang + '° 无关',
    insight: '牛顿用三棱镜把白光拆成七色，再用第二个棱镜倒回去，证明色不是棱镜「染」上去的。彩虹是水滴里的折射 + 反射 + 色散。',
    boundary: '正常色散范围内成立；某些材料在吸收带附近会出现反常色散。这里只比较偏折方向，不计算具体角度；几何光学近似。',
    next: '把关注颜色切到紫光再跑——答案会变吗？真值只由物理规律决定。',
    caption: p => '装置：白光 → 三棱镜 → 光屏；节点按「入射 → 折射率差异 → 色带顺序」依次点亮'
  },
  {
    id: 'j8a_glasses', stage: '初中', subject: '物理', chapter: '八上 · 第五章 · 眼睛和眼镜',
    title: '200 度的近视镜，焦距是多少',
    hook: '「度数」不是放大倍数，是焦距倒数的 100 倍。',
    question: '一副 −200 度的近视眼镜，透镜焦距的大小是多少 m？',
    predictLabel: '你猜焦距大小', predictUnit: 'm', predictDefault: 2, predictMin: 0, predictMax: 10,
    params: [
      { key: 'D', label: '眼镜度数', unit: '度', options: [
        { label: '−1000 度', value: -1000 }, { label: '−500 度', value: -500 },
        { label: '−200 度', value: -200 }, { label: '+200 度', value: 200 },
        { label: '+500 度', value: 500 }, { label: '+1000 度', value: 1000 }
      ], value: -200 },
      { key: 'u', label: '眼睛远点距离', unit: 'm', min: 0.1, max: 5, step: 0.1, value: 0.5 },
      { key: 'h', label: '镜片直径', unit: 'cm', min: 2, max: 10, step: 1, value: 5 }
    ],
    renderer: 'function', duration: 2.6,
    curve: p => x => 100 / x,
    domain: () => [100, 1000],
    truth: p => 100 / Math.abs(p.D),
    formula: '焦度 Φ = 1/f（f 用 m），眼镜度数 = 100Φ → |f| = 100/|度数|',
    calc: p => 'Φ = ' + p.D + '/100 = ' + (p.D / 100).toFixed(1) + ' m⁻¹；|f| = 1/|Φ| = ' + (100 / Math.abs(p.D)).toFixed(2) + ' m（负号表示凹透镜；远点 ' + p.u.toFixed(1) + ' m、镜片直径 ' + p.h + ' cm 不进入换算）',
    insight: '近视眼成像在视网膜前，要用凹透镜（度数为负）把光先发散；远视眼用凸透镜（度数为正）。−200 度就是 0.5 m 焦距的凹透镜。',
    boundary: '薄透镜、空气中、镜眼距离忽略。度数只是焦度的 100 倍，与放大倍数无关；实际镜片有厚度、像散，验光还要考虑瞳距与散光轴位。',
    next: '把度数换成 −1000 度再猜——焦距会缩到 0.1 m 吗？',
    curveLabel: p => '横轴是度数的绝对值，|f| = 100/|度数| 是双曲线；当前 ' + p.D + ' 度 → ' + (100 / Math.abs(p.D)).toFixed(2) + ' m'
  },
  {
    id: 'j8a_magnifier', stage: '初中', subject: '物理', chapter: '八上 · 第五章 · 生活中的透镜',
    title: '放大镜凑近焦点，字会被放大几倍',
    hook: '越靠近焦点字越大，越过焦点像就翻过来、还成不到屏上。',
    question: '焦距 10 cm 的放大镜，物体放在离透镜 8 cm 处，放大倍数是多少倍？',
    predictLabel: '你猜放大倍数', predictUnit: '倍', predictDefault: 2, predictMin: 0, predictMax: 100,
    params: [
      { key: 'f', label: '焦距 f', unit: 'cm', min: 10, max: 20, step: 1, value: 10 },
      { key: 'u', label: '物距 u', unit: 'cm', min: 1, max: 9, step: 0.5, value: 8 },
      { key: 'h', label: '物体高度 h', unit: 'cm', min: 1, max: 10, step: 1, value: 2 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => p.f / (p.f - x),
    domain: () => [1, 9],
    truth: p => p.f / (p.f - p.u),
    formula: '放大镜（u < f）：成正立放大虚像，M = f/(f − u)',
    calc: p => 'M = ' + p.f + '/(' + p.f + '−' + p.u.toFixed(1) + ') = ' + (p.f / (p.f - p.u)).toFixed(2) + ' 倍（物体高 ' + p.h + ' cm → 虚像高 ' + (p.h * p.f / (p.f - p.u)).toFixed(1) + ' cm）',
    insight: 'u 越接近 f，分母越小，放大倍数急剧变大；一旦 u ≥ f，1/f = 1/u + 1/v 给出正的实像距，就变成投影仪/照相机了。虚像不能成在光屏上。',
    boundary: '薄透镜、近轴光线、u < f。实际放大镜有像差与视场限制，边缘会变形；眼睛位置也会改变实际视角放大率。',
    next: '把 u 拖到 9 cm 再猜——倍数会接近 10 倍吗？',
    curveLabel: p => '横轴是物距 u，M = ' + p.f + '/(' + p.f + '−u) 在靠近 f 时急剧上翘；当前 ' + (p.f / (p.f - p.u)).toFixed(2) + ' 倍'
  },
  {
    id: 'j8a_hollow_ball', stage: '初中', subject: '物理', chapter: '八上 · 第六章 · 测量物质的密度',
    title: '79 g 的铁球量出 20 cm³，是空心的吗',
    hook: '排水法量的是「外轮廓」，不是铁真正占的体积。',
    question: '质量 79 g、材料密度 7.9 g/cm³ 的铁球，排水量得体积 20 cm³，空心部分多大？',
    predictLabel: '你猜空心体积', predictUnit: 'cm³', predictDefault: 2, predictMin: -200, predictMax: 300,
    params: [
      { key: 'm', label: '球的质量 m', unit: 'g', min: 10, max: 500, step: 1, value: 79 },
      { key: 'V', label: '排水法测得体积 V', unit: 'cm³', min: 5, max: 200, step: 1, value: 20 },
      { key: 'rhoMat', label: '材料密度 ρ材料', unit: 'g/cm³', min: 1, max: 20, step: 0.5, value: 7.9 },
      { key: 'h', label: '量筒初始水深', unit: 'cm', min: 1, max: 20, step: 1, value: 5 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => x - p.m / p.rhoMat,
    domain: () => [5, 200],
    truth: p => p.V - p.m / p.rhoMat,
    formula: 'V实 = m/ρ材料；V空 = V测 − V实（V测 由排水法得到）',
    calc: p => 'V实 = ' + p.m + '/' + p.rhoMat.toFixed(1) + ' = ' + (p.m / p.rhoMat).toFixed(1) + ' cm³；V空 = ' + p.V + ' − ' + (p.m / p.rhoMat).toFixed(1) + ' = ' + (p.V - p.m / p.rhoMat).toFixed(1) + ' cm³（平均密度 ' + (p.m / p.V).toFixed(2) + ' g/cm³）',
    insight: '平均密度 m/V 小于材料密度就说明空心（或掺了轻材料）。排水法测到的是球壳围出来的整个外体积，所以两者之差就是空腔。',
    boundary: '物体不吸水、不溶于液体、完全浸没且不碰杯壁杯底；空心部分必须封闭不进水；读数时视线与液面凹处最低点平齐。若 V实 > V测，说明给定的 m 与 ρ 不自洽。',
    next: '把质量调到 158 g 再猜——V空 会变成 0 吗？',
    curveLabel: p => '横轴是测得体积 V，V空 = V − ' + (p.m / p.rhoMat).toFixed(1) + ' 是斜率为 1 的直线；当前 ' + (p.V - p.m / p.rhoMat).toFixed(1) + ' cm³'
  },
  {
    id: 'j8b_spring_scale', stage: '初中', subject: '物理', chapter: '八下 · 第七章 · 弹力',
    title: '弹簧拉长 3 cm，测力计该读几牛',
    hook: '刻度之所以均匀，是因为伸长量和拉力成正比。',
    question: '劲度系数 2 N/cm 的弹簧拉长 3 cm，弹簧测力计读数是多少 N？',
    predictLabel: '你猜读数', predictUnit: 'N', predictDefault: 3, predictMin: 0, predictMax: 100,
    params: [
      { key: 'k', label: '劲度系数 k', unit: 'N/cm', min: 0.5, max: 5, step: 0.5, value: 2 },
      { key: 'x', label: '伸长量 Δx', unit: 'cm', min: 0.5, max: 10, step: 0.5, value: 3 },
      { key: 'm', label: '悬挂物质量 m', unit: 'kg', min: 0.1, max: 5, step: 0.1, value: 1 }
    ],
    renderer: 'function', duration: 2.6,
    curve: p => xx => p.k * xx,
    domain: () => [0.5, 10],
    truth: p => p.k * p.x,
    formula: '胡克定律（弹性限度内）：F = k·Δx',
    calc: p => 'F = ' + p.k.toFixed(1) + ' × ' + p.x.toFixed(1) + ' = ' + (p.k * p.x).toFixed(1) + ' N（悬挂物质量 ' + p.m.toFixed(1) + ' kg 只是让弹簧伸长的外部原因）',
    insight: 'F 与 Δx 是一次函数，所以测力计刻度等间距。使用前要看量程、调零、沿弹簧轴线方向拉，读数时视线与指针平齐。',
    boundary: '只在弹性限度内成立；超过限度弹簧会永久变形，刻度全废。忽略弹簧自重与摩擦，静止读数；动态晃动时示数会振荡。',
    next: '把 Δx 拖到 10 cm 再猜——读数会到 20 N 吗？这时还在线性范围吗？',
    curveLabel: p => '横轴是伸长量 Δx，F = ' + p.k.toFixed(1) + '·Δx 是过原点直线；当前 ' + (p.k * p.x).toFixed(1) + ' N'
  },
  {
    id: 'j8b_no_work', stage: '初中', subject: '物理', chapter: '八下 · 第十一章 · 功',
    title: '提着箱子水平走 10 m，力做了多少功',
    hook: '累得满头汗，物理上却一份功都没做。',
    question: '用 50 N 竖直向上的力提着箱子水平走 10 m，这个力做了多少 J 的功？',
    predictLabel: '你猜做功', predictUnit: 'J', predictDefault: 250, predictMin: 0, predictMax: 5000,
    params: [
      { key: 'F', label: '提力 F', unit: 'N', min: 5, max: 100, step: 5, value: 50 },
      { key: 's', label: '水平位移 s', unit: 'm', min: 1, max: 50, step: 1, value: 10 },
      { key: 'ang', label: '力与位移夹角 θ', unit: '°', min: 0, max: 90, step: 5, value: 90 },
      { key: 'm', label: '箱子质量 m', unit: 'kg', min: 1, max: 50, step: 1, value: 5 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => p.F * p.s * Math.cos(rad(x)),
    domain: () => [0, 90],
    truth: p => p.F * p.s * Math.cos(rad(p.ang)),
    formula: 'W = Fs·cosθ；θ = 90° 时 W = 0',
    calc: p => 'W = ' + p.F + ' × ' + p.s + ' × cos' + p.ang + '° = ' + (p.F * p.s * Math.cos(rad(p.ang))).toFixed(2) + ' J（箱子质量 ' + p.m + ' kg 不进入这个力的功）',
    insight: '做功必须同时满足「有力」和「沿力的方向有距离」。三种不做功：推墙不动（s=0）、惯性滑行（F=0）、提着水平走（力与位移垂直）。人累是肌肉在内部做功，不是这个提力对箱子做功。',
    boundary: '恒力、直线位移、只算某一个力做的功（不是合力功，也不是人体消耗的能量）。变力或曲线路径要沿路径积分。',
    next: '把 θ 拖到 0° 再猜——这时功会变成 500 J 吗？',
    curveLabel: p => '横轴是夹角 θ，W = ' + (p.F * p.s) + '·cosθ 从最大值降到 0；当前 ' + (p.F * p.s * Math.cos(rad(p.ang))).toFixed(2) + ' J'
  },
  {
    id: 'j8b_mech_efficiency', stage: '初中', subject: '物理', chapter: '八下 · 第十二章 · 机械效率',
    title: '动滑轮自己也有重量，效率还能到 100% 吗',
    hook: '提升高度被约掉，效率只跟「物重 vs 动滑轮重」有关。',
    question: '物重 200 N、动滑轮重 40 N，忽略摩擦时机械效率是多少 %？',
    predictLabel: '你猜机械效率', predictUnit: '%', predictDefault: 95, predictMin: 0, predictMax: 100,
    params: [
      { key: 'G', label: '物体重力 G', unit: 'N', min: 10, max: 500, step: 10, value: 200 },
      { key: 'Gd', label: '动滑轮重 G动', unit: 'N', min: 5, max: 200, step: 5, value: 40 },
      { key: 'h', label: '提升高度 h', unit: 'm', min: 0.5, max: 5, step: 0.5, value: 2 },
      { key: 'n', label: '承担重物的绳股数 n', unit: '股', min: 2, max: 6, step: 1, value: 3 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => 100 * p.G / (p.G + x),
    domain: () => [5, 200],
    truth: p => 100 * p.G / (p.G + p.Gd),
    formula: 'η = W有/W总 = Gh/[(G+G动)h] = G/(G+G动)',
    calc: p => 'η = ' + p.G + '/(' + p.G + '+' + p.Gd + ') = ' + (100 * p.G / (p.G + p.Gd)).toFixed(1) + '%（高度 ' + p.h.toFixed(1) + ' m 与绳股数 ' + p.n + ' 都被约掉）',
    insight: '提升动滑轮做的功是「不得不做的额外功」，所以 η 永远小于 100%。物越重，额外功占比越小，效率越高——这就是「满载更划算」。',
    boundary: '忽略绳重与摩擦、匀速提升。实际摩擦会额外降低效率；用滑轮组时 W总 = Fs 且 s = nh，公式要按实际拉力重算。',
    next: '把 G 拖到 500 N 再猜——效率会超过 90% 吗？能到 100% 吗？',
    curveLabel: p => '横轴是动滑轮重 G动，η = 100×' + p.G + '/(' + p.G + '+G动) 单调下降；当前 ' + (100 * p.G / (p.G + p.Gd)).toFixed(1) + '%'
  },
  {
    id: 'j8b_incline', stage: '初中', subject: '物理', chapter: '八下 · 第十二章 · 简单机械',
    title: '盘山公路为什么修得那么绕',
    hook: '省力不省功：少花力气，就得多走距离。',
    question: '把 200 N 的重物沿 4 m 长的斜面提升到 1 m 高处，理想情况下需要多大的拉力？',
    predictLabel: '你猜拉力', predictUnit: 'N', predictDefault: 200, predictMin: 0, predictMax: 1000,
    params: [
      { key: 'G', label: '物体重力 G', unit: 'N', min: 10, max: 500, step: 10, value: 200 },
      { key: 'h', label: '提升高度 h', unit: 'm', min: 0.5, max: 5, step: 0.5, value: 1 },
      { key: 'L', label: '斜面长度 L', unit: 'm', min: 1, max: 20, step: 0.5, value: 4 },
      { key: 'w', label: '斜面宽度 w', unit: 'm', min: 0.5, max: 5, step: 0.5, value: 1 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => p.G * p.h / x,
    domain: () => [1, 20],
    truth: p => p.G * p.h / p.L,
    formula: '功的原理：FL = Gh → F = Gh/L（L 越长越省力）',
    calc: p => 'F = ' + p.G + ' × ' + p.h.toFixed(1) + ' / ' + p.L.toFixed(1) + ' = ' + (p.G * p.h / p.L).toFixed(1) + ' N（斜面宽 ' + p.w.toFixed(1) + ' m 不影响；F 做的功 = ' + (p.G * p.h).toFixed(0) + ' J，与直接提升相同）',
    insight: '斜面把「一次抬起」拆成「长距离小推力」，但 F×L 与 G×h 始终相等，任何机械都不省功。盘山公路、螺丝螺纹、刀刃都是这个原理。',
    boundary: '忽略摩擦；实际 F = Gh/L + f，效率 η = Gh/(FL) < 100%。要求 L ≥ h（否则不是斜面）；匀速推动、不计物体转动。',
    next: '把 L 拖到 20 m 再猜——拉力会降到 10 N 吗？要走的距离呢？',
    curveLabel: p => '横轴是斜面长度 L，F = ' + (p.G * p.h).toFixed(0) + '/L 是双曲线；当前 ' + (p.G * p.h / p.L).toFixed(1) + ' N'
  },
  {
    id: 'j8b_buoyancy_weigh', stage: '初中', subject: '物理', chapter: '八下 · 第十章 · 浮力',
    title: '物体浸进水里，测力计为什么变轻了',
    hook: '不是重力变小，是水在底下托了一把。',
    question: '空气中测力计读数 5 N，浸没水中读数 3 N，浮力是多少 N？',
    predictLabel: '你猜浮力', predictUnit: 'N', predictDefault: 5, predictMin: -50, predictMax: 100,
    params: [
      { key: 'G', label: '空气中读数 G', unit: 'N', min: 1, max: 50, step: 1, value: 5 },
      { key: 'F', label: '浸没后读数 F示', unit: 'N', min: 0, max: 50, step: 1, value: 3 },
      { key: 'rho', label: '液体密度 ρ液', unit: 'g/cm³', options: [
        { label: '清水 1.0', value: 1 }, { label: '盐水 1.1', value: 1.1 }
      ], value: 1 },
      { key: 'V', label: '物体体积 V', unit: 'cm³', min: 10, max: 500, step: 10, value: 200 }
    ],
    renderer: 'function', duration: 2.6,
    curve: p => x => p.G - x,
    domain: () => [0, 50],
    truth: p => p.G - p.F,
    formula: '称重法：F浮 = G − F示',
    calc: p => 'F浮 = ' + p.G + ' − ' + p.F + ' = ' + (p.G - p.F).toFixed(1) + ' N（换成 ρ液 = ' + p.rho + ' g/cm³ 时示数会变，但差值法仍成立）',
    insight: '测力计拉力 + 浮力 = 重力，三力平衡。把示数变小的那部分「补」回来就是浮力；这也是实验室测浮力最常用的方法。',
    boundary: '物体完全浸没、不接触容器底与壁、不吸水、读数稳定。若 F示 > G，说明外力方向或读数有误；物体部分浸入时 F浮 只对应浸入的那部分体积。',
    next: '把 F示 拖到 5 N 再猜——浮力为 0 意味着什么？',
    curveLabel: p => '横轴是浸没后示数 F示，F浮 = ' + p.G + ' − F示 是斜率为 −1 的直线；当前 ' + (p.G - p.F).toFixed(1) + ' N'
  },
  {
    id: 'j8b_ship_displacement', stage: '初中', subject: '物理', chapter: '八下 · 第十章 · 物体的浮沉条件及应用',
    title: '5000 吨的船，要排开多少海水',
    hook: '船从海驶进河，会悄悄下沉一点。',
    question: '质量 5000 t 的轮船漂浮在密度 1.03 t/m³ 的海水中，排开海水体积是多少 m³？',
    predictLabel: '你猜排水体积', predictUnit: 'm³', predictDefault: 5000, predictMin: 0, predictMax: 20000,
    params: [
      { key: 'm', label: '轮船质量 m', unit: 't', min: 100, max: 10000, step: 100, value: 5000 },
      { key: 'rho', label: '液体密度 ρ液', unit: 't/m³', options: [
        { label: '海水 1.03', value: 1.03 }, { label: '淡水 1.00', value: 1 }
      ], value: 1.03 },
      { key: 'g', label: '重力加速度 g', unit: 'm/s²', options: G, value: 9.8 },
      { key: 'd', label: '吃水深度 d', unit: 'm', min: 1, max: 20, step: 1, value: 5 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => p.m / x,
    domain: () => [1, 1.1],
    truth: p => p.m / p.rho,
    formula: '漂浮：F浮 = G → ρ液 g V排 = mg → V排 = m/ρ液',
    calc: p => 'V排 = ' + p.m + '/' + p.rho + ' = ' + (p.m / p.rho).toFixed(0) + ' m³（g = ' + p.g + ' 在等式两边约掉；吃水深度 ' + p.d + ' m 是结果不是原因）',
    insight: '船重不变、浮力就不变；从海水驶入密度更小的淡水，V排 必须变大，于是船身下沉。「排水量」说的其实是船的质量，不是水的体积。',
    boundary: '漂浮且静止、液体密度均匀、船体不进水。装载变化会改变 m；g 被约掉所以换到月球（仍有液体）结论不变；结冰或盐度分层会让 ρ 不均匀。',
    next: '把介质换成淡水再猜——V排 会变成 5000 m³ 吗？',
    curveLabel: p => '横轴是液体密度 ρ液，V排 = ' + p.m + '/ρ液 是双曲线；当前 ' + (p.m / p.rho).toFixed(0) + ' m³'
  },
  // ══════════════ 2026-11-17 · 批次 H：九全收尾 + 第二十二章空白（7 条）══════════════
  // 第二十二章「能源与可持续发展」此前 0 条，本次补上核能；
  // 变阻器接线 / 安全用电 / 奥斯特实验用 diagram 承接教材定性实验。
  {
    id: 'j9_ammeter_scale', stage: '初中', subject: '物理', chapter: '九全 · 第十五章 · 电流的测量',
    title: '同一根指针，换个量程读数差几倍',
    hook: '接线柱决定量程，看错量程是实验题第一大坑。',
    question: '指针停在 30 格中的第 12 格，接 0~3 A 量程时读数是多少 A？',
    predictLabel: '你猜电流读数', predictUnit: 'A', predictDefault: 0.24, predictMin: 0, predictMax: 10,
    params: [
      { key: 'pos', label: '指针所在格数 k', unit: '格', min: 1, max: 30, step: 1, value: 12 },
      { key: 'n', label: '表盘总格数 n', unit: '格', options: [
        { label: '30 格', value: 30 }, { label: '50 格', value: 50 }
      ], value: 30 },
      { key: 'range', label: '所接量程', unit: 'A', options: [
        { label: '0~0.6 A', value: 0.6 }, { label: '0~3 A', value: 3 }
      ], value: 3 },
      { key: 't', label: '通电时间 t', unit: 's', min: 1, max: 60, step: 1, value: 10 }
    ],
    renderer: 'function', duration: 2.6,
    curve: p => x => p.range * x / p.n,
    domain: () => [1, 30],
    truth: p => p.range * p.pos / p.n,
    formula: '读数 = 量程 × 指针格数/总格数（分度值 = 量程/总格数）',
    calc: p => '分度值 = ' + p.range + '/' + p.n + ' = ' + (p.range / p.n).toFixed(3) + ' A/格；I = ' + (p.range / p.n).toFixed(3) + '×' + p.pos + ' = ' + (p.range * p.pos / p.n).toFixed(2) + ' A（通电 ' + p.t + ' s 不改变瞬时读数）',
    insight: '指针偏转角度由电流决定，但刻度对应哪个数值取决于接的是哪个接线柱。同一位置在 3 A 挡的读数正好是 0.6 A 挡的 5 倍。',
    boundary: '指针式表、刻度均匀、视线与表盘垂直、指针已调零。数字表直接读数；超过量程会打表甚至烧坏电表，试触时要先选大量程。',
    next: '把量程切到 0~0.6 A 再猜——读数会变成 0.24 A 吗？',
    curveLabel: p => '横轴是指针格数 k，I = (' + p.range + '/' + p.n + ')·k；当前 ' + (p.range * p.pos / p.n).toFixed(2) + ' A'
  },
  {
    id: 'j9_varistor_wiring', stage: '初中', subject: '物理', chapter: '九全 · 第十六章 · 变阻器',
    title: '接了上面两个接线柱，滑片还能调电阻吗',
    hook: '四根接线柱看着都能接，只有「一上一下」才管用。',
    question: '滑动变阻器接上面两个接线柱，把滑片从 30% 滑到 100%，接入电阻变化了多少 Ω？',
    predictLabel: '你猜电阻变化量', predictUnit: 'Ω', predictDefault: 15, predictMin: 0, predictMax: 200,
    params: [
      { key: 'Rmax', label: '变阻器最大阻值', unit: 'Ω', min: 10, max: 200, step: 10, value: 50 },
      { key: 'pos', label: '滑片位置', unit: '%', min: 0, max: 100, step: 10, value: 30 },
      { key: 'wire', label: '接线方式', unit: '', options: [
        { label: '一上一下（正确）', value: 1 },
        { label: '同上（都接金属杆）', value: 0 },
        { label: '同下（都接电阻丝）', value: -1 }
      ], value: 0 }
    ],
    renderer: 'diagram', duration: 2.8,
    diagram: p => [
      { label: '接线柱', value: p.wire === 1 ? '一上一下' : (p.wire === 0 ? '同上（金属杆）' : '同下（电阻丝）'), tone: 'warn' },
      { label: '滑片位置', value: p.pos + '%' },
      { label: '接入电阻', value: p.wire === 1 ? (p.Rmax * p.pos / 100).toFixed(1) + ' Ω' : (p.wire === 0 ? '≈ 0 Ω' : p.Rmax + ' Ω'), tone: 'good' },
      { label: '滑片移到头', value: p.wire === 1 ? '阻值改变' : '阻值不变', tone: 'good' },
      { label: '最大阻值 R最大', value: p.Rmax + ' Ω' },
      { label: '结论', value: p.wire === 1 ? '能调节电流' : '接了等于没接', tone: 'good' }
    ],
    truth: () => 0,
    formula: '必须「一上一下」接线：同上 ≈ 0 Ω、同下 = R最大，滑片移动都不改变接入电阻',
    calc: p => '接上面两个接线柱相当于接了一根金属杆，接入电阻恒 ≈ 0 Ω，变化量 = 0 Ω；最大阻值 ' + p.Rmax + ' Ω 与滑片 ' + p.pos + '% 都影响不到它',
    insight: '上面两个接线柱连的是电阻可忽略的金属杆，下面两个连的是整根电阻丝。只有一上一下，滑片才能改变「接入电路的那段电阻丝」的长度。',
    boundary: '忽略金属杆与接触电阻；闭合开关前滑片应置于阻值最大处以保护电路；本实验讨论的是接入电阻，不是整个变阻器的总电阻。',
    next: '把接线方式切到「同下」再跑——阻值恒为最大值，变化量还是 0 吗？',
    caption: p => '装置：滑动变阻器四接线柱 → 滑片 → 电流表；节点按「接法 → 接入段 → 滑片效果」依次点亮'
  },
  {
    id: 'j9_elec_bill', stage: '初中', subject: '物理', chapter: '九全 · 第十八章 · 电能 电功',
    title: '1 kW 的电器每天开 4 小时，一个月多少电费',
    hook: '电能表上的「度」就是 kW·h，别把 W 和 kW 搞混。',
    question: '1000 W 的电器每天用 4 h、用 30 天，电价 0.6 元/度，电费是多少元？',
    predictLabel: '你猜电费', predictUnit: '元', predictDefault: 120, predictMin: 0, predictMax: 10000,
    params: [
      { key: 'P', label: '电器功率 P', unit: 'W', min: 10, max: 3000, step: 50, value: 1000 },
      { key: 'hours', label: '每天使用时长', unit: 'h', min: 0.5, max: 24, step: 0.5, value: 4 },
      { key: 'days', label: '使用天数', unit: '天', min: 1, max: 60, step: 1, value: 30 },
      { key: 'price', label: '电价', unit: '元/度', min: 0.3, max: 2, step: 0.1, value: 0.6 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => p.P / 1000 * p.hours * x * p.price,
    domain: () => [1, 60],
    truth: p => p.P / 1000 * p.hours * p.days * p.price,
    formula: 'W = P·t（kW·h，1 度 = 1 kW·h = 3.6×10⁶ J）；电费 = W × 单价',
    calc: p => 'W = (' + p.P + '/1000) kW × ' + p.hours.toFixed(1) + ' h × ' + p.days + ' = ' + (p.P / 1000 * p.hours * p.days).toFixed(1) + ' 度；电费 = ' + (p.P / 1000 * p.hours * p.days).toFixed(1) + ' × ' + p.price.toFixed(1) + ' = ' + (p.P / 1000 * p.hours * p.days * p.price).toFixed(1) + ' 元',
    insight: '功率用 kW、时间用 h，相乘直接得「度」。电能表读的是累计消耗量，两次读数之差才是这段时间的用电量；待机功率小但 24 小时不停，常年下来也不少。',
    boundary: '功率恒定、按单一电价计算。实际有阶梯电价、峰谷分时、待机功耗与功率因数；电能表读数末位常是小数位，要看清。',
    next: '把每天时长拖到 24 h 再猜——一个月会用掉多少度？',
    curveLabel: p => '横轴是使用天数，电费 = (' + (p.P / 1000 * p.hours * p.price).toFixed(2) + ' 元/天)·天数；当前 ' + (p.P / 1000 * p.hours * p.days * p.price).toFixed(1) + ' 元'
  },
  {
    id: 'j9_safety', stage: '初中', subject: '物理', chapter: '九全 · 第十九章 · 安全用电',
    title: '36 V 为什么被定为安全电压',
    hook: '危险的不是电压数字，是通过人体的电流。',
    question: '人体电阻按 2000 Ω 估算，接触 220 V 火线时通过人体的电流约多少 mA？',
    predictLabel: '你猜通过电流', predictUnit: 'mA', predictDefault: 1, predictMin: 0, predictMax: 1000,
    params: [
      { key: 'U', label: '接触电压 U', unit: 'V', min: 10, max: 380, step: 10, value: 220 },
      { key: 'R', label: '人体电阻 R', unit: 'Ω', min: 500, max: 100000, step: 500, value: 2000 },
      { key: 'touch', label: '接触方式', unit: '', options: [
        { label: '单手接触火线', value: 1 }, { label: '双手分别接触', value: 2 }
      ], value: 1 }
    ],
    renderer: 'diagram', duration: 2.8,
    diagram: p => [
      { label: '接触电压', value: p.U + ' V' },
      { label: '人体电阻', value: p.R + ' Ω', tone: 'warn' },
      { label: '通过电流', value: (p.U / p.R * 1000).toFixed(1) + ' mA', tone: 'warn' },
      { label: '摆脱阈值', value: '约 10 mA' },
      { label: '安全电压', value: '不高于 36 V', tone: 'good' },
      { label: '原则', value: '不接触低压带电体', tone: 'good' }
    ],
    truth: p => p.U / p.R * 1000,
    formula: 'I = U/R人体；行业规定安全电压不高于 36 V',
    calc: p => 'I = ' + p.U + '/' + p.R + ' = ' + (p.U / p.R * 1000).toFixed(1) + ' mA，已远超 10 mA 摆脱阈值；换成 36 V 时只有 ' + (36 / p.R * 1000).toFixed(1) + ' mA',
    insight: '人体电阻变化极大：皮肤干燥时可达数万欧，出汗或潮湿时骤降到几百欧，所以「36 V 一定安全」也不是绝对的。真正决定伤害的是电流大小与通电时间。',
    boundary: '纯电阻估算、电流路径固定，仅用于数量级认知，不能用于实际安全判断。实际还与接触面积、皮肤湿度、交流电频率、通电时长、电流是否经过心脏有关；本模型未计入这些。',
    next: '把 U 拖到 36 V 再猜——电流会降到多少 mA？',
    caption: p => '装置：电源线 → 人体 → 大地；节点按「电压 → 电阻 → 电流 → 安全阈值」依次点亮'
  },
  {
    id: 'j9_oster', stage: '初中', subject: '物理', chapter: '九全 · 第二十章 · 电生磁',
    title: '把电流方向反过来，小磁针会怎么转',
    hook: '1820 年的一次课堂演示，第一次把电和磁连到一起。',
    question: '奥斯特实验中，把导线电流方向反过来，小磁针 N 极的偏转方向会怎样？填 +1 表示不变、−1 表示反转。',
    predictLabel: '你猜偏转方向', predictUnit: '', predictDefault: 1, predictMin: -2, predictMax: 2,
    params: [
      { key: 'I', label: '导线电流 I', unit: 'A', min: 0.5, max: 5, step: 0.5, value: 2 },
      { key: 'dir', label: '电流方向', unit: '', options: [
        { label: '正向', value: 1 }, { label: '反向', value: -1 }
      ], value: 1 },
      { key: 'd', label: '导线到磁针距离', unit: 'cm', min: 1, max: 20, step: 1, value: 5 }
    ],
    renderer: 'diagram', duration: 2.8,
    diagram: p => [
      { label: '导线电流', value: p.I.toFixed(1) + ' A · ' + (p.dir > 0 ? '正向' : '反向（已对调）'), tone: 'warn' },
      { label: '导线周围', value: '产生环形磁场' },
      { label: '小磁针', value: 'N 极发生偏转' },
      { label: '电流反向', value: '磁场方向跟着反转', tone: 'good' },
      { label: 'N 极偏转', value: '反转（−1）', tone: 'good' },
      { label: '定则', value: '右手螺旋定则' }
    ],
    truth: () => -1,
    formula: '电流的磁效应：磁场方向由电流方向决定（右手螺旋定则），电流反向则磁场反向',
    calc: p => '电流 ' + p.I.toFixed(1) + ' A 反向 → 环形磁场反向 → 小磁针 N 极偏转方向反转（−1）；距离 ' + p.d + ' cm 只影响偏转幅度，不改变方向',
    insight: '磁场是电流「造」出来的，方向只由电流方向决定；电流大小、距离远近只改变磁场强弱和偏转角大小。这也是电磁铁、电磁继电器能工作的起点。',
    boundary: '忽略地磁场与附近铁磁物体；导线需与小磁针平行放置现象才明显；电流太小或距离太远时偏转被地磁场淹没。',
    next: '把电流方向切到「反向」再跑——真值仍然是 −1 吗？想想题目问的是「改变后相对原来」。',
    caption: p => '装置：直导线 → 下方小磁针 → 电源；节点按「通电 → 生磁 → 反向 → 偏转反转」依次点亮'
  },
  {
    id: 'j9_generator', stage: '初中', subject: '物理', chapter: '九全 · 第二十章 · 磁生电',
    title: '50 Hz 的交流电，一秒换向多少次',
    hook: '线圈转一圈，电流方向变两次。',
    question: '我国市电频率 50 Hz，发电机线圈每秒转 50 圈，感应电流方向每秒改变多少次？',
    predictLabel: '你猜换向次数', predictUnit: '次', predictDefault: 50, predictMin: 0, predictMax: 500,
    params: [
      { key: 'f', label: '交流电频率 f', unit: 'Hz', min: 10, max: 100, step: 5, value: 50 },
      { key: 'N', label: '线圈匝数 N', unit: '匝', min: 50, max: 500, step: 50, value: 200 },
      { key: 'B', label: '磁感应强度 B', unit: 'T', min: 0.1, max: 1, step: 0.1, value: 0.4 }
    ],
    renderer: 'function', duration: 2.6,
    curve: p => x => 2 * x,
    domain: () => [10, 100],
    truth: p => 2 * p.f,
    formula: '线圈每转一圈，感应电流方向改变 2 次 → 每秒换向次数 = 2f',
    calc: p => '2 × ' + p.f + ' = ' + (2 * p.f) + ' 次/秒（匝数 ' + p.N + '、磁场 ' + p.B.toFixed(1) + ' T 只影响电动势大小，不改变换向次数）',
    insight: '线圈每转半圈，两边导体切割磁感线的方向就反一次，电流跟着换向，所以一个周期换向两次。发电机把机械能变电能（电磁感应），电动机把电能变机械能（安培力），两个过程正好互逆。',
    boundary: '匀速转动、一对磁极、线圈每转一周完成一个周期。实际电网频率有微小波动；多极发电机 f = pn/60，换向次数仍为 2f。',
    next: '把 f 拖到 100 Hz 再猜——换向次数会到 200 次吗？',
    curveLabel: p => '横轴是频率 f，换向次数 = 2f 是过原点直线；当前 ' + (2 * p.f) + ' 次/秒'
  },
  {
    id: 'j9_nuclear_energy', stage: '初中', subject: '物理', chapter: '九全 · 第二十二章 · 核能',
    title: '1 g 铀裂变，相当于烧多少煤',
    hook: '质量只「少」了千分之一，能量却大得离谱，因为乘的是光速平方。',
    question: '1 g 铀完全裂变、约 0.1% 的质量转化为能量，释放的能量是多少 ×10¹⁰ J？',
    predictLabel: '你猜释放能量', predictUnit: '×10¹⁰ J', predictDefault: 1, predictMin: 0, predictMax: 1000,
    params: [
      { key: 'm', label: '参与反应的质量 m', unit: 'g', min: 0.1, max: 10, step: 0.1, value: 1 },
      { key: 'eta', label: '质量亏损比例 η', unit: '%', min: 0.01, max: 1, step: 0.01, value: 0.1 },
      { key: 't', label: '发电时长', unit: 'h', min: 1, max: 24, step: 1, value: 10 }
    ],
    renderer: 'function', duration: 3.0,
    curve: p => x => p.m * x * 90,
    domain: () => [0.01, 1],
    truth: p => p.m * p.eta * 90,
    formula: 'E = Δm·c²，Δm = m·η；取 c = 3×10⁸ m/s，1 g 对应 9×10¹³ J = 9000×10¹⁰ J（再乘 η）',
    calc: p => 'Δm = ' + p.m.toFixed(1) + ' g × ' + p.eta.toFixed(2) + '% = ' + (p.m * p.eta / 100).toFixed(4) + ' g = ' + (p.m * p.eta / 1e5).toExponential(2) + ' kg；E = Δm·c² ≈ ' + (p.m * p.eta * 90).toFixed(1) + '×10¹⁰ J（发电 ' + p.t + ' h 不改变总能量）',
    insight: '1 g 铀-235 全部裂变约放 8×10¹⁰ J，相当于烧约 2.7 吨标准煤；能量密度是化学燃料的百万倍量级。核能来自原子核结合能，属于不可再生能源；太阳能本质也是太阳内部的核聚变。',
    boundary: 'η = 0.1% 是铀裂变的典型量级，氘氚聚变约 0.7%；这里假设装料全部参与反应，实际燃耗远小于此。未计入中微子带走的能量，也未计入汽轮机发电约 30~40% 的热效率；结果是「释放能量」不是「上网电量」。',
    next: '把 η 拖到 0.7%（聚变）再猜——能量会变成 7 倍吗？',
    curveLabel: p => '横轴是质量亏损比例 η（%），E = ' + (p.m * 90).toFixed(0) + '·η ×10¹⁰ J 是直线；当前 ' + (p.m * p.eta * 90).toFixed(1) + '×10¹⁰ J'
  },

  // ── 2026-11-17 教材定性栏目收尾批次（9 条）────────────────────
  // 噪声等级 / 升华凝华 / 看不见的光 / 显微镜望远镜 / 力的三要素 /
  // 杠杆分类 / 内能改变方式 / 电路图识别 / 能源分类。
  // 能用「猜一个数」承载的定性考点一律保留四步框架：方向、分类用 ±1 / 1·2·3
  // 编码，真值随参数变化；转动效果与杠杆分类直接做成 function 定量曲线。
  {
    id: 'j8a_noise_level', stage: '初中', subject: '物理', chapter: '八上 · 第二章 · 噪声的危害和控制',
    title: '装了隔音墙，是在哪一环节减弱噪声',
    hook: '0 dB 不是「没有声音」，而是人耳刚能听到的下限。',
    question: '当前这个降噪措施属于哪一环节？填 1 = 声源处、2 = 传播过程中、3 = 人耳处（切换「降噪措施」再看答案变不变）。',
    predictLabel: '你猜控制环节', predictUnit: '', predictDefault: 1, predictMin: 0, predictMax: 4,
    params: [
      { key: 'L', label: '环境噪声级', unit: 'dB', min: 20, max: 110, step: 5, value: 70 },
      { key: 'way', label: '降噪措施', unit: '', options: [
        { label: '汽车装消声器（声源处）', value: 1 },
        { label: '路旁装隔音墙（传播中）', value: 2 },
        { label: '工人戴防噪耳塞（人耳处）', value: 3 }
      ], value: 2 },
      { key: 't', label: '暴露时长', unit: 'h', min: 1, max: 12, step: 1, value: 4 }
    ],
    renderer: 'diagram', duration: 2.8,
    diagram: p => [
      { label: '0 dB', value: '听觉下限，不是无声' },
      { label: '30~40 dB', value: '较理想的安静环境' },
      { label: '50 dB', value: '保证休息睡眠的上限' },
      { label: '70 / 90 dB', value: '保证工作学习 / 保护听力', tone: 'warn' },
      { label: '当前环境', value: p.L + ' dB · 暴露 ' + p.t + ' h' },
      { label: '三条途径', value: '声源 / 传播 / 人耳 → 答案 ' + p.way, tone: 'good' }
    ],
    truth: p => p.way,
    formula: '控制噪声的三条途径：在声源处、在传播过程中、在人耳处；分贝阈值 50 / 70 / 90 dB',
    calc: p => '当前 ' + p.L + ' dB：' + (p.L > 90 ? '超过 90 dB，长期暴露损伤听力' : p.L > 70 ? '超过 70 dB，影响工作学习' : p.L > 50 ? '超过 50 dB，影响休息睡眠' : '低于 50 dB，属安静范围') + '；措施归类 = ' + (p.way === 1 ? '声源处（1）' : p.way === 2 ? '传播过程中（2）' : '人耳处（3）') + '，与暴露 ' + p.t + ' h 无关',
    insight: '隔音墙、关门窗、道路两旁植树都是「在传播过程中」把声音挡住；消声器是「在声源处」少发声，耳塞是「在人耳处」少接收。教材按声音到达人耳之前的三个位置分类，与噪声本身多大无关。',
    boundary: '教材只要求定性的等级划分与三途径归类。分贝是对数标度，两处 60 dB 的声源叠加并不是 120 dB（约 63 dB），这里不做对数叠加；也不计入个体听力差异、频谱计权与距离衰减。',
    next: '把降噪措施切到「戴耳塞」再跑——真值会跟着变成 3 吗？',
    caption: () => '装置：声源 → 传播路径 → 人耳；节点按「分贝阈值 → 三条控制途径」依次点亮'
  },
  {
    id: 'j8a_sublimation', stage: '初中', subject: '物理', chapter: '八上 · 第三章 · 升华和凝华',
    title: '霜是「冻」出来的，可它到底是吸热还是放热',
    hook: '固态和气态之间可以不经过液态，直接跳过去。',
    question: '当前这种物态变化是吸热还是放热？填 +1 = 吸热、−1 = 放热（切换「物态变化」再看答案变不变）。',
    predictLabel: '你猜吸放热', predictUnit: '', predictDefault: 1, predictMin: -2, predictMax: 2,
    params: [
      { key: 'proc', label: '物态变化', unit: '', options: [
        { label: '升华（固→气）', value: 1 },
        { label: '凝华（气→固）', value: -1 }
      ], value: -1 },
      { key: 'T', label: '环境温度', unit: '℃', min: -30, max: 40, step: 2, value: -5 },
      { key: 'm', label: '物质质量', unit: 'g', min: 1, max: 50, step: 1, value: 10 }
    ],
    renderer: 'diagram', duration: 2.8,
    diagram: p => [
      { label: '初始物态', value: p.proc > 0 ? '固态（干冰 / 樟脑丸 / 冰）' : '气态（水蒸气）' },
      { label: '末态', value: p.proc > 0 ? '气态，跳过液态' : '固态，跳过液态' },
      { label: '热量方向', value: p.proc > 0 ? '吸热（+1）' : '放热（−1）', tone: 'good' },
      { label: '常见现象', value: p.proc > 0 ? '干冰升华、樟脑丸变小、灯丝变细' : '霜、雾凇、窗上冰花、灯泡变黑' },
      { label: '易错点', value: '「白气」是小液滴，属于液化', tone: 'warn' },
      { label: '当前条件', value: p.T + ' ℃ · ' + p.m + ' g' }
    ],
    truth: p => p.proc,
    formula: '升华（固→气）吸热；凝华（气→固）放热；两者都跳过液态',
    calc: p => (p.proc > 0 ? '升华：固态直接变气态，分子挣脱束缚需吸热（+1）；干冰制冷、樟脑丸变小都靠它' : '凝华：气态直接变固态，分子被束缚要放热（−1）；霜和雾凇是水蒸气遇极冷物体凝华而成') + '；环境 ' + p.T + ' ℃、质量 ' + p.m + ' g 只影响快慢，不改变吸放热方向',
    insight: '判断吸放热看「分子是变自由还是被束缚」：变自由（熔化、汽化、升华）一律吸热，被束缚（凝固、液化、凝华）一律放热。冬天窗玻璃上的冰花在室内一侧，是室内水蒸气遇到冷玻璃凝华，不是外面雪化后又冻上。',
    boundary: '这里只判断吸放热方向，不计算潜热数值；实际常伴有其他物态变化（干冰周围的白雾是水蒸气液化，不是二氧化碳）。三相点附近或压强剧烈变化时限性判断仍成立，但相变路径可能改变。',
    next: '把物态变化切到「升华」再跑——真值会翻成 +1 吗？想想干冰为什么能制冷。',
    caption: () => '装置：初始物态 → 跳过液态 → 末态 → 热量方向；节点按相变顺序依次点亮'
  },
  {
    id: 'j8a_invisible_light', stage: '初中', subject: '物理', chapter: '八上 · 第四章 · 看不见的光',
    title: '验钞机用的到底是红外线还是紫外线',
    hook: '把太阳光拆开，红光外侧和紫光外侧都还有「看不见」的光。',
    question: '当前这个应用用的是哪种看不见的光？填 1 = 红外线、2 = 紫外线（切换「应用场景」再看答案变不变）。',
    predictLabel: '你猜光种', predictUnit: '', predictDefault: 1, predictMin: 0, predictMax: 3,
    params: [
      { key: 'app', label: '应用场景', unit: '', options: [
        { label: '电视机遥控器', value: 1 },
        { label: '验钞机', value: 2 },
        { label: '红外夜视仪', value: 1 },
        { label: '紫外线灭菌灯', value: 2 },
        { label: '浴室取暖灯', value: 1 },
        { label: '防晒霜防的光', value: 2 }
      ], value: 2 },
      { key: 'lam', label: '波长量级', unit: 'nm', min: 200, max: 1200, step: 50, value: 400 },
      { key: 't', label: '照射时长', unit: 's', min: 1, max: 60, step: 1, value: 10 }
    ],
    renderer: 'diagram', duration: 2.8,
    diagram: p => [
      { label: '光谱位置', value: '红外在红光外侧 · 紫外在紫光外侧' },
      { label: '红外线', value: '热效应显著，一切物体都在辐射' },
      { label: '紫外线', value: '化学效应强，使荧光物质发光', tone: 'warn' },
      { label: '典型应用', value: p.app === 1 ? '遥控 / 夜视 / 测温 / 取暖（1）' : '验钞 / 杀菌 / 促进维生素D（2）', tone: 'good' },
      { label: '易错点', value: '紫外线过量伤皮肤；臭氧层吸收大部分' },
      { label: '答案', value: '当前应用 = ' + p.app + ' · 时长 ' + p.t + ' s 不影响判断', tone: 'good' }
    ],
    truth: p => p.app,
    formula: '红外线：热效应显著（遥控、夜视、测温）；紫外线：荧光效应与杀菌（验钞、灭菌灯），过量有害',
    calc: p => (p.app === 1 ? '该应用利用红外线的热效应或不可见遥控信号 → 答案 1' : '该应用利用紫外线使荧光物质发光或破坏微生物 → 答案 2') + '；波长参数 ' + p.lam + ' nm、照射 ' + p.t + ' s 不改变光种归类',
    insight: '牛顿色散得到的是「看得见」的七色光带；赫歇尔把温度计移到红光外侧发现升温，里特用氯化银在紫光外侧发现更快变黑，才补上两条不可见的光谱。验钞、杀菌、防晒都属紫外线；红外遥控靠的是不可见光脉冲，不是「热」。',
    boundary: '初中只要求按效应区分两类光并记住典型应用，不要求波长数值、光子能量或荧光机理。这里波长滑块只是干扰项；实际遥控器用约 940 nm 近红外，灭菌灯用约 254 nm 深紫外。',
    next: '把应用场景切到「电视机遥控器」再跑——答案会翻成 1 吗？',
    caption: () => '装置：太阳光 → 色散 → 红光外侧 / 紫光外侧 → 效应与应用；节点按「特性 → 归类」依次点亮'
  },
  {
    id: 'j8a_micro_telescope', stage: '初中', subject: '物理', chapter: '八上 · 第五章 · 显微镜和望远镜',
    title: '显微镜最后看到的像，是实像还是虚像',
    hook: '物镜已经把像做出来了，目镜又把它「再放大」一次。',
    question: '通过目镜最终看到的那个放大的像，是实像还是虚像？填 1 = 实像、−1 = 虚像。',
    predictLabel: '你猜像的性质', predictUnit: '', predictDefault: 1, predictMin: -2, predictMax: 2,
    params: [
      { key: 'obj', label: '物镜放大倍数', unit: '×', min: 5, max: 40, step: 5, value: 10 },
      { key: 'eye', label: '目镜放大倍数', unit: '×', min: 5, max: 20, step: 5, value: 10 },
      { key: 'dev', label: '观察装置', unit: '', options: [
        { label: '显微镜', value: 1 },
        { label: '开普勒望远镜', value: 2 }
      ], value: 1 }
    ],
    renderer: 'diagram', duration: 3.0,
    diagram: p => [
      { label: '物镜', value: '成倒立、放大的实像（中间像）' },
      { label: '中间像', value: '落在目镜焦点以内，当「物体」' },
      { label: '目镜', value: '相当于放大镜，成正立放大虚像', tone: 'warn' },
      { label: '最终像', value: '虚像（−1），不能成在光屏上', tone: 'good' },
      { label: '显微镜总倍数', value: p.obj + '× × ' + p.eye + '× = ' + (p.obj * p.eye) + '×' },
      { label: '望远镜', value: p.dev === 1 ? '本装置为显微镜' : '望远镜靠增大视角，物镜焦距长' }
    ],
    truth: () => -1,
    formula: '物镜成倒立放大实像 → 目镜成正立放大虚像；显微镜总放大倍数 = 物镜倍数 × 目镜倍数',
    calc: p => '物镜 ' + p.obj + '× 先成一实像，目镜 ' + p.eye + '× 再放大 → 总倍数 ' + (p.obj * p.eye) + '×；但最终进入眼睛的是虚像（−1），光屏接不到。' + (p.dev === 1 ? '显微镜物镜焦距很短。' : '望远镜物镜焦距长、目镜焦距短，作用是把远处物体的视角放大。'),
    insight: '显微镜是「两级放大」：物镜负责把微小物体做成放大的实像，目镜把这个实像当作物体再用放大镜看一次。望远镜反过来，物镜把远处物体成缩小的实像，但把视角放大了，所以看起来更近。两者最终的像都是虚像。',
    boundary: '初中只作定性了解：不要求透镜成像公式、焦距计算与组合光具组的严格作图；「总倍数 = 物镜×目镜」是标称放大率，实际还受筒长、数值孔径与人眼分辨本领限制。开普勒望远镜成倒像，伽利略望远镜成正像，这里未细分。',
    next: '把物镜切到 40× 再跑——总倍数变 400×，最终像的性质会跟着变吗？',
    caption: () => '装置：被观察物 → 物镜 → 中间实像 → 目镜 → 眼睛；节点按两次成像顺序依次点亮'
  },
  {
    id: 'j8b_force_elements', stage: '初中', subject: '物理', chapter: '八下 · 第七章 · 力',
    title: '推门推在门把手旁边，为什么省这么多力',
    hook: '同样大的力，换个位置推，门就是不听话。',
    question: '同样 20 N 的力，作用点从离门轴 0.10 m 移到 0.30 m，转动效果变成原来的几倍？',
    predictLabel: '你猜转动效果倍数', predictUnit: '倍', predictDefault: 1, predictMin: 0, predictMax: 10,
    params: [
      { key: 'F', label: '推力 F', unit: 'N', min: 5, max: 60, step: 5, value: 20 },
      { key: 'l', label: '作用点到门轴距离 l', unit: 'm', min: 0.05, max: 0.6, step: 0.05, value: 0.3 },
      { key: 'ang', label: '推力与门面夹角', unit: '°', min: 0, max: 90, step: 5, value: 90 },
      { key: 'm', label: '门的质量', unit: 'kg', min: 5, max: 60, step: 5, value: 20 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => (x / 0.1) * Math.sin(rad(p.ang)),
    domain: () => [0.05, 0.6],
    truth: p => (p.l / 0.1) * Math.sin(rad(p.ang)),
    formula: '力的三要素：大小、方向、作用点；转动效果 ∝ F·l·sinθ',
    calc: p => '以 l₀ = 0.10 m 为基准：l/l₀ = ' + (p.l / 0.1).toFixed(1) + '，sin' + p.ang + '° = ' + Math.sin(rad(p.ang)).toFixed(2) + ' → 转动效果 = ' + ((p.l / 0.1) * Math.sin(rad(p.ang))).toFixed(2) + ' 倍；F = ' + p.F + ' N 与门质量 ' + p.m + ' kg 在「倍数」里被约掉',
    insight: '力的效果不只由大小决定：作用点离转轴越远、方向越垂直于门面，转动越明显。所以门把手一定装在远离门轴的一侧，推门要垂直于门面推。三要素里任意一个改变，效果都可能改变。',
    boundary: '初中教材只要求定性知道「作用点、方向会改变力的作用效果」，不出现力矩公式。这里用 F·l·sinθ 做定量类比，忽略门轴摩擦、门本身重力、转动惯量与铰链的反作用力；角度为 0° 时力沿门面推，转动效果为 0。',
    next: '把夹角拖到 0° 再猜——力再大、力臂再长，门还会转吗？',
    curveLabel: p => '横轴是作用点到门轴距离 l，转动效果倍数 = (l/0.10)·sin' + p.ang + '°；当前 l = ' + p.l.toFixed(2) + ' m → ' + ((p.l / 0.1) * Math.sin(rad(p.ang))).toFixed(2) + ' 倍'
  },
  {
    id: 'j8b_lever_types', stage: '初中', subject: '物理', chapter: '八下 · 第十二章 · 杠杆',
    title: '动力臂 30 cm、阻力臂 10 cm，这根杠杆算哪一类',
    hook: '分类不靠「看起来费不费劲」，靠两条力臂谁长。',
    question: '动力臂 30 cm、阻力臂 10 cm，提起 60 N 的重物，需要多大的动力？',
    predictLabel: '你猜动力 F₁', predictUnit: 'N', predictDefault: 60, predictMin: 0, predictMax: 500,
    params: [
      { key: 'G', label: '阻力（物重）G', unit: 'N', min: 10, max: 200, step: 10, value: 60 },
      { key: 'l1', label: '动力臂 l₁', unit: 'cm', min: 5, max: 60, step: 5, value: 30 },
      { key: 'l2', label: '阻力臂 l₂', unit: 'cm', min: 5, max: 60, step: 5, value: 10 },
      { key: 'm', label: '杠杆自重', unit: 'kg', min: 0, max: 10, step: 1, value: 0 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => p.G * p.l2 / x,
    domain: () => [5, 60],
    truth: p => p.G * p.l2 / p.l1,
    formula: 'F₁l₁ = F₂l₂ → F₁ = G·l₂/l₁；l₁ > l₂ 省力、l₁ < l₂ 费力、l₁ = l₂ 等臂',
    calc: p => 'F₁ = ' + p.G + ' × ' + p.l2 + ' / ' + p.l1 + ' = ' + (p.G * p.l2 / p.l1).toFixed(1) + ' N；l₁/l₂ = ' + (p.l1 / p.l2).toFixed(2) + ' → ' + (p.l1 > p.l2 ? '省力杠杆（省力但费距离）' : p.l1 < p.l2 ? '费力杠杆（费力但省距离）' : '等臂杠杆（不省力也不费力）') + '；杠杆自重 ' + p.m + ' kg 未计入',
    insight: '分类只看动力臂与阻力臂的长短：撬棒、扳手、开瓶器是省力杠杆；钓鱼竿、镊子、筷子是费力杠杆，图的是省距离和动作灵活；天平是等臂杠杆。省力必然费距离，天下没有既省力又省距离的杠杆。',
    boundary: '杠杆平衡条件只在静止或匀速转动（平衡）时成立；力臂是支点到力的作用线的垂直距离，不等于杆上某段长度。这里忽略杠杆自重、支点摩擦与形变，也不计入动滑轮、轮轴等变形机械。',
    next: '把 l₁ 拖到和 l₂ 相等再猜——F₁ 会变成多少？这时还叫省力杠杆吗？',
    curveLabel: p => '横轴是动力臂 l₁（cm），F₁ = ' + (p.G * p.l2).toFixed(0) + '/l₁ 是双曲线；当前 l₁ = ' + p.l1 + ' cm → ' + (p.G * p.l2 / p.l1).toFixed(1) + ' N'
  },
  {
    id: 'j9_internal_energy_way', stage: '初中', subject: '物理', chapter: '九全 · 第十三章 · 内能',
    title: '搓手让手变热，是「热传进来」了吗',
    hook: '做功和热传递改变内能的效果完全一样，但机理不同。',
    question: '当前这个现象主要靠哪种方式改变内能？填 1 = 做功、−1 = 热传递（切换「现象」再看答案变不变）。',
    predictLabel: '你猜改变方式', predictUnit: '', predictDefault: -1, predictMin: -2, predictMax: 2,
    params: [
      { key: 'act', label: '现象', unit: '', options: [
        { label: '冬天搓手', value: 1 },
        { label: '对着手哈气', value: -1 },
        { label: '压缩空气引火仪', value: 1 },
        { label: '晒太阳取暖', value: -1 },
        { label: '钻木取火', value: 1 },
        { label: '抱热水袋', value: -1 }
      ], value: 1 },
      { key: 't', label: '持续时长', unit: 's', min: 1, max: 120, step: 5, value: 30 },
      { key: 'm', label: '物体质量', unit: 'kg', min: 0.1, max: 10, step: 0.1, value: 1 }
    ],
    renderer: 'diagram', duration: 2.8,
    diagram: p => [
      { label: '两种方式', value: '做功（转化） / 热传递（转移）' },
      { label: '做功实例', value: '摩擦生热、压缩气体、锻打、钻木' },
      { label: '热传递实例', value: '晒太阳、哈气、热水袋、烧水' },
      { label: '条件', value: '热传递需要温度差，做功不需要', tone: 'warn' },
      { label: '等效性', value: '只看内能变化，无法分辨用了哪种', tone: 'good' },
      { label: '答案', value: '当前现象 = ' + (p.act > 0 ? '做功（1）' : '热传递（−1）') + ' · ' + p.t + ' s', tone: 'good' }
    ],
    truth: p => p.act,
    formula: '改变内能的两种方式：做功是能量的转化（机械能 → 内能），热传递是内能的转移（高温 → 低温）',
    calc: p => (p.act > 0 ? '摩擦 / 压缩过程中外界对物体做功，机械能转化为内能 → 做功（1）' : '物体与更高温的物体或辐射源之间存在温度差，内能直接转移 → 热传递（−1）') + '；持续 ' + p.t + ' s、质量 ' + p.m.toFixed(1) + ' kg 只改变内能变化量，不改变方式归类',
    insight: '「热」不是物体里装着的一种东西，热传递转移的是内能；摩擦生热是机械能转化成内能，属于做功。两种方式在改变内能上完全等效：一杯水温度升高 10 ℃，你没法只凭温度判断它是被加热还是被搅拌。',
    boundary: '这里只判断「主要方式」；真实过程常同时存在两种（搓手时手也在向空气散热，哈气还伴随水蒸气液化放热）。忽略化学反应、相变潜热与人体代谢产热，也不区分传导 / 对流 / 辐射三种热传递形式。',
    next: '把现象切到「压缩空气引火仪」再跑——还是做功吗？想想活塞对谁做了功。',
    caption: () => '装置：外界 / 高温物体 → 研究对象 → 内能增加；节点按「两种方式 → 条件 → 等效性」依次点亮'
  },
  {
    id: 'j9_circuit_read', stage: '初中', subject: '物理', chapter: '九全 · 第十五章 · 电流和电路',
    title: '两个灯泡挨着画，就一定串联吗',
    hook: '识别电路不看元件摆在哪，看电流有没有岔路。',
    question: '电流从电源正极回到负极只有一条路径吗？填 1 = 只有一条（串联）、2 = 有多条（并联）（切换「连接方式」再看答案变不变）。',
    predictLabel: '你猜连接方式', predictUnit: '', predictDefault: 2, predictMin: 0, predictMax: 3,
    params: [
      { key: 'wiring', label: '连接方式', unit: '', options: [
        { label: '两灯首尾依次相连', value: 1 },
        { label: '两灯并列接在同一对节点间', value: 2 }
      ], value: 1 },
      { key: 'sw', label: '干路开关', unit: '', options: [
        { label: '闭合', value: 1 },
        { label: '断开', value: 0 }
      ], value: 1 },
      { key: 'n', label: '灯泡个数', unit: '个', min: 2, max: 4, step: 1, value: 2 }
    ],
    renderer: 'diagram', duration: 2.8,
    diagram: p => [
      { label: '元件符号', value: '电源 / 开关 / 灯泡 / 导线 / 电流表' },
      { label: '看电流路径', value: p.wiring === 1 ? '正极 → 灯₁ → 灯₂ → 负极，无分支' : '正极分两路，各过一灯再汇合', tone: 'warn' },
      { label: '串 / 并判断', value: p.wiring === 1 ? '串联（1）' : '并联（2）', tone: 'good' },
      { label: '干路开关', value: p.sw === 1 ? '闭合：电路通路' : '断开：全电路无电流' },
      { label: '易错识别', value: '导线直连电源两极 = 短路，会烧电源' },
      { label: '仪表接法', value: '电流表串联、电压表并联；' + p.n + ' 个灯不改变路径数', tone: 'good' }
    ],
    truth: p => p.wiring,
    formula: '串联：电流只有一条路径，各用电器互相影响；并联：电路有分支，各支路独立；导线直连电源两极 = 短路',
    calc: p => (p.wiring === 1 ? '两灯首尾相连，电流依次流过每个用电器、只有一条路径 → 串联（1）' : '两灯两端分别接在同一对节点上，电流在节点处分叉 → 并联（2）') + '；干路开关' + (p.sw === 1 ? '闭合，电路通路' : '断开，' + (p.wiring === 1 ? '整个电路断路' : '各支路全部断电')) + '；灯泡 ' + p.n + ' 个不改变路径条数',
    insight: '画得挨得近不代表串联，画得上下叠着也不代表并联；只看电流从正极到负极有没有分叉口。串联时一个灯坏了全灭，并联时各支路互不影响——家里插座和路灯都是并联。识别电路图还要防「导线绕过用电器直连电源两极」的短路。',
    boundary: '按理想导线、理想电源、灯泡纯电阻处理，忽略导线电阻、电源内阻与灯丝电阻随温度的变化；电流表内阻视为 0、电压表内阻视为无穷大。开关只放在干路，未讨论支路开关与局部短路的组合情形。',
    next: '把连接方式切到「并列接在同一对节点间」再跑——答案会变成 2 吗？断开干路开关又如何？',
    caption: () => '装置：电源正极 → 节点 → 用电器 → 负极；节点按「符号 → 路径数 → 串并 / 短路」依次点亮'
  },
  {
    id: 'j9_energy_class', stage: '初中', subject: '物理', chapter: '九全 · 第二十二章 · 能源与可持续发展',
    title: '电能是一次能源吗',
    hook: '「从自然界直接拿来」和「能不能再生」是两把不同的尺子。',
    question: '电能属于一次能源还是二次能源？填 1 = 一次能源、2 = 二次能源（切换「能源种类」再看答案变不变）。',
    predictLabel: '你猜能源类别', predictUnit: '', predictDefault: 1, predictMin: 0, predictMax: 3,
    params: [
      { key: 'src', label: '能源种类', unit: '', options: [
        { label: '煤炭', value: 1 },
        { label: '电能', value: 2 },
        { label: '太阳能', value: 1 },
        { label: '汽油', value: 2 },
        { label: '核能（铀矿）', value: 1 },
        { label: '风能', value: 1 }
      ], value: 2 },
      { key: 't', label: '可开采年限', unit: '年', min: 10, max: 500, step: 10, value: 100 },
      { key: 'eta', label: '转化效率', unit: '%', min: 10, max: 100, step: 5, value: 40 }
    ],
    renderer: 'diagram', duration: 2.8,
    diagram: p => [
      { label: '第一把尺子', value: '一次：自然界直接获取' },
      { label: '第二把尺子', value: '二次：由一次能源加工转换' },
      { label: '另一套维度', value: '可再生 / 不可再生，别混用', tone: 'warn' },
      { label: '典型例子', value: '煤、石油、风、太阳能 = 一次；电、汽油、氢 = 二次' },
      { label: '易错点', value: '核能清洁但铀矿有限 → 不可再生', tone: 'warn' },
      { label: '答案', value: '当前能源 = ' + (p.src === 1 ? '一次（1）' : '二次（2）') + ' · 效率 ' + p.eta + '%', tone: 'good' }
    ],
    truth: p => p.src,
    formula: '一次能源 = 直接从自然界获取（煤、石油、风、太阳能、铀矿）；二次能源 = 由一次能源转化而来（电能、汽油、焦炭、氢能）',
    calc: p => (p.src === 1 ? '可直接从自然界开采或获取，未经加工转换 → 一次能源（1）' : '必须由煤、油、风、光等一次能源经发电或炼制得到 → 二次能源（2）') + '；可开采 ' + p.t + ' 年、转化效率 ' + p.eta + '% 属于「可再生性 / 效率」维度，不影响一次·二次的分类',
    insight: '分类维度要分清：一次 / 二次看「有没有被加工转换」，可再生 / 不可再生看「短期内能不能补回来」。电能是最典型的二次能源，几乎都由别的一次能源换来；核能不排碳但铀矿有限，仍算不可再生。清洁能源 ≠ 可再生能源。',
    boundary: '按初中教材的分类口径，不讨论能量品质（火用）、全生命周期碳排放与净能量回报；氢能按二次能源载体处理，若未来直接开采天然氢则归类会变。这里也不计入电网储能与分布式发电的边界情形。',
    next: '把能源切到「汽油」再跑——它和电能一样是二次能源吗？再切到「太阳能」呢？',
    caption: () => '装置：自然界 → 一次能源 → 加工转换 → 二次能源 → 用户；节点按「两把尺子 → 易错点」依次点亮'
  },

  // ── 2026-11-17 人教A版数学必修批次（30 条）────────────────────
  // 用户已把 6 本数学教材放入 D:/textbook。A 版必修一/二共 10 章为章节主线，
  // 另补 10 条高考数学高频专题（数列、导数、积分、圆锥曲线、概率统计）。
  // id 前缀 m1_ / m2_ / mgk_ 与物理数据分开；mgk_ 标「高考专题 ·」不计入教材落地数。
  {
    id: 'm1_set_union', stage: '高中', subject: '数学', chapter: '必修一 · 第一章 · 集合与常用逻辑用语',
    title: '两个小组人数加起来，为什么比全班还多',
    hook: '重叠的那部分被数了两次，减掉一次才对。',
    question: '全班 50 人，参加数学组 30 人、物理组 25 人，两组都参加的 10 人。至少参加一个小组的有多少人？',
    predictLabel: '你猜至少参加人数', predictUnit: '人', predictDefault: 55, predictMin: 0, predictMax: 100,
    params: [
      { key: 'N', label: '全班人数', unit: '人', min: 30, max: 80, step: 1, value: 50 },
      { key: 'A', label: '数学组人数', unit: '人', min: 10, max: 50, step: 1, value: 30 },
      { key: 'B', label: '物理组人数', unit: '人', min: 10, max: 50, step: 1, value: 25 },
      { key: 'both', label: '两组都参加', unit: '人', min: 0, max: 25, step: 1, value: 10 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => p.A + p.B - x,
    domain: p => [0, Math.min(p.A, p.B)],
    truth: p => p.A + p.B - p.both,
    formula: '|A∪B| = |A| + |B| − |A∩B|',
    calc: p => '|A∪B| = ' + p.A + ' + ' + p.B + ' − ' + p.both + ' = ' + (p.A + p.B - p.both) + ' 人；全班 ' + p.N + ' 人只是上限约束，不进入公式',
    insight: '直接相加把交集里的 10 个人数了两遍，减掉一次才是真实人数。55 > 50 本身就是「数据不可能」的信号——容斥结果超过全集时要回头检查条件。',
    boundary: '两个有限集合的容斥；三个集合要交替加减：|A∪B∪C| = |A|+|B|+|C| − |A∩B| − |A∩C| − |B∩C| + |A∩B∩C|。N 只是约束校验，若算出 |A∪B| > N 则题设自相矛盾。',
    next: '把「两组都参加」拖到 0——结果会变成 55 吗？全班只有 50 人，这说明什么？',
    curveLabel: p => '横轴是交集人数 x，|A∪B| = ' + (p.A + p.B) + ' − x；当前交集 ' + p.both + ' 人 → ' + (p.A + p.B - p.both) + ' 人'
  },
  {
    id: 'm1_quad_discriminant', stage: '高中', subject: '数学', chapter: '必修一 · 第二章 · 一元二次函数、方程和不等式',
    title: '两个不等实根，k 是小于 1 还是大于 1',
    hook: '判别式要大于零，不等号方向一写反就全错。',
    question: '方程 x² + 2x + k = 0 有两个不相等的实数根，k 应小于哪个临界值？',
    predictLabel: '你猜临界值', predictUnit: '', predictDefault: 4, predictMin: -10, predictMax: 10,
    params: [
      { key: 'k', label: '常数项 k', unit: '', min: -10, max: 10, step: 1, value: 0 },
      { key: 'b', label: '一次项系数 b', unit: '', min: 1, max: 6, step: 1, value: 2 },
      { key: 'c', label: '干扰系数', unit: '', min: 0, max: 10, step: 1, value: 3 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => p.b * p.b - 4 * x,
    domain: () => [-5, 5],
    truth: p => p.b * p.b / 4,
    formula: 'Δ = b² − 4ac；有两个不等实根 ⇔ Δ > 0 ⇔ k < b²/4',
    calc: p => 'Δ = ' + p.b + '² − 4k = ' + (p.b * p.b) + ' − 4k；Δ > 0 → k < ' + (p.b * p.b / 4).toFixed(2) + '；当前 k = ' + p.k + '，' + (p.k < p.b * p.b / 4 ? '满足条件' : '不满足条件') + '；干扰系数 c = ' + p.c + ' 与本方程无关',
    insight: 'a = 1、c = k，所以 Δ = 4 − 4k。两根不等要求 Δ > 0，解出 k < 1。常见的两个错法是「把 b² = 4 直接当临界值」和「把不等号写成 k > 1」。画 Δ(k) 直线一眼就能看出它随 k 增大而下降。',
    boundary: '只讨论实系数一元二次方程且 a = 1（b 可调）；Δ = 0 时两根相等、Δ < 0 时无实根（有一对共轭复根）。这里不讨论含参数的高次方程或根的分布问题。',
    next: '把一次项系数 b 拖到 4——临界值会变成 4 吗？想想 b²/4。',
    curveLabel: p => '横轴是 k，Δ(k) = ' + (p.b * p.b) + ' − 4k 是下降直线；Δ = 0 处 k = ' + (p.b * p.b / 4).toFixed(2)
  },
  {
    id: 'm1_rect_max_area', stage: '高中', subject: '数学', chapter: '必修一 · 第二章 · 一元二次函数、方程和不等式',
    title: '20 米篱笆围矩形，怎么围面积最大',
    hook: '最「匀称」的围法，面积反而最大。',
    question: '用 20 m 长的篱笆围一个矩形，面积最大是多少 m²？',
    predictLabel: '你猜最大面积', predictUnit: 'm²', predictDefault: 20, predictMin: 0, predictMax: 150,
    params: [
      { key: 'P', label: '篱笆周长', unit: 'm', min: 8, max: 80, step: 2, value: 20 },
      { key: 'x', label: '当前边长 x', unit: 'm', min: 1, max: 35, step: 1, value: 6 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => x * (p.P / 2 - x),
    domain: p => [0.5, p.P / 2 - 0.5],
    truth: p => p.P * p.P / 16,
    formula: 'x + y = P/2，S = x(P/2 − x) ≤ (P/4)²（当 x = y = P/4 取等）',
    calc: p => '半周长 = ' + (p.P / 2) + ' m；S(x) = x(' + (p.P / 2) + ' − x) 开口向下，顶点 x = ' + (p.P / 4) + ' m → S最大 = ' + (p.P * p.P / 16).toFixed(2) + ' m²；当前 x = ' + p.x + ' m 时 S = ' + (p.x * (p.P / 2 - p.x)).toFixed(2) + ' m²',
    insight: '和一定时积在两数相等处最大——这是均值不等式的几何版。直觉常选「长一点窄一点」（比如 6×4 = 24），但正方形 5×5 = 25 更大。越均衡，面积越大。',
    boundary: '只限矩形、篱笆全部用完且不考虑靠墙或地形；周长可变但始终为正偶数。若允许围成圆，同样周长下圆面积 P²/(4π) ≈ 31.8 m² 更大，本实验只在矩形范围内比较。',
    next: '把周长改成 40 m——最大面积会变成 100 m² 吗？',
    curveLabel: p => '横轴是边长 x，S = x(' + (p.P / 2) + ' − x) 是开口向下的抛物线；顶点 S最大 = ' + (p.P * p.P / 16).toFixed(2) + ' m²'
  },
  {
    id: 'm1_bisection', stage: '高中', subject: '数学', chapter: '必修一 · 第三章 · 函数的概念与性质',
    title: '二分法 10 次，精度能到多少',
    hook: '每次砍一半，10 次就是 1/1024——比直觉小一个量级。',
    question: '用二分法求 √2 的近似值，初始区间 [1,2]，二分 10 次后区间长度约为多少？',
    predictLabel: '你猜区间长度', predictUnit: '', predictDefault: 0.1, predictMin: 0.0001, predictMax: 2,
    params: [
      { key: 'n', label: '二分次数', unit: '次', min: 1, max: 20, step: 1, value: 10 },
      { key: 'a', label: '区间左端', unit: '', min: 0, max: 2, step: 0.5, value: 1 },
      { key: 'b', label: '区间右端', unit: '', min: 2, max: 4, step: 0.5, value: 2 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => x * x - 2,
    domain: () => [0, 3],
    truth: p => (p.b - p.a) / Math.pow(2, p.n),
    formula: '每次区间长度减半 → 第 n 次后长度 = (b−a)/2ⁿ',
    calc: p => '长度 = (' + p.b + ' − ' + p.a + ')/2^' + p.n + ' = ' + ((p.b - p.a) / Math.pow(2, p.n)).toExponential(3) + '；曲线 f(x) = x²−2 只提供「哪半边变号」的判据，不进入长度公式',
    insight: '二分法的收敛速度和函数形状完全无关，只取决于初始区间和次数：1 → 0.5 → 0.25 → … → 1/1024 ≈ 0.001。很多人凭直觉猜 0.1，差了整整 100 倍。这是指数级收敛。',
    boundary: '要求 f 在 [a,b] 上连续且 f(a)·f(b) < 0；区间长度是「根的定位精度」上界，不等于根的真实误差（真实误差 ≤ 半长）。忽略浮点舍入，且初值必须真的夹住一个根。',
    next: '把二分次数拖到 20——区间长度会跌破 10⁻⁶ 吗？',
    curveLabel: p => '曲线 f(x) = x²−2 在 x ≈ 1.414 处变号；二分 ' + p.n + ' 次后区间长度 = ' + ((p.b - p.a) / Math.pow(2, p.n)).toExponential(3)
  },
  {
    id: 'm1_exp_vs_power', stage: '高中', subject: '数学', chapter: '必修一 · 第四章 · 指数函数与对数函数',
    title: '2ⁿ 什么时候第一次超过 n³',
    hook: '指数一开始输给幂，最后却甩开它。',
    question: '从 n = 1 开始，2ⁿ 第一次严格大于 n³ 时，n 最小是多少？',
    predictLabel: '你猜最小的 n', predictUnit: '', predictDefault: 20, predictMin: 1, predictMax: 60,
    params: [
      { key: 'base', label: '指数底数 a', unit: '', min: 2, max: 5, step: 1, value: 2 },
      { key: 'pow', label: '幂次 k', unit: '', min: 2, max: 5, step: 1, value: 3 },
      { key: 'nNow', label: '当前 n', unit: '', min: 1, max: 40, step: 1, value: 10 }
    ],
    renderer: 'function', duration: 3.0,
    curve: p => x => Math.pow(p.base, x) - Math.pow(x, p.pow),
    domain: () => [1, 40],
    truth: p => {
      for (let n = 1; n <= 200; n++) if (Math.pow(p.base, n) > Math.pow(n, p.pow)) return n
      return 200
    },
    formula: 'aⁿ（a > 1）最终超过任何幂函数 nᵏ；先慢后快，超过后不再被反超',
    calc: p => {
      let t = 200
      for (let n = 1; n <= 200; n++) if (Math.pow(p.base, n) > Math.pow(n, p.pow)) { t = n; break }
      return '逐个比较 aⁿ 与 nᵏ：第一次严格超过出现在 n = ' + t + '（aⁿ = ' + Math.pow(p.base, t).toExponential(2) + '，nᵏ = ' + Math.pow(t, p.pow).toExponential(2) + '）；当前 n = ' + p.nNow + ' 时 ' + (Math.pow(p.base, p.nNow) > Math.pow(p.nNow, p.pow) ? '指数已经在前面' : '幂函数还领先')
    },
    insight: '指数增长的「爆发」来得晚但不可逆。2¹⁰ = 1024 只比 10³ = 1000 大一点点，可 2²⁰ 已经是 20³ 的约 2600 倍。复利、病毒传播、算法复杂度都走这条曲线。',
    boundary: '只比较 n 为正整数、底数 a > 1 与幂次 k 为正整数；「第一次超过」依赖起点与是否严格要求大于（相等不算）。n ≤ 200 时浮点仍能表示，更大 n 需换高精度。',
    next: '把底数改成 3——第一次超过 n³ 会提前到 n = 2 吗？想想 3² 和 2³。',
    curveLabel: p => '横轴 n，画 aⁿ − nᵏ；穿过 0 的位置就是指数反超的点，当前 n = ' + p.nNow
  },
  {
    id: 'm1_log_chain', stage: '高中', subject: '数学', chapter: '必修一 · 第四章 · 指数函数与对数函数',
    title: 'log₂3 · log₃5 · log₅8 等于几',
    hook: '换底之后连乘，中间的「桥」全约掉了。',
    question: '计算 log₂3 · log₃5 · log₅8 的值。',
    predictLabel: '你猜连乘积', predictUnit: '', predictDefault: 1, predictMin: 0, predictMax: 20,
    params: [
      { key: 'a', label: '第一个底数', unit: '', min: 2, max: 10, step: 1, value: 2 },
      { key: 'b', label: '第二个底数', unit: '', min: 2, max: 10, step: 1, value: 3 },
      { key: 'c', label: '第三个底数', unit: '', min: 2, max: 10, step: 1, value: 5 },
      { key: 'n', label: '最终真数', unit: '', min: 2, max: 100, step: 1, value: 8 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => Math.log(x) / Math.log(p.a),
    domain: () => [1, 20],
    truth: p => Math.log(p.n) / Math.log(p.a),
    formula: 'logₐb · log_b c · log_c n = logₐ n（换底公式连锁约分）',
    calc: p => 'log_' + p.a + '(' + p.b + ') · log_' + p.b + '(' + p.c + ') · log_' + p.c + '(' + p.n + ') = log_' + p.a + '(' + p.n + ') = ' + (Math.log(p.n) / Math.log(p.a)).toFixed(4),
    insight: '全部换成自然对数后，ln b 和 ln c 分别在分子分母出现一次，直接约掉，只剩 ln n / ln a。这是对数换底最漂亮的「望远镜」结构，和中间经过哪些底数完全无关。',
    boundary: '所有底数须大于 0 且不等于 1，真数须大于 0；这里限定底数 2~10、最终真数 ≤ 100。不讨论负底数、负数真数与复数对数，浮点结果按精确值解释。',
    next: '把最终真数拖到 32——答案会变成 5 吗？想想 log₂32。',
    curveLabel: p => '横轴是真数 x，画 log_' + p.a + '(x)；连乘积等于 x = ' + p.n + ' 处的函数值'
  },
  {
    id: 'm1_trig_period', stage: '高中', subject: '数学', chapter: '必修一 · 第五章 · 三角函数',
    title: 'sin(2026π + π/6) 到底等于多少',
    hook: '先把 2026 个 π 全扔掉，再算剩下的。',
    question: 'sin(2026π + π/6) 的值是多少？',
    predictLabel: '你猜函数值', predictUnit: '', predictDefault: 1, predictMin: -2, predictMax: 2,
    params: [
      { key: 'k', label: 'π 的系数', unit: '', min: 0, max: 3000, step: 2, value: 2026 },
      { key: 'ang', label: '剩余角度', unit: '°', min: 0, max: 360, step: 15, value: 30 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => Math.sin(x),
    domain: () => [0, 4 * PI],
    truth: p => Math.sin(p.k * PI + rad(p.ang)),
    formula: 'sin(2mπ + θ) = sinθ；先按周期化简，再用诱导公式',
    calc: p => p.k + 'π = ' + (p.k / 2).toFixed(0) + ' 个 2π，整数个周期全部消掉 → sin(' + p.ang + '°) = ' + Math.sin(rad(p.ang)).toFixed(4),
    insight: '正弦的周期是 2π，不是 π。2026π 正好是 1013 个整周期，全部消掉。若系数是奇数（如 2027π），要先拆成 1013 个 2π 加一个 π，用 sin(π+θ) = −sinθ 变号。',
    boundary: '参与周期运算的是弧度；这里的系数限定为偶数（滑块 step = 2），因此不需要额外的变号步骤。忽略大数乘法的浮点误差；不讨论复数域正弦。',
    next: '把系数改成 2027（奇数）——答案会翻成 −0.5 吗？',
    curveLabel: () => '横轴是弧度 x，曲线 y = sin x 每 2π 重复一次；把大角度折回第一个周期再读数'
  },
  {
    id: 'm1_trig_double', stage: '高中', subject: '数学', chapter: '必修一 · 第五章 · 三角函数',
    title: 'sin15° × cos15°，答案是 1/2 吗',
    hook: '它其实是 sin30° 的一半，别忘了前面还有个 1/2。',
    question: 'sin15° · cos15° 的值是多少？',
    predictLabel: '你猜乘积', predictUnit: '', predictDefault: 0.5, predictMin: 0, predictMax: 2,
    params: [
      { key: 'ang', label: '角度 θ', unit: '°', min: 5, max: 45, step: 5, value: 15 },
      { key: 'scale', label: '干扰系数', unit: '', min: 1, max: 10, step: 1, value: 2 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => Math.sin(rad(x)) * Math.cos(rad(x)),
    domain: () => [0, 45],
    truth: p => Math.sin(rad(p.ang)) * Math.cos(rad(p.ang)),
    formula: 'sin2θ = 2sinθcosθ → sinθcosθ = ½sin2θ',
    calc: p => '½ sin(' + (2 * p.ang) + '°) = ½ × ' + Math.sin(rad(2 * p.ang)).toFixed(4) + ' = ' + (Math.sin(rad(p.ang)) * Math.cos(rad(p.ang))).toFixed(4) + '；干扰系数 ' + p.scale + ' 不进入公式',
    insight: '很多人看到 15°+15° = 30° 就直接填 sin30° = 0.5，漏掉二倍角公式前面的系数 2。正确答案是 0.25——整整差了一倍。写成 ½sin2θ 就不容易错。',
    boundary: '角度制，θ 限定在 5°~45°；题面默认 θ = 15°，拖滑块后真值随之改变。不讨论负角、诱导公式组合与复数域；浮点结果按精确值解释。',
    next: '把角度拖到 30°——乘积会变成 0.5 吗？提示：√3/4 ≈ 0.433。',
    curveLabel: p => '横轴是角度 θ，曲线 y = sinθ·cosθ = ½sin2θ；当前 θ = ' + p.ang + '°'
  },
  {
    id: 'm1_trig_square_sum', stage: '高中', subject: '数学', chapter: '必修一 · 第五章 · 三角函数',
    title: 'sin²20° + sin²70° 是多少',
    hook: '70° 就是 90°−20°，正弦要换成余弦。',
    question: 'sin²20° + sin²70° 的值是多少？',
    predictLabel: '你猜平方和', predictUnit: '', predictDefault: 0.5, predictMin: 0, predictMax: 2,
    params: [
      { key: 'ang', label: '第一个角', unit: '°', min: 5, max: 85, step: 5, value: 20 },
      { key: 'scale', label: '干扰参数', unit: '', min: 1, max: 10, step: 1, value: 3 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => Math.pow(Math.sin(rad(x)), 2) + Math.pow(Math.cos(rad(x)), 2),
    domain: () => [0, 90],
    truth: () => 1,
    formula: 'sin(90°−θ) = cosθ，sin²θ + cos²θ = 1',
    calc: p => 'sin²' + p.ang + '° + sin²(' + (90 - p.ang) + '°) = sin²' + p.ang + '° + cos²' + p.ang + '° = 1；与角度 ' + p.ang + '°、干扰参数 ' + p.scale + ' 都无关',
    insight: '互余角的正余弦互换，平方和恒等于 1。猜 0.5 是把两个平方项「平均」了，但三角恒等式不给这种折扣——无论角度怎么变，这条总量守恒。',
    boundary: '角度制且两角必须互余（和为 90°）；浮点计算有 1e-16 量级误差，真值按精确的 1 处理。不讨论非互余角的平方和或高次幂。',
    next: '把角度拖到 45°——答案会变成 0.5 吗？',
    curveLabel: () => '横轴是角度 θ，曲线 sin²θ + cos²θ 是一条恒为 1 的水平线'
  },
  {
    id: 'm1_abs_sum_min', stage: '高中', subject: '数学', chapter: '必修一 · 第三章 · 函数的概念与性质',
    title: '|x−1| + |x−2| 的最小值是多少',
    hook: '到两个点的距离之和，最短就是两点之间的距离。',
    question: '函数 f(x) = |x−1| + |x−2| 的最小值是多少？',
    predictLabel: '你猜最小值', predictUnit: '', predictDefault: 3, predictMin: 0, predictMax: 20,
    params: [
      { key: 'a', label: '第一个定点 a', unit: '', min: -10, max: 10, step: 1, value: 1 },
      { key: 'b', label: '第二个定点 b', unit: '', min: -10, max: 10, step: 1, value: 2 },
      { key: 'xNow', label: '当前 x', unit: '', min: -20, max: 20, step: 1, value: 0 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => Math.abs(x - p.a) + Math.abs(x - p.b),
    domain: () => [-5, 8],
    truth: p => Math.abs(p.a - p.b),
    formula: '|x−a| + |x−b| ≥ |a−b|，当 x 落在 [a,b] 内时取等',
    calc: p => '最小值 = |' + p.a + ' − ' + p.b + '| = ' + Math.abs(p.a - p.b).toFixed(1) + '；x 取 [' + Math.min(p.a, p.b) + ', ' + Math.max(p.a, p.b) + '] 中任意值都达到最小；当前 x = ' + p.xNow + ' 时 f = ' + (Math.abs(p.xNow - p.a) + Math.abs(p.xNow - p.b)).toFixed(1),
    insight: '数轴上到两定点距离之和，最短路径就是「直达」：只要 x 在两点之间，两段距离相加恰好等于两点间距；一旦跑到区间外才开始变长。这是绝对值三角不等式的几何版。',
    boundary: '一维数轴、两个定点；a = b 时最小值为 0（此时任取 x = a 即可）。若推广到平面上三个点求距离和最小（费马点）或多点情形，结论完全不同。',
    next: '把第一个定点拖到 −5——最小值会变成 7 吗？',
    curveLabel: p => '横轴 x，曲线是「平底 V 形」：在 [' + Math.min(p.a, p.b) + ', ' + Math.max(p.a, p.b) + '] 上贴着最低值 ' + Math.abs(p.a - p.b).toFixed(1)
  },
  {
    id: 'm2_vector_dot', stage: '高中', subject: '数学', chapter: '必修二 · 第六章 · 平面向量及其应用',
    title: '两个向量长度 3 和 4，点积一定是 12 吗',
    hook: '点积还要看夹角，方向不对就打折。',
    question: '已知 |a| = 3、|b| = 4，两向量夹角 60°，求 a·b。',
    predictLabel: '你猜点积', predictUnit: '', predictDefault: 12, predictMin: -20, predictMax: 30,
    params: [
      { key: 'A', label: '向量 a 的模', unit: '', min: 1, max: 10, step: 1, value: 3 },
      { key: 'B', label: '向量 b 的模', unit: '', min: 1, max: 10, step: 1, value: 4 },
      { key: 'ang', label: '夹角 θ', unit: '°', min: 0, max: 180, step: 5, value: 60 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => p.A * p.B * Math.cos(rad(x)),
    domain: () => [0, 180],
    truth: p => p.A * p.B * Math.cos(rad(p.ang)),
    formula: 'a·b = |a||b|cosθ；θ = 90° 时点积为 0（垂直）',
    calc: p => 'a·b = ' + p.A + ' × ' + p.B + ' × cos' + p.ang + '° = ' + (p.A * p.B).toFixed(0) + ' × ' + Math.cos(rad(p.ang)).toFixed(4) + ' = ' + (p.A * p.B * Math.cos(rad(p.ang))).toFixed(3),
    insight: '点积不是「长度相乘」就完事：夹角 60° 只保留一半（cos60° = 0.5），所以 3×4 变成 6。垂直时 cos90° = 0，点积为零；反向时 cos180° = −1，点积取负。这个夹角因子是向量能描述「方向」的关键。',
    boundary: '平面向量、夹角取 [0°,180°]；这里不涉及空间向量与叉积。求夹角时若点积为 0 要单独判断垂直，不能反求 cos。浮点结果按精确值解释。',
    next: '把夹角拖到 180°——点积会变成 −12 吗？',
    curveLabel: p => '横轴是夹角 θ，a·b = ' + (p.A * p.B) + '·cosθ 从 +' + (p.A * p.B) + ' 降到 −' + (p.A * p.B) + '，90° 处过零'
  },
  {
    id: 'm2_vector_collinear', stage: '高中', subject: '数学', chapter: '必修二 · 第六章 · 平面向量及其应用',
    title: '向量 (1,2) 与 (2,m) 共线，m 是 1 还是 4',
    hook: '坐标交叉相乘相等，别把比例写反。',
    question: '向量 a = (1,2) 与 b = (2,m) 共线，m 是多少？',
    predictLabel: '你猜 m', predictUnit: '', predictDefault: 1, predictMin: -10, predictMax: 10,
    params: [
      { key: 'x1', label: 'a 的横坐标', unit: '', min: -5, max: 5, step: 1, value: 1 },
      { key: 'y1', label: 'a 的纵坐标', unit: '', min: -5, max: 5, step: 1, value: 2 },
      { key: 'x2', label: 'b 的横坐标', unit: '', min: -5, max: 5, step: 1, value: 2 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => p.y1 * x / (p.x1 || 1),
    domain: () => [-5, 5],
    truth: p => p.y1 * p.x2 / (p.x1 || 1),
    formula: 'a ∥ b ⇔ x₁y₂ − x₂y₁ = 0 ⇔ y₂ = (y₁/x₁)·x₂',
    calc: p => '共线条件：' + p.x1 + '·m − ' + p.x2 + '·' + p.y1 + ' = 0 → m = ' + (p.y1 * p.x2 / (p.x1 || 1)).toFixed(2) + '；也就是 b = (' + p.x1 + ', ' + p.y1 + ') 的 ' + (p.x2 / (p.x1 || 1)).toFixed(2) + ' 倍',
    insight: '共线的本质是「方向相同或相反」，也就是一个向量是另一个的倍数。写成交叉相乘 x₁y₂ = x₂y₁ 最不容易写反比例。直觉填 1 是把 2→1 的比例倒过来了。',
    boundary: '平面向量，要求 x₁ ≠ 0（这里用 || 1 兜底避免除零，但 x₁ = 0 时应改用 y 分量判断）。零向量与任意向量共线，属退化情形；不讨论空间向量的共线。',
    next: '把 a 的纵坐标拖到 −2——m 会变成 −4 吗？这时两向量方向相反。',
    curveLabel: p => '横轴是 b 的横坐标 x₂，纵轴是共线要求的 y₂ = (' + p.y1 + '/' + (p.x1 || 1) + ')·x₂；当前 x₂ = ' + p.x2
  },
  {
    id: 'm2_complex_mod', stage: '高中', subject: '数学', chapter: '必修二 · 第七章 · 复数',
    title: '|(1+i)/(1−i)| 会是 √2 吗',
    hook: '分子分母是一对共轭复数，模相等。',
    question: '复数 (1+i)/(1−i) 的模是多少？',
    predictLabel: '你猜复数的模', predictUnit: '', predictDefault: 1.414, predictMin: 0, predictMax: 5,
    params: [
      { key: 'a', label: '实部 a', unit: '', min: 1, max: 5, step: 1, value: 1 },
      { key: 'b', label: '虚部 b', unit: '', min: 1, max: 5, step: 1, value: 1 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => Math.sqrt(p.a * p.a + x * x) / Math.sqrt(p.a * p.a + x * x),
    domain: () => [-5, 5],
    truth: () => 1,
    formula: '|z₁/z₂| = |z₁|/|z₂|；共轭复数模相等 → 商的模恒为 1',
    calc: p => '|(' + p.a + '+' + p.b + 'i)/(' + p.a + '−' + p.b + 'i)| = √(' + p.a + '²+' + p.b + '²) / √(' + p.a + '²+' + p.b + '²) = 1；实际相除结果是 (' + ((p.a * p.a - p.b * p.b) / (p.a * p.a + p.b * p.b)).toFixed(2) + ') + (' + (2 * p.a * p.b / (p.a * p.a + p.b * p.b)).toFixed(2) + ')i，模仍是 1',
    insight: '别急着把复数算成标准形式再求模——直接用「商的模 = 模的商」更快。共轭复数关于实轴对称，模必然相等，所以商模为 1。结果 (1+i)/(1−i) = i，正好落在单位圆上。猜 √2 是把分子自己的模当成了商的模。',
    boundary: '分母不能为 0（这里 a、b ≥ 1 保证非零）；模定义基于复平面欧氏距离。不讨论复数的幅角多值性或复对数。',
    next: '把虚部拖到 2——模还是 1 吗？再看看计算结果变没变。',
    curveLabel: () => '横轴是虚部 b，曲线 |(a+bi)/(a−bi)| 是一条恒为 1 的水平线'
  },
  {
    id: 'm2_complex_power', stage: '高中', subject: '数学', chapter: '必修二 · 第七章 · 复数',
    title: 'i 的 2026 次方，实部是多少',
    hook: 'i 的幂每 4 次转一圈，2026 只是绕了很多圈。',
    question: 'i^2026 的实部是多少？如果结果是纯虚数就填 0。',
    predictLabel: '你猜实部', predictUnit: '', predictDefault: 0, predictMin: -2, predictMax: 2,
    params: [
      { key: 'n', label: '幂指数 n', unit: '', min: 0, max: 3000, step: 2, value: 2026 }
    ],
    renderer: 'function', duration: 2.8,
    curve: () => x => Math.cos(x * PI / 2),
    domain: () => [0, 8],
    truth: p => Math.cos(p.n * PI / 2),
    formula: 'i⁴ = 1 → iⁿ 以 4 为周期；n mod 4 = 0/1/2/3 对应 1/i/−1/−i',
    calc: p => p.n + ' mod 4 = ' + (p.n % 4) + ' → i^' + p.n + ' = i^' + (p.n % 4) + ' = ' + (p.n % 4 === 0 ? '1' : p.n % 4 === 1 ? 'i（实部 0）' : p.n % 4 === 2 ? '−1' : '−i（实部 0）') + '；实部 = ' + Math.cos(p.n * PI / 2).toFixed(0),
    insight: '虚数单位 i 的幂是周期 4 的循环：1, i, −1, −i, 1, …。2026 = 4×506 + 2，所以 i^2026 = i² = −1，实部是 −1。很多人猜 0 是把结果当成了纯虚数 i 或 −i。',
    boundary: '指数限定为非负整数（滑块 step = 2，默认偶数）；负指数需先取倒数，不在此讨论。浮点 cos 在极大 n 时有舍入误差，真值按模 4 的精确结果解释。',
    next: '把指数改成 2027（需要切回允许奇数的参数）——结果会变成纯虚数吗？',
    curveLabel: () => '横轴是指数 n（0~8），曲线是实部 cos(nπ/2)：1, 0, −1, 0 循环'
  },
  {
    id: 'm2_sphere_in_cube', stage: '高中', subject: '数学', chapter: '必修二 · 第八章 · 立体几何初步',
    title: '正方体里塞个内切球，体积能占一半吗',
    hook: '球的半径只有棱长的一半，立方项会再打折。',
    question: '正方体内切一个与六个面都相切的球，球体积占正方体体积的百分之多少？',
    predictLabel: '你猜体积占比', predictUnit: '%', predictDefault: 50, predictMin: 0, predictMax: 100,
    params: [
      { key: 'a', label: '正方体棱长', unit: '', min: 1, max: 10, step: 1, value: 2 },
      { key: 'd', label: '干扰量', unit: '', min: 1, max: 10, step: 1, value: 3 }
    ],
    renderer: 'function', duration: 2.8,
    curve: () => x => 100 * PI / 6,
    domain: () => [1, 10],
    truth: () => 100 * PI / 6,
    formula: 'r = a/2 → V球/V正 = (4/3)π(a/2)³ ÷ a³ = π/6 ≈ 52.4%',
    calc: p => 'V球 = (4/3)π(' + (p.a / 2) + ')³ ≈ ' + (4 / 3 * PI * Math.pow(p.a / 2, 3)).toFixed(2) + '；V正 = ' + p.a + '³ = ' + (p.a * p.a * p.a) + '；比值 = π/6 = ' + (100 * PI / 6).toFixed(2) + '%（与棱长 ' + p.a + '、干扰量 ' + p.d + ' 都无关）',
    insight: '直觉「圆占方形的 π/4 ≈ 78.5%，所以球也占一半多」方向对但数值不准：体积是三次方，球的半径只有棱长一半，要乘 (1/2)³，最终是 π/6 ≈ 52.4%，刚过一半。',
    boundary: '球与正方体六个面都相切（内切球），不存在空隙优化；棱长变化只缩放体积、不改变比例。不讨论外接球或非相切摆放。',
    next: '把棱长拖到 10——占比会变吗？为什么尺寸不影响比例？',
    curveLabel: () => '横轴是棱长 a，体积占比恒为 π/6 ≈ 52.4% 的水平线'
  },
  {
    id: 'm2_cube_section', stage: '高中', subject: '数学', chapter: '必修二 · 第八章 · 立体几何初步',
    title: '一个平面截正方体，截面最多是几边形',
    hook: '想截出六边形，平面得同时碰到六个面。',
    question: '用一个平面去截正方体，截面最多可以是几边形？',
    predictLabel: '你猜最多边数', predictUnit: '边', predictDefault: 4, predictMin: 3, predictMax: 10,
    params: [
      { key: 'tilt', label: '平面倾斜角', unit: '°', min: 0, max: 90, step: 5, value: 45 },
      { key: 'offset', label: '平面位置', unit: '', min: 0.1, max: 0.9, step: 0.1, value: 0.5 },
      { key: 'n', label: '干扰量', unit: '', min: 1, max: 10, step: 1, value: 6 }
    ],
    renderer: 'diagram', duration: 3.0,
    diagram: p => [
      { label: '截平面', value: '倾斜 ' + p.tilt + '° · 位置 ' + p.offset.toFixed(1) },
      { label: '切到 3 个面', value: '三角形（过三个相邻面）' },
      { label: '切到 4 个面', value: '四边形（常见截面）' },
      { label: '切到 5 个面', value: '五边形' },
      { label: '切到 6 个面', value: '六边形（六个面都相交）', tone: 'warn' },
      { label: '上限', value: '边数 ≤ 面数 = 6（−1）', tone: 'good' }
    ],
    truth: () => 6,
    formula: '截面的每条边来自平面与正方体一个面的交线 → 边数 ≤ 面数 = 6',
    calc: p => '正方体只有 6 个面，平面与每个面最多交出一条边，所以边数不超过 6；当平面斜穿六个面且不经过顶点时可得到六边形。当前倾斜 ' + p.tilt + '°、位置 ' + p.offset.toFixed(1) + ' 与干扰量 ' + p.n + ' 不改变这个上限',
    insight: '很多人只见过三角形、四边形截面就以为上限是 4。只要平面足够「斜」并且走到中心附近，就能同时切开六个面，得到六边形——截面边数的上限就是立体本身的面数。',
    boundary: '只讨论平面截正方体且截面非退化；若平面经过顶点或棱，边数会因交点重合而减少（正六边形是特殊情形）。不讨论曲面立体或高维超立方体。',
    next: '把平面位置拖到 0.1（贴近一个面）——截面还能是六边形吗？想想能切到几个面。',
    caption: () => '装置：正方体 → 截平面 → 交线 → 截面多边形；节点按「切到的面数」依次点亮'
  },
  {
    id: 'm2_stats_shift', stage: '高中', subject: '数学', chapter: '必修二 · 第九章 · 统计',
    title: '每个数据都加 10，方差会变成多少',
    hook: '整体平移只是换了个位置，离散程度没变。',
    question: '一组数据的方差是 4，把每个数据都加上 10，新方差是多少？',
    predictLabel: '你猜新方差', predictUnit: '', predictDefault: 14, predictMin: 0, predictMax: 50,
    params: [
      { key: 'v', label: '原方差', unit: '', min: 1, max: 20, step: 1, value: 4 },
      { key: 'c', label: '平移量', unit: '', min: -20, max: 20, step: 1, value: 10 },
      { key: 'm', label: '数据个数', unit: '个', min: 3, max: 50, step: 1, value: 10 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => p.v * x * x / (x * x || 1),
    domain: () => [-20, 20],
    truth: p => p.v,
    formula: 'D(X + c) = D(X)；E(X + c) = E(X) + c，方差不受平移影响',
    calc: p => '每个数据 xᵢ → xᵢ + ' + p.c + '，均值也跟着加 ' + p.c + ' → 每个离差 (xᵢ+c) − (μ+c) = xᵢ − μ 完全不变 → 方差仍为 ' + p.v.toFixed(1) + '；数据个数 ' + p.m + ' 不进入公式',
    insight: '均值跟着整体平移走，所以「离均值的距离」一个都没变，方差自然不变。直觉填 14 是把「方差加上平移量」了——那件事只发生在均值上。若改成「每个数据乘 k」，方差才会变成 k² 倍。',
    boundary: '这里只做加常数平移，不涉及乘常数或标准化；方差按总体方差定义，样本方差的 1/(n−1) 修正不影响平移不变性。数据个数 m 只是背景信息。',
    next: '如果把每个数据改成乘 2（不是加 2），方差会变成 4 倍吗？',
    curveLabel: p => '横轴是平移量 c，方差曲线恒为 ' + p.v.toFixed(1) + ' 的水平线'
  },
  {
    id: 'm2_prob_two_boys', stage: '高中', subject: '数学', chapter: '必修二 · 第十章 · 概率',
    title: '已知至少有一个男孩，两个都是男孩的概率',
    hook: '去掉的不是「一半」，而是四种情况里的一种。',
    question: '一个家庭有两个孩子，已知至少有一个是男孩，那么两个都是男孩的概率是多少（%）？',
    predictLabel: '你猜条件概率', predictUnit: '%', predictDefault: 50, predictMin: 0, predictMax: 100,
    params: [
      { key: 'pBoy', label: '生男孩概率', unit: '', min: 0.3, max: 0.7, step: 0.1, value: 0.5 },
      { key: 'n', label: '调查家庭数', unit: '户', min: 10, max: 1000, step: 10, value: 100 }
    ],
    renderer: 'function', duration: 3.0,
    curve: p => x => x / 3,
    domain: () => [0, 3],
    truth: p => 100 * p.pBoy * p.pBoy / (1 - Math.pow(1 - p.pBoy, 2)),
    formula: 'P(两男 | 至少一男) = P(两男)/P(至少一男) = p²/[1−(1−p)²]',
    calc: p => '四种等可能：男男 / 男女 / 女男 / 女女；已知「至少一男」后去掉女女，剩 3 种，其中男男 1 种 → 1/3 ≈ ' + (100 / 3).toFixed(1) + '%（p = ' + p.pBoy.toFixed(1) + ' 时为 ' + (100 * p.pBoy * p.pBoy / (1 - Math.pow(1 - p.pBoy, 2))).toFixed(1) + '%）；调查 ' + p.n + ' 户不改变比例',
    insight: '直觉答 50% 的人把「另一个孩子是男孩」当成独立事件了。但「至少一个男孩」这个条件并没有指定是哪一个，男女和女男是两种不同情况。样本空间从 4 种缩到 3 种，两男只占 1/3。',
    boundary: '假设每胎性别独立且概率相同、只考虑男女两种性别；「至少一男」是接到随机家庭后的条件，与「看到其中一个是男孩」信息结构不同（后者可能得到 1/2）。这里用等可能枚举，不讨论多胞胎。',
    next: '把生男孩概率拖到 0.7——条件概率会跟着变吗？用 p²/(1−(1−p)²) 算算。',
    curveLabel: () => '横轴是「已知至少一男后」的三种等可能家庭，两男占 1/3 ≈ 33.3%'
  },
  {
    id: 'm2_prob_dice', stage: '高中', subject: '数学', chapter: '必修二 · 第十章 · 概率',
    title: '掷两枚骰子，至少一个 6 点是 33.3% 吗',
    hook: '直接把 1/6 加两次，会把「两个都是 6」数重。',
    question: '同时掷两枚均匀六面骰子，至少出现一个 6 点的概率是多少（%）？',
    predictLabel: '你猜概率', predictUnit: '%', predictDefault: 33.3, predictMin: 0, predictMax: 100,
    params: [
      { key: 'n', label: '模拟次数', unit: '次', min: 100, max: 2000, step: 100, value: 600 },
      { key: 'sides', label: '骰子面数', unit: '面', min: 2, max: 12, step: 1, value: 6 }
    ],
    renderer: 'bars', duration: 3.2,
    trial: (p, rng) => rng() < 1 / p.sides || rng() < 1 / p.sides,
    truth: p => 100 * (1 - Math.pow(1 - 1 / p.sides, 2)),
    formula: 'P(至少一个 6) = 1 − P(两个都不是 6) = 1 − (5/6)² = 11/36 ≈ 30.6%',
    calc: p => '对立事件更稳：P = 1 − (1 − 1/' + p.sides + ')² = ' + (100 * (1 - Math.pow(1 - 1 / p.sides, 2))).toFixed(2) + '%；直接相加 1/' + p.sides + ' + 1/' + p.sides + ' = ' + (200 / p.sides).toFixed(1) + '% 会重复计算「两枚都是 6」',
    insight: '两个事件不是互斥的——「第一枚是 6」和「第二枚是 6」可以同时发生。加法公式要减去交集：1/6 + 1/6 − 1/36 = 11/36。更省事的方法是算对立事件「两个都不是 6」。',
    boundary: '两枚骰子相互独立且各面等可能；只统计「至少一个 6」，不区分先后顺序也不关心点数之和。模拟次数 n 只影响估计精度，不改变真值。',
    next: '把骰子换成 12 面——概率会变成 1/12 + 1/12 = 16.7% 吗？',
    caption: p => '撒点模拟 ' + p.n + ' 次：频率会收敛到真实概率，而不是直觉的「1/' + p.sides + ' + 1/' + p.sides + '」'
  },
  {
    id: 'm2_prob_expect', stage: '高中', subject: '数学', chapter: '必修二 · 第十章 · 概率',
    title: '掷骰子的平均点数，为什么不是整数',
    hook: '大量重复后稳定在 3.5，可骰子上根本没有 3.5 点。',
    question: '均匀六面骰子掷很多次，点数的平均值会趋近多少？',
    predictLabel: '你猜平均值', predictUnit: '', predictDefault: 3, predictMin: 1, predictMax: 10,
    params: [
      { key: 'sides', label: '骰子面数', unit: '面', min: 4, max: 20, step: 1, value: 6 },
      { key: 'n', label: '投掷次数', unit: '次', min: 10, max: 10000, step: 10, value: 1000 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => (1 + p.sides) / 2 + 1 / x,
    domain: () => [1, 100],
    truth: p => (1 + p.sides) / 2,
    formula: '均匀分布 1~n 的期望 E(X) = (1 + 2 + … + n)/n = (n+1)/2',
    calc: p => 'E(X) = (1+2+…+' + p.sides + ')/' + p.sides + ' = [' + p.sides + '×' + (p.sides + 1) + '/2]/' + p.sides + ' = ' + ((p.sides + 1) / 2).toFixed(2) + '；投掷 ' + p.n + ' 次只是让频率更接近期望，不改变期望本身',
    insight: '期望不是「最可能出现的结果」，而是长期平均的稳定值。3.5 点永远掷不出来，但它就是六面骰子的重心位置。把面数改成 4~20，期望总在 (n+1)/2——永远落在两个数中间。',
    boundary: '各面等概率且相互独立；期望存在且不要求单次结果等于期望。这里用确定性曲线示意「随投掷次数收敛」，不是真实随机序列；不讨论加权骰子或无限期望分布。',
    next: '把面数拖到 20——期望会变成 10.5 吗？',
    curveLabel: p => '横轴是投掷次数 n，平均值从上方收敛到 E(X) = ' + ((p.sides + 1) / 2).toFixed(2)
  },

  // ── 高考数学专题（10 条）────────────────────────────────────
  // 用户只提供必修教材，但数列、导数、解析几何、计数与正态分布在高考必考。
  // chapter 标「高考专题 ·」，按既有惯例不计入 textbook:scan 的教材落地数。
  {
    id: 'mgk_sum_arith', stage: '高中', subject: '数学', chapter: '高考专题 · 数列',
    title: '1+2+…+100，高斯凭什么一眼算出 5050',
    hook: '把首项和末项配成一对，每一对都一样大。',
    question: '1 + 2 + 3 + … + 100 的和是多少？',
    predictLabel: '你猜求和结果', predictUnit: '', predictDefault: 5000, predictMin: 0, predictMax: 20000,
    params: [
      { key: 'N', label: '加到第 N 项', unit: '', min: 10, max: 200, step: 10, value: 100 },
      { key: 'k', label: '干扰量', unit: '', min: 1, max: 10, step: 1, value: 3 }
    ],
    renderer: 'function', duration: 2.8,
    curve: () => x => x * (x + 1) / 2,
    domain: () => [1, 200],
    truth: p => p.N * (p.N + 1) / 2,
    formula: '等差数列求和 Sₙ = n(a₁ + aₙ)/2 = n(n+1)/2',
    calc: p => '首尾配对：1 + ' + p.N + ' = ' + (p.N + 1) + '，共 ' + (p.N / 2) + ' 对 → ' + (p.N + 1) + ' × ' + (p.N / 2) + ' = ' + (p.N * (p.N + 1) / 2) + '；公式 n(n+1)/2 给出同样结果，干扰量 ' + p.k + ' 无关',
    insight: '高斯小时候的巧算法：把数列正着写一遍、倒着写一遍，上下相加每列都是 n+1，一共 n 列，所以总和是 n(n+1)/2。硬加 100 次当然也能算，但配对法一眼就出结果。',
    boundary: '首项为 1、公差为 1 的特殊等差数列；一般等差数列要用 Sₙ = n(a₁+aₙ)/2，n 为奇数时配对会出现半项（公式仍成立）。不讨论无穷级数收敛性。',
    next: '把 N 拖到 200——和会变成 20100 吗？想想 200×201/2。',
    curveLabel: () => '横轴是项数 n，Sₙ = n(n+1)/2 是一条开口向上的抛物线'
  },
  {
    id: 'mgk_sum_geo', stage: '高中', subject: '数学', chapter: '高考专题 · 数列',
    title: '棋盘放麦粒，最后一格和全部相比哪个多',
    hook: '总和不是最后一格，而是下一格减一。',
    question: '等比数列 1 + 2 + 4 + … + 2²⁰ 的和是多少万粒？',
    predictLabel: '你猜总和', predictUnit: '万粒', predictDefault: 100, predictMin: 0, predictMax: 500,
    params: [
      { key: 'n', label: '最高次幂', unit: '', min: 5, max: 25, step: 1, value: 20 },
      { key: 'q', label: '公比', unit: '', min: 2, max: 4, step: 1, value: 2 }
    ],
    renderer: 'function', duration: 3.0,
    curve: p => x => (Math.pow(p.q, x + 1) - 1) / (p.q - 1) / 10000,
    domain: p => [1, p.n],
    truth: p => (Math.pow(2, p.n + 1) - 1) / 10000,
    formula: '等比数列求和 Sₙ = a₁(qⁿ − 1)/(q − 1)；公比 2 时 S = 2^(n+1) − 1',
    calc: p => '从 2⁰ 加到 2^' + p.n + ' 共 ' + (p.n + 1) + ' 项；S = 2^' + (p.n + 1) + ' − 1 = ' + (Math.pow(2, p.n + 1) - 1).toLocaleString('en-US') + ' 粒 ≈ ' + ((Math.pow(2, p.n + 1) - 1) / 10000).toFixed(2) + ' 万粒；最后一格 2^' + p.n + ' = ' + (Math.pow(2, p.n) / 10000).toFixed(2) + ' 万粒，只是总和的一半多一点点',
    insight: '直觉常把「最后一格」当成「全部」：2²⁰ ≈ 105 万，可总和是 2²¹ − 1 ≈ 210 万，差不多翻倍。棋盘放麦粒的传说正是靠这个翻倍速度，让国王倾家荡产。',
    boundary: '首项为 1、公比 q > 1 的有限等比级数；这里的真值按公比 2 计算（q 滑块为干扰项，切换到 3 或 4 时请改用通用公式）。大指数用浮点近似，结果按整数解释。',
    next: '把最高次幂拖到 25——总粒数会翻 32 倍吗？',
    curveLabel: p => '横轴是最高次幂 n，S(n) = 2^(n+1) − 1 呈指数爆炸；当前 n = ' + p.n
  },
  {
    id: 'mgk_fib_phi', stage: '高中', subject: '数学', chapter: '高考专题 · 数列',
    title: '斐波那契相邻两项之比，最终停在哪个数',
    hook: '越往后越接近 1.618，这个数到处都是。',
    question: '斐波那契数列 F(n+1)/F(n) 当 n 很大时趋近多少？',
    predictLabel: '你猜极限比值', predictUnit: '', predictDefault: 2, predictMin: 1, predictMax: 3,
    params: [
      { key: 'n', label: '项数 n', unit: '', min: 5, max: 30, step: 1, value: 20 },
      { key: 'a0', label: '首项', unit: '', min: 1, max: 5, step: 1, value: 1 },
      { key: 'a1', label: '第二项', unit: '', min: 1, max: 5, step: 1, value: 1 }
    ],
    renderer: 'function', duration: 3.0,
    curve: () => x => 1.618033988749895 + 0.4 / x,
    domain: () => [1, 30],
    truth: () => (1 + Math.sqrt(5)) / 2,
    formula: 'lim F(n+1)/F(n) = φ = (1+√5)/2 ≈ 1.618（黄金比例）',
    calc: p => 'φ = (1+√5)/2 = ' + ((1 + Math.sqrt(5)) / 2).toFixed(6) + '；递推 F(n+2) = F(n+1) + F(n) 两边除以 F(n+1) 再取极限，得 L = 1 + 1/L → L² − L − 1 = 0，取正根；当前算到第 ' + p.n + ' 项已经非常接近',
    insight: '「后一项 = 前两项之和」这个简单规则，会把相邻比值逼到一个固定的无理数。它出现在花瓣排列、贝壳螺旋、帕特农神庙的比例里，也是黄金分割的定义来源。猜 2 是把「大约翻倍」当成了精确极限。',
    boundary: '标准斐波那契初值 F₁ = F₂ = 1；换初值（a₀、a₁ 滑块为干扰项）时极限仍是 φ，只要两项同号且不同时为 0。曲线用闭式近似示意收敛，不是逐项精确计算。',
    next: '把项数拖到 5——比值偏离 φ 多远？项数越多越贴近。',
    curveLabel: () => '横轴是项数 n，比值从上方振荡收敛到 φ ≈ 1.618 的水平线'
  },
  {
    id: 'mgk_telescope', stage: '高中', subject: '数学', chapter: '高考专题 · 数列',
    title: '裂项相消，最后只剩两头',
    hook: '每一项都拆成两项，中间的全部抵消。',
    question: '1/(1×2) + 1/(2×3) + … + 1/(99×100) 的和是多少？',
    predictLabel: '你猜和', predictUnit: '', predictDefault: 0.5, predictMin: 0, predictMax: 2,
    params: [
      { key: 'N', label: '最后一项分母 N', unit: '', min: 5, max: 100, step: 5, value: 99 },
      { key: 'k', label: '干扰量', unit: '', min: 1, max: 10, step: 1, value: 2 }
    ],
    renderer: 'function', duration: 2.8,
    curve: () => x => x / (x + 1),
    domain: () => [1, 100],
    truth: p => p.N / (p.N + 1),
    formula: '1/[k(k+1)] = 1/k − 1/(k+1) → Sₙ = 1 − 1/(n+1) = n/(n+1)',
    calc: p => '1/(1×2) = 1 − 1/2，1/(2×3) = 1/2 − 1/3，…，1/(' + p.N + '×' + (p.N + 1) + ') = 1/' + p.N + ' − 1/' + (p.N + 1) + '；中间全消 → S = 1 − 1/' + (p.N + 1) + ' = ' + (p.N / (p.N + 1)).toFixed(4),
    insight: '裂项相消的关键是把通项写成「两项之差」，而且相邻项能首尾接上。很多人只算前两三项就猜 0.5，其实随着项数增加，和会一直逼近 1——只是永远差 1/(n+1)。',
    boundary: '仅适用于形如 1/[k(k+d)] 的可裂项通项（这里 d = 1）；一般分式要先做部分分式分解。N 为正整数，不讨论无穷级数的极限取值过程（极限为 1）。',
    next: '把 N 拖到 5——和会变成 5/6 ≈ 0.833 吗？',
    curveLabel: () => '横轴是项数 n，S(n) = n/(n+1) 从 0.5 逐渐逼近 1'
  },
  {
    id: 'mgk_derivative_slope', stage: '高中', subject: '数学', chapter: '高考专题 · 导数',
    title: 'y = x² 在 x = 3 处的切线斜率是 9 吗',
    hook: '9 是那个点的高度，斜率要从导数算。',
    question: '曲线 y = x² 在点 (3,9) 处的切线斜率是多少？',
    predictLabel: '你猜切线斜率', predictUnit: '', predictDefault: 9, predictMin: -5, predictMax: 30,
    params: [
      { key: 'a', label: '切点横坐标', unit: '', min: 0, max: 10, step: 1, value: 3 },
      { key: 'p', label: '幂次 n', unit: '', min: 2, max: 5, step: 1, value: 2 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => p.p * Math.pow(x, p.p - 1),
    domain: () => [0, 10],
    truth: p => p.p * Math.pow(p.a, p.p - 1),
    formula: '(xⁿ)′ = n·xⁿ⁻¹；切线斜率就是导函数在该点的值',
    calc: p => 'f(x) = x^' + p.p + '，f′(x) = ' + p.p + 'x^' + (p.p - 1) + '；在 x = ' + p.a + ' 处斜率 = ' + (p.p * Math.pow(p.a, p.p - 1)).toFixed(2) + '；而函数值 f(' + p.a + ') = ' + Math.pow(p.a, p.p) + '（容易误当成斜率的数）',
    insight: '混淆「函数值」和「导数值」是导数题第一大失分点。点 (3,9) 告诉你高度是 9，但切线倾斜程度由 f′(3) = 2×3 = 6 决定。可以拿割线斜率 (f(3+h)−f(3))/h 令 h→0 验证。',
    boundary: '只讨论幂函数且切点在定义域内；幂次改为 3、4 时真值随之改变。若函数不可导（尖点、垂直切线）则没有有限斜率，本实验不涉及。',
    next: '把幂次改成 3——在 x = 3 处斜率会变成 27 吗？想想 3x²。',
    curveLabel: p => '横轴是横坐标 x，曲线 y = f′(x) = ' + p.p + 'x^' + (p.p - 1) + '；在 x = ' + p.a + ' 处读斜率'
  },
  {
    id: 'mgk_integral_area', stage: '高中', subject: '数学', chapter: '高考专题 · 导数',
    title: 'y = x² 在 0~1 下方的面积，是 1/2 吗',
    hook: '它不是三角形，不能套「底乘高除以二」。',
    question: '曲线 y = x²、x 轴与直线 x = 1 围成的图形面积是多少？',
    predictLabel: '你猜面积', predictUnit: '', predictDefault: 0.5, predictMin: 0, predictMax: 3,
    params: [
      { key: 'n', label: '幂次', unit: '', min: 1, max: 5, step: 1, value: 2 },
      { key: 'b', label: '右端点', unit: '', min: 0.5, max: 3, step: 0.5, value: 1 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => Math.pow(x, p.n),
    domain: p => [0, p.b],
    truth: p => Math.pow(p.b, p.n + 1) / (p.n + 1),
    formula: '∫₀ᵇ xⁿ dx = bⁿ⁺¹/(n+1)',
    calc: p => '∫₀^' + p.b + ' x^' + p.n + ' dx = x^' + (p.n + 1) + '/' + (p.n + 1) + ' |₀^' + p.b + ' = ' + (Math.pow(p.b, p.n + 1) / (p.n + 1)).toFixed(4) + '；用外接矩形 b×bⁿ = ' + (p.b * Math.pow(p.b, p.n)).toFixed(2) + ' 估算会偏大',
    insight: '很多人把曲线下方面积当成三角形，算成 ½×1×1 = 0.5。但 y = x² 是向下凹的，实际只占单位正方形的 1/3。定积分正是解决这类「非规则图形面积」的工具。',
    boundary: '函数在积分区间上非负且连续；幂次 n 为非负整数，右端点 b > 0。若曲线在 x 轴下方，积分值为负而面积取其绝对值，本实验不涉及。',
    next: '把幂次改成 1（直线 y = x）——面积会变成 0.5 吗？',
    curveLabel: p => '横轴 x，曲线 y = x^' + p.n + ' 下方的面积 = ' + (Math.pow(p.b, p.n + 1) / (p.n + 1)).toFixed(4)
  },
  {
    id: 'mgk_ellipse_e', stage: '高中', subject: '数学', chapter: '高考专题 · 圆锥曲线',
    title: '椭圆 a = 5、b = 3，离心率是 3/5 吗',
    hook: '短半轴除以长半轴不是离心率，要先算焦距。',
    question: '椭圆 x²/25 + y²/9 = 1 的离心率是多少？',
    predictLabel: '你猜离心率', predictUnit: '', predictDefault: 0.6, predictMin: 0, predictMax: 1,
    params: [
      { key: 'a', label: '长半轴 a', unit: '', min: 2, max: 10, step: 1, value: 5 },
      { key: 'b', label: '短半轴 b', unit: '', min: 1, max: 9, step: 1, value: 3 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => Math.sqrt(Math.max(0, x * x - p.b * p.b)) / x,
    domain: p => [p.b + 0.5, 12],
    truth: p => Math.sqrt(Math.max(0, p.a * p.a - p.b * p.b)) / (p.a || 1),
    formula: 'c² = a² − b²；离心率 e = c/a = √(a²−b²)/a',
    calc: p => 'c = √(' + p.a + '² − ' + p.b + '²) = ' + Math.sqrt(Math.max(0, p.a * p.a - p.b * p.b)).toFixed(2) + '；e = c/a = ' + (Math.sqrt(Math.max(0, p.a * p.a - p.b * p.b)) / (p.a || 1)).toFixed(4) + '；而 b/a = ' + (p.b / p.a).toFixed(2) + ' 只是短长轴之比，不是离心率',
    insight: '离心率量的是「焦点离中心有多远」，所以要用 c 而不是 b。a=5、b=3 时 c=4（经典 3-4-5 直角三角形），e=0.8。猜 0.6 是把 b/a 当成了 e——注意 e 越接近 1 椭圆越扁。',
    boundary: '只讨论焦点在 x 轴且 a > b > 0 的标准椭圆；若 b > a 需交换 a、b 并把焦点放到 y 轴。圆（a = b）的离心率为 0，属退化情形。',
    next: '把 b 拖到 4——c 会变成 3、e 变成 0.6 吗？',
    curveLabel: p => '横轴是长半轴 a，e = √(a²−' + p.b + '²)/a 随 a 增大而上升；当前 a = ' + p.a
  },
  {
    id: 'mgk_binomial_sum', stage: '高中', subject: '数学', chapter: '高考专题 · 计数与二项式',
    title: '(1+x)¹⁰ 展开后所有系数加起来是多少',
    hook: '别去逐项算组合数，给 x 赋一个值就行。',
    question: '(1 + x)¹⁰ 展开式中所有二项式系数的和是多少？',
    predictLabel: '你猜系数和', predictUnit: '', predictDefault: 20, predictMin: 0, predictMax: 2000,
    params: [
      { key: 'n', label: '指数 n', unit: '', min: 1, max: 20, step: 1, value: 10 },
      { key: 'k', label: '干扰量', unit: '', min: 1, max: 10, step: 1, value: 4 }
    ],
    renderer: 'function', duration: 2.8,
    curve: () => x => Math.pow(2, x),
    domain: () => [1, 20],
    truth: p => Math.pow(2, p.n),
    formula: '令 x = 1 → 系数和 = (1+1)ⁿ = 2ⁿ = C(n,0)+C(n,1)+…+C(n,n)',
    calc: p => '令 x = 1，左边 (1+1)^' + p.n + ' = 2^' + p.n + ' = ' + Math.pow(2, p.n) + '，右边正是所有系数之和；干扰量 ' + p.k + ' 无关',
    insight: '赋值法是二项式定理最常用的技巧：要求系数和就令 x = 1；要求奇数项系数和就用 (1+1)ⁿ 与 (1−1)ⁿ 相加减。逐项算 11 个组合数既慢又容易漏，答案是 1024 不是 20。',
    boundary: '指数 n 为非负整数；系数指二项式系数 C(n,k)，若各项另带字母系数则不能直接令 x = 1。不讨论广义二项式定理的无穷级数。',
    next: '把指数拖到 20——系数和会变成 1 048 576 吗？',
    curveLabel: () => '横轴是指数 n，系数和 = 2ⁿ 是一条陡峭的指数曲线'
  },
  {
    id: 'mgk_bayes_test', stage: '高中', subject: '数学', chapter: '高考专题 · 概率统计',
    title: '检测准确率 99%，阳性就真的有病吗',
    hook: '没病的人太多了，哪怕只有 1% 误报也能凑出一样多。',
    question: '某病患病率 1%，检测的灵敏度与特异度都是 99%。一个人检测呈阳性，他真患病的概率约是多少（%）？',
    predictLabel: '你猜阳性后患病率', predictUnit: '%', predictDefault: 99, predictMin: 0, predictMax: 100,
    params: [
      { key: 'prev', label: '人群患病率', unit: '%', min: 0.1, max: 10, step: 0.1, value: 1 },
      { key: 'acc', label: '检测准确率', unit: '%', min: 90, max: 99.9, step: 0.1, value: 99 }
    ],
    renderer: 'function', duration: 3.2,
    curve: p => x => 100 * (x / 100) * (p.acc / 100) / ((x / 100) * (p.acc / 100) + (1 - x / 100) * (1 - p.acc / 100)),
    domain: () => [0.1, 10],
    truth: p => 100 * (p.prev / 100) * (p.acc / 100) / ((p.prev / 100) * (p.acc / 100) + (1 - p.prev / 100) * (1 - p.acc / 100)),
    formula: 'P(病|阳) = P(阳|病)P(病) / [P(阳|病)P(病) + P(阳|无病)P(无病)]',
    calc: p => '假设 10000 人：真有病 100 人，其中 ' + (100 * p.acc / 100).toFixed(0) + ' 人检出阳性；没病 9900 人，其中约 ' + (9900 * (1 - p.acc / 100)).toFixed(0) + ' 人被误报阳性。阳性总人数里真病人的占比 = ' + (100 * (p.prev / 100) * (p.acc / 100) / ((p.prev / 100) * (p.acc / 100) + (1 - p.prev / 100) * (1 - p.acc / 100))).toFixed(1) + '%',
    insight: '「准确率 99%」不等于「阳性后 99% 有病」。因为没病的人基数巨大，1% 的误报就能产生和真病人差不多多的阳性结果。这是贝叶斯公式最经典的反直觉案例，也是体检需要复查的原因。',
    boundary: '假设灵敏度与特异度相等、检测独立于其他信息、受检者从普通人群随机抽取；有症状或高危人群的先验患病率更高，阳性预测值会明显上升。不讨论多次检测的联合判断。',
    next: '把患病率拖到 10%——阳性后患病率会大幅上升吗？这就是「基础率」的作用。',
    curveLabel: p => '横轴是人群患病率（%），阳性预测值随之陡升；当前准确率 ' + p.acc.toFixed(1) + '%'
  },
  {
    id: 'mgk_normal_2sigma', stage: '高中', subject: '数学', chapter: '高考专题 · 概率统计',
    title: '正态分布的 μ±2σ 里装了多少数据',
    hook: '68% 对应的是 ±1σ，不是 ±2σ。',
    question: '服从正态分布的随机变量，落在 μ±2σ 区间内的概率约为多少（%）？',
    predictLabel: '你猜区间概率', predictUnit: '%', predictDefault: 68, predictMin: 0, predictMax: 100,
    params: [
      { key: 'mu', label: '均值 μ', unit: '', min: -10, max: 10, step: 1, value: 0 },
      { key: 'sigma', label: '标准差 σ', unit: '', min: 0.5, max: 5, step: 0.5, value: 1 }
    ],
    renderer: 'function', duration: 2.8,
    curve: p => x => Math.exp(-0.5 * Math.pow((x - p.mu) / p.sigma, 2)) / (p.sigma * Math.sqrt(2 * PI)),
    domain: p => [p.mu - 4 * p.sigma, p.mu + 4 * p.sigma],
    truth: () => 95.44997,
    formula: '3σ 原则：P(μ±σ) ≈ 68.3%，P(μ±2σ) ≈ 95.4%，P(μ±3σ) ≈ 99.7%',
    calc: p => 'μ = ' + p.mu + '、σ = ' + p.sigma + ' 只决定钟形曲线的位置和宽窄，不改变区间内的面积比例；±2σ 覆盖约 95.4% 的数据；±1σ 才是约 68.3%',
    insight: '3σ 原则是正态分布最常用的记忆点：68-95-99.7。把 68% 安到 ±2σ 上是把两个数字记串了。工业质量控制里的「六西格玛」也是这套规则的延伸。',
    boundary: '只对正态（高斯）分布成立，其他分布即便有相同均值方差也不适用；区间端点连续，取不取等号不影响概率。这里用标准公式给出近似值，不是精确积分。',
    next: '想想 ±3σ 覆盖多少？为什么工业上用 3σ 判异常值？',
    curveLabel: p => '横轴是随机变量取值，钟形曲线以 μ = ' + p.mu + ' 为中心、σ = ' + p.sigma + ' 为宽窄'
  }
]

/* ── 主题分组 ────────────────────────────────────────────────
 * 首页按这个顺序展示，同主题的实验紧挨在一起；
 * topic 只是展示顺序标签，不改教材章节，也不参与筛选计数。
 */
export const TOPIC_ORDER = [
  '力学', '热学', '电磁学', '光学', '声与波动', '近代物理与能源',
  '数学·函数与代数', '数学·几何与向量', '数学·概率与统计', '数学·数列与微积分'
]

const TOPIC_RULES = [
  ['热学', /^(j8a_(melt|boil|thermometer|sublimation)|j9_(heat_|engine_eff|internal_energy_way)|gk_(gas_|thermo_first))/],
  ['光学', /^(refraction|j8a_(mirror|lens|light_reflect|pinhole|dispersion|invisible_light|glasses|magnifier|micro_telescope)|gk_(total_reflection|double_slit))$/],
  ['声与波动', /^(wave|doppler|j8a_(sound_.*|echo|lightning|noise_level))$/],
  ['近代物理与能源', /^(gk_(photoelectric|half_life|energy_level)|j9_(nuclear_energy|energy_class))$/],
  ['电磁学', /^(ohm|b3_|gk_(lorentz_period|transmission|transformer|ampere_angle|velocity_selector|lenz)|j9_(series_|parallel_|elec_power|joule|electromagnet|volt_divider|rated_power|household|voltmeter|fault_short|induction_current|ammeter_scale|varistor_wiring|elec_bill|safety|oster|generator|emwave_lambda|circuit_read)|book_(multimeter|induction_condition|ampere_lab|capacitor_charge))$/],
  ['数学·几何与向量', /^(pythagoras|m2_(vector_|sphere_in_cube|cube_section)|mgk_ellipse_e)$/],
  ['数学·概率与统计', /^(monty|birthday|pi_mc|m2_(stats_shift|prob_.*)|mgk_(bayes_test|normal_2sigma|binomial_sum))$/],
  ['数学·数列与微积分', /^(mgk_(sum_.*|fib_phi|telescope|derivative_slope|integral_area))$/]
]

function topicOf(e) {
  for (const [topic, re] of TOPIC_RULES) {
    if (re.test(e.id)) return topic
  }
  if (e.subject === '数学') return '数学·函数与代数'
  return '力学'
}

const CHAPTER_ORDER = [
  '力学', '光学', '电学', '波动', '几何', '概率', '函数',
  '八上', '八下', '九全', '必修一', '必修二', '必修三', '高考专题', '教材实验'
]

function rank(list, key) {
  const i = list.indexOf(key)
  return i < 0 ? list.length : i
}

export const EXPERIMENTS = RAW_EXPERIMENTS
  .map((e, sourceIndex) => ({ ...e, topic: topicOf(e), sourceIndex }))
  .sort((a, b) => {
    const t = rank(TOPIC_ORDER, a.topic) - rank(TOPIC_ORDER, b.topic)
    if (t) return t
    const s = rank(['初中', '高中'], a.stage) - rank(['初中', '高中'], b.stage)
    if (s) return s
    const chapterA = a.chapter.split(' · ')[0]
    const chapterB = b.chapter.split(' · ')[0]
    const c = rank(CHAPTER_ORDER, chapterA) - rank(CHAPTER_ORDER, chapterB)
    if (c) return c
    if (a.chapter !== b.chapter) return a.chapter < b.chapter ? -1 : 1
    return a.sourceIndex - b.sourceIndex
  })

export function findExperiment(id) {
  return EXPERIMENTS.find(e => e.id === id) || EXPERIMENTS[0]
}

export function paramValueText(param, value) {
  if (param.options) {
    const hit = param.options.find(o => o.value === value)
    return hit ? hit.label : String(value)
  }
  const n = Number(value)
  return (param.step && param.step < 1) ? n.toFixed(1) : String(Math.round(n * 100) / 100)
}
