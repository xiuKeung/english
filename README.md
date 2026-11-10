# English learning app

一个面向家庭使用的静态英语课本点读网页。教材页上的英文可直接点读，并提供单词学习、词义选择和听写练习。

完整的交接与新年级教材开发流程见 [docs/development-guide.md](docs/development-guide.md)。

## 内容包

每套教材有自己的稳定 ID：

`content/curricula/<地区-版本-年份>/grade-<年级>/semester-<学期>/`

当前内容包：`shenzhen-hj-2025 / grade-2 / semester-1`。

每套教材独立维护：

- `manifest.json`：版本、来源、页码和导入状态。
- `units/*.json`：课程正文，按可播放片段组织。
- `resources/curricula/<curriculum-id>/`：每套教材独立的 PDF、原始/发布页图、音频和离线清单。

这样增加二年级下册或其他版本时，只需新增内容包和音频目录；前端不需要复制一份。

## 音频与录音

标准朗读音频应预生成并作为静态文件随站点发布。录音使用浏览器 `MediaRecorder`，录音只留在本机；发音识别则采用可选模式：联网时把录音发给识别服务评分，离线时只提供录音回放和波形，不伪造“发音分数”。详见 `docs/architecture.md`。

## 当前阶段

已完成二年级上册 Unit 1–6 与“其他”的点读、课本音频、单词练习、PWA 安装和按需离线下载。

## 本地运行

在仓库根目录运行：

```bash
zsh english/start.sh
```

然后打开 `http://127.0.0.1:4173/`。第一版已完成 Unit 1：10 个单词、15 个句子、正常/慢速本地音频、顺序连播，以及浏览器本地录音回放。录音权限只在用户按“开始录音”后请求。

## GitHub Pages

这是一个完全静态的项目。提交仓库根目录并把它设置为 GitHub Pages 的发布来源。原始 PDF/PNG 按用户要求保留在 Git；网页运行时只使用优化后的 WebP。发布地址为：

`https://xiukeung.github.io/english/`

课程 JSON、课本核对图和音频均以相对路径引用，因此发布后不需要本地服务、API、数据库或常驻进程。`start.sh` 只为本机预览服务；浏览器直接以 `file://` 打开模块化网页时会拦截数据加载，所以本地才需要它。
