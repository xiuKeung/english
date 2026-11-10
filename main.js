const units = [window.ENGLISH_UNIT_1, window.ENGLISH_UNIT_2, window.ENGLISH_UNIT_3, window.ENGLISH_UNIT_4, window.ENGLISH_UNIT_5, window.ENGLISH_UNIT_6, window.ENGLISH_OTHER].filter(Boolean);
let unit = units[0];
const audioRoot = "./resources/curricula/shenzhen-hj-2025-grade-2-semester-1/audio";
const icons = { feel:"✋", see:"👀", smell:"🌼", hear:"👂", taste:"🍓", kitten:"🐱", puppy:"🐶", rabbit:"🐰", flowers:"💐", egg:"🥚" };
const state = { slow:false, selected:null, audio:null, queue:[], queueIndex:0, recorder:null, chunks:[], recordUrl:null, speechToken:0, speechWakeTimer:null, preferredVoice:null, dictationAutoTimer:null };
const preloadedPageImages = new Set();
const $ = (s) => document.querySelector(s);
const vocabStudy = $("#vocab-study"), vocabPractice = $("#vocab-practice"), vocabularySection = $("#vocabulary"), readerContent = $("#reader-content"), sentenceList = $("#sentence-list"), chosenLine = $("#chosen-line"), toast = $("#toast");
const learningState = { view:"reader", vocabView:"study", items:[], studyIndex:0, question:null, answer:"", rounds:{} };
try {
  const savedView=localStorage.getItem("little-ear:learning-view"), savedVocabView=localStorage.getItem("little-ear:vocabulary-view");
  if (["reader","vocabulary"].includes(savedView)) learningState.view=savedView;
  if (["study","choice","listen-choice","dictation"].includes(savedVocabView)) learningState.vocabView=savedVocabView;
} catch (_) {}

function showToast(message) { toast.textContent = message; toast.classList.add("show"); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove("show"), 2500); }
function audioPath(id) { const unitId=id.match(/^u(\d{2})-/)?.[1]; return `${audioRoot}/${unitId?`unit-${Number(unitId)}`:"other"}/${state.slow ? "slow" : "normal"}/${id}.m4a`; }
function optimizedPageImage(image) { return image.replace(/\.png$/i,".webp"); }
function resetPlaying() { document.querySelectorAll(".playing").forEach((node) => node.classList.remove("playing")); }
function clearSpeech({ cancel=true }={}) { state.speechToken += 1; if (state.speechWakeTimer) clearInterval(state.speechWakeTimer); state.speechWakeTimer=null; if (cancel && "speechSynthesis" in window) speechSynthesis.cancel(); }
function stopAudio({ clearQueue=true }={}) { if (state.audio) { state.audio.pause(); state.audio.currentTime = 0; state.audio = null; } clearSpeech(); if (clearQueue) state.queue=[]; resetPlaying(); }
function preferredEnglishVoice() {
  if (!("speechSynthesis" in window)) return null;
  const voices=speechSynthesis.getVoices();
  if (!voices.length) return null;
  const english=voices.filter((voice)=>/^en(-|_)/i.test(voice.lang));
  const femaleName=/(samantha|ava|aria|jenny|zira|karen|moira|tessa|allison|serena|victoria|female|google us english)/i;
  return english.find((voice)=>femaleName.test(voice.name)) || english.find((voice)=>/^en-us$/i.test(voice.lang)) || english[0] || null;
}
if ("speechSynthesis" in window) speechSynthesis.addEventListener?.("voiceschanged",()=>{ state.preferredVoice=preferredEnglishVoice(); });
function speakFallback(text, done) {
  if (!("speechSynthesis" in window)) { showToast("这个设备暂时不能播放语音。"); done?.(); return; }
  const wasBusy = speechSynthesis.speaking || speechSynthesis.pending;
  clearSpeech(); const token = state.speechToken; const utterance = new SpeechSynthesisUtterance(text); utterance.lang="en-US"; utterance.rate=state.slow ? .68 : .9; state.preferredVoice=preferredEnglishVoice() || state.preferredVoice; if (state.preferredVoice) utterance.voice=state.preferredVoice;
  const finish = () => { if (token !== state.speechToken) return; if (state.speechWakeTimer) clearInterval(state.speechWakeTimer); state.speechWakeTimer=null; done?.(); };
  utterance.onend=finish; utterance.onerror=finish;
  const start = () => {
    if (token !== state.speechToken) return;
    // iOS Safari can leave speech synthesis paused after a very short utterance.
    state.speechWakeTimer=setInterval(() => { if (token === state.speechToken) speechSynthesis.resume(); }, 250);
    speechSynthesis.resume(); speechSynthesis.speak(utterance); speechSynthesis.resume();
  };
  // Safari may silently ignore speak() immediately after cancel(). Only delay
  // when another utterance was actually active; fresh taps still speak now.
  if (wasBusy) setTimeout(start, 80); else start();
}
function play(item, node, done) {
  const audioId=item.audioId||item.id;
  if (!window.ENGLISH_AUDIO_INDEX?.has(audioId)) { if (state.audio) { state.audio.pause(); state.audio.currentTime=0; state.audio=null; } resetPlaying(); node?.classList.add("playing"); speakFallback(item.text, () => { node?.classList.remove("playing"); done?.(); }); return; }
  stopAudio({clearQueue:false}); resetPlaying(); node?.classList.add("playing");
  const player = new Audio(audioPath(audioId)); state.audio = player;
  const finish = () => { node?.classList.remove("playing"); if (state.audio === player) state.audio=null; done?.(); };
  player.addEventListener("ended", finish, { once:true });
  player.addEventListener("error", () => { node?.classList.remove("playing"); state.audio=null; speakFallback(item.text, done); }, { once:true });
  player.play().catch(() => { node?.classList.remove("playing"); state.audio=null; speakFallback(item.text, done); });
}
function chooseSentence(item, node) { document.querySelectorAll(".line-card").forEach((el) => el.classList.remove("selected")); node.classList.add("selected"); state.selected=item; chosenLine.textContent=`跟读：${item.text}`; $("#record-button").disabled=false; }
function playNext() { if (state.queueIndex >= state.queue.length) { showToast("这一段听完啦，试试跟读吧！"); return; } const item=state.queue[state.queueIndex++]; const node=document.querySelector(`[data-id="${item.id}"]`); play(item,node,playNext); }
function beginQueue(items) { stopAudio(); state.queue=items; state.queueIndex=0; playNext(); }
const unit1Pages = [
  { label:"第 3 页 · 五感单词", image:"./resources/curricula/shenzhen-hj-2025-grade-2-semester-1/pages/unit-1-page-3.png", hotspots:[
    ["u01-inst-01", 15, 9, 54, 6], ["u01-word-feel", 32, 27, 7, 4], ["u01-word-see", 62, 27, 7, 4], ["u01-word-smell", 19, 43, 9, 4], ["u01-word-hear", 46, 43, 8, 4], ["u01-word-taste", 73, 43, 9, 4], ["u01-inst-02", 15, 48, 32, 5], ["u01-inst-03", 14, 53, 41, 5], ["u01-line-01", 75, 65, 16, 7]
  ]},
  { label:"第 4 页 · Daisy 的故事", image:"./resources/curricula/shenzhen-hj-2025-grade-2-semester-1/pages/unit-1-page-4.png", hotspots:[
    ["u01-inst-04", 17, 11, 25, 4], ["u01-inst-05", 17, 15, 27, 7], ["u01-inst-06", 17, 69, 25, 4], ["u01-word-kitten", 20, 33, 9, 4], ["u01-word-puppy", 37, 32, 10, 4], ["u01-word-rabbit", 20, 49, 10, 4], ["u01-word-flowers", 37, 49, 11, 4], ["u01-word-egg", 28, 64, 7, 4], ["u01-line-03", 64, 26, 24, 4], ["u01-line-04", 78, 51, 10, 4], ["u01-line-16", 51, 57, 24, 4], ["u01-line-05", 60, 83, 16, 4]
  ]},
  { label:"第 5 页 · Daisy 的故事", image:"./resources/curricula/shenzhen-hj-2025-grade-2-semester-1/pages/unit-1-page-5.png", hotspots:[
    ["u01-line-06", 30, 2, 16, 7], ["u01-line-07", 15, 21, 10, 4], ["u01-line-08", 72, 3, 18, 4], ["u01-line-09", 57, 24, 13, 4], ["u01-line-10", 12, 49, 33, 4], ["u01-line-11", 77, 32, 17, 4], ["u01-line-12", 56, 45, 10, 4], ["u01-line-13", 15, 57, 13, 4], ["u01-line-14", 29, 76, 16, 5], ["u01-line-15", 53, 54, 27, 4], ["u01-inst-14", 17, 85, 70, 4]
  ]},
  { label:"第 6 页 · 表演", image:"./resources/curricula/shenzhen-hj-2025-grade-2-semester-1/pages/unit-1-page-6.png", hotspots:[["u01-inst-07", 8, 2, 43, 6], ["u01-inst-08", 13, 53, 18, 4], ["u01-line-17", 21, 80, 23, 4], ["u01-line-18", 68, 82, 11, 4]]},
  { label:"第 7 页 · 问答", image:"./resources/curricula/shenzhen-hj-2025-grade-2-semester-1/pages/unit-1-page-7.png", hotspots:[["u01-inst-09", 9, 10, 54, 4], ["u01-inst-10", 39, 86, 50, 4], ["u01-line-17", 31, 66, 22, 4], ["u01-line-19", 40, 74, 29, 4]]},
  { label:"第 8 页 · 延伸故事", image:"./resources/curricula/shenzhen-hj-2025-grade-2-semester-1/pages/unit-1-page-8.png", hotspots:[["u01-line-20", 25, 12, 51, 4], ["u01-line-21", 51, 16, 35, 4], ["u01-line-22", 9, 44, 38, 4], ["u01-line-23", 12, 58, 16, 4], ["u01-line-24", 11, 70, 12, 4], ["u01-line-25", 51, 56, 27, 4], ["u01-line-26", 28, 78, 17, 4], ["u01-line-27", 50, 78, 8, 4], ["u01-inst-11", 10, 85, 57, 4], ["u01-inst-12", 76, 86, 15, 4]]},
  { label:"第 9 页 · 自然拼读", image:"./resources/curricula/shenzhen-hj-2025-grade-2-semester-1/pages/unit-1-page-9.png", hotspots:[["u01-inst-13", 29, 5, 21, 4], ["u01-sound-at", 11, 16, 11, 4], ["u01-line-28", 53, 12, 23, 4], ["u01-line-29", 53, 15, 22, 4], ["u01-line-30", 54, 18, 21, 4], ["u01-line-31", 54, 21, 27, 4], ["u01-sound-ap", 79, 51, 11, 4], ["u01-line-32", 20, 50, 23, 4], ["u01-line-33", 20, 53, 18, 4], ["u01-line-34", 20, 55, 19, 4], ["u01-line-35", 20, 58, 22, 4]]}
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
function revealTabGroup(container, activeTab, behavior="smooth") {
  const buttons=[...container.querySelectorAll("button")], index=buttons.indexOf(activeTab);
  if (index<0) return;
  const first=buttons[Math.max(0,index-1)], last=buttons[Math.min(buttons.length-1,index+1)];
  const groupLeft=first.offsetLeft-8, groupRight=last.offsetLeft+last.offsetWidth+8;
  const target=Math.max(0,Math.min(container.scrollWidth-container.clientWidth,(groupLeft+groupRight-container.clientWidth)/2));
  container.scrollTo({left:target,behavior});
}
function escapeHtml(text) { return String(text).replace(/[&<>'"]/g, (character) => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[character]); }
function shuffle(items) { return [...items].sort(() => Math.random() - .5); }
function normalizedAudioText(text) { return String(text).trim().replace(/\s+/g," ").replace(/[’‘]/g,"'").toLowerCase(); }
function vocabularyAudioId(unitId, text, fallbackId) {
  const matches=Object.entries(window.ENGLISH_AUDIO_ITEMS||{}).filter(([,entry])=>normalizedAudioText(entry.text)===normalizedAudioText(text));
  return matches.find(([,entry])=>entry.unit===unitId)?.[0]||matches[0]?.[0]||(window.ENGLISH_AUDIO_INDEX?.has(fallbackId)?fallbackId:null);
}
function vocabularyFor(activeUnit) {
  const curated = (window.ENGLISH_VOCABULARY_1 || []).filter((item) => item.unit === activeUnit.id);
  const seen = new Set(curated.map((item) => item.text.toLowerCase()));
  const extras = (activeUnit.words || []).filter((item) => !seen.has(item.text.toLowerCase()));
  return [...curated, ...extras].map((item)=>({...item,audioId:vocabularyAudioId(activeUnit.id,item.text,item.id)}));
}
function renderStudyCard() {
  const items = learningState.items; if (!items.length) return;
  const index = Math.max(0, Math.min(learningState.studyIndex, items.length - 1)); learningState.studyIndex=index; const item=items[index];
  vocabStudy.innerHTML=`<p class="study-progress">${index+1} / ${items.length}</p><div class="study-card"><p class="study-word">${escapeHtml(item.text)}</p><p class="study-meaning">${escapeHtml(item.meaning || "点击朗读，先听一听")}</p></div><div class="study-actions"><button type="button" data-study="previous">上一个</button><button class="primary-action" type="button" data-study="play">🔊 听读音</button><button type="button" data-study="next">下一个</button></div>`;
  vocabStudy.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => { const action=button.dataset.study; if(action === "play") play(item,button); if(action === "previous") { learningState.studyIndex=(index-1+items.length)%items.length; renderStudyCard(); } if(action === "next") { learningState.studyIndex=(index+1)%items.length; renderStudyCard(); } }));
}
function nextRoundPrompt(type, prompts) {
  let round=learningState.rounds[type];
  if(!round) { round={pending:shuffle(prompts),retries:[],total:prompts.length,firstPassCorrect:0,mistakes:0}; learningState.rounds[type]=round; }
  return round.pending.shift()||round.retries.shift()||null;
}
function recordRoundResult(question, correct) {
  const round=learningState.rounds[question.type];
  if(correct&&!question.isRetry) round.firstPassCorrect+=1;
  if(!correct&&!question.isRetry) { round.mistakes+=1; round.retries.push({item:question.item,englishToChinese:question.englishToChinese,isRetry:true}); }
}
function renderRoundComplete(type, title, restart) {
  const round=learningState.rounds[type];
  vocabPractice.innerHTML=`<div class="vocab-empty"><div><p class="practice-progress">${title}</p><h3>本轮完成</h3><p>首次答对 ${round.firstPassCorrect} / ${round.total} 题<br />错题 ${round.mistakes} 题，已各复习一次。</p><div class="practice-actions"><button class="primary-action" type="button" data-restart>再练一轮</button></div></div></div>`;
  vocabPractice.querySelector("[data-restart]").addEventListener("click",()=>{ learningState.rounds[type]=null; learningState.question=null; restart(); });
}
function returnUnansweredQuestion() {
  const question=learningState.question, round=question&&learningState.rounds[question.type];
  if(!question||question.answered||question.checked||!round) return;
  const prompt={item:question.item,englishToChinese:question.englishToChinese,isRetry:question.isRetry};
  (question.isRetry?round.retries:round.pending).unshift(prompt);
}
function newChoiceQuestion() {
  const items=learningState.items.filter((item)=>item.meaning), prompts=items.flatMap((item)=>[{item,englishToChinese:true},{item,englishToChinese:false}]);
  const prompt=nextRoundPrompt("choice",prompts); if(!prompt) return null;
  learningState.question={type:"choice",...prompt,options:shuffle([prompt.item,...shuffle(items.filter((entry)=>entry.id!==prompt.item.id)).slice(0,3)]),answered:false}; return learningState.question;
}
function renderChoicePractice() {
  const items=learningState.items.filter((item)=>item.meaning); if(items.length<4) { vocabPractice.innerHTML='<div class="vocab-empty">本单元可用于中英互认的词汇不足 4 个。</div>'; return; }
  if(!learningState.question || learningState.question.type!=="choice") newChoiceQuestion(); const question=learningState.question; if(!question) { renderRoundComplete("choice","中英互认",renderChoicePractice); return; } const item=question.item, round=learningState.rounds.choice;
  const prompt=question.englishToChinese ? item.text : item.meaning; const direction=question.englishToChinese ? "选出正确的中文意思" : "选出正确的英文单词";
  vocabPractice.innerHTML=`<p class="practice-progress">中英互认 · ${direction} · 基础题 ${round.total-round.pending.length} / ${round.total}</p><p class="practice-question">${escapeHtml(prompt)}</p><div class="choice-grid">${question.options.map((option)=>`<button type="button" data-choice="${escapeHtml(option.id)}">${escapeHtml(question.englishToChinese?option.meaning:option.text)}</button>`).join("")}</div><p class="feedback" id="practice-feedback"></p><div class="practice-actions"><button type="button" data-next hidden>下一题</button></div>`;
  const feedback=$("#practice-feedback"), next=vocabPractice.querySelector("[data-next]");
  vocabPractice.querySelectorAll("[data-choice]").forEach((button)=>button.addEventListener("click",()=>{ if(question.answered)return; question.answered=true; const correct=button.dataset.choice===item.id; vocabPractice.querySelectorAll("[data-choice]").forEach((choice)=>{ const option=question.options.find((entry)=>entry.id===choice.dataset.choice); if(option.id===item.id)choice.classList.add("correct"); else if(choice===button)choice.classList.add("wrong"); choice.disabled=true; }); recordRoundResult(question,correct); feedback.textContent=correct?"答对啦！":"再记一遍："+(question.englishToChinese?item.meaning:item.text)+(question.isRetry?"":"（本轮结束前会再出现一次）"); feedback.className=`feedback ${correct?"correct":"wrong"}`; next.hidden=false; }));
  next.addEventListener("click",()=>{ learningState.question=null; renderChoicePractice(); });
}
function newListeningChoiceQuestion() {
  const items=learningState.items.filter((item)=>item.meaning), prompt=nextRoundPrompt("listen-choice",items.map((item)=>({item})));
  if(!prompt) return null; learningState.question={type:"listen-choice",...prompt,options:shuffle([prompt.item,...shuffle(items.filter((entry)=>entry.id!==prompt.item.id)).slice(0,3)]),answered:false}; return learningState.question;
}
function renderListeningChoicePractice() {
  const items=learningState.items.filter((item)=>item.meaning); if(items.length<4) { vocabPractice.innerHTML='<div class="vocab-empty">本单元可用于听音选词义的词汇不足 4 个。</div>'; return; }
  if(!learningState.question || learningState.question.type!=="listen-choice") newListeningChoiceQuestion(); const question=learningState.question; if(!question) { renderRoundComplete("listen-choice","听音选词义",renderListeningChoicePractice); return; } const item=question.item, round=learningState.rounds["listen-choice"];
  vocabPractice.innerHTML=`<p class="practice-progress">听音选词义 · 先听读音，再选中文意思 · 基础题 ${round.total-round.pending.length} / ${round.total}</p><div class="practice-actions listen-choice-actions"><button class="primary-action" type="button" data-listen-play>🔊 播放读音</button></div><div class="choice-grid">${question.options.map((option)=>`<button type="button" data-listen-choice="${escapeHtml(option.id)}">${escapeHtml(option.meaning)}</button>`).join("")}</div><p class="feedback" id="practice-feedback"></p><div class="practice-actions"><button type="button" data-next hidden>下一题</button></div>`;
  const feedback=$("#practice-feedback"), next=vocabPractice.querySelector("[data-next]"); vocabPractice.querySelector("[data-listen-play]").addEventListener("click",(event)=>play(item,event.currentTarget));
  vocabPractice.querySelectorAll("[data-listen-choice]").forEach((button)=>button.addEventListener("click",()=>{ if(question.answered)return; question.answered=true; const correct=button.dataset.listenChoice===item.id; vocabPractice.querySelectorAll("[data-listen-choice]").forEach((choice)=>{ const option=question.options.find((entry)=>entry.id===choice.dataset.listenChoice); if(option.id===item.id)choice.classList.add("correct"); else if(choice===button)choice.classList.add("wrong"); choice.disabled=true; }); recordRoundResult(question,correct); feedback.textContent=correct?"答对啦！":"正确答案："+item.meaning+(question.isRetry?"":"（本轮结束前会再出现一次）"); feedback.className=`feedback ${correct?"correct":"wrong"}`; next.hidden=false; }));
  next.addEventListener("click",()=>{ learningState.question=null; renderListeningChoicePractice(); });
}
function newDictationQuestion() { const items=learningState.items.filter((item)=>/^[a-z]+$/i.test(item.text)), prompt=nextRoundPrompt("dictation",items.map((item)=>({item}))); if(!prompt) return null; learningState.question={type:"dictation",...prompt,checked:false}; learningState.answer=""; return learningState.question; }
function queueDictationAutoplay() {
  if (state.dictationAutoTimer) clearTimeout(state.dictationAutoTimer);
  const question=learningState.question;
  state.dictationAutoTimer=setTimeout(()=>{ state.dictationAutoTimer=null; if (learningState.vocabView!=="dictation" || learningState.question!==question) return; const button=vocabPractice.querySelector('[data-dictation="play"]'); if (button) play(question.item,button); },500);
}
function renderDictationPractice() {
  const items=learningState.items.filter((item)=>/^[a-z]+$/i.test(item.text)); if(!items.length) { vocabPractice.innerHTML='<div class="vocab-empty">本单元词汇以短语为主。请先用“中英互认”练习；26 个字母键盘的听写会在单词单元开启。</div>'; return; }
  if(!learningState.question || learningState.question.type!=="dictation") newDictationQuestion(); const question=learningState.question; if(!question) { renderRoundComplete("dictation","听写",renderDictationPractice); return; } const item=question.item, round=learningState.rounds.dictation;
  const draw=()=>{ const letters="abcdefghijklmnopqrstuvwxyz".split(""); const display=learningState.answer ? learningState.answer.toUpperCase().split("").join(" ") : "· · ·"; vocabPractice.innerHTML=`<p class="practice-progress">听写 · 仅使用 26 个英文字母 · 基础题 ${round.total-round.pending.length} / ${round.total}</p><p class="practice-question">听一听，拼出这个单词</p><div class="practice-actions dictation-listen-actions"><button class="primary-action" type="button" data-dictation="play">🔊 播放读音</button></div><div class="dictation-display" aria-label="当前拼写">${display}</div><div class="letter-keyboard" aria-label="英文字母键盘">${letters.map((letter)=>`<button type="button" data-letter="${letter}">${letter}</button>`).join("")}</div><p class="feedback" id="practice-feedback"></p><div class="practice-actions dictation-actions"><button type="button" data-dictation="delete">删除</button><button type="button" data-dictation="clear">清空</button><button class="primary-action" type="button" data-dictation="check">检查</button><button type="button" data-dictation="next" hidden>下一题</button></div>`;
    const feedback=$("#practice-feedback"), next=vocabPractice.querySelector('[data-dictation="next"]');
    vocabPractice.querySelectorAll("[data-letter]").forEach((button)=>button.addEventListener("click",()=>{ if(!question.checked && learningState.answer.length<item.text.length) { learningState.answer+=button.dataset.letter; draw(); } }));
    vocabPractice.querySelectorAll("[data-dictation]").forEach((button)=>button.addEventListener("click",()=>{ const action=button.dataset.dictation; if(action==="play") { if(state.dictationAutoTimer) clearTimeout(state.dictationAutoTimer); state.dictationAutoTimer=null; play(item,button); } if(action==="delete"&&!question.checked) { learningState.answer=learningState.answer.slice(0,-1); draw(); } if(action==="clear"&&!question.checked) { learningState.answer=""; draw(); } if(action==="check"&&!question.checked) { question.checked=true; const correct=learningState.answer.toLowerCase()===item.text.toLowerCase(); recordRoundResult(question,correct); feedback.textContent=correct?"拼对啦！":"正确拼写："+item.text.toUpperCase()+(question.isRetry?"":"（本轮结束前会再出现一次）"); feedback.className=`feedback ${correct?"correct":"wrong"}`; ["delete","clear","check"].forEach((name)=>{ vocabPractice.querySelector(`[data-dictation="${name}"]`).disabled=true; }); next.hidden=false; } if(action==="next") { learningState.question=null; renderDictationPractice(); if(learningState.question?.type==="dictation") queueDictationAutoplay(); } }));
  }; draw();
}
function renderVocabulary(activeUnit) {
  learningState.items=vocabularyFor(activeUnit); learningState.studyIndex=0; learningState.question=null; learningState.answer=""; learningState.rounds={}; $("#word-count").textContent=`${learningState.items.length} 个词汇`;
  const isStudy=learningState.vocabView==="study"; vocabStudy.hidden=!isStudy; vocabPractice.hidden=isStudy; document.querySelectorAll("[data-vocab-view]").forEach((button)=>button.classList.toggle("active",button.dataset.vocabView===learningState.vocabView));
  if(!learningState.items.length) { vocabStudy.hidden=false; vocabPractice.hidden=true; vocabStudy.innerHTML='<div class="vocab-empty">这个部分暂时没有可练习词汇。</div>'; vocabPractice.innerHTML=""; return; }
  renderStudyCard(); if(learningState.vocabView==="choice") renderChoicePractice(); if(learningState.vocabView==="listen-choice") renderListeningChoicePractice(); if(learningState.vocabView==="dictation") renderDictationPractice();
}
function showLearningView(view, {scroll=true}={}) { learningState.view=view; try { localStorage.setItem("little-ear:learning-view",view); } catch (_) {} const vocabulary=view==="vocabulary"; readerContent.hidden=vocabulary; vocabularySection.hidden=!vocabulary; $("#reader-mode").classList.toggle("active",!vocabulary); $("#reader-mode").setAttribute("aria-selected",String(!vocabulary)); $("#vocabulary-mode").classList.toggle("active",vocabulary); $("#vocabulary-mode").setAttribute("aria-selected",String(vocabulary)); if(vocabulary&&scroll) vocabularySection.scrollIntoView({behavior:"smooth",block:"start"}); }
function renderTextbookReader(unit) {
  const allItems = [...unit.words, ...unit.sentences]; const tabs = $("#page-tabs"), stage = $("#reader-stage");
  const tabLabel = (label) => label.match(/第\s*\d+\s*页/)?.[0] || label;
  const pageStorageKey = `little-ear:last-page:${unit.id}`;
  const warmPage = (page) => {
    if (!page || preloadedPageImages.has(page.image)) return;
    preloadedPageImages.add(page.image);
    const preload=()=>{ const image = new Image(); image.decoding="async"; image.src = optimizedPageImage(page.image); };
    if ("requestIdleCallback" in window) requestIdleCallback(preload,{timeout:2500}); else setTimeout(preload,250);
  };
  function showPage(index, {remember=true, scrollTab=true}={}) {
    const page = unit.pages[index]; tabs.querySelectorAll("button").forEach((button, buttonIndex)=>button.classList.toggle("active",buttonIndex===index));
    if (remember) try { localStorage.setItem(pageStorageKey, page.image); } catch (_) {}
    stage.setAttribute("aria-busy", "true");
    stage.innerHTML = `<div class="book-page is-loading"><div class="book-page-canvas"><div class="reader-loader" role="status"><span></span>正在打开${tabLabel(page.label)}</div><img src="${optimizedPageImage(page.image)}" alt="${page.label}" fetchpriority="high" decoding="async" />${page.hotspots.map(([id,left,top,width,height])=>{ const item=allItems.find((entry)=>entry.id===id); const [expandedLeft, expandedTop, expandedWidth, expandedHeight] = expandedHotspot(left, top, width, height); return item ? `<button class="hotspot" data-id="${id}" style="left:${expandedLeft}%;top:${expandedTop}%;width:${expandedWidth}%;height:${expandedHeight}%" aria-label="播放：${item.text}"></button>` : ""; }).join("")}</div></div>`;
    const bookPage = stage.querySelector(".book-page"), image = bookPage.querySelector("img"), loader = bookPage.querySelector(".reader-loader");
    const loaded = () => { bookPage.classList.remove("is-loading"); loader.remove(); stage.removeAttribute("aria-busy"); warmPage(unit.pages[index - 1]); warmPage(unit.pages[index + 1]); };
    image.addEventListener("load", loaded, {once:true}); image.addEventListener("error", () => { loader.textContent="这一页暂时打不开，请稍后重试。"; stage.removeAttribute("aria-busy"); }, {once:true});
    if (image.complete && image.naturalWidth) loaded();
    if (scrollTab) revealTabGroup(tabs,tabs.querySelectorAll("button")[index],remember ? "smooth" : "auto");
    stage.querySelectorAll(".hotspot").forEach((node)=>node.addEventListener("click",()=>{ const item=allItems.find((entry)=>entry.id===node.dataset.id); if(item) play(item,node); }));
  }
  tabs.innerHTML=unit.pages.map((page,index)=>`<button type="button" class="${index===0?"active":""}">${tabLabel(page.label)}</button>`).join("");
  tabs.querySelectorAll("button").forEach((button,index)=>button.addEventListener("click",()=>{
    showPage(index);
  }));
  let savedImage; try { savedImage = localStorage.getItem(pageStorageKey); } catch (_) {}
  const restoredIndex = Math.max(0, unit.pages.findIndex((page) => page.image === savedImage));
  showPage(restoredIndex, {remember:false, scrollTab:true});
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
    requestAnimationFrame(()=>revealTabGroup(tabs,tabs.querySelector(`[data-unit="${unit.id}"]`)));
  }));
}
function render(unit) {
  unit.pages ||= unit1Pages;
  $("#unit-title").textContent=unit.englishTitle; $(".subtitle").textContent=unit.title; $("#word-count").textContent=`${unit.words.length} 个单词`;
  sentenceList.innerHTML=unit.sentences.map((item,index)=>`<button class="line-card" data-id="${item.id}"><span class="line-number">${String(index+1).padStart(2,"0")}</span><span class="line-text">${item.text}<span class="line-meaning">${item.meaning}</span></span><span class="line-play" aria-hidden="true">▶</span></button>`).join("");
  sentenceList.onclick=(event)=>{ const node=event.target.closest(".line-card"); if(!node)return; const item=unit.sentences.find((line)=>line.id===node.dataset.id); chooseSentence(item,node); play(item,node); };
  $("#play-all").onclick=()=>beginQueue(unit.sentences);
  renderTextbookReader(unit);
  renderVocabulary(unit);
  renderUnitDock();
  showLearningView(learningState.view,{scroll:false});
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
document.querySelectorAll("#toggle-slow,#toggle-slow-vocabulary").forEach((button)=>button.addEventListener("click",()=>{ state.slow=!state.slow; document.querySelectorAll("#toggle-slow,#toggle-slow-vocabulary").forEach((entry)=>entry.textContent=`🐢 慢速：${state.slow?"开":"关"}`); showToast(state.slow?"已切换到慢速朗读":"已切换到正常语速"); }));
$("#stop-audio").addEventListener("click",stopAudio);
$("#reader-mode").addEventListener("click",()=>showLearningView("reader"));
$("#vocabulary-mode").addEventListener("click",()=>showLearningView("vocabulary"));
document.querySelectorAll("[data-vocab-view]").forEach((button)=>button.addEventListener("click",()=>{ learningState.vocabView=button.dataset.vocabView; try { localStorage.setItem("little-ear:vocabulary-view",learningState.vocabView); } catch (_) {} document.querySelectorAll("[data-vocab-view]").forEach((entry)=>entry.classList.toggle("active",entry===button)); if(learningState.vocabView==="study") { vocabPractice.hidden=true; vocabStudy.hidden=false; renderStudyCard(); } else { vocabStudy.hidden=true; vocabPractice.hidden=false; returnUnansweredQuestion(); learningState.question=null; if(learningState.vocabView==="choice") renderChoicePractice(); else if(learningState.vocabView==="listen-choice") renderListeningChoicePractice(); else renderDictationPractice(); } }));
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
function formatBytes(bytes) { return `${(bytes/1024/1024).toFixed(bytes>=10*1024*1024?0:1)} MB`; }
function setupOfflineDownload() {
  const button=$("#download-offline"), assets=window.ENGLISH_OFFLINE_ASSETS||[], version=window.ENGLISH_OFFLINE_ASSET_VERSION, courseId=window.ENGLISH_OFFLINE_COURSE_ID||"current";
  if (!button || !assets.length || !("caches" in window)) { button?.setAttribute("hidden",""); return; }
  const ready=()=>{ try { return localStorage.getItem(`little-ear:offline-version:${courseId}`)===version; } catch (_) { return false; } };
  const label=()=>{ button.textContent=ready()?"✓ 已离线" : `⇩ 离线下载 ${formatBytes(window.ENGLISH_OFFLINE_ASSET_BYTES||0)}`; };
  label();
  button.addEventListener("click",async()=>{
    if(ready()) { showToast("本册资源已可离线使用。"); return; }
    button.disabled=true; const cache=await caches.open("little-ear-offline"); let finished=0, cursor=0;
    const update=()=>{ button.textContent=`下载中 ${Math.round(finished/assets.length*100)}%`; };
    const worker=async()=>{ while(cursor<assets.length) { const asset=assets[cursor++]; const response=await fetch(asset,{cache:"reload"}); if(!response.ok) throw new Error(asset); await cache.put(asset,response); finished+=1; if(finished%8===0||finished===assets.length) update(); } };
    try { update(); await Promise.all(Array.from({length:4},worker)); try { localStorage.setItem(`little-ear:offline-version:${courseId}`,version); } catch (_) {} button.disabled=false; label(); showToast("离线资源下载完成！"); }
    catch(error) { button.disabled=false; label(); showToast("下载中断，请检查网络后重试。"); }
  });
}
if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
setupAppInstall();
setupOfflineDownload();
setupRecording();
try { const remembered = localStorage.getItem("little-ear:last-unit"); const rememberedUnit = units.find((entry) => entry.id === remembered); if (rememberedUnit) unit = rememberedUnit; } catch (_) {}
if (unit) render(unit);
else showToast("课程内容加载失败，请刷新页面后重试。");
