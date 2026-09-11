import { supabase } from './supabase';

const PLAN = {
  monday: {
    label: "Shoulders (top priority) & Arm Maintenance",
    exercises: [
      {id:'m1', name:'Seated DB overhead press', sets:4, reps:'8-10', note:''},
      {id:'m2', name:'Cable or DB lateral raise', sets:4, reps:'14→12→10→8', note:'Pyramid: increase weight each set, minimal rest — the width driver'},
      {id:'m10', name:'Front raise (cable or DB)', sets:3, reps:'14→10→8', note:'Pyramid, back-to-back with lateral raise like a superset'},
      {id:'m11', name:'Leaning single-arm cable lateral raise', sets:3, reps:'12-15', note:'Different angle on the side delt — extra width volume'},
      {id:'m3', name:'Rear delt fly (cable/DB)', sets:3, reps:'15', note:'Balance + posture'},
      {id:'m4', name:'Cable / DB bicep curl', sets:3, reps:'10-12', note:'Neutral-grip DB if wrists bark — maintenance volume'},
      {id:'m6', name:'Cable tricep pushdown', sets:3, reps:'10-12', note:'Rope attachment easier on wrists — maintenance volume'},
      {id:'m8', name:'Plank', sets:2, reps:'45-60s', note:'Ab finisher'},
      {id:'m9', name:'Bicycle crunch', sets:2, reps:'20', note:'Ab finisher'},
    ]
  },
  tuesday: {
    label: "Back — Width & Thickness",
    exercises: [
      {id:'t1', name:'Wide-grip cable pulldown', sets:4, reps:'10-12', note:'Width'},
      {id:'t2', name:'Single-arm cable row', sets:3, reps:'10-12/side', note:'Thickness'},
      {id:'t3', name:'Cable seated row (close grip)', sets:3, reps:'10-12', note:'Thickness/taper'},
      {id:'t4', name:'Straight-arm cable pulldown', sets:3, reps:'12-15', note:'Lat isolation — key for the "diamond" taper look'},
      {id:'t5', name:'Face pull', sets:3, reps:'15', note:'Rear delts (2nd shoulder touch) + posture'},
      {id:'t6', name:'Plank', sets:2, reps:'45-60s', note:'Ab finisher'},
      {id:'t7', name:'Bicycle crunch', sets:2, reps:'20', note:'Ab finisher'},
    ]
  },
  wednesday: {
    label: "Chest & Shoulders",
    exercises: [
      {id:'w1', name:'Flat DB bench press', sets:4, reps:'8-10', note:''},
      {id:'w2', name:'Incline DB press', sets:3, reps:'10-12', note:'Upper chest'},
      {id:'w3', name:'Cable fly (low-to-high)', sets:3, reps:'12-15', note:'Upper chest angle'},
      {id:'w4', name:'Cable fly (high-to-low)', sets:2, reps:'12-15', note:'Lower chest angle'},
      {id:'w5', name:'Lateral raise (light/burnout)', sets:2, reps:'15', note:'2nd shoulder touch of the week'},
      {id:'w6', name:'Plank', sets:2, reps:'45-60s', note:'Ab finisher'},
      {id:'w7', name:'Bicycle crunch', sets:2, reps:'20', note:'Ab finisher'},
    ]
  },
  thursday: {
    label: "Legs & Glutes",
    exercises: [
      {id:'h1', name:'Goblet squat (DB)', sets:3, reps:'10-12', note:'Full depth, knees tracking over toes'},
      {id:'h2', name:'Romanian deadlift (DB)', sets:4, reps:'10-12', note:'Main glute-mass driver here'},
      {id:'h3', name:'Hip thrust or glute bridge', sets:4, reps:'12-15', note:'Direct glute focus'},
      {id:'h4', name:'Walking lunge', sets:3, reps:'12/leg', note:'Glute + knee stability'},
      {id:'h5', name:'Leg extension or DB step-up', sets:2, reps:'12-15', note:'Light, controlled — knee health'},
      {id:'h6', name:'Standing calf raise', sets:3, reps:'15-20', note:''},
      {id:'h7', name:'Plank', sets:2, reps:'45-60s', note:'Ab finisher'},
      {id:'h8', name:'Bicycle crunch', sets:2, reps:'20', note:'Ab finisher'},
    ]
  }
};

const DAY_KEYS = ['monday','tuesday','wednesday','thursday'];

const SHELL = `
<header class="top">
  <div>
    <div class="app-name">Training Log</div>
    <div class="app-sub">Now → April · shoulders, back, chest, legs &amp; glutes, abs</div>
  </div>
  <button type="button" class="link btn-sign-out">Sign out</button>
</header>

<nav class="tabs">
  <button data-tab="monday" class="active">Mon · Shoulders</button>
  <button data-tab="tuesday">Tue · Back</button>
  <button data-tab="wednesday">Wed · Chest &amp; Shoulders</button>
  <button data-tab="thursday">Thu · Legs &amp; Glutes</button>
  <button data-tab="nutrition">Nutrition</button>
  <button data-tab="progress">Progress</button>
</nav>

<main id="main">
  <!-- Day panels are rendered here by JS -->
</main>
`;

let userId = null;

function todayISO(){
  const d = new Date();
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off*60000);
  return local.toISOString().slice(0,10);
}

function esc(s){
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// ---------- storage helpers (Supabase "kv" table; row-level security scopes rows to the signed-in user) ----------
async function storeGet(key){
  const { data, error } = await supabase.from('kv').select('value').eq('key', key).maybeSingle();
  return error || !data ? null : data.value;
}
async function storeSet(key, value){
  const { error } = await supabase.from('kv').upsert({ user_id: userId, key, value, updated_at: new Date().toISOString() });
  return !error;
}
async function storeDelete(key){
  const { error } = await supabase.from('kv').delete().eq('key', key);
  return !error;
}
async function storeEntries(prefix){
  const { data, error } = await supabase.from('kv').select('key, value').like('key', prefix + '%');
  return error ? [] : data;
}

// ---------- day panel rendering ----------
function setRowsHTML(ex, saved){
  let rows = '';
  for(let i=1;i<=ex.sets;i++){
    const s = (saved && saved[i]) ? saved[i] : {w:'', r:'', done:false};
    rows += `
      <div class="set-row" data-set="${i}">
        <div class="set-num">${i}</div>
        <input type="text" inputmode="decimal" placeholder="weight" value="${esc(s.w||'')}" data-field="w">
        <input type="text" placeholder="${ex.reps}" value="${esc(s.r||'')}" data-field="r">
        <button type="button" class="check-btn ${s.done?'done':''}" data-field="done">✓</button>
      </div>`;
  }
  return rows;
}

function exerciseHTML(ex, saved){
  return `
    <div class="exercise" data-ex="${ex.id}">
      <div class="exercise-head">
        <div>
          <div class="exercise-name">${ex.name}</div>
          <div class="exercise-target">${ex.sets} sets × ${ex.reps}</div>
          ${ex.note ? `<div class="exercise-note">${ex.note}</div>` : ''}
        </div>
      </div>
      <div class="col-labels">
        <div></div><div>weight</div><div>reps</div><div>done</div>
      </div>
      <div class="sets">
        ${setRowsHTML(ex, saved)}
      </div>
    </div>
  `;
}

async function renderDayPanel(dayKey){
  const plan = PLAN[dayKey];
  const container = document.getElementById('panel-'+dayKey);
  const dateInput = container.querySelector('.log-date');
  const date = dateInput.value || todayISO();
  const key = `log:${dayKey}:${date}`;
  const saved = await storeGet(key);
  const entries = saved ? saved.entries : {};

  const list = container.querySelector('.exercise-list');
  list.innerHTML = plan.exercises.map(ex => exerciseHTML(ex, entries[ex.id])).join('');

  container.querySelector('.save-status').textContent = saved ? 'Loaded saved log for this date' : 'No log yet for this date';
  container.querySelector('.save-status').classList.remove('ok');
}

function buildDayPanel(dayKey){
  const plan = PLAN[dayKey];
  const div = document.createElement('div');
  div.className = 'panel';
  div.id = 'panel-'+dayKey;
  div.innerHTML = `
    <div class="day-head">
      <h2>${plan.label}</h2>
      <div class="date-row">
        Date
        <input type="date" class="log-date" value="${todayISO()}">
      </div>
    </div>
    <div class="exercise-list"></div>
    <div class="save-bar">
      <span class="save-status"></span>
      <button type="button" class="ghost btn-clear">Clear</button>
      <button type="button" class="primary btn-save">Save log</button>
    </div>
  `;
  return div;
}

// ---------- Nutrition panel ----------
function buildNutritionPanel(){
  const div = document.createElement('div');
  div.className = 'panel';
  div.id = 'panel-nutrition';
  div.innerHTML = `
    <div class="day-head">
      <h2>Nutrition</h2>
      <div class="date-row">
        Date
        <input type="date" class="nut-date" value="${todayISO()}">
      </div>
    </div>

    <div class="macro-hero">
      <div class="macro-card"><div class="num">2250</div><div class="label">calories</div></div>
      <div class="macro-card"><div class="num">175g</div><div class="label">protein</div></div>
      <div class="macro-card"><div class="num">210g</div><div class="label">carbs</div></div>
      <div class="macro-card"><div class="num">65g</div><div class="label">fat</div></div>
    </div>

    <section class="block">
      <h3>Today's checklist</h3>
      <div class="checklist">
        <label class="check-item"><input type="checkbox" data-k="protein"> Hit protein target (~175g)</label>
        <label class="check-item"><input type="checkbox" data-k="calories"> Stayed near calorie target</label>
        <label class="check-item"><input type="checkbox" data-k="water"> Hydration on track</label>
        <label class="check-item"><input type="checkbox" data-k="training"> Trained or active today</label>
      </div>
    </section>

    <section class="block">
      <h3>Portion cheat sheet</h3>
      <div class="meal-card"><div class="m-title">Liquid egg whites — 1 cup (~8 whites)</div><div class="m-body">26g protein · 2g carb · 0g fat · 120 cal</div></div>
      <div class="meal-card"><div class="m-title">Whole egg — 1 large</div><div class="m-body">6g protein · 0g carb · 5g fat · 70 cal</div></div>
      <div class="meal-card"><div class="m-title">Whey protein — 1 scoop</div><div class="m-body">24g protein · 2g carb · 1g fat · 120 cal</div></div>
      <div class="meal-card"><div class="m-title">Banana — 1 medium</div><div class="m-body">1g protein · 27g carb · 0g fat · 105 cal</div></div>
      <div class="meal-card"><div class="m-title">Chicken breast, cooked — 1 cup diced (~5oz)</div><div class="m-body">35g protein · 0g carb · 3g fat · 190 cal</div></div>
      <div class="meal-card"><div class="m-title">Ground beef (90/10), cooked — 4oz (~1/2 cup)</div><div class="m-body">24g protein · 0g carb · 10g fat · 195 cal</div></div>
      <div class="meal-card"><div class="m-title">White rice, cooked — 1 cup</div><div class="m-body">4g protein · 45g carb · 0g fat · 205 cal</div></div>
      <div class="meal-card"><div class="m-title">Black beans, cooked — 1 cup</div><div class="m-body">15g protein · 41g carb · 1g fat · 227 cal</div></div>
      <div class="meal-card"><div class="m-title">Greek yogurt (plain, 2%) — 1 cup</div><div class="m-body">20g protein · 9g carb · 5g fat · 150 cal</div></div>
      <div class="meal-card"><div class="m-title">Olive oil — 1 tbsp</div><div class="m-body">0g protein · 0g carb · 14g fat · 120 cal</div></div>
      <div class="meal-card"><div class="m-title">Avocado — 1/2 medium</div><div class="m-body">2g protein · 4g carb · 15g fat · 160 cal</div></div>
      <div class="meal-card"><div class="m-title">Mixed salad greens — 2 cups</div><div class="m-body">1g protein · 4g carb · 0g fat · 20 cal</div></div>
      <div class="meal-card" style="border-color:var(--accent);"><div class="m-title">Salsa or soy sauce, to taste</div><div class="m-body">Negligible calories/macros. Soy sauce is high sodium — can cause temporary water retention, not fat gain. Low-sodium version or coconut aminos if you use it a lot.</div></div>
    </section>

    <section class="block">
      <h3>Training day template</h3>
      <div class="meal-card"><div class="m-title">Breakfast</div><div class="m-body">1 cup liquid egg whites + 1 whole egg, scrambled, with 1 cup peppers/spinach (~33g protein)</div></div>
      <div class="meal-card"><div class="m-title">Pre-workout</div><div class="m-body">Protein shake: 1 scoop whey + 1 banana + splash of coffee, blended</div></div>
      <div class="meal-card"><div class="m-title">Lunch</div><div class="m-body">6oz chicken breast (~1-1.25 cups diced), 1 cup white rice, 1 cup mixed veg, 1 tsp olive oil</div></div>
      <div class="meal-card"><div class="m-title">Dinner</div><div class="m-body">6oz ground beef (~3/4 cup cooked), 1 cup black beans, 2 cups salad or mixed veg, salsa/soy sauce to taste</div></div>
      <div class="meal-card"><div class="m-title">Snack</div><div class="m-body">1 cup Greek yogurt + 1/2 cup berries</div></div>
    </section>

    <section class="block">
      <h3>Rest day template</h3>
      <div class="meal-card"><div class="m-title">Breakfast</div><div class="m-body">1 cup Greek yogurt + 1/2 cup berries + 1 scoop protein powder stirred in</div></div>
      <div class="meal-card"><div class="m-title">Lunch</div><div class="m-body">6oz chicken or tuna, 2 cups salad, 1/2 avocado</div></div>
      <div class="meal-card"><div class="m-title">Dinner</div><div class="m-body">6oz lean protein, 1 cup roasted vegetables, 1/2 cup rice or quinoa</div></div>
      <div class="meal-card"><div class="m-title">Snack</div><div class="m-body">Protein shake + banana + coffee (same as training days)</div></div>
    </section>

    <section class="block">
      <h3>Notes</h3>
      <textarea class="nut-notes" placeholder="Anything to remember about today..."></textarea>
    </section>

    <div class="save-bar">
      <span class="save-status"></span>
      <button type="button" class="primary btn-save-nut">Save day</button>
    </div>
  `;
  return div;
}

async function renderNutritionPanel(){
  const container = document.getElementById('panel-nutrition');
  const date = container.querySelector('.nut-date').value || todayISO();
  const key = `nutrition:${date}`;
  const saved = await storeGet(key);
  container.querySelectorAll('.checklist input[type=checkbox]').forEach(cb=>{
    cb.checked = saved ? !!saved[cb.dataset.k] : false;
  });
  container.querySelector('.nut-notes').value = saved && saved.notes ? saved.notes : '';
  container.querySelector('.save-status').textContent = saved ? 'Loaded saved entry for this date' : 'No entry yet for this date';
  container.querySelector('.save-status').classList.remove('ok');
}

// ---------- Progress panel ----------
function buildProgressPanel(){
  const div = document.createElement('div');
  div.className = 'panel';
  div.id = 'panel-progress';
  div.innerHTML = `
    <div class="day-head">
      <h2>Progress</h2>
    </div>

    <div class="stat-hero">
      <div class="big" id="latestWeight">—</div>
      <div class="unit">lb</div>
      <div class="delta" id="weightDelta"></div>
    </div>

    <div class="weigh-form">
      <input type="date" class="wi-date" value="${todayISO()}">
      <input type="number" step="0.1" class="wi-weight" placeholder="weight (lb)">
      <button type="button" class="primary btn-add-weight">Log weight</button>
    </div>

    <canvas id="weightChart"></canvas>

    <section class="block">
      <h3>Weigh-ins</h3>
      <table class="log-table" id="weighTable">
        <thead><tr><th>Date</th><th>Weight</th><th></th></tr></thead>
        <tbody></tbody>
      </table>
      <div class="empty" id="weighEmpty" style="display:none;">No weigh-ins logged yet.</div>
    </section>

    <section class="block">
      <h3>Workout history</h3>
      <table class="log-table" id="historyTable">
        <thead><tr><th>Date</th><th>Day</th><th>Sets logged</th></tr></thead>
        <tbody></tbody>
      </table>
      <div class="empty" id="historyEmpty" style="display:none;">No workouts logged yet.</div>
    </section>
  `;
  return div;
}

async function getWeighIns(){
  const data = await storeGet('weighins');
  return data && Array.isArray(data) ? data : [];
}

function drawChart(entries){
  const canvas = document.getElementById('weightChart');
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0,0,rect.width, rect.height);

  if(entries.length < 2){
    ctx.fillStyle = '#6b6e77';
    ctx.font = `13px ${getComputedStyle(document.body).fontFamily}`;
    ctx.fillText('Log at least 2 weigh-ins to see a trend line', 16, rect.height/2);
    return;
  }
  const sorted = [...entries].sort((a,b)=> a.date.localeCompare(b.date));
  const weights = sorted.map(e=>e.weight);
  const min = Math.min(...weights) - 1;
  const max = Math.max(...weights) + 1;
  const padX = 20, padY = 16;
  const w = rect.width - padX*2;
  const h = rect.height - padY*2;

  ctx.strokeStyle = '#c99a44';
  ctx.lineWidth = 2;
  ctx.beginPath();
  sorted.forEach((e,i)=>{
    const x = padX + (i/(sorted.length-1))*w;
    const y = padY + h - ((e.weight-min)/(max-min))*h;
    if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  });
  ctx.stroke();

  ctx.fillStyle = '#c99a44';
  sorted.forEach((e,i)=>{
    const x = padX + (i/(sorted.length-1))*w;
    const y = padY + h - ((e.weight-min)/(max-min))*h;
    ctx.beginPath();
    ctx.arc(x,y,2.6,0,Math.PI*2);
    ctx.fill();
  });
}

async function renderProgressPanel(){
  const entries = await getWeighIns();
  const sorted = [...entries].sort((a,b)=> b.date.localeCompare(a.date));

  const latest = document.getElementById('latestWeight');
  const delta = document.getElementById('weightDelta');
  if(sorted.length){
    latest.textContent = sorted[0].weight;
    if(sorted.length > 1){
      const diff = (sorted[0].weight - sorted[sorted.length-1].weight).toFixed(1);
      delta.textContent = `${diff > 0 ? '+' : ''}${diff} lb since first log`;
      delta.className = 'delta ' + (diff < 0 ? 'down' : (diff > 0 ? 'up' : ''));
    } else {
      delta.textContent = '';
    }
  } else {
    latest.textContent = '—';
    delta.textContent = '';
  }

  const tbody = document.querySelector('#weighTable tbody');
  const emptyEl = document.getElementById('weighEmpty');
  if(sorted.length){
    emptyEl.style.display = 'none';
    tbody.innerHTML = sorted.map(e => `
      <tr>
        <td class="strong">${e.date}</td>
        <td>${e.weight} lb</td>
        <td><span class="del-link" data-date="${e.date}">remove</span></td>
      </tr>`).join('');
  } else {
    tbody.innerHTML = '';
    emptyEl.style.display = 'block';
  }

  drawChart(entries);

  // workout history (one query for every saved log)
  const logs = await storeEntries('log:');
  const histBody = document.querySelector('#historyTable tbody');
  const histEmpty = document.getElementById('historyEmpty');
  if(logs.length){
    const rows = logs.map(({key, value}) => {
      const [, dayKey, date] = key.split(':'); // log:day:date
      let setsLogged = 0;
      if(value && value.entries){
        Object.values(value.entries).forEach(sets => {
          Object.values(sets).forEach(s => { if(s.done) setsLogged++; });
        });
      }
      return {date, dayKey, setsLogged};
    });
    rows.sort((a,b)=> b.date.localeCompare(a.date));
    histEmpty.style.display = 'none';
    histBody.innerHTML = rows.map(r => `
      <tr>
        <td class="strong">${r.date}</td>
        <td>${PLAN[r.dayKey] ? PLAN[r.dayKey].label : r.dayKey}</td>
        <td>${r.setsLogged} sets</td>
      </tr>`).join('');
  } else {
    histBody.innerHTML = '';
    histEmpty.style.display = 'block';
  }
}

// ---------- wiring ----------
// Builds the app inside `root` for the signed-in user; returns a cleanup function.
export function startApp(root, uid){
  userId = uid;
  root.innerHTML = SHELL;

  const main = document.getElementById('main');
  DAY_KEYS.forEach(dk => main.appendChild(buildDayPanel(dk)));
  main.appendChild(buildNutritionPanel());
  main.appendChild(buildProgressPanel());
  document.getElementById('panel-monday').classList.add('active');

  root.querySelector('.btn-sign-out').addEventListener('click', ()=> supabase.auth.signOut());

  document.querySelectorAll('nav.tabs button').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      document.querySelectorAll('nav.tabs button').forEach(b=>b.classList.remove('active'));
      document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      document.getElementById('panel-'+tab).classList.add('active');
      if(DAY_KEYS.includes(tab)) await renderDayPanel(tab);
      else if(tab === 'nutrition') await renderNutritionPanel();
      else if(tab === 'progress') await renderProgressPanel();
    });
  });

  // day panel behavior
  DAY_KEYS.forEach(dayKey => {
    const panel = document.getElementById('panel-'+dayKey);

    panel.querySelector('.log-date').addEventListener('change', ()=> renderDayPanel(dayKey));

    panel.querySelector('.exercise-list').addEventListener('click', (e)=>{
      if(e.target.classList.contains('check-btn')){
        e.target.classList.toggle('done');
      }
    });

    panel.querySelector('.btn-save').addEventListener('click', async ()=>{
      const date = panel.querySelector('.log-date').value || todayISO();
      const entries = {};
      panel.querySelectorAll('.exercise').forEach(exDiv=>{
        const exId = exDiv.dataset.ex;
        const sets = {};
        exDiv.querySelectorAll('.set-row').forEach(row=>{
          const num = row.dataset.set;
          sets[num] = {
            w: row.querySelector('[data-field="w"]').value,
            r: row.querySelector('[data-field="r"]').value,
            done: row.querySelector('[data-field="done"]').classList.contains('done')
          };
        });
        entries[exId] = sets;
      });
      const status = panel.querySelector('.save-status');
      const ok = await storeSet(`log:${dayKey}:${date}`, {day: dayKey, entries});
      status.textContent = ok ? 'Saved' : 'Could not save — try again';
      status.classList.toggle('ok', ok);
    });

    panel.querySelector('.btn-clear').addEventListener('click', async ()=>{
      const date = panel.querySelector('.log-date').value || todayISO();
      await storeDelete(`log:${dayKey}:${date}`);
      await renderDayPanel(dayKey);
    });

    renderDayPanel(dayKey);
  });

  // nutrition behavior
  {
    const panel = document.getElementById('panel-nutrition');
    panel.querySelector('.nut-date').addEventListener('change', renderNutritionPanel);

    panel.querySelector('.btn-save-nut').addEventListener('click', async ()=>{
      const date = panel.querySelector('.nut-date').value || todayISO();
      const data = {};
      panel.querySelectorAll('.checklist input[type=checkbox]').forEach(cb=>{
        data[cb.dataset.k] = cb.checked;
      });
      data.notes = panel.querySelector('.nut-notes').value;
      const status = panel.querySelector('.save-status');
      const ok = await storeSet(`nutrition:${date}`, data);
      status.textContent = ok ? 'Saved' : 'Could not save — try again';
      status.classList.toggle('ok', ok);
    });

    renderNutritionPanel();
  }

  // progress behavior
  const progressPanel = document.getElementById('panel-progress');

  progressPanel.querySelector('.btn-add-weight').addEventListener('click', async ()=>{
    const date = progressPanel.querySelector('.wi-date').value || todayISO();
    const weightVal = parseFloat(progressPanel.querySelector('.wi-weight').value);
    if(!weightVal){ return; }
    const entries = await getWeighIns();
    const filtered = entries.filter(e => e.date !== date);
    filtered.push({date, weight: weightVal});
    await storeSet('weighins', filtered);
    progressPanel.querySelector('.wi-weight').value = '';
    await renderProgressPanel();
  });

  progressPanel.querySelector('#weighTable').addEventListener('click', async (e)=>{
    if(e.target.classList.contains('del-link')){
      const date = e.target.dataset.date;
      const entries = await getWeighIns();
      const filtered = entries.filter(x => x.date !== date);
      await storeSet('weighins', filtered);
      await renderProgressPanel();
    }
  });

  const onResize = ()=> {
    if(progressPanel.classList.contains('active')){
      getWeighIns().then(drawChart);
    }
  };
  window.addEventListener('resize', onResize);

  return ()=> {
    window.removeEventListener('resize', onResize);
    root.innerHTML = '';
  };
}
