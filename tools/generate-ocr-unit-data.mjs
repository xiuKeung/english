#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const [inputPath, outputPath, id, title, englishTitle, firstPdfPage, lastPdfPage, imagePrefix] = process.argv.slice(2);
if (!imagePrefix) {
  console.error("Usage: node tools/generate-ocr-unit-data.mjs <ocr.txt> <out.js> <id> <title> <english-title> <first-pdf> <last-pdf> <image-prefix>");
  process.exit(1);
}

const allowedText = (text) => {
  if (!/^[\x20-\x7e]+$/.test(text) || !/[A-Za-z]/.test(text)) return false;
  if (/^(App|Unit|Ready\? Go!|Story|Communicate|Extend|Big Question|Sounds)$/i.test(text)) return true;
  if (/^[A-Z0-9#@€$£¡|\\/_+=.\- ]+$/.test(text)) return false;
  return text.length > 1;
};
const cleanWordListText = (text) => {
  const noise = new Set(["app", "cs", "us", "aj", "fimhee", "faimeee", "faimeae", "tamêfee"]);
  const knownLabels = new Map([
    ["daily expressions", "Daily expressions"], ["picture dictionary", "Picture dictionary"], ["family", "Family"], ["five senses", "Five senses"], ["places", "Places"], ["toys", "Toys"], ["farm animals", "Farm animals"], ["the mid-autumn festival activities", "The Mid-Autumn Festival activities"], ["tapescripts", "Tapescripts"]
  ]);
  const label = knownLabels.get(text.toLowerCase());
  if (label) return label;
  const header = text.match(/^Word list(?:\s+\d+)?(?:\s*\([^)]*\))?$/i);
  if (header) return header[0];
  const unit = text.match(/^Unit\s+([1-6])$/i);
  if (unit) return `Unit ${unit[1]}`;
  // Retain one or more complete English sentences, but discard trailing OCR
  // fragments that often represent the adjacent Chinese translation.
  const englishWord = "[A-Za-z]+(?:'[A-Za-z]+)?(?:,)?";
  const sentences = text.match(new RegExp(`^((?:${englishWord}(?:\\s+${englishWord})*[.!?]\\s*)+)`));
  if (sentences) return sentences[1].trim();
  // Word-list rows often contain a Chinese translation or OCR debris after the
  // English word. Keep only consecutive lower-case English tokens from the
  // beginning; this prevents the speech engine from trying to read garbage.
  const words = text.trim().split(/\s+/);
  const english = [];
  for (const [index, originalWord] of words.entries()) {
    const word = originalWord.replace(/[.,;:!?]+$/, "");
    if (!/^[a-z]+(?:-[a-z]+)?$/i.test(word)) break;
    const lower = word.toLowerCase();
    const isInitialCapital = index === 0 && (/^[A-Z][a-z]+$/.test(word) || word === "A" || word === "I");
    const isTitleCase = /^[A-Z][a-z]*(?:-[A-Z][a-z]*)?$/.test(word);
    const isStandaloneCaps = words.length === 1 && word === word.toUpperCase() && word.length >= 3;
    if (word !== lower && !isInitialCapital && !isTitleCase && !isStandaloneCaps && word !== "I") break;
    english.push(isStandaloneCaps ? lower : word);
  }
  const cleaned = english.join(" ");
  return noise.has(cleaned.toLowerCase()) ? "" : cleaned;
};
const source = fs.readFileSync(inputPath, "utf8").trim().split(/\r?\n/);
const pages = new Map();
let currentPdfPage = null;
for (const line of source) {
  const heading = line.match(/^--- PDF (\d+) ---$/);
  if (heading) { currentPdfPage = Number(heading[1]); pages.set(currentPdfPage, []); continue; }
  if (!currentPdfPage) continue;
  const [text, coords] = line.split("\t");
  if (!coords) continue;
  const cleanedText = currentPdfPage >= 53 ? cleanWordListText(text.trim()) : text.trim();
  if (!cleanedText || !allowedText(cleanedText)) continue;
  const numbers = coords.split(",").map(Number);
  if (numbers.length !== 4 || numbers.some((number) => !Number.isFinite(number))) continue;
  pages.get(currentPdfPage).push({ text: cleanedText, box: numbers });
}

const idPrefix = id === "other" ? "other" : `u${id.split("-")[1].padStart(2, "0")}`;
const pageData = [];
const sentences = [];
// OCR misses a few tightly packed Word List entries entirely. These are
// calibrated source-PDF coordinates (Vision's bottom-left coordinate system).
const manualEntries = {
  53: [
    { text: "cousin", box: [.105, .535, .105, .019] },
    { text: "zoo", box: [.519, .716, .06, .019] }
  ],
  55: [{ text: "zoo", box: [.51436, .816723, .121484, .01917] }]
};
for (let pdfPage = Number(firstPdfPage); pdfPage <= Number(lastPdfPage); pdfPage += 1) {
  const unique = new Set();
  const sourceEntries = [...(pages.get(pdfPage) || []), ...(manualEntries[pdfPage] || [])];
  const hotspots = sourceEntries.filter((entry) => {
    const signature = `${entry.text}|${entry.box.map((number) => number.toFixed(4)).join(",")}`;
    if (unique.has(signature)) return false;
    unique.add(signature); return true;
  }).map((entry, index) => {
    const itemId = `${idPrefix}-p${pdfPage}-${String(index + 1).padStart(2, "0")}`;
    sentences.push({ id: itemId, text: entry.text, meaning: "" });
    const [x, y, width, height] = entry.box;
    return [itemId, x, 1 - y - height, width, height];
  });
  const bookPage = pdfPage + 1;
  pageData.push({ label: `第 ${bookPage} 页`, image: `./resources/pages/${imagePrefix}-${bookPage}.png`, hotspots });
}

const js = `// Generated from local Apple Vision OCR. Keep original text-tight boxes; main.js applies the shared touch-target padding.\n(function () {\n  const box = (id, x, y, width, height) => [id, x * 100, y * 100, width * 100, height * 100];\n  const sentences = ${JSON.stringify(sentences, null, 2)};\n  const pages = ${JSON.stringify(pageData, null, 2)}.map((page) => ({ ...page, hotspots: page.hotspots.map(([itemId, x, y, width, height]) => box(itemId, x, y, width, height)) }));\n  window.${id === "other" ? "ENGLISH_OTHER" : `ENGLISH_${id.replace("-", "_").toUpperCase()}`} = { id: ${JSON.stringify(id)}, title: ${JSON.stringify(title)}, englishTitle: ${JSON.stringify(englishTitle)}, sourcePages: Array.from({ length: ${Number(lastPdfPage) - Number(firstPdfPage) + 1} }, (_, index) => ${Number(firstPdfPage)} + index), words: [], sentences, pages };\n})();\n`;
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, js);
console.log(`Generated ${sentences.length} point-reading entries in ${outputPath}`);
