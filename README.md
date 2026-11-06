# English learning app

一个面向家庭使用的静态英语学习网页。应用读取教材内容包，将单词、句子和对话渲染为可点击、可播放的学习卡；教材扫描件只作为内部校对来源，不作为默认界面。

## 内容包

每套教材有自己的稳定 ID：

`content/curricula/<地区-版本-年份>/grade-<年级>/semester-<学期>/`

当前内容包：`shenzhen-hj-2025 / grade-2 / semester-1`。

每套教材独立维护：

- `manifest.json`：版本、来源、页码和导入状态。
- `units/*.json`：课程正文，按可播放片段组织。
- `resources/pages/`：由 PDF 导出的内部核对页图。
- `resources/audio/<curriculum-id>/`：按片段 ID 保存的音频。

这样增加二年级下册或其他版本时，只需新增内容包和音频目录；前端不需要复制一份。

## 音频与录音

标准朗读音频应预生成并作为静态文件随站点发布。录音使用浏览器 `MediaRecorder`，录音只留在本机；发音识别则采用可选模式：联网时把录音发给识别服务评分，离线时只提供录音回放和波形，不伪造“发音分数”。详见 `docs/architecture.md`。

## 当前阶段

已保存二年级上册原始 PDF；下一步是将每页内容提取、校对并建立 Unit 数据包，然后生成/绑定朗读音频。

## 本地运行

在仓库根目录运行：

```bash
zsh english/start.sh
```

然后打开 `http://127.0.0.1:4173/`。第一版已完成 Unit 1：10 个单词、15 个句子、正常/慢速本地音频、顺序连播，以及浏览器本地录音回放。录音权限只在用户按“开始录音”后请求。

## GitHub Pages

这是一个完全静态的项目。提交 `english/` 目录即可（`resources/source/*.pdf` 有意忽略，不会发布），并把仓库根目录设置为 GitHub Pages 的发布来源。发布地址将是：

`https://xiuKeung.github.io/minigame/english/`

课程 JSON、课本核对图和音频均以相对路径引用，因此发布后不需要本地服务、API、数据库或常驻进程。`start.sh` 只为本机预览服务；浏览器直接以 `file://` 打开模块化网页时会拦截数据加载，所以本地才需要它。
