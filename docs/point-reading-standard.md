# 课本点读实现规范

本规范适用于深圳沪教版二年级英语项目的所有单元与“其他”内容。新增单元必须遵循它，以保持点读圈选、翻页和朗读体验一致。

## 页面与内容

- 课本页面使用 `resources/pages/` 的发布版 PNG；原始 PDF 只用于本地校对，不能提交。
- 每个单元提供一个浏览器安全的 `units/unit-N.js`，以经典 `<script>` 加载，保证用户直接以 `file://` 打开页面也可用。
- 单元对象包含 `words`、`sentences` 和 `pages`。每个可点读文本必须拥有稳定的唯一 ID，例如 `u03-line-01`。
- 页面条目使用 `{ label, image, hotspots }`；`hotspots` 项的格式为 `[id, left, top, width, height]`，所有数值均为页面百分比，且坐标是 **OCR 原始紧贴文本框**。

## 紫色热区

1. 先对导出的页面运行本地 Apple Vision OCR：

   ```bash
   swift tools/extract-text-boxes.swift resources/pages/unit-3-page-18.png | sort
   ```

2. Vision 结果的坐标原点在左下角，转换为网页坐标时：

   ```text
   left = x * 100
   top = (1 - y - height) * 100
   width = width * 100
   height = height * 100
   ```

3. 不要在单元数据中手动加点击留白。`main.js` 的 `expandedHotspot()` 是唯一的通用留白入口，自动将原始框扩展为：

   - 左右：各为原框宽度的 10%
   - 上下：各为原框高度的 5%
   - 页面边界：自动截断，绝不越出页面

4. 热区按钮必须保持空白，不得重复展示英文文本；使用 `aria-label` 提供无障碍朗读说明。
5. 新增或校准坐标后，须在桌面与手机宽度检查紫圈是否覆盖完整英文且不误碰邻近文本。

## 发音

- 每次点击文本均通过统一 `play()` 函数播放；不得在单元代码中自行创建音频播放器。
- 优先播放清单中存在的预生成音频；缺少音频时才直接使用设备的浏览器英文朗读。这样既保持固定音色，也避免手机或 PWA 为不存在的音频触发 404。
- 若为新单元生成质量可靠、已确认可发布的音频，命名必须为：

  ```text
  resources/audio/shenzhen-hj-2025-grade-2-semester-1/
    manifest.js
    unit-1/normal/<content-id>.m4a
    unit-1/slow/<content-id>.m4a
    unit-2/normal/<content-id>.m4a
    unit-2/slow/<content-id>.m4a
  ```

- 使用 `node tools/generate-course-audio.mjs --all --normal-rate 150 --slow-rate 108 --prune` 生成所有单元。该工具从单元数据读取 ID 与英文文本、跳过明显 OCR 杂讯、清理不再对应任何有效内容的旧音频，并自动刷新 `manifest.js`；新增单元后不需要维护手写音频列表。
- `manifest.js` 同时保存 `内容 ID → 英文文本 / 单元` 与按教材页排序的 `ENGLISH_LISTENING_TRACKS`。听力播放应读取这份清单，不能凭文件名或页面文字推测顺序；同一段音频可同时被点读与听力队列复用。

## 页签与单元切换

- 页签选中后必须调用 `scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" })`，使完整页签进入横向可视区。
- 底部单元选择由课程目录的可用对象自动生成；新增单元须在 `index.html` 中先加载其静态 JS，再加入 `units`。
- PDF 第 49 页及之后统一归入 `other`，并以“其他”显示在 Unit 6 的右侧。

## 验证

每次提交前运行：

```bash
node --check main.js
node --check content/curricula/shenzhen-hj-2025/grade-2/semester-1/units/unit-N.js
git diff --check
```
