const units = [window.ENGLISH_UNIT_1, window.ENGLISH_UNIT_2].filter(Boolean);
let unit = units[0];
const audioRoot = "./resources/audio/shenzhen-hj-2025-grade-2-semester-1";
const icons = { feel:"✋", see:"👀", smell:"🌼", hear:"👂", taste:"🍓", kitten:"🐱", puppy:"🐶", rabbit:"🐰", flowers:"💐", egg:"🥚" };
const state = { slow:false, selected:null, audio:null, queue:[], queueIndex:0, recorder:null, chunks:[], recordUrl:null };
const $ = (s) => document.querySelector(s);
const wordGrid = $("#word-grid"), sentenceList = $("#sentence-list"), chosenLine = $("#chosen-line"), toast = $("#toast");

function showToast(message) { toast.textContent = message; toast.classList.add("show"); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove("show"), 2500); }
function audioPath(id) { return `${audioRoot}/${id}.${state.slow ? "slow" : "normal"}.m4a`; }
function resetPlaying() { document.querySelectorAll(".playing").forEach((node) => node.classList.remove("playing")); }
function stopAudio() { if (state.audio) { state.audio.pause(); state.audio.currentTime = 0; state.audio = null; } state.queue=[]; resetPlaying(); }
function speakFallback(text, done) { if (!("speechSynthesis" in window)) { showToast("这个设备暂时不能播放语音。"); done?.(); return; } const utterance = new SpeechSynthesisUtterance(text); utterance.lang="en-US"; utterance.rate=state.slow ? .68 : .9; utterance.onend=() => done?.(); speechSynthesis.cancel(); speechSynthesis.speak(utterance); }
function play(item, node, done) {
  stopAudio(); resetPlaying(); node?.classList.add("playing");
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
function renderTextbookReader(unit) {
  const allItems = [...unit.words, ...unit.sentences]; const tabs = $("#page-tabs"), stage = $("#reader-stage");
  function showPage(index) {
    const page = unit.pages[index]; tabs.querySelectorAll("button").forEach((button, buttonIndex)=>button.classList.toggle("active",buttonIndex===index));
    stage.innerHTML = `<div class="book-page"><div class="book-page-canvas"><img src="${page.image}" alt="${page.label}" />${page.hotspots.map(([id,left,top,width,height])=>{ const item=allItems.find((entry)=>entry.id===id); return item ? `<button class="hotspot" data-id="${id}" style="left:${left}%;top:${top}%;width:${width}%;height:${height}%" aria-label="播放：${item.text}"></button>` : ""; }).join("")}</div></div>`;
    stage.querySelectorAll(".hotspot").forEach((node)=>node.addEventListener("click",()=>{ const item=allItems.find((entry)=>entry.id===node.dataset.id); if(item) play(item,node); }));
  }
  tabs.innerHTML=unit.pages.map((page,index)=>`<button type="button" class="${index===0?"active":""}">${page.label}</button>`).join("");
  tabs.querySelectorAll("button").forEach((button,index)=>button.addEventListener("click",()=>showPage(index))); showPage(0);
}
function renderUnitDock() {
  const allUnits = Array.from({length:6}, (_, index) => ({ id:`unit-${index + 1}`, label:`Unit ${index + 1}`, available:units.some((entry) => entry.id === `unit-${index + 1}`) }));
  let lastUnit = "unit-1";
  try { lastUnit = localStorage.getItem("little-ear:last-unit") || "unit-1"; } catch (_) {}
  if (!allUnits.some((entry) => entry.id === lastUnit && entry.available)) lastUnit = units[0]?.id || "unit-1";
  try { localStorage.setItem("little-ear:last-unit", lastUnit); } catch (_) {}
  const tabs = $("#unit-tabs");
  tabs.innerHTML = allUnits.map((entry) => `<button type="button" class="${entry.id === lastUnit ? "active" : ""}" ${entry.available ? "" : "disabled"} aria-label="${entry.label}${entry.available ? "" : "，正在整理"}">${entry.label}</button>`).join("");
  tabs.querySelectorAll("button:not([disabled])").forEach((button) => button.addEventListener("click", () => {
    const nextUnit = units.find((entry) => entry.id === button.dataset.unit);
    if (!nextUnit || nextUnit.id === unit.id) return;
    unit = nextUnit; try { localStorage.setItem("little-ear:last-unit", unit.id); } catch (_) {} render(unit);
  }));
  tabs.querySelectorAll("button:not([disabled])").forEach((button) => { button.dataset.unit = button.textContent.trim().toLowerCase().replace(" ", "-"); });
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
setupRecording();
try { const remembered = localStorage.getItem("little-ear:last-unit"); const rememberedUnit = units.find((entry) => entry.id === remembered); if (rememberedUnit) unit = rememberedUnit; } catch (_) {}
if (unit) render(unit);
else showToast("课程内容加载失败，请刷新页面后重试。");
