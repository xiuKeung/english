# English point-reading app: handoff for the next AI

## Mission

Continue building a **family-use, fully static English textbook point-reading site** for Shenzhen primary-school Grade 2, first semester. The user wants the textbook page itself to be the main learning surface: every meaningful English word, sentence, classroom instruction, question, and section title should have a thin purple clickable outline; clicking it plays audio. Do not show duplicate English text inside the outline.

The project is intentionally static: no backend, database, or runtime API is needed. It must work from GitHub Pages and also when the user directly opens `index.html` with `file://`.

## Project root

`/Users/xiaoqiang.zhangxq/Documents/Codex/english`

Important files:

```text
index.html                         # static page entrypoint
style.css                          # visual treatment, sticky reader controls, crop mask
main.js                            # app behavior, page data/hotspots, audio playback
content/curricula/shenzhen-hj-2025/grade-2/semester-1/
  manifest.json                    # curriculum metadata
  units/unit-1.json                # canonical structured content
  units/unit-1.js                  # browser-safe static mirror; assigns window.ENGLISH_UNIT_1
resources/source/shenzhen-hj-2025-grade-2-semester-1.pdf
resources/pages/unit-1-page-3.png ... unit-1-page-9.png
resources/audio/shenzhen-hj-2025-grade-2-semester-1/
tools/extract-text-boxes.swift     # local Apple Vision OCR, including normalized boxes
tools/generate-unit-1-audio.sh     # local system-TTS audio generator
```

## Current product state

- Unit 1 is the only available unit; textbook pages 3–9 are shown as image pages with clickable purple outlines.
- Main content cards (word cards, sentence cards, recording/follow-along) are intentionally hidden. Do not re-enable them unless the user asks.
- The page selector for textbook pages is sticky while scrolling through the reader.
- The bottom horizontal unit selector shows Unit 1 plus disabled future units. `localStorage` key `little-ear:last-unit` stores the last available selection.
- The reader has a normal/slow control. Each playable item expects:
  `resources/audio/shenzhen-hj-2025-grade-2-semester-1/<content-id>.normal.m4a`
  `resources/audio/shenzhen-hj-2025-grade-2-semester-1/<content-id>.slow.m4a`
- The bottom of every scanned page is hidden with a CSS crop in `style.css`, currently `aspect-ratio: 992 / 1332`. This hides scanner/QR residue without changing hotspot coordinates. Prefer changing this display crop over physically cropping source images.
- Unit 1 has 61 point-reading entries and 122 audio files (normal + slow).

## Critical design decisions

1. **Do not use `fetch()` for essential initial course data.** Browser restrictions blocked it when the user opened `file://.../index.html`. `index.html` therefore loads `units/unit-1.js` as a classic script before `main.js`. If a new unit is added, create an equivalent browser-safe static JS companion and load it explicitly or build a static bundle.
2. **Keep the purple outlines aligned to original printed text.** The original implementation guessed percentage coordinates and was visibly wrong. The current positions were calibrated from OCR boxes.
3. **No duplicate text in hotspots.** Hotspot buttons must be empty; their `aria-label` contains the spoken text for accessibility.
4. **Static GitHub Pages compatibility.** Use relative URLs only. `.gitignore` excludes only the copyrighted source PDF and local recordings; page PNGs and audio must be committed/published.

## OCR workflow for new pages

The OCR is local macOS Apple Vision, not an LLM and not a cloud request.

```bash
cd /Users/xiaoqiang.zhangxq/Documents/Codex/english
swift tools/extract-text-boxes.swift resources/pages/unit-1-page-3.png | sort
```

Output form:

```text
recognized text<TAB>x,y,width,height
```

Vision coordinates are normalized and have the origin at the **bottom-left**. Convert to CSS percentage values:

```text
left = x * 100
top = (1 - y - height) * 100
width = width * 100
height = height * 100
```

Add only a small click tolerance (about 1–2 percentage points) around the recognized bounds; do not revert to rough visual guesses. After changes, inspect the page in a browser at desktop and phone widths.

If the Swift command first fails due to the macOS compiler cache sandbox, run it with the required local permission/escalation; it remains completely local.

## Adding content and hotspots

1. Render or copy the needed textbook page PNG to `resources/pages/`.
2. OCR every page and manually correct obvious OCR mistakes.
3. Add each meaningful English text run to both:
   - `units/unit-N.json` (canonical content), and
   - `units/unit-N.js` (static browser mirror).
4. Add the page and `[id, left, top, width, height]` hotspot entries to `textbookPages` in `main.js`.
5. Ensure every new ID has normal and slow audio.
6. Validate `node --check main.js`, `node --check <unit>.js`, and `python3 -m json.tool <unit>.json`.

For Unit 1 system audio, update `tools/generate-unit-1-audio.sh` and run a targeted range:

```bash
zsh tools/generate-unit-1-audio.sh <start-index> <end-index>
```

The script currently uses the installed macOS voice `Eddy (英语（美国）)`. The user explicitly found the former local-system audio unattractive. Before generating more large batches, prefer a higher-quality neural TTS source with clear permission/licensing; if unavailable, describe the limitation rather than claiming the system voice is polished.

## Unit selection: what needs refactoring next

`renderUnitDock()` in `main.js` currently hardcodes Unit 1 as the sole available unit. Before adding Unit 2, refactor this to a curriculum catalog whose entries include an ID, title, page set, content object, and availability. On click:

- save the selected unit ID to `little-ear:last-unit`;
- render that unit's page tabs and hotspots;
- restore that selection on next load.

Do not make unprepared units appear selectable. The user expects a stable, remembered last unit, not a blank screen.

## Source and copyright

The source PDF is a 60-page local scan titled `2025深圳二年级英语电子课本沪教版`. It is for the family-use workflow and is ignored by Git. Do not publish the scanned source PDF. Page images/audio included in the static app should remain scoped to this personal learning project unless the user explicitly resolves distribution rights.

## Recent user preferences

- “课本点读” is the product, not flashcards.
- Textbook page tabs should remain sticky during scrolling.
- Bottom page QR/scanner residue should stay hidden.
- Label is exactly: `紫色圈可点击`.
- User wants the next AI to continue generating the remaining course content.
