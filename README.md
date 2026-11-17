# 直觉实验室

初高中物理与数学的互动实验集合。核心不是“讲公式”，而是让用户先给出一个数字，再看模拟结果、观察偏差，最后才看到公式和边界。

目前共有 **176 个实验**：

| 学段 · 学科 | 数量 |
|---|---:|
| 初中 · 物理 | 78 |
| 高中 · 物理 | 62 |
| 初中 · 数学 | 3 |
| 高中 · 数学 | 33 |

项目基于 uni-app + Vue 3 + Vite，同一份源码可构建 H5、微信小程序和 App。

## 功能

- 四步学习闭环：猜一个数 → 运行模拟 → 看真实值与偏差 → 公式、洞察、边界、下一问。
- 13 种渲染器：自由落体、单摆、弹簧、抛体、波、多普勒、光路、电路、杠杆、几何、函数曲线、蒙特卡洛、定性装置图。
- 直觉档案：记录每次猜测与偏差，统计玩过的实验、平均偏差和最近记录，数据存在本地。
- 首页按主题分组：力学、热学、电磁学、光学、声与波动、近代物理与能源，以及数学四个主题；同主题内按学段和教材章节排。
- 支持教材索引同步：可扫描 `D:/textbook` 下的人教版教材，统计已落地的教材实验。

## 快速开始

```bash
npm install
```

### 开发

```bash
npm run dev:h5           # H5 本地开发
npm run dev:mp-weixin    # 微信小程序开发
npm run dev:app          # App 开发
```

### 构建

```bash
npm run build:h5
npm run build:mp-weixin
npm run build:app
```

产物分别位于：

- `dist/build/h5`
- `dist/build/mp-weixin`
- `dist/build/app`

App 产物还需要用 HBuilderX 云打包成 APK；微信小程序产物需要用微信开发者工具导入。

## 本地预览与验收

```bash
npm run build:h5
npm run preview:h5
```

预览地址：<http://127.0.0.1:8767/>

完整验收流程：

```bash
npm run check            # 实验清单全量自检
npm run build:h5         # 构建 H5
npm run preview:h5       # 启动预览服务
npm run verify:h5        # 浏览器端到端验收
```

`verify:h5` 会启动本机 Chrome / Edge，通过 DevTools 协议检查首页卡片、筛选、顺序分组、几个代表性实验的四步流程，以及是否有横向溢出。

## 常用脚本

| 命令 | 作用 |
|---|---|
| `npm run check` | 校验所有实验的字段、id、真值、参数边界、曲线和渲染器契约 |
| `npm run new:exp` | 生成一条实验骨架，查看支持的渲染器 |
| `npm run textbook:scan` | 扫描教材并更新 `scripts/textbook-outline.json` |
| `npm run textbook:ocr` | 对扫描版教材做 OCR 并更新索引 |
| `npm run verify:h5` | 对 H5 构建产物做浏览器端验收 |

## 目录结构

```text
.
├── index.html                  # H5 入口
├── vite.config.js              # Vite / uni-app 配置
├── serve-h5.mjs                # 本地静态预览服务
├── src/
│   ├── App.vue
│   ├── main.js
│   ├── manifest.json
│   ├── pages.json
│   ├── uni.scss
│   ├── common/
│   │   ├── experiments.js      # 实验数据唯一扩展点
│   │   ├── engine.js           # 真值、逐帧状态、偏差计算
│   │   └── profile.js          # 本地直觉档案
│   └── pages/
│       ├── index/index.vue     # 首页、筛选、主题顺序
│       └── lab/lab.vue         # 实验四步流程与舞台
└── scripts/
    ├── check-experiments.mjs   # 数据自检
    ├── new-experiment.mjs      # 新实验脚手架
    ├── verify-h5.mjs           # 浏览器端到端验收
    ├── extract-textbook.py     # 教材扫描
    ├── ocr-textbook.py         # 教材 OCR
    ├── textbook-outline.json   # 教材与实验索引
    ├── textbook-ocr.json       # OCR 文本索引
    └── vendor/                 # 本地 Python 依赖
```

## 新增实验

绝大多数情况下只需要改 `src/common/experiments.js`。推荐流程：

```bash
npm run new:exp -- --id=my_lab --title="我的实验" --renderer=function
npm run check
```

把生成的骨架粘到文件里的 `RAW_EXPERIMENTS` 数组中，改好文案、参数、真值和公式。导出层会自动打上 `topic` 并按主题归位，不需要手动调整顺序。

一条实验至少要有：

- `id` / `stage` / `subject` / `chapter` / `title`
- `hook` / `question`
- `predictLabel` / `predictUnit` / `predictDefault` / `predictMin` / `predictMax`
- `params` / `renderer` / `duration`
- `truth(p)` / `formula` / `calc(p)`
- `insight` / `boundary` / `next`

注意：

- 老实验的 `id` 不要改，直觉档案是按 id 存储的。
- `predictDefault` 必须严格满足 `predictMin < predictDefault < predictMax`，百分比题不要让默认值贴着 100。
- `function` 渲染器的 `curve` 必须写成 `curve(p) => x => y`。
- `bars` 渲染器的 `mcTarget` 只能是数字；真值随参数变化时不要写它，引擎会自动使用 `truth(p)`。
- `diagram` 渲染器适合定性实验，节点会按模拟进度依次点亮。

只有现有 13 种画面都不够用时，才需要同时改：

- `src/common/engine.js`：增加渲染器的逐帧状态
- `src/pages/lab/lab.vue`：增加舞台分支与样式
- `scripts/check-experiments.mjs`：增加字段和状态校验
- `scripts/new-experiment.mjs`：增加脚手架模板

## 教材索引

教材 PDF 放在 `D:/textbook`。当前索引包含 12 本书、2051 页，其中物理 6 本、数学 6 本；教材落地统计为物理 108 条、数学 20 条。

`gk_`（高考专题）、`mgk_`（高考数学专题）和“教材实验 ·”前缀的实验按设计不计入教材落地数。

## 已知事项

- `npm run build:h5` 有时会在清理旧 `dist/build/h5` 时遇到安全删除守卫超时；遇到时先把旧目录挪到 `dist/build/h5_bak_*` 再构建。
- 如果本地预览服务正在运行，它会占用 `dist/build/h5`；重建前需要先停掉预览进程。
- `.gitignore` 已排除 `node_modules/`、`dist/`、`unpackage/`、Python 缓存和本地环境文件。
