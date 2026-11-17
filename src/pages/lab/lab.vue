<template>
  <view class="page">
    <view class="head">
      <view class="head-top">
        <text class="tag" :class="exp.subject === '物理' ? 'tag-phy' : 'tag-math'">{{ exp.stage }} · {{ exp.subject }}</text>
        <text class="chapter">{{ exp.chapter }}</text>
      </view>
      <text class="title">{{ exp.title }}</text>
      <text class="hook">{{ exp.hook }}</text>
    </view>

    <view class="steps">
      <view v-for="(s, i) in stepNames" :key="i" class="step" :class="i <= activeStep ? 'step-on' : ''">
        <text class="step-n">{{ i + 1 }}</text><text class="step-t">{{ s }}</text>
      </view>
    </view>

    <!-- ================= 舞台：渲染器池 ================= -->
    <view class="stage">
      <view class="stage-bg-line"></view>

      <view v-if="exp.renderer === 'freefall'" class="rf">
        <view class="rf-ground"></view>
        <view class="rf-ball rf-a" :style="{ top: (state.drop * 0.72) + '%' }"><text>铁球</text></view>
        <view class="rf-ball rf-b" :style="{ top: (state.drop * 0.72) + '%' }"><text>木球</text></view>
        <text class="stage-cap">{{ stageCaption }}</text>
      </view>

      <view v-else-if="exp.renderer === 'pendulum'" class="pd">
        <view class="pd-pivot"></view>
        <view class="pd-arm" :style="{ transform: 'rotate(' + state.angle + 'deg)' }">
          <view class="pd-rod" :style="{ height: (42 + p.L * 48) + 'px' }"></view>
          <view class="pd-bob" :style="{ top: (42 + p.L * 48) + 'px' }"></view>
        </view>
        <text class="stage-cap">{{ stageCaption }}</text>
      </view>

      <view v-else-if="exp.renderer === 'spring'" class="sp">
        <view class="sp-top"></view>
        <view class="sp-coil" :style="{ height: (62 + state.offset) + 'px' }"></view>
        <view class="sp-mass" :style="{ top: (62 + state.offset) + 'px' }"><text>{{ p.m.toFixed(1) }} kg</text></view>
        <text class="stage-cap">{{ stageCaption }}</text>
      </view>

      <view v-else-if="exp.renderer === 'projectile'" class="pj">
        <view class="pj-ground"></view>
        <view v-for="(pt, i) in state.pts" :key="i" class="pj-dot" :style="{ left: (4 + pt.left * 0.9) + '%', bottom: (14 + pt.bottom * 0.8) + '%' }"></view>
        <view class="pj-ball" :style="{ left: (4 + state.ball.left * 0.9) + '%', bottom: (14 + state.ball.bottom * 0.8) + '%' }"></view>
        <text class="stage-cap">{{ stageCaption }}</text>
      </view>

      <view v-else-if="exp.renderer === 'wave' || exp.renderer === 'doppler'" class="wv">
        <view class="wv-row">
          <view v-for="(h, i) in state.heights" :key="i" class="wv-bar" :style="{ height: h + '%' }"></view>
        </view>
        <text class="stage-cap">{{ stageCaption }}</text>
      </view>

      <view v-else-if="exp.renderer === 'optics'" class="op">
        <view class="op-medium"></view>
        <view class="op-normal"></view>
        <view class="op-in op-ray" :style="{ transform: 'rotate(' + (270 - state.inAngle) + 'deg)' }"></view>
        <view class="op-out op-ray" :style="{ transform: 'rotate(' + (90 - state.outAngle) + 'deg)' }"></view>
        <view class="op-label op-l1"><text>空气 n₁≈1</text></view>
        <view class="op-label op-l2"><text>介质 n₂={{ p.n2 }}</text></view>
        <text class="stage-cap">{{ stageCaption }}</text>
      </view>

      <view v-else-if="exp.renderer === 'circuit'" class="ci">
        <view class="ci-row">
          <view class="ci-box"><text class="ci-k">电池</text><text class="ci-v">{{ p.U }} V</text></view>
          <view class="ci-wire"></view>
          <view class="ci-box"><text class="ci-k">电阻</text><text class="ci-v">{{ p.R }} Ω</text></view>
          <view class="ci-wire"></view>
          <view class="ci-lamp" :style="{ opacity: state.brightness }"><text>灯</text></view>
        </view>
        <text class="stage-cap">{{ stageCaption }}</text>
      </view>

      <view v-else-if="exp.renderer === 'lever'" class="lv">
        <view class="lv-fulcrum"></view>
        <view class="lv-beam" :style="{ transform: 'rotate(' + state.tilt + 'deg)' }">
          <view class="lv-w lv-w1"><text>{{ p.F1 }} N</text></view>
          <view class="lv-w lv-w2"><text>{{ state.F2.toFixed(1) }} N</text></view>
        </view>
        <text class="stage-cap">{{ stageCaption }}</text>
      </view>

      <view v-else-if="exp.renderer === 'triangle'" class="tr">
        <view class="tr-base" :style="{ width: state.aLen + 'px' }"><text>a = {{ p.a }}</text></view>
        <view class="tr-side" :style="{ height: state.bLen + 'px' }"><text>b = {{ p.b }}</text></view>
        <view class="tr-hyp" :style="{ left: (60 + state.aLen) + 'px', width: state.cLen + 'px', transform: 'rotate(' + (180 + state.cDeg) + 'deg)' }"></view>
        <text class="tr-c">c = {{ fmt(actualOrTruth) }}</text>
        <text class="stage-cap">{{ stageCaption }}</text>
      </view>

      <view v-else-if="exp.renderer === 'function'" class="fn">
        <view class="fn-axis-x"></view>
        <view class="fn-axis-y"></view>
        <view v-for="(pt, i) in state.pts" :key="i" class="fn-dot"
          :class="i <= revealCount ? 'fn-dot-on' : ''"
          :style="{ left: (4 + pt.left * 0.92) + '%', bottom: (12 + pt.bottom * 0.82) + '%' }"></view>
        <text class="stage-cap">{{ stageCaption }}</text>
      </view>

      <view v-else-if="exp.renderer === 'bars'" class="br">
        <view class="br-row">
          <view class="br-col"><view class="br-bar br-guess" :style="{ height: guessBar + '%' }"></view><text class="br-l">你猜 {{ fmt(guessNum) }}%</text></view>
          <view class="br-col"><view class="br-bar br-truth" :style="{ height: Math.min(100, state.target) + '%' }"></view><text class="br-l">真实 {{ fmt(state.target) }}%</text></view>
          <view class="br-col"><view class="br-bar br-mc" :style="{ height: Math.min(100, state.estimate) + '%' }"></view><text class="br-l">模拟 {{ fmt(state.estimate) }}%</text></view>
        </view>
        <text class="stage-cap">{{ stageCaption }}</text>
      </view>

      <view v-else-if="exp.renderer === 'diagram'" class="dg">
        <view class="dg-flow">
          <view v-for="(n, i) in state.nodes" :key="i" class="dg-node"
            :class="n.on ? ('dg-on ' + (n.tone === 'warn' ? 'dg-warn' : (n.tone === 'good' ? 'dg-good' : 'dg-info'))) : ''">
            <text class="dg-k">{{ n.label }}</text>
            <text class="dg-v">{{ n.value }}</text>
          </view>
        </view>
        <text class="stage-cap">{{ stageCaption }}</text>
      </view>
    </view>

    <!-- ================= 参数 ================= -->
    <view class="sec">
      <view class="sec-t">先调参数</view>
      <view v-for="item in exp.params" :key="item.key" class="param">
        <view class="param-h"><text class="param-k">{{ item.label }}</text><text class="param-v">{{ paramValueText(item, p[item.key]) }}{{ item.unit ? ' ' + item.unit : '' }}</text></view>
        <slider v-if="!item.options" class="slider" :value="p[item.key]" :min="item.min" :max="item.max" :step="item.step"
          activeColor="#1B3A54" backgroundColor="#E2DDD2" block-size="18" @change="onSlider(item.key, $event)" />
        <view v-else class="opt-row">
          <view v-for="o in item.options" :key="o.value" class="opt" :class="p[item.key] === o.value ? 'opt-on' : ''" @click="onOption(item.key, o.value)"><text>{{ o.label }}</text></view>
        </view>
      </view>
    </view>

    <!-- ================= 猜 / 跑 ================= -->
    <view class="sec">
      <view class="sec-t">{{ phase === 'result' ? '这次的结果' : '先写下你的预测' }}</view>
      <text class="q">{{ exp.question }}</text>
      <view v-if="phase !== 'result'" class="guess-row">
        <input class="guess-input" type="digit" v-model="guess" :disabled="phase === 'running'" />
        <text class="guess-unit">{{ exp.predictUnit }}</text>
        <button class="btn" :disabled="phase === 'running'" @click="run"><text>{{ phase === 'running' ? '模拟中…' : '运行模拟' }}</text></button>
      </view>
      <text v-if="phase === 'running'" class="running-hint">正在按真实物理规律推进，公式还藏着…</text>
      <text v-if="phase === 'guess'" class="guess-hint">猜错没关系，偏差正是这个 App 要记录的东西。</text>

      <view v-if="phase === 'result'" class="result">
        <view class="res-grid">
          <view class="res"><text class="res-k">你猜</text><text class="res-v">{{ fmt(guessNum) }}{{ exp.predictUnit }}</text></view>
          <view class="res"><text class="res-k">真实</text><text class="res-v res-real">{{ fmt(actual) }}{{ exp.predictUnit }}</text></view>
          <view class="res"><text class="res-k">偏差</text><text class="res-v res-err">{{ Math.round(err) }}%</text></view>
        </view>
        <view v-if="showFormula" class="formula-card">
          <text class="fc-k">第 4 步 · 公式出现（对你刚才观察的压缩）</text>
          <text class="fc-f">{{ exp.formula }}</text>
          <text class="fc-c">代入：{{ exp.calc(p) }} = {{ fmt(actual) }}{{ exp.predictUnit }}</text>
        </view>
        <view v-if="showFormula" class="insight"><text class="ib-k">为什么会这样</text><text class="ib-b">{{ exp.insight }}</text></view>
        <view v-if="showFormula" class="boundary"><text class="ib-k">模型边界 · 公式在哪儿会失效</text><text class="ib-b">{{ exp.boundary }}</text></view>
        <view v-if="showFormula" class="next"><text class="ib-k">下一问</text><text class="ib-b">{{ exp.next }}</text></view>
        <button class="btn btn-again" @click="again"><text>改参数，再猜一次</text></button>
      </view>
    </view>

    <view v-if="history.length" class="sec">
      <view class="sec-t">这个实验的直觉校准</view>
      <view class="hist">
        <view v-for="(x, i) in history" :key="i" class="hist-row">
          <text class="hist-n">第 {{ i + 1 }} 次</text>
          <view class="hist-track"><view class="hist-bar" :style="{ width: Math.min(100, x.err) + '%' }"></view></view>
          <text class="hist-v">{{ Math.round(x.err) }}%</text>
        </view>
      </view>
    </view>

    <view class="foot"><text>公式是压缩，不是起点 · 模型边界已如实标注</text></view>
  </view>
</template>

<script>
import { EXPERIMENTS, findExperiment, paramValueText } from '../../common/experiments.js'
import { initialParams, truthValue, relativeError, frameState, fmt } from '../../common/engine.js'
import { loadProfile, recordAttempt } from '../../common/profile.js'

const FIRST = EXPERIMENTS[0]

export default {
  data() {
    return {
      exp: FIRST,
      p: initialParams(FIRST),
      state: frameState(FIRST, initialParams(FIRST), 0, 0),
      stepNames: ['猜', '跑', '偏差', '公式'],
      phase: 'guess',
      guess: String(FIRST.predictDefault),
      guessNum: 0,
      actual: 0,
      err: 0,
      showFormula: false,
      history: [],
      timer: null,
      paramValueText,
      fmt,
      Math
    }
  },
  computed: {
    activeStep() { return this.phase === 'guess' ? 0 : (this.phase === 'running' ? 1 : (this.showFormula ? 3 : 2)) },
    guessBar() { return Math.max(0, Math.min(100, Number(this.guess) || this.guessNum || 0)) },
    revealCount() { return this.phase === 'running' ? Math.ceil(this.state.progress * 41) : 41 },
    actualOrTruth() { return truthValue(this.exp, this.p) },
    /**
     * 舞台底部说明。实验数据里若提供 caption(p, state)，完全由数据决定；
     * 否则按 renderer 给一套默认文案。新增实验因此不必改本页模板。
     */
    stageCaption() {
      const e = this.exp, p = this.p, s = this.state || {}
      if (typeof e.caption === 'function') return e.caption(p, s)
      const t = Number(s.t || 0).toFixed(2)
      switch (e.renderer) {
        case 'freefall': return 'h = ' + p.h + ' m · g = ' + p.g + ' m/s² · t = ' + t + ' s'
        case 'pendulum': return 'L = ' + Number(p.L || 0).toFixed(1) + ' m · t = ' + t + ' s'
        case 'spring': return 'k = ' + p.k + ' N/m · t = ' + t + ' s'
        case 'projectile': return 'v₀ = ' + p.v0 + ' m/s · θ = ' + p.ang + '° · 飞行 ' + Number(s.flight || 0).toFixed(2) + ' s'
        case 'wave': return 'f = ' + p.f + ' Hz · λ = ' + Number(p.lam || 0).toFixed(1) + ' m'
        case 'doppler': return '波前压缩 ×' + Number(s.compress || 0).toFixed(2)
        case 'optics': return 'θ₁ = ' + s.inAngle + '° · θ₂ = ' + Number(s.outAngle || 0).toFixed(1) + '°'
        case 'circuit': return 'I = ' + Number(s.current || 0).toFixed(2) + ' A · 亮度随功率变化'
        case 'lever': return 'L₁ = ' + Number(p.L1 || 0).toFixed(1) + ' m · L₂ = ' + Number(p.L2 || 0).toFixed(1) + ' m'
        case 'triangle': return '直角三角形 · 面积关系 a² + b² = c²'
        case 'function': return typeof e.curveLabel === 'function' ? e.curveLabel(p) : e.formula
        case 'bars': return s.trials
          ? ('已模拟 ' + s.trials + ' 次 · 频率正在收敛到真实概率')
          : '点「运行模拟」开始撒点，看频率怎么逼近真值'
        case 'diagram': return '装置现象 ' + (s.shown || 0) + '/' + ((s.nodes || []).length) + ' 步 · 依次点亮'
        default: return ''
      }
    }
  },
  onLoad(options) {
    const exp = findExperiment(options && options.id)
    const p = initialParams(exp)
    this.exp = exp
    this.p = p
    this.state = frameState(exp, p, 0, 0)
    this.guess = String(exp.predictDefault)
    this.loadHistory(exp.id)
    uni.setNavigationBarTitle({ title: exp.title })
  },
  onUnload() { if (this.timer) clearInterval(this.timer) },
  methods: {
    loadHistory(id) {
      this.history = loadProfile().attempts.filter(a => a.id === id).slice(-8)
    },
    refreshState() { this.state = frameState(this.exp, this.p, 0, 0) },
    onSlider(key, e) {
      const v = Number(e.detail.value)
      this.p = { ...this.p, [key]: v }
      if (this.phase !== 'running') this.refreshState()
    },
    onOption(key, v) {
      this.p = { ...this.p, [key]: v }
      if (this.phase !== 'running') this.refreshState()
    },
    run() {
      if (this.phase === 'running') return
      const raw = String(this.guess).trim()
      const g = Number(raw)
      // 允许负数：函数类实验的真值可能为负（如 y(2)）；只挡空输入与非法数字
      if (!raw || !isFinite(g)) { uni.showToast({ title: '先填一个数字再跑', icon: 'none' }); return }
      this.guessNum = g
      this.phase = 'running'
      this.showFormula = false
      this.state = frameState(this.exp, this.p, 0, 0)
      const t0 = Date.now()
      if (this.timer) clearInterval(this.timer)
      this.timer = setInterval(() => {
        const t = (Date.now() - t0) / 1000
        const prog = Math.min(1, t / this.exp.duration)
        this.state = frameState(this.exp, this.p, t, prog)
        if (prog >= 1) { clearInterval(this.timer); this.timer = null; this.finish() }
      }, 40)
    },
    finish() {
      this.actual = truthValue(this.exp, this.p)
      this.err = relativeError(this.guessNum, this.actual)
      recordAttempt(this.exp.id, this.guessNum, this.actual, this.err)
      this.loadHistory(this.exp.id)
      this.phase = 'result'
      setTimeout(() => { this.showFormula = true }, 600)
    },
    again() {
      this.phase = 'guess'
      this.showFormula = false
      this.state = frameState(this.exp, this.p, 0, 0)
      this.guess = String(this.exp.predictDefault)
    }
  }
}
</script>

<style>
.page { padding: 16px 16px 40px; background: #F6F4EF; }
.head { padding-bottom: 14px; border-bottom: 1px solid #E2DDD2; }
.head-top { display: flex; flex-direction: row; align-items: center; }
.tag { display: flex; flex-direction: row; align-items: center; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 4px; margin-right: 8px; }
.tag-phy { background: #E6F1FB; color: #185FA5; }
.tag-math { background: #E1F5EE; color: #0F6E56; }
.chapter { font-size: 10px; color: #8B8F96; }
.title { display: block; font-size: 21px; font-weight: 700; color: #1B3A54; margin-top: 8px; line-height: 1.35; }
.hook { display: block; font-size: 12px; color: #B86A32; margin-top: 6px; line-height: 1.6; }
.steps { display: flex; flex-direction: row; margin: 14px 0; }
.step { flex: 1; display: flex; flex-direction: row; align-items: center; justify-content: center; padding: 6px 0; border-radius: 6px; background: #EBE7DD; margin-right: 6px; }
.step-on { background: #1B3A54; }
.step-n { font-size: 11px; color: #8B8F96; margin-right: 4px; font-family: "SFMono-Regular", Consolas, monospace; }
.step-on .step-n { color: #8FC4EA; }
.step-t { font-size: 12px; color: #8B8F96; }
.step-on .step-t { color: #FFFFFF; font-weight: 700; }
.stage { position: relative; height: 196px; background: #FFFFFF; border: 1px solid #E8E3D8; border-radius: 10px; overflow: hidden; }
.stage-bg-line { position: absolute; left: 0; right: 0; top: 50%; border-top: 1px dashed #F0ECE2; }
.stage-cap { position: absolute; left: 10px; bottom: 6px; font-size: 10px; color: #8B8F96; font-family: "SFMono-Regular", Consolas, monospace; }
.rf, .pd, .sp, .pj, .wv, .op, .ci, .lv, .tr, .fn, .br, .dg { position: absolute; left: 0; top: 0; right: 0; bottom: 0; }
.rf-ground { position: absolute; left: 0; right: 0; bottom: 24px; height: 2px; background: #B4B2A9; }
.rf-ball { position: absolute; width: 34px; height: 34px; border-radius: 17px; display: flex; flex-direction: row; align-items: center; justify-content: center; }
.rf-ball text { font-size: 9px; color: #FFFFFF; }
.rf-a { left: 28%; background: #5F7D88; }
.rf-b { left: 58%; background: #B86A32; }
.pd-pivot { position: absolute; left: 50%; top: 14px; width: 8px; height: 8px; border-radius: 4px; background: #1B3A54; margin-left: -4px; }
.pd-arm { position: absolute; left: 50%; top: 18px; width: 2px; transform-origin: 50% 0%; }
.pd-rod { width: 2px; background: #1B3A54; }
.pd-bob { position: absolute; left: -11px; width: 24px; height: 24px; border-radius: 12px; background: #378ADD; }
.sp-top { position: absolute; left: 50%; top: 12px; width: 70px; height: 4px; margin-left: -35px; background: #1B3A54; }
.sp-coil { position: absolute; left: 50%; top: 16px; width: 3px; margin-left: -1px; border-left: 2px dashed #85B7EB; }
.sp-mass { position: absolute; left: 50%; width: 56px; height: 26px; margin-left: -28px; border-radius: 5px; background: #378ADD; display: flex; flex-direction: row; align-items: center; justify-content: center; }
.sp-mass text { font-size: 10px; color: #FFFFFF; }
.pj-ground { position: absolute; left: 0; right: 0; bottom: 26px; height: 2px; background: #B4B2A9; }
.pj-dot { position: absolute; width: 4px; height: 4px; border-radius: 2px; background: #B5D4F4; }
.pj-ball { position: absolute; width: 12px; height: 12px; border-radius: 6px; background: #B86A32; }
.wv-row { position: absolute; left: 12px; right: 12px; top: 20px; height: 130px; display: flex; flex-direction: row; align-items: center; }
.wv-bar { flex: 1; margin: 0 1px; background: #85B7EB; border-radius: 2px; min-height: 2px; }
.op-medium { position: absolute; left: 0; right: 0; top: 50%; bottom: 0; background: #E6F1FB; }
.op-normal { position: absolute; left: 50%; top: 0; bottom: 0; width: 1px; border-left: 1px dashed #8B8F96; }
.op-ray { position: absolute; left: 50%; top: 50%; width: 100px; height: 2px; background: #B86A32; transform-origin: 0% 50%; }
.op-in { margin-left: 0; }
.op-out { margin-left: 0; background: #1B3A54; }
.op-label { position: absolute; font-size: 10px; color: #185FA5; }
.op-l1 { left: 12px; top: 12px; }
.op-l2 { left: 12px; bottom: 30px; }
.ci-row { position: absolute; left: 10px; right: 10px; top: 58px; display: flex; flex-direction: row; align-items: center; justify-content: center; }
.ci-box { width: 70px; height: 54px; border: 1px solid #1B3A54; border-radius: 6px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #FFFFFF; }
.ci-k { font-size: 10px; color: #8B8F96; }
.ci-v { font-size: 13px; font-weight: 700; color: #1B3A54; }
.ci-wire { width: 22px; height: 2px; background: #1B3A54; }
.ci-lamp { width: 46px; height: 46px; border-radius: 23px; background: #F0B429; display: flex; flex-direction: row; align-items: center; justify-content: center; }
.ci-lamp text { font-size: 11px; color: #633806; }
.lv-fulcrum { position: absolute; left: 50%; top: 108px; width: 0; height: 0; margin-left: -14px; border-left: 14px solid transparent; border-right: 14px solid transparent; border-bottom: 26px solid #8B8F96; }
.lv-beam { position: absolute; left: 12%; right: 12%; top: 96px; height: 8px; background: #1B3A54; border-radius: 4px; transform-origin: 50% 50%; }
.lv-w { position: absolute; top: -28px; width: 46px; height: 26px; border-radius: 4px; background: #B86A32; display: flex; flex-direction: row; align-items: center; justify-content: center; }
.lv-w text { font-size: 10px; color: #FFFFFF; }
.lv-w1 { left: 0; }
.lv-w2 { right: 0; background: #378ADD; }
.tr-base { position: absolute; left: 60px; bottom: 46px; height: 3px; background: #1B3A54; }
.tr-base text { position: absolute; left: 0; top: 8px; font-size: 10px; color: #1B3A54; white-space: nowrap; }
.tr-side { position: absolute; left: 60px; bottom: 46px; width: 3px; background: #1B3A54; }
.tr-side text { position: absolute; left: 8px; top: 40%; font-size: 10px; color: #1B3A54; white-space: nowrap; }
.tr-hyp { position: absolute; bottom: 46px; height: 3px; background: #B86A32; transform-origin: 0% 50%; }
.tr-c { position: absolute; right: 18px; top: 24px; font-size: 13px; font-weight: 700; color: #B86A32; font-family: "SFMono-Regular", Consolas, monospace; }
.fn-axis-x { position: absolute; left: 8px; right: 8px; bottom: 26px; height: 1px; background: #E2DDD2; }
.fn-axis-y { position: absolute; left: 24px; top: 12px; bottom: 26px; width: 1px; background: #E2DDD2; }
.fn-dot { position: absolute; width: 5px; height: 5px; border-radius: 3px; background: #378ADD; opacity: 0; }
.fn-dot-on { opacity: 1; }
.br-row { position: absolute; left: 20px; right: 20px; top: 18px; height: 128px; display: flex; flex-direction: row; align-items: flex-end; justify-content: space-around; }
.br-col { width: 28%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; }
.br-bar { width: 60%; border-radius: 4px 4px 0 0; min-height: 2px; }
.br-guess { background: #B86A32; }
.br-truth { background: #1B3A54; }
.br-mc { background: #85B7EB; }
.br-l { font-size: 10px; color: #6B7178; margin-top: 5px; white-space: nowrap; }
.dg-flow { position: absolute; left: 10px; right: 10px; top: 20px; display: flex; flex-direction: row; flex-wrap: wrap; align-items: flex-start; justify-content: center; }
.dg-node { width: 30%; min-height: 58px; margin: 5px 1.5%; border: 1px solid #E2DDD2; border-radius: 8px; background: #F8F7F2; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 6px 3px; opacity: 0.32; }
.dg-on { opacity: 1; }
.dg-info.dg-on { background: #E6F1FB; border-color: #85B7EB; }
.dg-warn.dg-on { background: #FAEEDA; border-color: #B86A32; }
.dg-good.dg-on { background: #E1F5EE; border-color: #0F6E56; }
.dg-k { font-size: 10px; color: #8B8F96; text-align: center; }
.dg-v { display: block; font-size: 13px; font-weight: 700; color: #1B3A54; margin-top: 5px; font-family: "SFMono-Regular", Consolas, monospace; text-align: center; }
.sec { margin-top: 20px; }
.sec-t { display: block; font-size: 14px; font-weight: 700; color: #1B3A54; margin-bottom: 10px; }
.param { background: #FFFFFF; border: 1px solid #E8E3D8; border-radius: 8px; padding: 10px 12px; margin-bottom: 8px; }
.param-h { display: flex; flex-direction: row; justify-content: space-between; align-items: center; }
.param-k { font-size: 12px; color: #4A5058; }
.param-v { font-size: 12px; font-weight: 700; color: #B86A32; font-family: "SFMono-Regular", Consolas, monospace; }
.slider { display: block; margin: 6px 0 2px; }
.opt-row { display: flex; flex-direction: row; flex-wrap: wrap; margin-top: 8px; }
.opt { display: flex; flex-direction: row; align-items: center; justify-content: center; padding: 5px 11px; border-radius: 14px; border: 1px solid #DDD7CA; margin-right: 7px; margin-bottom: 5px; }
.opt text { font-size: 11px; color: #5F5E5A; }
.opt-on { background: #1B3A54; border-color: #1B3A54; }
.opt-on text { color: #FFFFFF; }
.q { display: block; font-size: 13px; color: #4A5058; line-height: 1.7; }
.guess-row { display: flex; flex-direction: row; align-items: center; margin-top: 10px; }
.guess-input { flex: 1; min-width: 0; height: 42px; background: #FFFFFF; border: 1px solid #DDD7CA; border-radius: 8px; padding: 0 12px; font-size: 17px; color: #1B3A54; font-family: "SFMono-Regular", Consolas, monospace; }
.guess-unit { font-size: 12px; color: #8B8F96; margin: 0 10px 0 8px; }
.btn { display: flex; flex-direction: row; align-items: center; justify-content: center; height: 42px; padding: 0 16px; background: #1B3A54; border-radius: 8px; border: 0; }
.btn text { font-size: 13px; font-weight: 700; color: #FFFFFF; }
.btn-again { margin-top: 14px; width: 100%; }
.guess-hint, .running-hint { display: block; font-size: 11px; color: #8B8F96; margin-top: 8px; }
.running-hint { color: #B86A32; }
.result { display: block; }
.res-grid { display: flex; flex-direction: row; margin-top: 12px; }
.res { width: 33.33%; background: #FFFFFF; border: 1px solid #E8E3D8; border-radius: 8px; padding: 10px 8px; margin-right: 6px; }
.res-k { display: block; font-size: 10px; color: #8B8F96; }
.res-v { display: block; font-size: 17px; font-weight: 700; color: #1B3A54; font-family: "SFMono-Regular", Consolas, monospace; margin-top: 3px; }
.res-real { color: #0F6E56; }
.res-err { color: #B86A32; }
.formula-card { display: block; background: #E6F1FB; border-radius: 8px; padding: 12px 14px; margin-top: 12px; }
.fc-k { display: block; font-size: 10px; color: #185FA5; }
.fc-f { display: block; font-size: 16px; font-weight: 700; color: #0C447C; font-family: "SFMono-Regular", Consolas, monospace; margin: 6px 0; }
.fc-c { display: block; font-size: 11px; color: #185FA5; font-family: "SFMono-Regular", Consolas, monospace; }
.insight, .boundary, .next { display: block; border-radius: 8px; padding: 11px 13px; margin-top: 8px; }
.insight { background: #E1F5EE; }
.boundary { background: #FAEEDA; }
.next { background: #FFFFFF; border: 1px dashed #B86A32; }
.ib-k { display: block; font-size: 11px; font-weight: 700; color: #1B3A54; }
.ib-b { display: block; font-size: 12px; color: #4A5058; line-height: 1.7; margin-top: 4px; }
.hist { display: block; background: #FFFFFF; border: 1px solid #E8E3D8; border-radius: 8px; padding: 12px; }
.hist-row { display: flex; flex-direction: row; align-items: center; margin-bottom: 7px; }
.hist-n { font-size: 10px; color: #8B8F96; width: 56px; }
.hist-track { flex: 1; height: 8px; background: #F1EFE8; border-radius: 4px; }
.hist-bar { height: 8px; background: #85B7EB; border-radius: 4px; }
.hist-v { font-size: 10px; color: #1B3A54; width: 36px; text-align: right; font-family: "SFMono-Regular", Consolas, monospace; }
.foot { display: flex; flex-direction: row; justify-content: center; margin-top: 26px; }
.foot text { font-size: 10px; color: #A8AAB0; }
</style>
