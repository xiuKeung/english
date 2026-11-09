#!/usr/bin/env node
/**
 * Generate static audio for any textbook unit.
 *
 * Examples:
 *   node tools/generate-course-audio.mjs --unit unit-1 --force
 *   node tools/generate-course-audio.mjs --all
 *   node tools/generate-course-audio.mjs --all --normal-rate 150 --slow-rate 108 --prune
 *
 * Requires macOS `say` (the installed Eddy US-English voice) and ffmpeg.
 * It also rewrites resources/audio/.../manifest.js, which lets the web app
 * use static files only when a matching clip really exists.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import vm from "node:vm";
import { readFile } from "node:fs/promises";

const projectRoot=resolve(dirname(new URL(import.meta.url).pathname),"..");
const curriculum="shenzhen-hj-2025-grade-2-semester-1";
const audioRoot=join(projectRoot,"resources","audio",curriculum);
const unitsRoot=join(projectRoot,"content","curricula","shenzhen-hj-2025","grade-2","semester-1","units");
const args=process.argv.slice(2);
const option=(name,fallback)=>{ const index=args.indexOf(name); return index===-1?fallback:args[index+1]; };
const requestedUnit=option("--unit",null);
const normalRate=Number(option("--normal-rate","150"));
const slowRate=Number(option("--slow-rate","108"));
const voice=option("--voice","Eddy (英语（美国）)");
const force=args.includes("--force"), dryRun=args.includes("--dry-run"), prune=args.includes("--prune"), all=args.includes("--all");
if ((!all&&!requestedUnit)||(!Number.isFinite(normalRate))||(!Number.isFinite(slowRate))) {
  console.error("Usage: node tools/generate-course-audio.mjs --unit unit-1|--all [--normal-rate 150] [--slow-rate 108] [--force] [--prune] [--dry-run]");
  process.exit(1);
}
const selected=all?["unit-1","unit-2","unit-3","unit-4","unit-5","unit-6","other"]:[requestedUnit];
const safeText=(text)=>{
  const normalized=String(text||"").trim().replace(/\s+/g," ");
  // OCR artifacts such as #fm@#EE must never become a spoken clip. Items
  // that fail this check still work in the app through browser-speech fallback.
  const ocrTail=/\b(?:af|tid|od)\b/i.test(normalized)||/\b[bcdfghjklmnpqrstvwxyz]{5,}\b/i.test(normalized);
  return normalized&&/[A-Za-z]/.test(normalized)&&!/[#@^&]/.test(normalized)&&!ocrTail?normalized:null;
};
const loadUnit=async (unitId)=>{
  const filename=unitId==="other"?"other.js":`${unitId}.js`;
  const code=await readFile(join(unitsRoot,filename),"utf8");
  const context={window:{}}; vm.createContext(context); vm.runInContext(code,context,{filename});
  const key=unitId==="other"?"ENGLISH_OTHER":`ENGLISH_UNIT_${unitId.split("-")[1]}`;
  return context.window[key];
};
const run=(command,commandArgs)=>execFileSync(command,commandArgs,{stdio:"inherit"});
const tempDir=dryRun?null:mkdtempSync(join(tmpdir(),"english-audio-"));
let created=0, skipped=0, rejected=0;
try {
  for (const unitId of selected) {
    const unit=await loadUnit(unitId);
    if (!unit) throw new Error(`Unable to load ${unitId}`);
    const unitFolder=unitId.replace("unit-","unit-").padStart(0);
    const entries=[...(unit.words||[]),...(unit.sentences||[])];
    const seen=new Set();
    for (const entry of entries) {
      if (!entry?.id||seen.has(entry.id)) continue;
      seen.add(entry.id); const text=safeText(entry.text);
      if (!text) { rejected+=1; continue; }
      for (const [speed,rate] of [["normal",normalRate],["slow",slowRate]]) {
        const output=join(audioRoot,unitFolder,speed,`${entry.id}.m4a`);
        if (existsSync(output)&&!force) { skipped+=1; continue; }
        if (dryRun) { console.log(`Would create ${output}`); created+=1; continue; }
        mkdirSync(dirname(output),{recursive:true});
        const source=join(tempDir,`${entry.id}-${speed}.aiff`);
        run("say",["-v",voice,"-r",String(rate),"-o",source,"--",text]);
        run("ffmpeg",["-loglevel","error","-y","-i",source,"-c:a","aac","-b:a","64k",output]);
        created+=1;
      }
    }
  }
  if (!dryRun) {
    const items={}, tracks={};
    for (const unitId of ["unit-1","unit-2","unit-3","unit-4","unit-5","unit-6","other"]) {
      const unit=await loadUnit(unitId), unitFolder=unitId;
      for (const entry of [...(unit.words||[]),...(unit.sentences||[])]) {
        const text=safeText(entry.text), normal=join(audioRoot,unitFolder,"normal",`${entry.id}.m4a`);
        if (!text||!existsSync(normal)) continue;
        items[entry.id]={unit:unitId,text};
        const page=entry.id.match(/-p(\d+)-/)?.[1];
        const trackId=page?`${unitId}:page-${page}`:`${unitId}:all`;
        (tracks[trackId]||=[]).push(entry.id);
      }
    }
    if (prune) {
      const removeOrphans=(directory)=>{ for (const entry of readdirSync(directory,{withFileTypes:true})) { const path=join(directory,entry.name); if (entry.isDirectory()) removeOrphans(path); else if (entry.name.endsWith(".m4a")&&!items[basename(entry.name,".m4a")]) rmSync(path,{force:true}); } };
      if (existsSync(audioRoot)) removeOrphans(audioRoot);
    }
    const ids=Object.keys(items).sort();
    const manifest=`// Generated by tools/generate-course-audio.mjs\n// Each clip ID is tied to its exact textbook text; tracks retain textbook page order.\nwindow.ENGLISH_AUDIO_INDEX=new Set(${JSON.stringify(ids)});\nwindow.ENGLISH_AUDIO_ITEMS=${JSON.stringify(items)};\nwindow.ENGLISH_LISTENING_TRACKS=${JSON.stringify(tracks)};\n`;
    writeFileSync(join(audioRoot,"manifest.js"),manifest,"utf8");
  }
  console.log(`Audio complete: ${created} created, ${skipped} already present, ${rejected} OCR artifacts skipped.`);
} finally { if (tempDir) rmSync(tempDir,{recursive:true,force:true}); }
