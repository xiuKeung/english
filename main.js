const units = [window.ENGLISH_UNIT_1, window.ENGLISH_UNIT_2, window.ENGLISH_UNIT_3, window.ENGLISH_UNIT_4, window.ENGLISH_UNIT_5, window.ENGLISH_UNIT_6, window.ENGLISH_OTHER].filter(Boolean);
// Use the same immediate browser voice across every unit. This avoids a
// missing static-audio request delaying or suppressing speech on mobile/PWA.
units.forEach((entry) => { entry.preferSpeech = true; });
let unit = units[0];
const audioRoot = "./resources/audio/shenzhen-hj-2025-grade-2-semester-1";
const icons = { feel:"✋", see:"👀", smell:"🌼", hear:"👂", taste:"🍓", kitten:"🐱", puppy:"🐶", rabbit:"🐰", flowers:"💐", egg:"🥚" };
const state = { slow:false, selected:null, audio:null, queue:[], queueIndex:0, recorder:null, chunks:[], recordUrl:null, speechToken:0, speechWakeTimer:null };
const $ = (s) => document.querySelector(s);
const wordGrid = $("#word-grid"), sentenceList = $("#sentence-list"), chosenLine = $("#chosen-line"), toast = $("#toast");

function showToast(message) { toast.textContent = message; toast.classList.add("show"); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove("show"), 2500); }
function audioPath(id) { return `${audioRoot}/${id}.${state.slow ? "slow" : "normal"}.m4a`; }
function resetPlaying() { document.querySelectorAll(".playing").forEach((node) => node.classList.remove("playing")); }
function clearSpeech() { state.speechToken += 1; if (state.speechWakeTimer) clearInterval(state.speechWakeTimer); state.speechWakeTimer=null; if ("speechSynthesis" in window) speechSynthesis.cancel(); }
function stopAudio({ clearQueue=true }={}) { if (state.audio) { state.audio.pause(); state.audio.currentTime = 0; state.audio = null; } clearSpeech(); if (clearQueue) state.queue=[]; resetPlaying(); }
function speakFallback(text, done) {
  if (!("speechSynthesis" in window)) { showToast("这个设备暂时不能播放语音。"); done?.(); return; }
  clearSpeech(); const token = state.speechToken; const utterance = new SpeechSynthesisUtterance(text); utterance.lang="en-US"; utterance.rate=state.slow ? .68 : .9;
  const finish = () => { if (token !== state.speechToken) return; if (state.speechWakeTimer) clearInterval(state.speechWakeTimer); state.speechWakeTimer=null; done?.(); };
  utterance.onend=finish; utterance.onerror=finish;
  // iOS Safari can leave speech synthesis paused after a very short utterance.
  // Waking it briefly while this item owns the queue keeps the next tap usable.
  state.speechWakeTimer=setInterval(() => { if (token === state.speechToken) speechSynthesis.resume(); }, 250);
  speechSynthesis.speak(utterance); speechSynthesis.resume();
}
function play(item, node, done) {
  stopAudio({clearQueue:false}); resetPlaying(); node?.classList.add("playing");
  if (unit.preferSpeech) { speakFallback(item.text, () => { node?.classList.remove("playing"); done?.(); }); return; }
  const player = new Audio(audioPath(item.id)); state.audio = player;
  const finish = () => { node?.classList.remove("playing"); if (state.audio === player) state.audio=null; done?.(); };
  player.addEventListener("ended", finish, { once:true });
  player.addEventListener("error", () => { node?.classList.remove("playing"); state.audio=null; speakFallback(item.text, done); }, { once:true });
  player.play().catch(() => { node?.classList.remove("playing"); state.audio=null; speakFallback(item.text, done); });
}
function chooseSentence(item, node) { document.querySelectorAll(".line-card").forEach((el) => el.classList.remove("selected")); node.classList.add("selected"); state.selected=item; chosenLine.textContent=`跟读：${item.text}`; $("#record-button").disabled=false; }
function playNext() { if (state.queueIndex >= state.queue.length) { showToast("这一段听完啦，试试跟读吧！"); return; } const item=state.queue[state.queueIndex++]; const node=document.querySelector(`[data-id="${item.id}"]`); play(item,node,playNext); }
function beginQueue(items) { stopAudio(); state.queue=items; state.queueIndex=0; playNext(); }
const unit1Pages = [
  { label:"第 3 页 · 五感单词", image:"./resources/pages/unit-1-page-3.png", hotspots:[
    ["u01-inst-01", 15, 9, 54, 6], ["u01-word-feel", 32, 27, 7, 4], ["u01-word-see", 62, 27, 7, 4], ["u01-word-smell", 19, 43, 9, 4], ["u01-word-hear", 46, 43, 8, 4], ["u01-word-taste", 73, 43, 9, 4], ["u01-inst-02", 15, 48, 32, 5], ["u01-inst-03", 14, 53, 41, 5], ["u01-line-01", 75, 65, 16, 7]
  ]},
  { label:"第 4 页 · Daisy 的故事", image:"./resources/pages/unit-1-page-4.png", hotspots:[
    ["u01-inst-04", 17, 11, 25, 4], ["u01-inst-05", 17, 15, 27, 7], ["u01-inst-06", 17, 69, 25, 4], ["u01-word-kitten", 20, 33, 9, 4], ["u01-word-puppy", 37, 32, 10, 4], ["u01-word-rabbit", 20, 49, 10, 4], ["u01-word-flowers", 37, 49, 11, 4], ["u01-word-egg", 28, 64, 7, 4], ["u01-line-03", 64, 26, 24, 4], ["u01-line-04", 78, 51, 10, 4], ["u01-line-16", 51, 57, 24, 4], ["u01-line-05", 60, 83, 16, 4]
  ]},
  { label:"第 5 页 · Daisy 的故事", image:"./resources/pages/unit-1-page-5.png", hotspots:[
    ["u01-line-06", 30, 2, 16, 7], ["u01-line-07", 15, 21, 10, 4], ["u01-line-08", 72, 3, 18, 4], ["u01-line-09", 57, 24, 13, 4], ["u01-line-10", 12, 49, 33, 4], ["u01-line-11", 77, 32, 17, 4], ["u01-line-12", 56, 45, 10, 4], ["u01-line-13", 15, 57, 13, 4], ["u01-line-14", 29, 76, 16, 5], ["u01-line-15", 53, 54, 27, 4], ["u01-inst-14", 17, 85, 70, 4]
  ]},
  { label:"第 6 页 · 表演", image:"./resources/pages/unit-1-page-6.png", hotspots:[["u01-inst-07", 8, 2, 43, 6], ["u01-inst-08", 13, 53, 18, 4], ["u01-line-17", 21, 80, 23, 4], ["u01-line-18", 68, 82, 11, 4]]},
  { label:"第 7 页 · 问答", image:"./resources/pages/unit-1-page-7.png", hotspots:[["u01-inst-09", 9, 10, 54, 4], ["u01-inst-10", 39, 86, 50, 4], ["u01-line-17", 31, 66, 22, 4], ["u01-line-19", 40, 74, 29, 4]]},
  { label:"第 8 页 · 延伸故事", image:"./resources/pages/unit-1-page-8.png", hotspots:[["u01-line-20", 25, 12, 51, 4], ["u01-line-21", 51, 16, 35, 4], ["u01-line-22", 9, 44, 38, 4], ["u01-line-23", 12, 58, 16, 4], ["u01-line-24", 11, 70, 12, 4], ["u01-line-25", 51, 56, 27, 4], ["u01-line-26", 28, 78, 17, 4], ["u01-line-27", 50, 78, 8, 4], ["u01-inst-11", 10, 85, 57, 4], ["u01-inst-12", 76, 86, 15, 4]]},
  { label:"第 9 页 · 自然拼读", image:"./resources/pages/unit-1-page-9.png", hotspots:[["u01-inst-13", 29, 5, 21, 4], ["u01-sound-at", 11, 16, 11, 4], ["u01-line-28", 53, 12, 23, 4], ["u01-line-29", 53, 15, 22, 4], ["u01-line-30", 54, 18, 21, 4], ["u01-line-31", 54, 21, 27, 4], ["u01-sound-ap", 79, 51, 11, 4], ["u01-line-32", 20, 50, 23, 4], ["u01-line-33", 20, 53, 18, 4], ["u01-line-34", 20, 55, 19, 4], ["u01-line-35", 20, 58, 22, 4]]}
];
const ocrBox = (id, x, y, width, height) => [id, x * 100, (1 - y - height) * 100, width * 100, height * 100];
// Recalibrated from the published Unit 1 page PNGs with local Apple Vision OCR.
const unit1OcrHotspots = [
  [ocrBox("u01-inst-01",.156379,.873219,.526749,.038462),ocrBox("u01-word-feel",.333333,.707849,.049383,.017442),ocrBox("u01-word-see",.62963,.709302,.041152,.011628),ocrBox("u01-word-smell",.201646,.543605,.067901,.014535),ocrBox("u01-word-hear",.475309,.542151,.057613,.015988),ocrBox("u01-word-taste",.742568,.541664,.060132,.015509),ocrBox("u01-inst-02",.157853,.48576,.30569,.031274),ocrBox("u01-inst-03",.141176,.433048,.394118,.037785),ocrBox("u01-line-01",.765286,.322178,.125806,.019888)],
  [ocrBox("u01-inst-04",.174897,.864672,.240741,.02208),ocrBox("u01-inst-05",.174897,.800681,.263374,.048322),ocrBox("u01-inst-06",.174897,.27907,.236626,.021802),ocrBox("u01-word-kitten",.216049,.652616,.069959,.017442),ocrBox("u01-word-puppy",.386737,.648065,.07632,.019277),ocrBox("u01-word-rabbit",.213925,.482423,.076265,.019165),ocrBox("u01-word-flowers",.380637,.482503,.088521,.017552),ocrBox("u01-word-egg",.296296,.328488,.047325,.018895),ocrBox("u01-line-03",.654321,.710756,.22428,.020349),ocrBox("u01-line-04",.796296,.465116,.080247,.015988),ocrBox("u01-line-16",.522634,.412791,.222222,.017442),ocrBox("u01-line-05",.610986,.146388,.142226,.022631)],
  [ocrBox("u01-line-06",.306017,.919785,.102058,.050),ocrBox("u01-line-07",.162551,.761628,.074074,.018895),ocrBox("u01-line-08",.726254,.945866,.170948,.021058),ocrBox("u01-line-09",.584296,.738184,.107128,.019272),ocrBox("u01-line-10",.135802,.476744,.306584,.030523),ocrBox("u01-line-11",.779713,.647843,.154566,.024082),ocrBox("u01-line-12",.569959,.521802,.082305,.021802),ocrBox("u01-line-13",.157968,.407042,.114105,.023125),ocrBox("u01-line-14",.302177,.20697,.144617,.026468),ocrBox("u01-line-15",.547325,.427326,.251029,.023529),ocrBox("u01-inst-14",.176804,.116266,.691697,.024815)],
  [ocrBox("u01-inst-07",.083645,.937121,.416897,.043622),ocrBox("u01-inst-08",.137799,.4431,.162673,.023684),ocrBox("u01-line-17",.216049,.178775,.216049,.023504),ocrBox("u01-line-18",.695473,.164244,.090535,.017442)],
  [ocrBox("u01-inst-09",.098765,.867521,.532922,.023504),ocrBox("u01-inst-10",.394721,.105215,.492412,.028777),ocrBox("u01-line-17",.316872,.315407,.209877,.023256),ocrBox("u01-line-19",.407407,.235465,.273663,.021802)],
  [ocrBox("u01-line-20",.257202,.850291,.497942,.024709),ocrBox("u01-line-21",.522634,.797721,.337449,.020655),ocrBox("u01-line-22",.094383,.520245,.372974,.021196),ocrBox("u01-line-23",.125469,.399544,.146182,.020679),ocrBox("u01-line-24",.127572,.27907,.100823,.018895),ocrBox("u01-line-25",.516461,.420058,.255144,.020349),ocrBox("u01-line-26",.283867,.197369,.158603,.022414),ocrBox("u01-line-27",.510288,.199128,.065844,.018895),ocrBox("u01-inst-11",.104938,.121795,.557613,.025007),ocrBox("u01-inst-12",.761197,.11872,.144272,.019828)],
  [ocrBox("u01-inst-13",.294207,.924287,.203768,.024973),ocrBox("u01-sound-at",.119342,.800872,.096708,.030523),ocrBox("u01-line-28",.537037,.856105,.213992,.017442),ocrBox("u01-line-29",.54321,.826923,.193416,.019231),ocrBox("u01-line-30",.55144,.797721,.191358,.019231),ocrBox("u01-line-31",.549383,.770349,.248971,.018895),ocrBox("u01-sound-ap",.796296,.460756,.09465,.02907),ocrBox("u01-line-32",.205385,.483836,.218819,.019307),ocrBox("u01-line-33",.207498,.45705,.167378,.017416),ocrBox("u01-line-34",.207315,.42689,.178,.020721),ocrBox("u01-line-35",.207819,.398148,.205761,.020655)]
];
unit1Pages.forEach((page, index) => { page.hotspots = unit1OcrHotspots[index]; });
function expandedHotspot(left, top, width, height) {
  // OCR boxes are text-tight. The horizontal padding is deliberately larger
  // so the rounded outline clears the first/last letter; vertical padding
  // stays restrained to avoid overlapping adjacent text lines.
  const horizontalPad = width * 0.10, verticalPad = height * 0.05;
  const nextLeft = Math.max(0, left - horizontalPad), nextTop = Math.max(0, top - verticalPad);
  return [nextLeft, nextTop, Math.min(100 - nextLeft, width + horizontalPad * 2), Math.min(100 - nextTop, height + verticalPad * 2)];
}
function renderTextbookReader(unit) {
  const allItems = [...unit.words, ...unit.sentences]; const tabs = $("#page-tabs"), stage = $("#reader-stage");
  const tabLabel = (label) => label.match(/第\s*\d+\s*页/)?.[0] || label;
  function showPage(index) {
    const page = unit.pages[index]; tabs.querySelectorAll("button").forEach((button, buttonIndex)=>button.classList.toggle("active",buttonIndex===index));
    stage.innerHTML = `<div class="book-page"><div class="book-page-canvas"><img src="${page.image}" alt="${page.label}" />${page.hotspots.map(([id,left,top,width,height])=>{ const item=allItems.find((entry)=>entry.id===id); const [expandedLeft, expandedTop, expandedWidth, expandedHeight] = expandedHotspot(left, top, width, height); return item ? `<button class="hotspot" data-id="${id}" style="left:${expandedLeft}%;top:${expandedTop}%;width:${expandedWidth}%;height:${expandedHeight}%" aria-label="播放：${item.text}"></button>` : ""; }).join("")}</div></div>`;
    stage.querySelectorAll(".hotspot").forEach((node)=>node.addEventListener("click",()=>{ const item=allItems.find((entry)=>entry.id===node.dataset.id); if(item) play(item,node); }));
  }
  tabs.innerHTML=unit.pages.map((page,index)=>`<button type="button" class="${index===0?"active":""}">${tabLabel(page.label)}</button>`).join("");
  tabs.querySelectorAll("button").forEach((button,index)=>button.addEventListener("click",()=>{
    showPage(index);
    button.scrollIntoView({ behavior:"smooth", block:"nearest", inline:"nearest" });
  })); showPage(0);
}
function renderUnitDock() {
  const allUnits = [...Array.from({length:6}, (_, index) => ({ id:`unit-${index + 1}`, label:`Unit ${index + 1}`, available:units.some((entry) => entry.id === `unit-${index + 1}`) })), { id:"other", label:"其他", available:units.some((entry) => entry.id === "other") }];
  let lastUnit = "unit-1";
  try { lastUnit = localStorage.getItem("little-ear:last-unit") || "unit-1"; } catch (_) {}
  if (!allUnits.some((entry) => entry.id === lastUnit && entry.available)) lastUnit = units[0]?.id || "unit-1";
  try { localStorage.setItem("little-ear:last-unit", lastUnit); } catch (_) {}
  const tabs = $("#unit-tabs");
  tabs.innerHTML = allUnits.map((entry) => `<button type="button" data-unit="${entry.id}" class="${entry.id === lastUnit ? "active" : ""}" ${entry.available ? "" : "disabled"} aria-label="${entry.label}${entry.available ? "" : "，正在整理"}">${entry.label}</button>`).join("");
  tabs.querySelectorAll("button:not([disabled])").forEach((button) => button.addEventListener("click", () => {
    const nextUnit = units.find((entry) => entry.id === button.dataset.unit);
    if (!nextUnit || nextUnit.id === unit.id) return;
    unit = nextUnit; try { localStorage.setItem("little-ear:last-unit", unit.id); } catch (_) {} render(unit);
  }));
}
function render(unit) {
  unit.pages ||= unit1Pages;
  $("#unit-title").textContent=unit.title; $(".subtitle").textContent=unit.englishTitle; $("#word-count").textContent=`${unit.words.length} 个单词`;
  wordGrid.innerHTML=unit.words.map((item)=>`<button class="word-card" data-id="${item.id}" aria-label="播放 ${item.text}"><span class="word-icon">${icons[item.text]||"🔊"}</span><span class="word-text">${item.text}</span><span class="word-meaning">${item.meaning}</span></button>`).join("");
  sentenceList.innerHTML=unit.sentences.map((item,index)=>`<button class="line-card" data-id="${item.id}"><span class="line-number">${String(index+1).padStart(2,"0")}</span><span class="line-text">${item.text}<span class="line-meaning">${item.meaning}</span></span><span class="line-play" aria-hidden="true">▶</span></button>`).join("");
  wordGrid.addEventListener("click",(event)=>{ const node=event.target.closest(".word-card"); if(!node)return; const item=unit.words.find((word)=>word.id===node.dataset.id); play(item,node); });
  sentenceList.addEventListener("click",(event)=>{ const node=event.target.closest(".line-card"); if(!node)return; const item=unit.sentences.find((line)=>line.id===node.dataset.id); chooseSentence(item,node); play(item,node); });
  $("#play-all").addEventListener("click",()=>beginQueue(unit.sentences));
  renderTextbookReader(unit);
  renderUnitDock();
}
function setupRecording() {
  const recordButton=$("#record-button"), recordLabel=$("#record-label"), status=$("#record-status"), tools=$("#recording-tools"), playback=$("#recording-playback");
  recordButton.addEventListener("click", async ()=>{
    if (!state.recorder || state.recorder.state === "inactive") {
      try { const stream=await navigator.mediaDevices.getUserMedia({audio:true}); state.chunks=[]; state.recorder=new MediaRecorder(stream); state.recorder.ondataavailable=(e)=>e.data.size&&state.chunks.push(e.data); state.recorder.onstop=()=>{ stream.getTracks().forEach(track=>track.stop()); if(state.recordUrl)URL.revokeObjectURL(state.recordUrl); const blob=new Blob(state.chunks,{type:state.recorder.mimeType||"audio/webm"}); state.recordUrl=URL.createObjectURL(blob); playback.src=state.recordUrl; tools.hidden=false; recordButton.classList.remove("recording"); recordLabel.textContent="重新录音"; status.textContent="录好了！点播放听听自己的声音。"; }; state.recorder.start(); recordButton.classList.add("recording"); recordLabel.textContent="结束录音"; status.textContent=`正在录：${state.selected.text}`; } catch(error) { status.textContent="没有拿到麦克风权限。请在浏览器设置中允许麦克风后重试。"; showToast("需要麦克风权限才能录音"); }
    } else { state.recorder.stop(); }
  });
  $("#delete-recording").addEventListener("click",()=>{ if(state.recordUrl)URL.revokeObjectURL(state.recordUrl); state.recordUrl=null; playback.removeAttribute("src"); playback.load(); tools.hidden=true; status.textContent="这次录音已删除。"; });
}
$("#toggle-slow").addEventListener("click",(event)=>{ state.slow=!state.slow; event.currentTarget.textContent=`🐢 慢速：${state.slow?"开":"关"}`; showToast(state.slow?"已切换到慢速朗读":"已切换到正常语速"); });
$("#stop-audio").addEventListener("click",stopAudio);
const bookModal = $("#book-modal");
const closeBook = () => { bookModal.hidden = true; $("#book-preview").focus(); };
$("#book-preview").addEventListener("click", () => { bookModal.hidden = false; $("#close-book").focus(); });
$("#close-book").addEventListener("click", closeBook);
$("#close-book-backdrop").addEventListener("click", closeBook);
document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !bookModal.hidden) closeBook(); });
function setupAppInstall() {
  const installButton = $("#install-app"); if (!installButton) return;
  const isStandalone = window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone;
  if (isStandalone) return;
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  let deferredPrompt;
  window.addEventListener("beforeinstallprompt", (event) => { event.preventDefault(); deferredPrompt = event; installButton.hidden = false; });
  if (isIos) installButton.hidden = false;
  installButton.addEventListener("click", async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; installButton.hidden = true; return;
    }
    if (isIos) { showToast("Safari 中点“分享”，再选择“添加到主屏幕”。"); return; }
    showToast("请使用浏览器菜单中的“安装应用”或“添加到主屏幕”。");
  });
}
if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
setupAppInstall();
setupRecording();
try { const remembered = localStorage.getItem("little-ear:last-unit"); const rememberedUnit = units.find((entry) => entry.id === remembered); if (rememberedUnit) unit = rememberedUnit; } catch (_) {}
if (unit) render(unit);
else showToast("课程内容加载失败，请刷新页面后重试。");
