/* ============ PROOF — app.js ============ */
(function(){
"use strict";

const STORE_KEY = "proof_data_v1";
const todayStr = () => fmtDate(new Date());
function fmtDate(d){ return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
function parseDate(s){ const [y,m,d]=s.split("-").map(Number); return new Date(y,m-1,d); }
function daysBetween(a,b){ return Math.round((parseDate(b)-parseDate(a))/86400000); }
function addDays(dateStr, n){ const d=parseDate(dateStr); d.setDate(d.getDate()+n); return fmtDate(d); }
function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,7); }
function monthKey(dateStr){ return dateStr.slice(0,7); }
function clamp(n,min,max){ return Math.max(min,Math.min(max,n)); }

const CATEGORIES = [
  {id:"school", label:"School", emoji:"🏫"},
  {id:"fitness", label:"Fitness", emoji:"💪"},
  {id:"growth", label:"Personal Growth", emoji:"🧠"},
  {id:"work", label:"Work/Career", emoji:"💼"},
  {id:"life", label:"Life/Admin", emoji:"🏠"},
  {id:"hobbies", label:"Hobbies/Projects", emoji:"🎮"},
  {id:"social", label:"Social", emoji:"👥"},
  {id:"selfcare", label:"Self-Care", emoji:"❤️"},
  {id:"goals", label:"Goals", emoji:"🎯"},
  {id:"other", label:"Other", emoji:"✨"},
];
const SIZES = [
  {id:"tiny", label:"Tiny", pts:2},
  {id:"small", label:"Small", pts:4},
  {id:"medium", label:"Medium", pts:8},
  {id:"big", label:"Big", pts:18},
];

const DEFAULT_QUICK = [
  {name:"Homework", pts:5, cat:"school", emoji:"🏫"},
  {name:"Went to gym", pts:7, cat:"fitness", emoji:"💪"},
  {name:"Went for a walk", pts:3, cat:"selfcare", emoji:"🚶"},
  {name:"Worked on project", pts:6, cat:"hobbies", emoji:"🎮"},
  {name:"Healthy meal", pts:3, cat:"selfcare", emoji:"🥗"},
  {name:"Showered", pts:2, cat:"selfcare", emoji:"🚿"},
];

const LOW_ENERGY_TASKS = [
  {name:"Drink water", pts:1, emoji:"💧"},
  {name:"Showered", pts:2, emoji:"🚿"},
  {name:"Ate something", pts:2, emoji:"🍽️"},
  {name:"Went outside for 5 min", pts:2, emoji:"🌤️"},
  {name:"Cleaned one thing", pts:2, emoji:"🧹"},
  {name:"5 min of homework", pts:2, emoji:"📚"},
  {name:"Texted someone", pts:1, emoji:"💬"},
  {name:"Stretched", pts:1, emoji:"🤸"},
  {name:"Short walk", pts:3, emoji:"🚶"},
  {name:"Made my bed", pts:1, emoji:"🛏️"},
];

const HOME_MESSAGES_SOME = [
  "You still moved forward today.",
  "That still counts. Every bit of it.",
  "You didn't have to do any of that. You did it anyway.",
  "Small progress is still progress.",
  "You showed up today, and that matters.",
];
const HOME_MESSAGES_ZERO = [
  "No achievements recorded. Today is still yours.",
  "Nothing logged yet — there's still time, or there's always tomorrow.",
  "A quiet day isn't a failed one.",
];
const HOME_MESSAGES_GOOD = [
  "You got more done today than you probably realize.",
  "Look at that — a genuinely solid day.",
  "That's a strong day. Let it count.",
];

function seedData(){
  const data = {
    achievements: [], // {id,name,pts,cat,note,date,ts,size}
    posHabits: [], // {id,name,createdAt,log:{date:true}}
    badHabits: [], // {id,name,createdAt,log:{date:'green'|'red'}}
    goals: [], // {id,name,progress,deadline,milestonesTotal,milestonesDone,notes,createdAt}
    moods: {}, // date: {mood:1-5, energy:1-5}
    wins: [], // {id,text,date}
    goodThings: [], // {id,text,date}
    quickAdd: JSON.parse(JSON.stringify(DEFAULT_QUICK)),
    minDay: {tasks:["Shower","Eat something","10 min of homework"], completions:{}}, // date: [bool,bool,bool]
    settings: {name:"", sampleSeeded:false},
  };
  return data;
}

function seedSampleData(data){
  const today = new Date();
  const sampleAch = [
    ["Went to class",5,"school","🏫"],["Worked on essay",7,"school","🏫"],
    ["Went to gym",7,"fitness","💪"],["Cleaned room",4,"life","🏠"],
    ["Studied 30 min",6,"school","🏫"],["Went for a walk",3,"selfcare","🚶"],
    ["Worked on personal project",6,"hobbies","🎮"],["Called someone",3,"social","👥"],
    ["Cooked a healthy meal",3,"selfcare","🥗"],["Finished assignment",12,"school","🏫"],
    ["Applied for something",8,"work","💼"],["Did something I was avoiding",10,"growth","🧠"],
  ];
  const sampleHabitIds = [];
  for(let i=27;i>=0;i--){
    const d = new Date(today); d.setDate(d.getDate()-i);
    const ds = fmtDate(d);
    const count = Math.random()<0.12 ? 0 : (1+Math.floor(Math.random()*4));
    for(let c=0;c<count;c++){
      const pick = sampleAch[Math.floor(Math.random()*sampleAch.length)];
      data.achievements.push({id:uid(), name:pick[0], pts:pick[1], cat:pick[2], emoji:pick[3], note:"", date:ds, ts:Date.now(), sample:true});
    }
    if(Math.random()<0.7) data.moods[ds] = {mood: 2+Math.floor(Math.random()*4), energy: 1+Math.floor(Math.random()*5)};
  }
  const gymId = uid(), sleepId = uid(), scrollId = uid();
  data.posHabits.push({id:gymId, name:"Gym", createdAt: fmtDate(new Date(today.getFullYear(),today.getMonth(),1)), sample:true, log:{}});
  data.posHabits.push({id:sleepId, name:"Sleep on time", createdAt: fmtDate(new Date(today.getFullYear(),today.getMonth(),1)), sample:true, log:{}});
  data.badHabits.push({id:scrollId, name:"Doomscrolling", createdAt: fmtDate(new Date(today.getFullYear(),today.getMonth(),1)), sample:true, log:{}});
  const ph = data.posHabits.find(h=>h.id===gymId), sh = data.posHabits.find(h=>h.id===sleepId), bh = data.badHabits.find(h=>h.id===scrollId);
  for(let i=20;i>=0;i--){
    const d=new Date(today); d.setDate(d.getDate()-i); const ds=fmtDate(d);
    if(Math.random()<0.5) ph.log[ds]=true;
    if(Math.random()<0.6) sh.log[ds]=true;
    bh.log[ds] = Math.random()<0.65 ? "green" : "red";
  }
  data.goals.push({id:uid(), name:"Build my game", progress:60, deadline:"", milestonesTotal:10, milestonesDone:6, notes:"", createdAt: fmtDate(today), sample:true});
  data.goals.push({id:uid(), name:"Transfer to SJSU", progress:35, deadline:"", milestonesTotal:8, milestonesDone:3, notes:"", createdAt: fmtDate(today), sample:true});
  data.wins.push({id:uid(), text:"Handled a stressful week without shutting down.", date: addDays(fmtDate(today),-4), sample:true});
  data.goodThings.push({id:uid(), text:"Had a really good conversation with a friend.", date: addDays(fmtDate(today),-1), sample:true});
  data.settings.sampleSeeded = true;
  return data;
}
function clearSampleData(){
  DATA.achievements = DATA.achievements.filter(a=>!a.sample);
  DATA.posHabits = DATA.posHabits.filter(h=>!h.sample);
  DATA.badHabits = DATA.badHabits.filter(h=>!h.sample);
  DATA.goals = DATA.goals.filter(g=>!g.sample);
  DATA.wins = DATA.wins.filter(w=>!w.sample);
  DATA.goodThings = DATA.goodThings.filter(g=>!g.sample);
  DATA.settings.sampleSeeded = false;
  save();
}

/* Safe storage wrapper: falls back to in-memory storage if localStorage
   is blocked (sandboxed preview, opaque origin, private mode, etc.) so the
   app never crashes on load — it just won\'t persist between sessions. */
const memoryStore = {};
let storageWorks = true;
const safeStorage = {
  getItem(k){
    try{ return localStorage.getItem(k); }
    catch(e){ storageWorks = false; return memoryStore.hasOwnProperty(k) ? memoryStore[k] : null; }
  },
  setItem(k,v){
    try{ localStorage.setItem(k,v); }
    catch(e){ storageWorks = false; memoryStore[k] = v; }
  },
  removeItem(k){
    try{ localStorage.removeItem(k); }
    catch(e){ storageWorks = false; delete memoryStore[k]; }
  }
};

function loadData(){
  try{
    const raw = safeStorage.getItem(STORE_KEY);
    if(raw){
      const parsed = JSON.parse(raw);
      // migrate/fill defaults for anything missing
      const base = seedData();
      return Object.assign(base, parsed);
    }
  }catch(e){ console.warn("load failed", e); }
  // Fresh install: start empty. Sample data is opt-in from Settings.
  return seedData();
}

let DATA = loadData();
function save(){
  try{ safeStorage.setItem(STORE_KEY, JSON.stringify(DATA)); }
  catch(e){ console.warn("save failed", e); }
}

/* ---------- derived helpers ---------- */
function achievementsOnDate(ds){ return DATA.achievements.filter(a=>a.date===ds); }
function pointsOnDate(ds){ return achievementsOnDate(ds).reduce((s,a)=>s+a.pts,0); }
function pointsBetween(startDs, endDs){
  return DATA.achievements.filter(a=>a.date>=startDs && a.date<=endDs).reduce((s,a)=>s+a.pts,0);
}
function totalPoints(){ return DATA.achievements.reduce((s,a)=>s+a.pts,0); }
function weekRange(offsetWeeks){
  // week = last 7 days ending today, offset in whole weeks back
  const end = addDays(todayStr(), -7*offsetWeeks);
  const start = addDays(end, -6);
  return [start,end];
}
function monthRangeForOffset(offsetMonths){
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth()-offsetMonths);
  const start = fmtDate(d);
  const endD = new Date(d.getFullYear(), d.getMonth()+1, 0);
  const end = fmtDate(endD);
  return [start,end];
}
function currentStreak(){
  let streak=0; let d=todayStr();
  if(pointsOnDate(d)===0) d = addDays(d,-1);
  while(pointsOnDate(d)>0){ streak++; d=addDays(d,-1); }
  return streak;
}
function catInfo(id){ return CATEGORIES.find(c=>c.id===id) || CATEGORIES[CATEGORIES.length-1]; }

/* ---------- toast ---------- */
let toastTimer;
function toast(msg){
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>t.classList.remove("show"), 2400);
}

/* ---------- nav ---------- */
const views = ["home","achievements","habits","progress","goals"];
function showView(name){
  views.forEach(v=>{
    document.getElementById("view-"+v).classList.toggle("active", v===name);
  });
  document.getElementById("view-lowenergy").style.display = "none";
  document.querySelectorAll(".nav-btn").forEach(b=>b.classList.toggle("active", b.dataset.view===name));
  document.querySelector(".bottom-nav").style.display = "flex";
  renderCurrentView(name);
}
document.querySelectorAll(".nav-btn").forEach(btn=>{
  btn.addEventListener("click", ()=>showView(btn.dataset.view));
});

function renderCurrentView(name){
  if(name==="home") renderHome();
  else if(name==="achievements") renderAchievements();
  else if(name==="habits") renderHabits();
  else if(name==="progress") renderProgress();
  else if(name==="goals") renderGoals();
}

/* ============ HOME ============ */
function renderHome(){
  const ds = todayStr();
  const todays = achievementsOnDate(ds).slice().sort((a,b)=>b.ts-a.ts);
  const pts = pointsOnDate(ds);
  const streak = currentStreak();

  let msg;
  if(pts===0) msg = pick(HOME_MESSAGES_ZERO);
  else if(pts>=15) msg = pick(HOME_MESSAGES_GOOD);
  else msg = pick(HOME_MESSAGES_SOME);

  const hero = document.getElementById("heroCard");
  hero.innerHTML = `
    <div class="hero-top">
      <div>
        <div class="hero-label">TODAY · ${new Date().toLocaleDateString(undefined,{weekday:'long', month:'short', day:'numeric'})}</div>
        <div class="hero-points">${pts}<span>points</span></div>
      </div>
      ${streak>0 ? `<div class="streak-pill">🔥 ${streak} day streak</div>` : ``}
    </div>
    <div class="hero-msg">${msg}</div>
    ${todays.length ? `<div class="hero-list">${todays.slice(0,6).map(a=>`
      <div class="hero-item"><span class="name">${a.emoji||catInfo(a.cat).emoji} ${escapeHtml(a.name)}</span><span class="right"><span class="pts">+${a.pts}</span><button class="li-del" data-delach="${a.id}">✕</button></span></div>
    `).join("")}</div>` : `<div class="hero-empty">Nothing logged yet today. That's okay — tap Quick Add below when you're ready.</div>`}
    <div class="stat-grid">
      <div class="stat-box"><div class="val">${weeklyPoints()}</div><div class="lbl">This week</div></div>
      <div class="stat-box"><div class="val">${monthlyPoints()}</div><div class="lbl">This month</div></div>
      <div class="stat-box"><div class="val">${totalPoints()}</div><div class="lbl">Lifetime</div></div>
    </div>
  `;

  hero.querySelectorAll("[data-delach]").forEach(b=>{
    b.addEventListener("click", ()=>{
      DATA.achievements = DATA.achievements.filter(a=>a.id!==b.dataset.delach);
      save(); renderHome();
    });
  });

  const qg = document.getElementById("quickGrid");
  qg.innerHTML = DATA.quickAdd.map((q,i)=>`
    <button class="quick-btn" data-qi="${i}"><span>${q.emoji||"✨"} ${escapeHtml(q.name)}</span><span class="qp">+${q.pts}</span></button>
  `).join("");
  qg.querySelectorAll(".quick-btn").forEach(b=>{
    b.addEventListener("click", ()=>{
      const q = DATA.quickAdd[+b.dataset.qi];
      logAchievement({name:q.name, pts:q.pts, cat:q.cat, emoji:q.emoji, note:"", date:todayStr()});
      toast(`+${q.pts} · ${q.name}`);
      renderHome();
    });
  });

  // good things today
  const gt = achievementsGoodThings(ds);
  const gtEl = document.getElementById("goodThingsToday");
  gtEl.innerHTML = gt.length ? gt.map(g=>`<div class="win-item"><div class="wtxt">${escapeHtml(g.text)}</div><button class="li-del" data-delgood="${g.id}">✕</button></div>`).join("")
    : `<p class="dim" style="font-size:13.5px;">Nothing recorded yet today.</p>`;
  gtEl.querySelectorAll("[data-delgood]").forEach(b=>{
    b.addEventListener("click", ()=>{
      DATA.goodThings = DATA.goodThings.filter(g=>g.id!==b.dataset.delgood);
      save(); renderHome();
    });
  });

  // mood
  const moodRow = document.getElementById("moodRow");
  const moods = ["😞","😕","😐","🙂","😄"];
  const current = DATA.moods[ds];
  moodRow.innerHTML = moods.map((m,i)=>`<div class="mood-opt ${current && current.mood===i+1 ? 'sel':''}" data-m="${i+1}">${m}</div>`).join("");
  moodRow.querySelectorAll(".mood-opt").forEach(el=>{
    el.addEventListener("click", ()=>{
      const m = +el.dataset.m;
      DATA.moods[ds] = Object.assign({energy:3}, DATA.moods[ds], {mood:m});
      save(); renderHome();
    });
  });
}
function achievementsGoodThings(ds){ return DATA.goodThings.filter(g=>g.date===ds); }
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function weeklyPoints(){ const [s,e]=weekRange(0); return pointsBetween(s,e); }
function monthlyPoints(){ const [s,e]=monthRangeForOffset(0); return pointsBetween(s,e); }
function escapeHtml(s){ return (s||"").replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }

function logAchievement(a){
  DATA.achievements.push(Object.assign({id:uid(), ts:Date.now(), note:""}, a));
  save();
}

document.getElementById("openAddAchievement").addEventListener("click", openAddAchievementModal);
document.getElementById("addGoodThing").addEventListener("click", ()=>{
  openTextModal("Good thing that happened", "e.g. Someone made me laugh", (val)=>{
    DATA.goodThings.push({id:uid(), text:val, date:todayStr()});
    save(); renderHome();
  });
});
document.getElementById("addWinBtn").addEventListener("click", ()=>{
  openTextModal("Record a win", "e.g. I'm proud that I finally...", (val)=>{
    DATA.wins.push({id:uid(), text:val, date:todayStr()});
    save(); renderProgress();
  });
});
document.getElementById("lookWhatBtn").addEventListener("click", openLookWhatYouDid);

/* ============ ACHIEVEMENTS VIEW ============ */
let activeCatFilter = "all";
function renderAchievements(){
  const chipEl = document.getElementById("catChips");
  const chips = [{id:"all", label:"All", emoji:"🗂️"}, ...CATEGORIES];
  chipEl.innerHTML = chips.map(c=>`<div class="chip ${activeCatFilter===c.id?'active':''}" data-c="${c.id}">${c.emoji||""} ${c.label}</div>`).join("");
  chipEl.querySelectorAll(".chip").forEach(el=>{
    el.addEventListener("click", ()=>{ activeCatFilter = el.dataset.c; renderAchievements(); });
  });

  const q = document.getElementById("achSearch").value.trim().toLowerCase();
  let list = DATA.achievements.slice().sort((a,b)=>b.ts-a.ts);
  if(activeCatFilter!=="all") list = list.filter(a=>a.cat===activeCatFilter);
  if(q) list = list.filter(a=>a.name.toLowerCase().includes(q) || (a.note||"").toLowerCase().includes(q));

  const timeline = document.getElementById("achTimeline");
  if(!list.length){
    timeline.innerHTML = `<div class="empty-state"><div class="ic">🗒️</div><div class="t">No achievements found.</div></div>`;
    return;
  }
  // group by date
  const groups = {};
  list.forEach(a=>{ (groups[a.date] = groups[a.date]||[]).push(a); });
  const dates = Object.keys(groups).sort((a,b)=>b.localeCompare(a));
  timeline.innerHTML = dates.map(ds=>{
    const items = groups[ds];
    const dayTotal = items.reduce((s,a)=>s+a.pts,0);
    return `
      <div style="margin-bottom:6px;">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 4px 4px;">
          <span style="font-size:12.5px;color:var(--text-faint);font-weight:700;">${formatNiceDate(ds)}</span>
          <span style="font-size:12.5px;color:var(--accent2);font-weight:700;">+${dayTotal}</span>
        </div>
        ${items.map(a=>`
          <div class="log-item">
            <div class="li-left">
              <div class="li-emoji">${a.emoji || catInfo(a.cat).emoji}</div>
              <div>
                <div class="li-name">${escapeHtml(a.name)}</div>
                ${a.note ? `<div class="li-sub">${escapeHtml(a.note)}</div>` : ``}
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
              <div class="li-pts">+${a.pts}</div>
              <button class="li-del" data-del="${a.id}">✕</button>
            </div>
          </div>
        `).join("")}
      </div>
    `;
  }).join("");
  timeline.querySelectorAll("[data-del]").forEach(b=>{
    b.addEventListener("click", ()=>{
      DATA.achievements = DATA.achievements.filter(a=>a.id!==b.dataset.del);
      save(); renderAchievements();
    });
  });
}
document.getElementById("achSearch").addEventListener("input", renderAchievements);
function formatNiceDate(ds){
  const d = parseDate(ds);
  const today = todayStr(), yest = addDays(today,-1);
  if(ds===today) return "Today";
  if(ds===yest) return "Yesterday";
  return d.toLocaleDateString(undefined,{month:'short', day:'numeric', year: d.getFullYear()!==new Date().getFullYear()?'numeric':undefined});
}

/* ============ ADD ACHIEVEMENT MODAL ============ */
function openAddAchievementModal(){
  const body = document.getElementById("modalBody");
  let selCat = "other", selSize = "small";
  body.innerHTML = `
    <div class="modal-title">Add Achievement <button class="modal-close" id="mClose">✕</button></div>
    <div class="field"><label>What did you do?</label><input type="text" id="mName" placeholder="e.g. Worked on essay"></div>
    <div class="field">
      <label>Size</label>
      <div class="size-row" id="mSizeRow">
        ${SIZES.map(s=>`<div class="size-opt ${s.id===selSize?'sel':''}" data-s="${s.id}">${s.label}<span class="pv">${s.pts} pts</span></div>`).join("")}
      </div>
    </div>
    <div class="field"><label>Points (adjust if needed)</label><input type="number" id="mPts" value="${SIZES.find(s=>s.id===selSize).pts}"></div>
    <div class="field">
      <label>Category</label>
      <div class="cat-row" id="mCatRow">
        ${CATEGORIES.map(c=>`<div class="cat-opt ${c.id===selCat?'sel':''}" data-c="${c.id}">${c.emoji} ${c.label}</div>`).join("")}
      </div>
    </div>
    <div class="field"><label>Note (optional)</label><textarea id="mNote" placeholder="Any context worth remembering..."></textarea></div>
    <button class="btn btn-primary btn-block" id="mSave">Save Achievement</button>
  `;
  openModal();
  body.querySelector("#mClose").addEventListener("click", closeModal);
  body.querySelectorAll("#mSizeRow .size-opt").forEach(el=>{
    el.addEventListener("click", ()=>{
      body.querySelectorAll("#mSizeRow .size-opt").forEach(x=>x.classList.remove("sel"));
      el.classList.add("sel");
      selSize = el.dataset.s;
      body.querySelector("#mPts").value = SIZES.find(s=>s.id===selSize).pts;
    });
  });
  body.querySelectorAll("#mCatRow .cat-opt").forEach(el=>{
    el.addEventListener("click", ()=>{
      body.querySelectorAll("#mCatRow .cat-opt").forEach(x=>x.classList.remove("sel"));
      el.classList.add("sel");
      selCat = el.dataset.c;
    });
  });
  body.querySelector("#mSave").addEventListener("click", ()=>{
    const name = body.querySelector("#mName").value.trim();
    if(!name){ toast("Give it a name first."); return; }
    const pts = clamp(parseInt(body.querySelector("#mPts").value)||1, 1, 100);
    const note = body.querySelector("#mNote").value.trim();
    logAchievement({name, pts, cat:selCat, emoji: catInfo(selCat).emoji, note, date:todayStr()});
    closeModal();
    toast(`+${pts} · ${name}`);
    renderHome(); renderAchievements();
  });
}

/* ============ HABITS VIEW ============ */
let habitsCalCursor = new Date(); // shared month being viewed for both habit grids
function renderHabits(){
  renderHabitsMonthHeader();
  renderPosHabits();
  renderBadHabits();
  renderMinDay();
}
function renderHabitsMonthHeader(){
  document.getElementById("habitsMonthLabel").textContent = habitsCalCursor.toLocaleDateString(undefined,{month:'long', year:'numeric'});
  const dow = ["S","M","T","W","T","F","S"];
  document.getElementById("habitsDowRow").innerHTML = dow.map(d=>`<div class="cal-dow">${d}</div>`).join("");
}
document.getElementById("habitsCalPrev").addEventListener("click", ()=>{ habitsCalCursor.setMonth(habitsCalCursor.getMonth()-1); renderHabits(); });
document.getElementById("habitsCalNext").addEventListener("click", ()=>{ habitsCalCursor.setMonth(habitsCalCursor.getMonth()+1); renderHabits(); });

/* Builds the padded, month-aligned list of date strings (or null for
   leading blanks) for the currently viewed habits month. */
function habitsMonthDates(){
  const y = habitsCalCursor.getFullYear(), m = habitsCalCursor.getMonth();
  const first = new Date(y,m,1);
  const startDow = first.getDay();
  const daysInMonth = new Date(y,m+1,0).getDate();
  const out = [];
  for(let i=0;i<startDow;i++) out.push(null);
  for(let day=1; day<=daysInMonth; day++) out.push(fmtDate(new Date(y,m,day)));
  return out;
}
function renderPosHabits(){
  const el = document.getElementById("posHabitsList");
  if(!DATA.posHabits.length){ el.innerHTML = `<div class="empty-state"><div class="ic">🔁</div><div class="t">No habits yet. Add one you want to build.</div></div>`; return; }
  const dates = habitsMonthDates();
  const today = todayStr();
  el.innerHTML = DATA.posHabits.map(h=>{
    h.log = h.log || {};
    let streak=0, d=today;
    if(!h.log[d]) d = addDays(d,-1);
    while(h.log[d]){ streak++; d=addDays(d,-1); }
    const thisMonthDone = dates.filter(ds=>ds && h.log[ds]).length;
    return `
      <div class="card habit-card">
        <div class="habit-top">
          <div>
            <div class="habit-name">${escapeHtml(h.name)}</div>
            <div class="habit-meta">${streak>0?`🔥 ${streak} day streak`:`No active streak`}</div>
          </div>
          <button class="li-del" data-delph="${h.id}">✕</button>
        </div>
        <div class="month-grid">
          ${dates.map(ds=>{
            if(!ds) return `<div class="habit-cell pad"></div>`;
            const day = parseDate(ds).getDate();
            const cls = ["habit-cell", ds===today?"today":"", ds>today?"future":""].join(" ").trim();
            return `<div class="${cls}" data-ph="${h.id}" data-date="${ds}" style="background:${h.log[ds]? 'var(--green)':'#1d2436'}; color:${h.log[ds]?'rgba(0,0,0,0.55)':'rgba(255,255,255,0.45)'}">${day}</div>`;
          }).join("")}
        </div>
        <div class="habit-stats"><span><b>${thisMonthDone}</b> this month</span></div>
      </div>
    `;
  }).join("");
  el.querySelectorAll("[data-ph]").forEach(cell=>{
    cell.addEventListener("click", ()=>{
      const ds = cell.dataset.date;
      if(ds > todayStr()) return;
      const h = DATA.posHabits.find(x=>x.id===cell.dataset.ph);
      h.log[ds] = !h.log[ds];
      save(); renderPosHabits();
    });
  });
  el.querySelectorAll("[data-delph]").forEach(b=>{
    b.addEventListener("click", ()=>{
      DATA.posHabits = DATA.posHabits.filter(h=>h.id!==b.dataset.delph);
      save(); renderPosHabits();
    });
  });
}
function renderBadHabits(){
  const el = document.getElementById("badHabitsList");
  if(!DATA.badHabits.length){ el.innerHTML = `<div class="empty-state"><div class="ic">🚫</div><div class="t">Nothing here yet. Add a habit you're trying to reduce.</div></div>`; return; }
  const dates = habitsMonthDates();
  const today = todayStr();
  el.innerHTML = DATA.badHabits.map(h=>{
    h.log = h.log || {};
    let streak=0, d=today;
    if(h.log[d]!=='green') d = addDays(d,-1);
    while(h.log[d]==='green'){ streak++; d=addDays(d,-1); }
    let best=0, cur=0;
    Object.keys(h.log).sort().forEach(k=>{ if(h.log[k]==='green'){cur++; best=Math.max(best,cur);} else if(h.log[k]==='red'){cur=0;} });
    const monthDates = dates.filter(Boolean);
    const green = monthDates.filter(ds=>h.log[ds]==='green').length;
    const red = monthDates.filter(ds=>h.log[ds]==='red').length;
    const msg = h.log[today]==='red' ? "Today happened. Tomorrow is a new day."
      : (streak>0 ? `${streak} days avoided — nice consistency.` : "Tap a day to mark it green (avoided) or red.");
    return `
      <div class="card habit-card">
        <div class="habit-top">
          <div>
            <div class="habit-name">${escapeHtml(h.name)}</div>
            <div class="habit-meta">${streak>0?`🔥 ${streak} day streak avoiding this`:`No active streak`}</div>
          </div>
          <button class="li-del" data-delbh="${h.id}">✕</button>
        </div>
        <div class="month-grid">
          ${dates.map(ds=>{
            if(!ds) return `<div class="habit-cell pad"></div>`;
            const day = parseDate(ds).getDate();
            const v = h.log[ds];
            const bg = v==='green' ? 'var(--green)' : v==='red' ? 'var(--red)' : '#1d2436';
            const fg = v ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.45)';
            const cls = ["habit-cell", ds===today?"today":"", ds>today?"future":""].join(" ").trim();
            return `<div class="${cls}" data-bh="${h.id}" data-date="${ds}" style="background:${bg}; color:${fg}">${day}</div>`;
          }).join("")}
        </div>
        <div class="habit-stats">
          <span>Best streak <b>${best}</b></span>
          <span>This month <b>${green} green / ${red} red</b></span>
        </div>
        <div class="habit-msg">${msg}</div>
      </div>
    `;
  }).join("");
  el.querySelectorAll("[data-bh]").forEach(cell=>{
    cell.addEventListener("click", ()=>{
      const ds = cell.dataset.date;
      if(ds > todayStr()) return;
      const h = DATA.badHabits.find(x=>x.id===cell.dataset.bh);
      const cur = h.log[ds];
      h.log[ds] = cur==='green' ? 'red' : cur==='red' ? undefined : 'green';
      if(h.log[ds]===undefined) delete h.log[ds];
      save(); renderBadHabits();
    });
  });
  el.querySelectorAll("[data-delbh]").forEach(b=>{
    b.addEventListener("click", ()=>{
      DATA.badHabits = DATA.badHabits.filter(h=>h.id!==b.dataset.delbh);
      save(); renderBadHabits();
    });
  });
}
function renderMinDay(){
  const el = document.getElementById("minDayList");
  const ds = todayStr();
  DATA.minDay.completions[ds] = DATA.minDay.completions[ds] || DATA.minDay.tasks.map(()=>false);
  const comps = DATA.minDay.completions[ds];
  el.innerHTML = DATA.minDay.tasks.map((t,i)=>`
    <div class="log-item">
      <div class="li-left"><input type="checkbox" data-mdi="${i}" ${comps[i]?'checked':''} style="width:18px;height:18px;"> <span class="li-name">${escapeHtml(t)}</span></div>
    </div>
  `).join("") + (comps.every(Boolean) ? `<div class="habit-msg" style="margin-top:8px;">✅ Minimum day completed.</div>` : ``);
  el.querySelectorAll("[data-mdi]").forEach(cb=>{
    cb.addEventListener("change", ()=>{
      comps[+cb.dataset.mdi] = cb.checked;
      save(); renderMinDay();
    });
  });
}
document.getElementById("addPosHabit").addEventListener("click", ()=>{
  openTextModal("New habit to build", "e.g. Gym, Reading, Sleep on time", (val)=>{
    DATA.posHabits.push({id:uid(), name:val, createdAt:todayStr(), log:{}});
    save(); renderPosHabits();
  });
});
document.getElementById("addBadHabit").addEventListener("click", ()=>{
  openTextModal("New habit to reduce", "e.g. Doomscrolling, Procrastinating", (val)=>{
    DATA.badHabits.push({id:uid(), name:val, createdAt:todayStr(), log:{}});
    save(); renderBadHabits();
  });
});
document.getElementById("editMinDay").addEventListener("click", ()=>{
  const body = document.getElementById("modalBody");
  body.innerHTML = `
    <div class="modal-title">Minimum day tasks <button class="modal-close" id="mClose">✕</button></div>
    <p class="dim" style="font-size:13px;margin-bottom:14px;">1–3 tiny things that count as a successful minimum day.</p>
    <div class="field"><label>Task 1</label><input type="text" id="md0" value="${escapeHtml(DATA.minDay.tasks[0]||"")}"></div>
    <div class="field"><label>Task 2</label><input type="text" id="md1" value="${escapeHtml(DATA.minDay.tasks[1]||"")}"></div>
    <div class="field"><label>Task 3</label><input type="text" id="md2" value="${escapeHtml(DATA.minDay.tasks[2]||"")}"></div>
    <button class="btn btn-primary btn-block" id="mdSave">Save</button>
  `;
  openModal();
  body.querySelector("#mClose").addEventListener("click", closeModal);
  body.querySelector("#mdSave").addEventListener("click", ()=>{
    const tasks = [0,1,2].map(i=>body.querySelector("#md"+i).value.trim()).filter(Boolean);
    DATA.minDay.tasks = tasks.length ? tasks : DATA.minDay.tasks;
    save(); closeModal(); renderMinDay();
  });
});

/* ============ PROGRESS VIEW ============ */
let calCursor = new Date(); // first of month being viewed
function renderProgress(){
  renderCalendar();
  renderTrendBars();
  renderPastMe();
  renderRankings();
  renderRecords();
  renderLevel();
  renderWins();
}
function renderCalendar(){
  const y = calCursor.getFullYear(), m = calCursor.getMonth();
  document.getElementById("calMonthLabel").textContent = calCursor.toLocaleDateString(undefined,{month:'long', year:'numeric'});
  const first = new Date(y,m,1);
  const startDow = first.getDay();
  const daysInMonth = new Date(y,m+1,0).getDate();
  const grid = document.getElementById("calGrid");
  const dow = ["S","M","T","W","T","F","S"].map(d=>`<div class="cal-dow">${d}</div>`).join("");
  let cells = "";
  for(let i=0;i<startDow;i++) cells += `<div class="cal-cell pad"></div>`;
  const maxPts = Math.max(1, ...DATA.achievements.filter(a=>a.date.startsWith(monthKey(fmtDate(first)))).map(()=>0), 20);
  for(let day=1; day<=daysInMonth; day++){
    const ds = fmtDate(new Date(y,m,day));
    const pts = pointsOnDate(ds);
    const isToday = ds===todayStr();
    const bg = colorForPoints(pts);
    cells += `<div class="cal-cell ${isToday?'today':''}" data-date="${ds}" style="background:${bg}">
      <div class="d">${day}</div>
      ${pts>0?`<div class="p">${pts}</div>`:``}
    </div>`;
  }
  grid.innerHTML = dow + cells;
  grid.querySelectorAll(".cal-cell[data-date]").forEach(c=>{
    c.addEventListener("click", ()=>openDayDetail(c.dataset.date));
  });
}
function colorForPoints(pts){
  if(pts<=0) return "#1a2338";
  if(pts<5) return "#233a4a";
  if(pts<12) return "#1f5f6b";
  if(pts<22) return "#1c8a83";
  return "#20a394";
}
document.getElementById("calPrev").addEventListener("click", ()=>{ calCursor.setMonth(calCursor.getMonth()-1); renderCalendar(); });
document.getElementById("calNext").addEventListener("click", ()=>{ calCursor.setMonth(calCursor.getMonth()+1); renderCalendar(); });

function openDayDetail(ds){
  const items = achievementsOnDate(ds);
  const body = document.getElementById("modalBody");
  body.innerHTML = `
    <div class="modal-title">${formatNiceDate(ds)} <button class="modal-close" id="mClose">✕</button></div>
    ${items.length ? `
      <div style="margin-bottom:10px; font-weight:700; color:var(--accent2);">${items.reduce((s,a)=>s+a.pts,0)} points</div>
      ${items.map(a=>`
        <div class="log-item">
          <div class="li-left">
            <div class="li-emoji">${a.emoji||catInfo(a.cat).emoji}</div>
            <div><div class="li-name">${escapeHtml(a.name)}</div>${a.note?`<div class="li-sub">${escapeHtml(a.note)}</div>`:``}</div>
          </div>
          <div class="li-pts">+${a.pts}</div>
        </div>
      `).join("")}
    ` : `<p class="dim">No achievements recorded.</p>`}
  `;
  openModal();
  body.querySelector("#mClose").addEventListener("click", closeModal);
}

function renderTrendBars(){
  const weekEl = document.getElementById("weekBars");
  const dates = []; for(let i=6;i>=0;i--) dates.push(addDays(todayStr(),-i));
  const pts = dates.map(pointsOnDate);
  const max = Math.max(1,...pts);
  weekEl.innerHTML = dates.map((ds,i)=>`
    <div class="bar-col">
      <div class="bar-fill" style="height:${Math.max(4,(pts[i]/max)*100)}%"></div>
      <div class="bar-lbl">${parseDate(ds).toLocaleDateString(undefined,{weekday:'narrow'})}</div>
    </div>
  `).join("");

  const monthEl = document.getElementById("monthBars");
  const months = []; for(let i=5;i>=0;i--) months.push(monthRangeForOffset(i));
  const mpts = months.map(([s,e])=>pointsBetween(s,e));
  const mmax = Math.max(1,...mpts);
  monthEl.innerHTML = months.map(([s],i)=>`
    <div class="bar-col">
      <div class="bar-fill" style="height:${Math.max(4,(mpts[i]/mmax)*100)}%"></div>
      <div class="bar-lbl">${parseDate(s).toLocaleDateString(undefined,{month:'narrow'})}</div>
    </div>
  `).join("");
}

function renderPastMe(){
  const [tw,tw2]=weekRange(0), [lw,lw2]=weekRange(1);
  const wThis=pointsBetween(tw,tw2), wLast=pointsBetween(lw,lw2);
  const [tm,tm2]=monthRangeForOffset(0), [lm,lm2]=monthRangeForOffset(1);
  const mThis=pointsBetween(tm,tm2), mLast=pointsBetween(lm,lm2);
  const wDiff = wLast? Math.round(((wThis-wLast)/Math.max(1,wLast))*100) : (wThis>0?100:0);
  const mDiff = mLast? Math.round(((mThis-mLast)/Math.max(1,mLast))*100) : (mThis>0?100:0);
  const achThis = DATA.achievements.filter(a=>a.date>=tm && a.date<=tm2).length;
  const achLast = DATA.achievements.filter(a=>a.date>=lm && a.date<=lm2).length;
  const achDiff = achLast? Math.round(((achThis-achLast)/Math.max(1,achLast))*100) : (achThis>0?100:0);
  const better = mThis >= mLast;
  document.getElementById("pastMeCard").innerHTML = `
    <p style="font-size:14.5px; line-height:1.6;">
      ${better? "You're doing about as much or more than you were last month." : "This month is a bit quieter than last month so far — that's just information, not a verdict."}<br><br>
      <b style="color:var(--accent2)">${mDiff>=0?'+':''}${mDiff}%</b> total points vs last month<br>
      <b style="color:var(--accent2)">${achDiff>=0?'+':''}${achDiff}%</b> achievements vs last month<br>
      <b style="color:var(--accent2)">${wDiff>=0?'+':''}${wDiff}%</b> points vs last week
    </p>
    <p class="dim" style="font-size:13px; margin-top:10px; font-style:italic;">You don't have to feel productive for the progress to be real.</p>
  `;
}

function renderRankings(){
  const [tw,tw2]=weekRange(0), [lw,lw2]=weekRange(1);
  const wThis=pointsBetween(tw,tw2), wLast=pointsBetween(lw,lw2);
  document.getElementById("weekCompare").innerHTML = compareBarsHtml("This week", wThis, "Last week", wLast);

  const [tm,tm2]=monthRangeForOffset(0), [lm,lm2]=monthRangeForOffset(1);
  const mThis=pointsBetween(tm,tm2), mLast=pointsBetween(lm,lm2);
  document.getElementById("monthCompare").innerHTML = compareBarsHtml(calCursorLabel(0), mThis, calCursorLabel(1), mLast);

  // week leaderboard - last 8 weeks
  const weeks = [];
  for(let i=0;i<8;i++){ const [s,e]=weekRange(i); weeks.push({label: fmtRangeLabel(s,e), pts: pointsBetween(s,e), i}); }
  const rankedW = weeks.slice().sort((a,b)=>b.pts-a.pts);
  document.getElementById("weekLeaderboard").innerHTML = weeks.map(w=>{
    const rank = rankedW.findIndex(x=>x.i===w.i);
    const medal = rank===0?"🥇":rank===1?"🥈":rank===2?"🥉":(rank+1);
    return `<div class="rank-row"><span class="rank-medal">${medal}</span><span style="flex:1;margin-left:6px;">${w.label}${w.i===0?' <span class="dim">(current)</span>':''}</span><span class="rank-pts">${w.pts}</span></div>`;
  }).join("");

  // month leaderboard - last 6 months
  const monthsArr = [];
  for(let i=0;i<6;i++){ const [s,e]=monthRangeForOffset(i); monthsArr.push({label: parseDate(s).toLocaleDateString(undefined,{month:'short',year:'numeric'}), pts: pointsBetween(s,e), i}); }
  const rankedM = monthsArr.slice().sort((a,b)=>b.pts-a.pts);
  document.getElementById("monthLeaderboard").innerHTML = monthsArr.map(w=>{
    const rank = rankedM.findIndex(x=>x.i===w.i);
    const medal = rank===0?"🥇":rank===1?"🥈":rank===2?"🥉":(rank+1);
    return `<div class="rank-row"><span class="rank-medal">${medal}</span><span style="flex:1;margin-left:6px;">${w.label}${w.i===0?' <span class="dim">(current)</span>':''}</span><span class="rank-pts">${w.pts}</span></div>`;
  }).join("");
}
function calCursorLabel(offset){ const [s]=monthRangeForOffset(offset); return parseDate(s).toLocaleDateString(undefined,{month:'short'}); }
function fmtRangeLabel(s,e){ return parseDate(s).toLocaleDateString(undefined,{month:'short',day:'numeric'})+"–"+parseDate(e).toLocaleDateString(undefined,{month:'short',day:'numeric'}); }
function compareBarsHtml(labelA, ptsA, labelB, ptsB){
  const max = Math.max(1, ptsA, ptsB);
  const diff = ptsA-ptsB;
  const note = diff>0 ? `🏆 You're beating ${labelB.toLowerCase()}'s version of yourself by ${diff}.`
    : diff<0 ? `You're ${Math.abs(diff)} behind ${labelB.toLowerCase()}. There's still time to catch up.`
    : `Dead even so far.`;
  return `
    <div class="compare-row">
      <div class="compare-lbl"><span>${labelA}</span><span><b style="color:var(--text)">${ptsA}</b></span></div>
      <div class="compare-track"><div class="compare-fill" style="width:${(ptsA/max)*100}%; background:linear-gradient(90deg,var(--accent),var(--accent2));"></div></div>
    </div>
    <div class="compare-row">
      <div class="compare-lbl"><span>${labelB}</span><span>${ptsB}</span></div>
      <div class="compare-track"><div class="compare-fill" style="width:${(ptsB/max)*100}%; background:#3a4260;"></div></div>
    </div>
    <p style="font-size:13px; color:var(--text-dim); margin-top:4px;">${note}</p>
  `;
}

function renderRecords(){
  const byDate = {};
  DATA.achievements.forEach(a=>{ byDate[a.date]=(byDate[a.date]||0)+a.pts; });
  let bestDay = {ds:null, pts:0};
  Object.entries(byDate).forEach(([ds,p])=>{ if(p>bestDay.pts) bestDay={ds,pts:p}; });

  let bestWeek = {label:null, pts:0};
  for(let i=0;i<52;i++){ const [s,e]=weekRange(i); const p=pointsBetween(s,e); if(p>bestWeek.pts) bestWeek={label:fmtRangeLabel(s,e), pts:p}; if(s < "2000-01-01") break; }

  let bestMonth = {label:null, pts:0};
  for(let i=0;i<24;i++){ const [s,e]=monthRangeForOffset(i); const p=pointsBetween(s,e); if(p>bestMonth.pts) bestMonth={label:parseDate(s).toLocaleDateString(undefined,{month:'long',year:'numeric'}), pts:p}; }

  let bestHabitStreak = 0;
  DATA.posHabits.forEach(h=>{
    let cur=0, best=0;
    Object.keys(h.log||{}).sort().forEach(k=>{ if(h.log[k]){cur++; best=Math.max(best,cur);} else cur=0; });
    bestHabitStreak = Math.max(bestHabitStreak, best);
  });
  DATA.badHabits.forEach(h=>{
    let cur=0, best=0;
    Object.keys(h.log||{}).sort().forEach(k=>{ if(h.log[k]==='green'){cur++; best=Math.max(best,cur);} else if(h.log[k]==='red') cur=0; });
    bestHabitStreak = Math.max(bestHabitStreak, best);
  });

  const goalsCompleted = DATA.goals.filter(g=>g.progress>=100).length;

  document.getElementById("recordsCard").innerHTML = `
    <div class="rank-row"><span>🏆 Best day</span><span class="rank-pts">${bestDay.ds? bestDay.pts+" — "+formatNiceDate(bestDay.ds) : "—"}</span></div>
    <div class="rank-row"><span>🏆 Best week</span><span class="rank-pts">${bestWeek.label? bestWeek.pts+" — "+bestWeek.label : "—"}</span></div>
    <div class="rank-row"><span>🏆 Best month</span><span class="rank-pts">${bestMonth.label? bestMonth.pts+" — "+bestMonth.label : "—"}</span></div>
    <div class="rank-row"><span>🏆 Longest habit streak</span><span class="rank-pts">${bestHabitStreak} days</span></div>
    <div class="rank-row"><span>🏆 Goals completed</span><span class="rank-pts">${goalsCompleted}</span></div>
    <div class="rank-row"><span>🏆 Total achievements logged</span><span class="rank-pts">${DATA.achievements.length}</span></div>
  `;
}

const LEVELS = [
  {name:"Getting Started", min:0}, {name:"Showing Up", min:100}, {name:"Building Momentum", min:250},
  {name:"Consistent", min:500}, {name:"Locked In", min:1000}, {name:"Unstoppable", min:2500},
];
function renderLevel(){
  const total = totalPoints();
  let idx=0;
  LEVELS.forEach((l,i)=>{ if(total>=l.min) idx=i; });
  const cur = LEVELS[idx], next = LEVELS[idx+1];
  const pct = next ? clamp(((total-cur.min)/(next.min-cur.min))*100,0,100) : 100;
  document.getElementById("levelCard").innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:baseline;">
      <div><div style="font-size:16px;font-weight:800;">${cur.name}</div><div class="dim" style="font-size:12.5px;">${total} lifetime points</div></div>
      ${next?`<div class="dim" style="font-size:12px;">${next.min-total} to ${next.name}</div>`:`<div class="dim" style="font-size:12px;">Max level</div>`}
    </div>
    <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
    <p class="dim" style="font-size:12px;margin-top:8px;">This reflects activity logged, not your worth.</p>
  `;
}

function renderWins(){
  const el = document.getElementById("winsList");
  const sorted = DATA.wins.slice().sort((a,b)=>b.date.localeCompare(a.date));
  el.innerHTML = sorted.length ? sorted.map(w=>`
    <div class="win-item"><div><div class="wtxt">${escapeHtml(w.text)}</div><div class="wdate">${formatNiceDate(w.date)}</div></div><button class="li-del" data-delwin="${w.id}">✕</button></div>
  `).join("") : `<p class="dim" style="font-size:13.5px;">No wins recorded yet.</p>`;
  el.querySelectorAll("[data-delwin]").forEach(b=>{
    b.addEventListener("click", ()=>{
      DATA.wins = DATA.wins.filter(w=>w.id!==b.dataset.delwin);
      save(); renderWins();
    });
  });
}

/* ============ GOALS VIEW ============ */
function renderGoals(){
  const el = document.getElementById("goalsList");
  if(!DATA.goals.length){ el.innerHTML = `<div class="empty-state"><div class="ic">🎯</div><div class="t">No goals yet. Add something you're working toward.</div></div>`; return; }
  el.innerHTML = DATA.goals.map(g=>`
    <div class="card goal-card">
      <div class="goal-top">
        <div class="goal-name">${escapeHtml(g.name)}</div>
        <div class="goal-pct">${g.progress}%</div>
      </div>
      <div class="progress-track"><div class="progress-fill" style="width:${g.progress}%"></div></div>
      <div class="goal-meta">
        ${g.milestonesTotal ? `${g.milestonesDone}/${g.milestonesTotal} milestones` : ""}
        ${g.deadline ? ` · Target: ${g.deadline}` : ""}
      </div>
      ${g.notes ? `<div class="goal-meta" style="margin-top:6px;">${escapeHtml(g.notes)}</div>` : ""}
      <div style="display:flex; gap:8px; margin-top:12px;">
        <button class="btn btn-ghost" data-editgoal="${g.id}" style="flex:1;">Edit</button>
        <button class="btn btn-ghost" data-delgoal="${g.id}" style="flex:0.5;">Delete</button>
      </div>
    </div>
  `).join("");
  el.querySelectorAll("[data-editgoal]").forEach(b=>b.addEventListener("click", ()=>openGoalModal(b.dataset.editgoal)));
  el.querySelectorAll("[data-delgoal]").forEach(b=>b.addEventListener("click", ()=>{
    DATA.goals = DATA.goals.filter(g=>g.id!==b.dataset.delgoal);
    save(); renderGoals();
  }));
}
document.getElementById("addGoalBtn").addEventListener("click", ()=>openGoalModal(null));
function openGoalModal(goalId){
  const g = goalId ? DATA.goals.find(x=>x.id===goalId) : null;
  const body = document.getElementById("modalBody");
  body.innerHTML = `
    <div class="modal-title">${g?"Edit Goal":"New Goal"} <button class="modal-close" id="mClose">✕</button></div>
    <div class="field"><label>Goal name</label><input type="text" id="gName" value="${g?escapeHtml(g.name):''}" placeholder="e.g. Finish my game"></div>
    <div class="two-col">
      <div class="field"><label>Progress %</label><input type="number" id="gProgress" min="0" max="100" value="${g?g.progress:0}"></div>
      <div class="field"><label>Deadline</label><input type="date" id="gDeadline" value="${g?g.deadline:''}"></div>
    </div>
    <div class="two-col">
      <div class="field"><label>Milestones done</label><input type="number" id="gMDone" value="${g?g.milestonesDone:0}"></div>
      <div class="field"><label>Milestones total</label><input type="number" id="gMTotal" value="${g?g.milestonesTotal:0}"></div>
    </div>
    <div class="field"><label>Notes</label><textarea id="gNotes">${g?escapeHtml(g.notes||''):''}</textarea></div>
    <button class="btn btn-primary btn-block" id="gSave">${g?"Save Changes":"Create Goal"}</button>
  `;
  openModal();
  body.querySelector("#mClose").addEventListener("click", closeModal);
  body.querySelector("#gSave").addEventListener("click", ()=>{
    const name = body.querySelector("#gName").value.trim();
    if(!name){ toast("Name your goal first."); return; }
    const obj = {
      id: g?g.id:uid(),
      name,
      progress: clamp(parseInt(body.querySelector("#gProgress").value)||0,0,100),
      deadline: body.querySelector("#gDeadline").value,
      milestonesDone: parseInt(body.querySelector("#gMDone").value)||0,
      milestonesTotal: parseInt(body.querySelector("#gMTotal").value)||0,
      notes: body.querySelector("#gNotes").value.trim(),
      createdAt: g?g.createdAt:todayStr(),
    };
    if(g){ Object.assign(g, obj); } else { DATA.goals.push(obj); }
    save(); closeModal(); renderGoals();
  });
}

/* ============ LOOK WHAT YOU DID ============ */
function openLookWhatYouDid(){
  const [s30] = [addDays(todayStr(),-29)];
  const recent = DATA.achievements.filter(a=>a.date>=s30);
  const pts = recent.reduce((s,a)=>s+a.pts,0);
  const counts = {};
  recent.forEach(a=>{ counts[a.name]=(counts[a.name]||0)+1; });
  const topLines = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,6)
    .map(([name,c])=>`<div class="li-name" style="padding:6px 0;">• ${c}× ${escapeHtml(name)}</div>`).join("");
  const gymDays = new Set(DATA.posHabits.flatMap(h=>Object.keys(h.log||{}).filter(k=>h.log[k] && k>=s30))).size;
  const body = document.getElementById("modalBody");
  body.innerHTML = `
    <div class="modal-title">Remind me what I've done <button class="modal-close" id="mClose">✕</button></div>
    <p style="font-size:14.5px; line-height:1.6; margin-bottom:6px;">You may not feel productive right now. But here's the last 30 days:</p>
    <div style="margin:10px 0;">
      ${topLines || '<p class="dim">Not much logged in the last 30 days yet — that\'s fine, start today.</p>'}
    </div>
    <div class="stat-grid">
      <div class="stat-box"><div class="val">${recent.length}</div><div class="lbl">Logged</div></div>
      <div class="stat-box"><div class="val">${pts}</div><div class="lbl">Points</div></div>
      <div class="stat-box"><div class="val">${gymDays}</div><div class="lbl">Habit days</div></div>
    </div>
    <p class="dim" style="font-size:13px; margin-top:14px; font-style:italic;">The data says you've been moving.</p>
  `;
  openModal();
  body.querySelector("#mClose").addEventListener("click", closeModal);
}

/* ============ LOW ENERGY MODE ============ */
function renderLowEnergy(){
  const grid = document.getElementById("leGrid");
  const ds = todayStr();
  const doneToday = new Set(achievementsOnDate(ds).map(a=>a.name));
  grid.innerHTML = LOW_ENERGY_TASKS.map(t=>`
    <button class="le-btn" data-le='${encodeURIComponent(JSON.stringify(t))}'>
      <span class="ic">${t.emoji}</span><span>${t.name}</span>
      ${doneToday.has(t.name)?'<span style="margin-left:auto;color:var(--green);">✓</span>':''}
    </button>
  `).join("");
  grid.querySelectorAll("[data-le]").forEach(b=>{
    b.addEventListener("click", ()=>{
      const t = JSON.parse(decodeURIComponent(b.dataset.le));
      logAchievement({name:t.name, pts:t.pts, cat:"selfcare", emoji:t.emoji, note:"", date:ds});
      toast("That's enough to count.");
      renderLowEnergy();
    });
  });
}
document.getElementById("lowEnergyBtn").addEventListener("click", ()=>{
  views.forEach(v=>document.getElementById("view-"+v).classList.remove("active"));
  document.getElementById("view-lowenergy").style.display = "block";
  document.querySelector(".bottom-nav").style.display = "none";
  renderLowEnergy();
});
document.getElementById("exitLowEnergy").addEventListener("click", ()=>{
  document.getElementById("view-lowenergy").style.display = "none";
  document.querySelector(".bottom-nav").style.display = "flex";
  showView("home");
});

/* ============ SETTINGS ============ */
document.getElementById("settingsBtn").addEventListener("click", openSettings);
function openSettings(){
  const body = document.getElementById("modalBody");
  body.innerHTML = `
    <div class="modal-title">Settings <button class="modal-close" id="mClose">✕</button></div>
    <div class="settings-row">
      <div><div class="sname">Export data</div><div class="sdesc">Download everything as JSON</div></div>
      <button class="btn btn-ghost" id="exportBtn" style="flex:none;">Export</button>
    </div>
    <div class="settings-row">
      <div><div class="sname">Import data</div><div class="sdesc">Restore from a JSON backup</div></div>
      <label class="btn btn-ghost" style="flex:none; cursor:pointer;">Import<input type="file" id="importFile" accept="application/json" style="display:none;"></label>
    </div>
    <div class="settings-row">
      <div><div class="sname">Edit quick-add buttons</div><div class="sdesc">Customize your home screen shortcuts</div></div>
      <button class="btn btn-ghost" id="editQuickBtn" style="flex:none;">Edit</button>
    </div>
    <div class="settings-row">
      <div><div class="sname">${DATA.settings.sampleSeeded ? "Clear sample data" : "Load example data"}</div><div class="sdesc">${DATA.settings.sampleSeeded ? "Remove the demo entries, keep your real ones" : "See how the app looks with demo entries"}</div></div>
      <button class="btn btn-ghost" id="sampleToggleBtn" style="flex:none;">${DATA.settings.sampleSeeded ? "Clear" : "Load"}</button>
    </div>
    <div class="settings-row">
      <div><div class="sname">Reset everything</div><div class="sdesc">Delete all data permanently</div></div>
      <button class="btn btn-ghost" id="resetAllBtn" style="flex:none; color:var(--red);">Reset</button>
    </div>
    <div class="section-title">Help</div>
    <div class="card">
      <p style="font-size:13.5px; line-height:1.6;">This app is a personal motivation and reflection tool. It does not diagnose or treat mental illness and isn't a replacement for professional care.</p>
      <p style="font-size:13.5px; line-height:1.6; margin-top:10px;">If you're in serious distress, please reach out to a trusted person, or in the US call/text <b>988</b> (Suicide & Crisis Lifeline). If it's an emergency, call your local emergency number.</p>
    </div>
  `;
  openModal();
  body.querySelector("#mClose").addEventListener("click", closeModal);
  body.querySelector("#exportBtn").addEventListener("click", exportData);
  body.querySelector("#importFile").addEventListener("change", importData);
  body.querySelector("#editQuickBtn").addEventListener("click", openEditQuick);
  body.querySelector("#sampleToggleBtn").addEventListener("click", ()=>{
    if(DATA.settings.sampleSeeded){
      clearSampleData();
      closeModal();
      showView("home");
      toast("Sample data cleared. Your real entries are untouched.");
    } else {
      seedSampleData(DATA);
      save();
      closeModal();
      showView("home");
      toast("Example data loaded — clear it anytime from Settings.");
    }
  });
  body.querySelector("#resetAllBtn").addEventListener("click", ()=>{
    if(confirm("This deletes everything permanently. Are you sure?")){
      safeStorage.removeItem(STORE_KEY);
      DATA = seedData();
      save();
      closeModal();
      showView("home");
      toast("Everything reset.");
    }
  });
}
function exportData(){
  const blob = new Blob([JSON.stringify(DATA,null,2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `proof-backup-${todayStr()}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}
function importData(e){
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try{
      const parsed = JSON.parse(reader.result);
      DATA = Object.assign(seedData(), parsed);
      save();
      closeModal();
      showView("home");
      toast("Data imported.");
    }catch(err){ toast("Couldn't read that file."); }
  };
  reader.readAsText(file);
}
function openEditQuick(){
  const body = document.getElementById("modalBody");
  body.innerHTML = `
    <div class="modal-title">Quick-add buttons <button class="modal-close" id="mClose">✕</button></div>
    ${DATA.quickAdd.map((q,i)=>`
      <div class="field" style="display:flex; gap:8px; align-items:flex-end;">
        <div style="flex:2;"><label>Name</label><input type="text" data-qn="${i}" value="${escapeHtml(q.name)}"></div>
        <div style="flex:1;"><label>Pts</label><input type="number" data-qp="${i}" value="${q.pts}"></div>
        <button class="li-del" data-qdel="${i}" style="margin-bottom:12px;">✕</button>
      </div>
    `).join("")}
    <button class="btn btn-ghost btn-block" id="addQuickRow">+ Add button</button>
    <button class="btn btn-primary btn-block" id="qSave" style="margin-top:10px;">Save</button>
  `;
  openModal();
  body.querySelector("#mClose").addEventListener("click", closeModal);
  body.querySelector("#addQuickRow").addEventListener("click", ()=>{
    DATA.quickAdd.push({name:"New", pts:3, cat:"other", emoji:"✨"});
    openEditQuick();
  });
  body.querySelectorAll("[data-qdel]").forEach(b=>{
    b.addEventListener("click", ()=>{
      DATA.quickAdd.splice(+b.dataset.qdel,1);
      openEditQuick();
    });
  });
  body.querySelector("#qSave").addEventListener("click", ()=>{
    body.querySelectorAll("[data-qn]").forEach(inp=>{ DATA.quickAdd[+inp.dataset.qn].name = inp.value.trim() || "Untitled"; });
    body.querySelectorAll("[data-qp]").forEach(inp=>{ DATA.quickAdd[+inp.dataset.qp].pts = clamp(parseInt(inp.value)||1,1,100); });
    save(); closeModal(); renderHome();
  });
}

/* ============ GENERIC TEXT MODAL ============ */
function openTextModal(title, placeholder, onSave){
  const body = document.getElementById("modalBody");
  body.innerHTML = `
    <div class="modal-title">${title} <button class="modal-close" id="mClose">✕</button></div>
    <div class="field"><textarea id="genText" placeholder="${placeholder}" autofocus></textarea></div>
    <button class="btn btn-primary btn-block" id="genSave">Save</button>
  `;
  openModal();
  body.querySelector("#mClose").addEventListener("click", closeModal);
  body.querySelector("#genSave").addEventListener("click", ()=>{
    const val = body.querySelector("#genText").value.trim();
    if(!val){ toast("Write something first."); return; }
    onSave(val);
    closeModal();
    toast("Saved.");
  });
}

/* ============ MODAL PLUMBING ============ */
function openModal(){ document.getElementById("modalBackdrop").classList.add("open"); }
function closeModal(){ document.getElementById("modalBackdrop").classList.remove("open"); }
document.getElementById("modalBackdrop").addEventListener("click", (e)=>{
  if(e.target.id==="modalBackdrop") closeModal();
});

/* ============ INIT ============ */
renderHome();

/* ============ SERVICE WORKER ============ */
if("serviceWorker" in navigator){
  window.addEventListener("load", ()=>{
    navigator.serviceWorker.register("./sw.js").catch(()=>{});
  });
}

})();
