<template>
  <view class="page">
    <view class="hero">
      <text class="hero-k">INTUITION LAB · 直觉实验室</text>
      <text class="hero-h">先猜，再跑，最后才看公式</text>
      <text class="hero-s">把初高中物理与数学实验搬到口袋里。每个实验都先让你写下预测，再用模拟撞一次墙。</text>
      <view class="metas">
        <view class="meta"><text class="meta-v">{{ total }}</text><text class="meta-k">实验</text></view>
        <view class="meta"><text class="meta-v">{{ st.played }}</text><text class="meta-k">已玩</text></view>
        <view class="meta"><text class="meta-v">{{ st.total ? st.avgErr + '%' : '—' }}</text><text class="meta-k">平均偏差</text></view>
      </view>
    </view>

    <view class="note">
      <text class="note-h">这里不判分，也不排名</text>
      <text class="note-b">猜错才是重点。工具会记下「你的直觉 vs 真实」的偏差，攒成一条只属于你的校准曲线；每个实验还会诚实写明公式什么时候会失效。</text>
    </view>

    <view class="sec">
      <view class="sec-h"><text class="sec-n">01</text><text class="sec-t">挑一个实验</text><text class="sec-en">EXPERIMENTS</text></view>

      <view class="filters">
        <view class="chip-row">
          <view v-for="(s, i) in stages" :key="s" class="chip" :class="stageIdx === i ? 'chip-on' : ''" @click="stageIdx = i"><text>{{ s }}</text></view>
        </view>
        <view class="chip-row">
          <view v-for="(s, i) in subjects" :key="s" class="chip" :class="subjectIdx === i ? 'chip-on' : ''" @click="subjectIdx = i"><text>{{ s }}</text></view>
        </view>
      </view>

      <view class="count-line"><text>共 {{ list.length }} 个实验 · 点卡片进入</text></view>

      <view v-for="e in list" :key="e.id" :data-id="e.id" :data-topic="e.topic" class="exp-card" @click="open(e)">
        <view class="exp-top">
          <text class="tag" :class="e.subject === '物理' ? 'tag-phy' : 'tag-math'">{{ e.stage }} · {{ e.subject }}</text>
          <text class="exp-ch">{{ e.chapter }}</text>
        </view>
        <text class="exp-title">{{ e.title }}</text>
        <text class="exp-hook">{{ e.hook }}</text>
        <view class="exp-foot">
          <text class="exp-q">{{ e.question }}</text>
          <text class="exp-stat" v-if="st.byExp[e.id]">玩过 {{ st.byExp[e.id].n }} 次 · 上次偏差 {{ Math.round(st.byExp[e.id].last) }}%</text>
          <text class="exp-stat" v-else>还没玩过</text>
        </view>
      </view>
    </view>

    <view class="sec">
      <view class="sec-h"><text class="sec-n">02</text><text class="sec-t">我的直觉档案</text><text class="sec-en">CALIBRATION</text></view>
      <view class="card">
        <view v-if="!st.total" class="empty"><text>还没有记录。去做第一个实验，猜错也没关系。</text></view>
        <view v-else>
          <view class="kpis">
            <view class="kpi"><text class="kpi-v">{{ st.total }}</text><text class="kpi-k">总猜测</text></view>
            <view class="kpi"><text class="kpi-v">{{ st.avgErr }}%</text><text class="kpi-k">平均偏差</text></view>
            <view class="kpi"><text class="kpi-v">{{ st.best }}%</text><text class="kpi-k">最准一次</text></view>
          </view>
          <text class="bars-t">最近 {{ st.recent.length }} 次的偏差（越短越准）</text>
          <view class="bars">
            <view v-for="(x, i) in st.recent" :key="i" class="bar-wrap">
              <view class="bar" :style="{ height: Math.max(4, Math.min(100, x.err)) + '%' }"></view>
              <text class="bar-l">{{ Math.round(x.err) }}</text>
            </view>
          </view>
          <view class="reset-row"><text class="reset" @click="onReset">清空档案</text></view>
        </view>
      </view>
    </view>

    <view class="sec">
      <view class="sec-h"><text class="sec-n">03</text><text class="sec-t">关于模型边界</text><text class="sec-en">HONESTY</text></view>
      <view class="card">
        <text class="p">所有模拟都是「理想化模型」：忽略空气阻力、假设均匀介质、假设随机独立。这些不是 bug，而是物理学的入门方式——先看清主干，再一层层加回现实的复杂度。</text>
        <text class="p">每个实验的「模型边界」都直接写在结果页，告诉你公式在哪儿开始不准。能亲手把模型玩坏，比背下公式更接近真正的理解。</text>
      </view>
    </view>

    <view class="foot"><text>直觉实验室 · 离线可用 · 无需联网、无需账号</text></view>
  </view>
</template>

<script>
import { EXPERIMENTS, STAGES, SUBJECTS } from '../../common/experiments.js'
import { stats, resetProfile } from '../../common/profile.js'

export default {
  data() {
    return {
      stages: STAGES,
      subjects: SUBJECTS,
      stageIdx: 0,
      subjectIdx: 0,
      total: EXPERIMENTS.length,
      st: { total: 0, avgErr: 0, best: 0, played: 0, recent: [], byExp: {} },
      Math
    }
  },
  computed: {
    list() {
      const s = this.stages[this.stageIdx], sub = this.subjects[this.subjectIdx]
      return EXPERIMENTS.filter(e => (s === '全部' || e.stage === s) && (sub === '全部' || e.subject === sub))
    }
  },
  onShow() { this.st = stats() },
  methods: {
    open(e) { uni.navigateTo({ url: '/pages/lab/lab?id=' + e.id }) },
    onReset() {
      uni.showModal({
        title: '清空直觉档案', content: '所有猜测记录会被删除，不可恢复。',
        success: (r) => { if (r.confirm) { this.st = resetProfile(); uni.showToast({ title: '已清空', icon: 'none' }) } }
      })
    }
  }
}
</script>

<style>
.page { padding: 20px 16px 40px; background: #F6F4EF; }
.hero { padding: 8px 2px 18px; border-bottom: 1px solid #E2DDD2; }
.hero-k { display: block; font-size: 10px; letter-spacing: 1.5px; color: #B86A32; font-family: "SFMono-Regular", Consolas, monospace; }
.hero-h { display: block; font-size: 24px; font-weight: 700; color: #1B3A54; margin-top: 8px; line-height: 1.35; }
.hero-s { display: block; font-size: 12px; color: #6B7178; line-height: 1.7; margin-top: 8px; }
.metas { display: flex; flex-direction: row; margin-top: 16px; }
.meta { width: 33.33%; }
.meta-v { display: block; font-size: 19px; font-weight: 700; color: #1B3A54; font-family: "SFMono-Regular", Consolas, monospace; }
.meta-k { display: block; font-size: 10px; color: #8B8F96; margin-top: 2px; }
.note { display: block; margin-top: 16px; background: #FAEEDA; border-left: 3px solid #B86A32; border-radius: 6px; padding: 12px 14px; }
.note-h { display: block; font-size: 13px; font-weight: 700; color: #854F0B; }
.note-b { display: block; font-size: 11px; color: #633806; line-height: 1.7; margin-top: 4px; }
.sec { margin-top: 26px; }
.sec-h { display: flex; flex-direction: row; align-items: center; border-bottom: 1px solid #E2DDD2; padding-bottom: 8px; margin-bottom: 14px; }
.sec-n { font-size: 12px; color: #B86A32; font-family: "SFMono-Regular", Consolas, monospace; margin-right: 8px; }
.sec-t { font-size: 15px; font-weight: 700; color: #1B3A54; flex: 1; }
.sec-en { font-size: 9px; color: #8B8F96; letter-spacing: 1px; font-family: "SFMono-Regular", Consolas, monospace; }
.filters { display: block; }
.chip-row { display: flex; flex-direction: row; flex-wrap: wrap; margin-bottom: 8px; }
.chip { display: flex; flex-direction: row; align-items: center; justify-content: center; padding: 6px 14px; border-radius: 16px; border: 1px solid #DDD7CA; background: #FFFFFF; margin-right: 8px; margin-bottom: 6px; }
.chip-on { background: #1B3A54; border-color: #1B3A54; }
.chip text { font-size: 12px; color: #5F5E5A; }
.chip-on text { color: #FFFFFF; font-weight: 700; }
.count-line { display: block; margin: 6px 0 12px; }
.count-line text { font-size: 11px; color: #8B8F96; }
.exp-card { display: block; background: #FFFFFF; border: 1px solid #E8E3D8; border-radius: 10px; padding: 13px 14px; margin-bottom: 10px; }
.exp-top { display: flex; flex-direction: row; align-items: center; }
.tag { display: flex; flex-direction: row; align-items: center; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 4px; margin-right: 8px; }
.tag-phy { background: #E6F1FB; color: #185FA5; }
.tag-math { background: #E1F5EE; color: #0F6E56; }
.exp-ch { font-size: 10px; color: #8B8F96; }
.exp-title { display: block; font-size: 15px; font-weight: 700; color: #1B3A54; margin-top: 8px; }
.exp-hook { display: block; font-size: 12px; color: #6B7178; margin-top: 4px; line-height: 1.6; }
.exp-foot { display: flex; flex-direction: row; justify-content: space-between; align-items: center; border-top: 1px dashed #ECE7DC; margin-top: 10px; padding-top: 8px; }
.exp-q { font-size: 10px; color: #B86A32; flex: 1; }
.exp-stat { font-size: 10px; color: #8B8F96; margin-left: 8px; white-space: nowrap; }
.card { display: block; background: #FFFFFF; border: 1px solid #E8E3D8; border-radius: 10px; padding: 14px; }
.empty { display: block; padding: 12px 0; }
.empty text { font-size: 12px; color: #8B8F96; }
.kpis { display: flex; flex-direction: row; }
.kpi { width: 33.33%; }
.kpi-v { display: block; font-size: 20px; font-weight: 700; color: #1B3A54; font-family: "SFMono-Regular", Consolas, monospace; }
.kpi-k { display: block; font-size: 10px; color: #8B8F96; }
.bars-t { display: block; font-size: 11px; color: #6B7178; margin-top: 16px; }
.bars { display: flex; flex-direction: row; align-items: flex-end; height: 76px; margin-top: 8px; }
.bar-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; }
.bar { width: 60%; background: #85B7EB; border-radius: 3px 3px 0 0; min-height: 2px; }
.bar-l { font-size: 9px; color: #8B8F96; margin-top: 3px; }
.reset-row { display: flex; flex-direction: row; justify-content: flex-end; margin-top: 12px; }
.reset { font-size: 11px; color: #B86A32; text-decoration: underline; }
.p { display: block; font-size: 12px; color: #4A5058; line-height: 1.8; margin-bottom: 8px; }
.foot { display: flex; flex-direction: row; justify-content: center; margin-top: 30px; }
.foot text { font-size: 10px; color: #A8AAB0; }
</style>
