# 教材资源与离线下载流程

## 目标

首屏只加载当前教材页的优化 WebP；整册图片和音频只有家长主动点击“离线下载”时才缓存。新年级、新学期沿用同一流程。

## 目录约定

- `resources/curricula/<课程ID>/source/textbook.pdf`：原始教材 PDF，随课程源资料保存在 Git。
- `resources/curricula/<课程ID>/pages/*.png`：原始页图，用于 OCR、热区校正和再次压缩；网页不直接引用。
- `resources/curricula/<课程ID>/pages/*.webp`：网页实际显示的教材页图。
- `resources/curricula/<课程ID>/audio/<单元>/normal|slow/*.m4a`：课本点读与单词学习复用的音频。
- `resources/curricula/<课程ID>/offline-assets.js`：该课程自动生成的离线资源清单、字节数和版本号，不手改。

## 新增或更新教材的构建顺序

1. 放入/更新 PNG 页图、单元数据与热点。
2. 生成或修正音频：

   ```bash
   node tools/generate-course-audio.mjs --all --normal-rate 150 --slow-rate 108 --prune
   ```

3. 生成网页用 WebP 与离线清单：

   ```bash
   node tools/build-web-assets.mjs --quality 78
   ```

4. 校验页面是否引用 WebP、音频清单是否存在，并提交生成结果。需要只更新一套课程时，使用 `--course <课程ID>`。

`build-web-assets.mjs` 会比较 PNG 与同名 WebP 的修改时间；替换 PNG 后直接运行即可重建对应 WebP。若只改变压缩质量或需要强制全量重建，使用 `--force`。

## 性能规则

- 不要在初次打开时预下载整册。
- 当前页优先显示加载骨架；相邻页仅在浏览器空闲时预加载。
- “离线下载”只缓存当前选择课程的课程脚本、WebP、音频与图标，显示进度；资源更新后因版本变化可重新下载覆盖。下载未完成时刷新页面不会清掉已完成文件；同一版本再次点击会扫描专用离线缓存，并从缺失文件继续。
- 每次正常联网打开时，课程数据和离线清单会优先检查网络。若清单版本变了，按钮从“已离线”恢复为“离线下载”，由家长确认后再刷新图片和音频；离线时则继续读取已有缓存。
- 离线清单的版本由每个实际发布文件的内容哈希计算。即使替换后的 WebP 或 m4a 与旧文件大小相同，也会被识别为新版本；仅改 PNG/PDF 原件不会触发更新，必须先重新生成 WebP。
- 若图片质量不足，可使用 `--quality 82 --force` 重新生成 WebP；不要让网页回退引用 PNG。
