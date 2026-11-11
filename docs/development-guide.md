# 英语课本点读网站：开发交接总指南

> 本文是当前实现的权威说明。任何新 AI 接手、增加一个单元、一个学期或一个新年级前，都应先阅读本文和 `docs/README.md`。

## 1. 项目目标与当前交付状态

这是一个纯静态、面向家庭使用的英语课本点读 PWA。孩子可在教材图上直接点英文，播放对应的预生成女声/英语音频；还可进入单词学习、词义选择与听写练习。网站部署到 GitHub Pages，不需要后端、数据库或运行时 API。

当前已交付课程是：`shenzhen-hj-2025 / grade-2 / semester-1`（深圳沪教版二年级上册）。其中 Unit 1–6 和“其他”均可点读；PDF 第 49 页及之后归入“其他”。“其他”中的 Word list 支持单词学习和练习。

## 2. 运行与发布

```bash
cd /Users/xiaoqiang.zhangxq/Documents/Codex/english
zsh start.sh
```

打开 `http://127.0.0.1:4173/` 进行本地验证。所有路径必须保持相对路径，便于 GitHub Pages 部署和直接打开 `index.html`。

提交后将 `main` 推送到 `origin`；仓库的 Pages 地址是 `https://xiukeung.github.io/english/`。若 `git push` 报无用户名/设备未配置，先由用户在本机完成 GitHub 登录或配置 token，不能绕过认证。

## 3. 目录与职责

```text
index.html                         静态入口；显式加载课程 JS、音频清单和主程序
main.js                            播放、点读、练习、状态恢复、离线下载、所有课程注册
style.css                          页面视觉、热区、移动端布局
sw.js                              Service Worker：应用壳与离线缓存策略
content/curricula/<版本>/grade-<N>/semester-<N>/
  manifest.json                    课程元数据、PDF 页到单元的映射
  units/unit-1.js … unit-6.js      浏览器可直接加载的单元对象
  units/other.js                   PDF 第 49 页以后的“其他”对象
  practice/vocabulary/*.md|*.js    单词学习/听写的人工源表与浏览器数据
resources/curricula/<课程ID>/source/textbook.pdf         原始教材 PDF（保留并提交）
resources/curricula/<课程ID>/pages/*.png              原始页图：OCR、热区校正、重新压缩的来源（保留并提交）
resources/curricula/<课程ID>/pages/*.webp             发布页图；网页实际请求的图片
resources/curricula/<课程ID>/audio/<单元>/normal|slow/*.m4a
                                    点读、单词学习、听力复用的音频
resources/curricula/<课程ID>/audio/manifest.js 自动生成的“内容 ID → 有效音频”索引
resources/curricula/<课程ID>/offline-assets.js        自动生成的离线资源、总字节数与版本号
resources/brand/listen-speak-read-512.png             全站“听、说、读”主题图（Banner）
resources/brand/listen-speak-read-180|192|512.png     浏览器 Tab、iOS 及 Android PWA 主屏幕图标
tools/                             资源渲染、OCR、音频、WebP 构建脚本
docs/                              本指南及专题规范
```

### 品牌图标约定

- 所有全站视觉标识只放在 `resources/brand/`，目前唯一主题是 `listen-speak-read`：小朋友戴耳机读英语书，表达“听、说、读”。
- `-512.png` 用于 Banner，`-192.png` 用于浏览器 Tab 与 Android PWA，`-180.png` 用于 iOS 添加到主屏幕；三者必须来自同一张主题图。
- 不要重新创建或引用 `resources/icons/`：该旧目录已退役，避免出现两套不一致的应用图标。

### 文档如何使用

- `docs/point-reading-standard.md`：改热区、生成点读音频、调整页签时必读。
- `docs/asset-and-offline-workflow.md`：新增/替换页图、音频或离线内容时必读。
- `docs/architecture.md`：需要扩展录音、发音识别、数据模型时参考。
- `docs/archive/NEXT_AI_CMD.md`：历史快照，内容停留在早期 Unit 1 阶段，不能据此改当前项目。
- `content/.../practice/README.md`：新增词表、听写或拼写素材时参考。

## 4. 关键实现规则（不可破坏）

1. **课程数据必须作为经典脚本预加载。** `index.html` 通过 `<script defer>` 依次加载各 `unit-N.js`、`other.js`、词表 JS、音频 `manifest.js`，再加载 `main.js`。不要将首屏必需数据改成 `fetch()`，否则直接以 `file://` 打开时会失败。
2. **源数据路径仍写 PNG，渲染时统一转 WebP。** `main.js` 的 `optimizedPageImage()` 负责转换。这样热区数据与 OCR 源图同名，网页却不下载大 PNG。
3. **每一个可播放英语片段有稳定唯一 ID。** 例如 `u03-p17-03`。热点、音频、词汇练习和听力队列只通过 ID 关联，不能靠显示文本或文件名猜测。
4. **热区存原始紧贴文字的 OCR 百分比框。** 留白只由 `expandedHotspot()` 统一处理：左右各扩原框宽度 10%，上下各扩高度 5%，并裁在页面内。热区按钮保持空白，以 `aria-label` 提供文本。
5. **正常路径必须播放预生成 `.m4a`。** 只有音频清单不存在或实际音频失败时，才使用浏览器语音作为兜底；不要主动改回 TTS。
6. **词汇模块复用课本音频。** 通过 `ENGLISH_AUDIO_ITEMS` 按英文文本及所属单元匹配，不为同一单词生成第二份音频。
7. **不要首屏预下载整册。** 当前页优先，前后页空闲时预热；完整课程由家长主动点击“离线下载”。
8. **记住学习位置。** 单元、课本页、点读/单词视图和练习类型均使用 `localStorage` 恢复；改动渲染逻辑时不得清除这些键。

## 5. 新增一个完整年级/学期的交付流程

以下以 `<课程 ID>` 表示如 `shenzhen-hj-2026-grade-3-semester-1` 的新课程；不要把新课程资源混进现有二年级目录。

### A. 建课程骨架和源资料

1. 建立 `resources/curricula/<课程ID>/source/`，将原始 PDF 命名为 `textbook.pdf` 后放入并提交。
2. 新建 `content/curricula/<地区-版本-年份>/grade-<年级>/semester-<学期>/`；复制并改写 `manifest.json`，记录出版信息、页数、每个单元对应的 **PDF 页码**。
3. 从 PDF 导出每一页为命名稳定的 PNG，放入 `resources/curricula/<课程ID>/pages/`。建议格式为 `<课程短名>-page-<教材页>.png`，避免与其他年级同名冲突。保留 PNG；不要手工裁掉页底，因为这会改变热区坐标。
4. 使用 `tools/render-pdf-pages.swift`（或同等无损导出）生成页图，并用 `file`/图片预览确认页图方向与 PDF 一致。例如：

   ```bash
   swift tools/render-pdf-pages.swift resources/curricula/<课程ID>/source/textbook.pdf 1 60 resources/curricula/<课程ID>/pages
   ```

### B. 建单元点读数据

1. 对每张 PNG 运行本地 Apple Vision OCR：

   ```bash
   swift tools/extract-text-boxes.swift resources/curricula/<课程ID>/pages/<页图>.png | sort
   ```

2. 建 `units/unit-N.js`（或 `other.js`）。对象至少包括：

   ```js
   window.ENGLISH_UNIT_N = {
     id: "unit-N", title: "中文单元标题", englishTitle: "English title",
     sourcePages: [/* PDF 页码 */],
     words: [{ id: "uNN-word-01", text: "...", meaning: "..." }],
     sentences: [{ id: "uNN-p12-01", text: "...", meaning: "" }],
     pages: [{ label: "第 12 页", image: "./resources/curricula/<课程ID>/pages/<页图>.png", hotspots: [["uNN-p12-01", left, top, width, height]] }]
   };
   ```

3. 热区坐标采用百分比；Vision 坐标的原点在左下，换算为网页坐标：

   ```text
   left = x * 100
   top = (1 - y - height) * 100
   width = width * 100
   height = height * 100
   ```

4. 仅录入有意义的英文：单词、句子、对话、指令、标题、自然拼读内容等。剔除中文、二维码/扫描杂讯和明显 OCR 乱码；OCR 漏词（特别是 Word list）用教材人工补齐并手工校准框。
5. 在桌面和窄屏手机检查全部紫圈，尤其是首/尾字母、页边、相邻行与 Word list。详细标准见 `point-reading-standard.md`。

### C. 建词汇练习资料

1. 在新课程的 `practice/vocabulary/` 中建立 `word-list-N.md`：保留教材英文、中文、所属单元和教材页码，供人工核对、听写与拼写使用。
2. 建同名浏览器数据 JS（当前模式参见 `word-list-1.js`），每条保留稳定 `id`、`text`、`meaning`、`unit`、`sourcePage`。
3. 仅从教材已有单词抽取练习条目；这样单词学习可复用点读音频。

### D. 生成并核对音频

1. 先确保所有 `unit-N.js` 都能被加载、每条英文文本无乱码。
2. 生成正常和慢速音频并刷新音频清单：

   ```bash
   node tools/generate-course-audio.mjs --all --course <课程ID> --units-root content/curricula/<地区-版本-年份>/grade-<年级>/semester-<学期>/units --normal-rate 150 --slow-rate 108 --prune
   ```

   该脚本使用 macOS `say` 的 `Eddy (英语（美国）)` 音色和 `ffmpeg` 编码 AAC/m4a。正常速度是 150，慢速是 108；不要重新采用旧的 175。
3. 只修一条时使用：

   ```bash
   node tools/generate-course-audio.mjs --unit unit-3 --course <课程ID> --units-root content/curricula/<地区-版本-年份>/grade-<年级>/semester-<学期>/units --id u03-p17-03 --force
   ```

4. 检查 `resources/curricula/<课程ID>/audio/manifest.js` 中存在该 ID，且网页 Network 面板不会出现 `.m4a` 404。听力顺序读取 `ENGLISH_LISTENING_TRACKS`，不可自行按文件名排序。

> `generate-course-audio.mjs` 已支持 `--course` 和 `--units-root`，新增课程必须传入这两个参数，避免写入错误课程目录。当前 `main.js` 的课程加载清单仍以二年级上册为主；新增课程时需把它改为由课程选择器驱动。

### E. 生成发布图和离线资源

在所有页图、课程 JS 与音频最终确定后执行：

```bash
node tools/build-web-assets.mjs --quality 78
```

它会递归扫描每个 `resources/curricula/<课程ID>/pages/` 的 PNG，创建同名 WebP，并生成各课程自己的 `resources/curricula/<课程ID>/offline-assets.js`。该清单仅包含对应课程 JS、WebP、m4a、全站品牌图标与应用壳；“离线下载”按钮用它计算进度和版本。不能手改此文件。仅重建一套课程时可附加 `--course <课程ID>`。

如文字质量不足可用：

```bash
node tools/build-web-assets.mjs --quality 82 --force
```

每次新增或删除某课程的 `.js`、`.webp`、`.m4a`，或替换 `resources/brand/` 内的品牌图标后，都必须重新执行该命令并提交各课程新的 `offline-assets.js`，否则在线可用的内容不会完整离线化。

版本号基于每个发布文件的内容哈希，而不是文件名或大小：同尺寸替换图片/音频也会提示更新。替换原始 PNG 后，构建工具会自动重建比 PNG 更旧的同名 WebP；只改 PNG/PDF 本身不会进入离线包，必须运行构建命令。

### F. 接入前端并发布

1. 在 `index.html` 中按依赖顺序加入新课程的单元 JS、词表 JS；必须在 `main.js` 之前。
2. 将课程加入顶部年级/学期选择器，并使 `main.js` 按选择课程初始化：课程对象、`audioRoot`、词表、单元标签均不可继续硬编码为二年级上册。
3. 确保底部显示 Unit 1–6 与“其他”；“其他”总在 Unit 6 右侧。选中单元或页签时，当前项及相邻项应完整滚入横向可视区。
4. 更新 Service Worker 缓存版本（当应用壳策略变化时）并验证安装后刷新能获得新版本。
5. 提交 PNG、WebP、PDF、数据 JS、m4a、manifest 与离线清单，一并推送。

## 6. 离线下载如何工作

1. 当前选择课程的 `resources/curricula/<课程ID>/offline-assets.js` 由构建脚本写入文件列表、总字节和版本 hash。
2. 页面加载后，`setupOfflineDownload()` 显示“离线下载 <大小>”。用户点击后以四个并发请求下载并写入 Cache Storage 的 `little-ear-offline`。下载开始即记录该资源版本；若中途刷新或关闭页面，下次打开会显示“继续离线下载”，扫描该缓存并只补下载缺失文件。
3. `sw.js` 保留该离线缓存，并在离线时从缓存响应；应用 HTML/CSS/JS 则优先联网获取，以便修复能及时到达。
4. 每次正常联网打开时，课程数据和离线清单网络优先；资源大小或清单变化会改变版本 hash，因此按钮重新出现，用户可下载新版本覆盖缓存。图片和音频在此之前继续使用已有缓存，避免静默整册重下。

离线功能依赖 Service Worker/Cache Storage，必须用 `https://` 的 GitHub Pages 或 localhost 验证；`file://` 仅用于检查页面基本渲染，不能作为离线 PWA 验收环境。

## 7. 最低验收清单

```bash
node --check main.js
node --check tools/build-web-assets.mjs
node --check content/curricula/<...>/units/unit-N.js
git diff --check
```

另外必须人工验证：

- 每页 WebP 存在，且每个课程数据所引用的 PNG 都有同名 WebP。
- 每个热点 ID 都能在 `words` 或 `sentences` 中找到，点击后优先播放正确 m4a；不存在 404。
- 正常/慢速切换都有效；单词学习复用课本音频。
- 中英互认、听音选义、听写均为一轮有限题目；错题只额外出现一次，完成后可手动“再练一轮”。
- 刷新后恢复上次单元、页签和点读/单词视图。
- 首次打开先显示教材加载骨架，不会整册下载；窄屏顶部、学习按钮、紫色提示都不换行溢出。
- 在线点击“离线下载”完成后断网刷新，随机打开不同单元页和播放音频仍可用。

## 8. 当前限制与下一位开发者的注意点

- 当前 UI 的年级下拉框只有“二年级 · 上册”一个选项；课程数据、音频根目录和脚本加载也以该课程为主。新增年级不是只复制资源，必须完成第 5F 节的多课程接入。
- `tools/generate-course-audio.mjs` 生成新课程时必须传 `--course`、`--units-root`；`tools/build-web-assets.mjs` 已经是跨课程、跨目录通用的。
- 旧的 `tools/generate-unit-1-audio.sh` 是历史脚本，速度为旧值且目录结构已过时；不要用于新内容。
- `resources/curricula/<课程ID>/source` 与 `resources/curricula/<课程ID>/pages/*.png` 现在按用户要求提交到 Git。它们不是网页运行时资源，网页只请求 WebP。
