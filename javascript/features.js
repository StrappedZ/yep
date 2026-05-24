import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";
import { getDatabase, ref, push, onValue, update, remove } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-database.js";
import { showToast } from './ui.js';

const firebaseConfig = {
  apiKey: "AIzaSyDEcs8GSYIo2DZw1UERVJQ5wgt9i-yKyl0",
  authDomain: "leefrancis-5ec8f.firebaseapp.com",
  databaseURL: "https://leefrancis-5ec8f-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "leefrancis-5ec8f",
  storageBucket: "leefrancis-5ec8f.firebasestorage.app",
  messagingSenderId: "965812133410",
  appId: "1:965812133410:web:9ba0c0f4bd2b486185347b"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db  = getDatabase(app);
const auth = getAuth(app);

let uid = null;
let allActivities = [];
let allTasks = [];
let activityFilter = 'all';
let taskFilter = 'pending';

onAuthStateChanged(auth, user => {
  if (!user) return;
  uid = user.uid;
  listenActivities();
  listenHarvests();
  listenTasks();
  listenCropsForMap();
});

// ═══════════════════════════════════════════════════════
// ACTIVITY LOG
// ═══════════════════════════════════════════════════════
function listenActivities() {
  onValue(ref(db, `activities/${uid}`), snap => {
    const data = snap.val() || {};
    allActivities = Object.entries(data)
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    renderActivities();
  });
}

function renderActivities() {
  const el = document.getElementById('activity-list');
  if (!el) return;

  const icons  = { watering:'💧', fertilizing:'🌿', spraying:'🧪', scouting:'🔍', other:'📝' };
  const colors = { watering:'#e3f2fd', fertilizing:'#e8f5e9', spraying:'#fff8e1', scouting:'#f3e5f5', other:'#f5f5f5' };
  const filtered = activityFilter === 'all' ? allActivities : allActivities.filter(a => a.type === activityFilter);

  if (!filtered.length) {
    el.innerHTML = '<p style="color:var(--text-faint);font-size:13px;padding:16px 0;">No activities logged yet.</p>';
    return;
  }

  el.innerHTML = filtered.map(a => `
    <div style="display:flex;align-items:flex-start;gap:14px;padding:14px 0;border-bottom:1px solid var(--border);">
      <div style="width:38px;height:38px;border-radius:50%;background:${colors[a.type]||'#f5f5f5'};display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">
        ${icons[a.type] || '📝'}
      </div>
      <div style="flex:1;">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <span style="font-weight:600;font-size:14px;text-transform:capitalize;">${a.type}</span>
          <span style="font-size:12px;color:var(--text-faint);">${a.date || ''}</span>
        </div>
        <div style="font-size:13px;color:var(--text-faint);margin-top:2px;">
          ${a.field || ''}${a.by ? ' · by ' + a.by : ''}
        </div>
        ${a.notes ? `<div style="font-size:13px;margin-top:4px;color:#333;">${a.notes}</div>` : ''}
      </div>
      <button onclick="deleteActivity('${a.id}')"
        style="background:none;border:none;cursor:pointer;color:var(--text-faint);font-size:18px;padding:2px 6px;line-height:1;">✕</button>
    </div>
  `).join('');
}

window.openActivityModal = function() {
  document.getElementById('a-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('activity-modal').classList.add('open');
};

window.saveActivity = async function() {
  const data = {
    type:  document.getElementById('a-type').value,
    date:  document.getElementById('a-date').value,
    field: document.getElementById('a-field').value.trim(),
    by:    document.getElementById('a-by').value.trim(),
    notes: document.getElementById('a-notes').value.trim(),
    created: Date.now()
  };
  await push(ref(db, `activities/${uid}`), data);
  document.getElementById('activity-modal').classList.remove('open');
  ['a-field','a-by','a-notes'].forEach(id => document.getElementById(id).value = '');
  showToast('Activity logged!', 'success');
};

window.deleteActivity = async function(id) {
  await remove(ref(db, `activities/${uid}/${id}`));
  showToast('Deleted.', 'success');
};

window.filterActivity = function(type, btn) {
  activityFilter = type;
  document.querySelectorAll('.activity-filter').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderActivities();
};

// ═══════════════════════════════════════════════════════
// HARVEST RECORDS
// ═══════════════════════════════════════════════════════
function listenHarvests() {
  onValue(ref(db, `harvests/${uid}`), snap => {
    const data = snap.val() || {};
    const records = Object.entries(data)
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    renderHarvests(records);
  });
}

function renderHarvests(records) {
  const tbody = document.getElementById('harvest-body');
  if (!tbody) return;

  const totalEl    = document.getElementById('harvest-total');
  const accuracyEl = document.getElementById('harvest-accuracy');

  if (!records.length) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--text-faint);">No harvest records yet.</td></tr>`;
    if (totalEl) totalEl.textContent = '0';
    if (accuracyEl) accuracyEl.textContent = '—';
    return;
  }

  const total = records.reduce((s, r) => s + (parseFloat(r.actual) || 0), 0);
  if (totalEl) totalEl.textContent = total.toFixed(1) + ' t';

  const withBoth = records.filter(r => r.est && r.actual);
  if (withBoth.length && accuracyEl) {
    const acc = withBoth.reduce((s, r) => s + (1 - Math.abs(r.actual - r.est) / r.est), 0) / withBoth.length;
    accuracyEl.textContent = Math.round(acc * 100) + '%';
  }

  tbody.innerHTML = records.map(r => {
    const variance = r.est && r.actual
      ? ((r.actual - r.est) / r.est * 100).toFixed(1) : null;
    const varColor = variance === null ? 'var(--text-faint)'
      : parseFloat(variance) >= 0 ? 'var(--green-600)' : 'var(--red-600)';
    return `
      <tr>
        <td style="padding:12px 20px;font-weight:500;">${r.crop || '—'}</td>
        <td>${r.field || '—'}</td>
        <td>${r.date || '—'}</td>
        <td>${r.est ? r.est + ' t/ha' : '—'}</td>
        <td>${r.actual ? r.actual + ' t/ha' : '—'}</td>
        <td style="color:${varColor};font-weight:600;">
          ${variance !== null ? (parseFloat(variance) >= 0 ? '+' : '') + variance + '%' : '—'}
        </td>
        <td style="font-size:12px;color:var(--text-faint);">${r.notes || '—'}</td>
        <td>
          <button onclick="deleteHarvest('${r.id}')"
            style="background:none;border:1px solid #fecaca;border-radius:6px;padding:3px 8px;color:#ef4444;cursor:pointer;font-size:12px;">
            Delete
          </button>
        </td>
      </tr>`;
  }).join('');
}

window.openHarvestModal = function() {
  document.getElementById('h-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('harvest-modal').classList.add('open');
};

window.saveHarvest = async function() {
  const crop = document.getElementById('h-crop').value.trim();
  if (!crop) { showToast('Crop name required.', 'warn'); return; }
  const data = {
    crop,
    field:  document.getElementById('h-field').value.trim(),
    date:   document.getElementById('h-date').value,
    est:    parseFloat(document.getElementById('h-est').value) || 0,
    actual: parseFloat(document.getElementById('h-actual').value) || 0,
    notes:  document.getElementById('h-notes').value.trim(),
    created: Date.now()
  };
  await push(ref(db, `harvests/${uid}`), data);
  document.getElementById('harvest-modal').classList.remove('open');
  ['h-crop','h-field','h-est','h-actual','h-notes'].forEach(id => document.getElementById(id).value = '');
  showToast('Harvest recorded!', 'success');
};

window.deleteHarvest = async function(id) {
  await remove(ref(db, `harvests/${uid}/${id}`));
  showToast('Deleted.', 'success');
};

// ═══════════════════════════════════════════════════════
// TASK MANAGER
// ═══════════════════════════════════════════════════════
function listenTasks() {
  onValue(ref(db, `tasks/${uid}`), snap => {
    const data = snap.val() || {};
    allTasks = Object.entries(data)
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => new Date(a.due) - new Date(b.due));
    renderTasks();
    updateTaskCounts();
  });
}

function updateTaskCounts() {
  const pending  = allTasks.filter(t => !t.done).length;
  const todayStr = new Date().toISOString().split('T')[0];
  const doneToday = allTasks.filter(t => t.done && t.doneAt && t.doneAt.startsWith(todayStr)).length;

  const badge = document.getElementById('nav-task-count');
  if (badge) badge.textContent = pending;
  const pendEl = document.getElementById('tasks-pending');
  const doneEl = document.getElementById('tasks-done');
  if (pendEl) pendEl.textContent = pending;
  if (doneEl) doneEl.textContent = doneToday;
}

function renderTasks() {
  const el = document.getElementById('task-list');
  if (!el) return;

  const priority = { high: '🔴', medium: '🟡', low: '🟢' };
  let filtered = allTasks;
  if (taskFilter === 'pending') filtered = allTasks.filter(t => !t.done);
  if (taskFilter === 'done')    filtered = allTasks.filter(t => t.done);

  if (!filtered.length) {
    el.innerHTML = `<p style="color:var(--text-faint);font-size:13px;padding:8px 0;">No ${taskFilter === 'all' ? '' : taskFilter} tasks.</p>`;
    return;
  }

  const today = new Date().toISOString().split('T')[0];
  el.innerHTML = filtered.map(t => {
    const overdue = !t.done && t.due && t.due < today;
    return `
      <div style="display:flex;align-items:center;gap:12px;padding:13px 0;border-bottom:1px solid var(--border);${t.done ? 'opacity:0.55;' : ''}">
        <input type="checkbox" ${t.done ? 'checked' : ''} onchange="toggleTask('${t.id}', this.checked)"
          style="width:18px;height:18px;cursor:pointer;accent-color:var(--green-600);flex-shrink:0;" />
        <div style="flex:1;">
          <div style="font-size:14px;font-weight:500;${t.done ? 'text-decoration:line-through;color:var(--text-faint);' : ''}">
            ${priority[t.priority] || '🟡'} ${t.desc}
          </div>
          <div style="font-size:12px;color:${overdue ? 'var(--red-600)' : 'var(--text-faint)'};margin-top:3px;">
            ${t.field ? t.field + ' · ' : ''}${t.due ? (overdue ? '⚠ Overdue: ' : 'Due: ') + t.due : 'No due date'}${t.assigned ? ' · ' + t.assigned : ''}
          </div>
        </div>
        <button onclick="deleteTask('${t.id}')"
          style="background:none;border:none;cursor:pointer;color:var(--text-faint);font-size:18px;padding:2px 6px;line-height:1;">✕</button>
      </div>`;
  }).join('');
}

window.openTaskModal = function() {
  document.getElementById('task-modal').classList.add('open');
};

window.saveTask = async function() {
  const desc = document.getElementById('t-desc').value.trim();
  if (!desc) { showToast('Task description required.', 'warn'); return; }
  const data = {
    desc,
    field:    document.getElementById('t-field').value.trim(),
    due:      document.getElementById('t-due').value,
    priority: document.getElementById('t-priority').value,
    assigned: document.getElementById('t-assigned').value.trim(),
    done: false,
    created: Date.now()
  };
  await push(ref(db, `tasks/${uid}`), data);
  document.getElementById('task-modal').classList.remove('open');
  ['t-desc','t-field','t-due','t-assigned'].forEach(id => document.getElementById(id).value = '');
  showToast('Task added!', 'success');
};

window.toggleTask = async function(id, done) {
  await update(ref(db, `tasks/${uid}/${id}`), {
    done,
    doneAt: done ? new Date().toISOString() : null
  });
};

window.deleteTask = async function(id) {
  await remove(ref(db, `tasks/${uid}/${id}`));
  showToast('Task deleted.', 'success');
};

window.filterTasks = function(filter, btn) {
  taskFilter = filter;
  document.querySelectorAll('.task-filter').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderTasks();
};

// ═══════════════════════════════════════════════════════
// FIELD MAP
// ═══════════════════════════════════════════════════════
function listenCropsForMap() {
  onValue(ref(db, `crops/${uid}`), snap => {
    const data = snap.val() || {};
    const crops = Object.entries(data).map(([id, v]) => ({ id, ...v }));
    renderFieldMap(crops);
  });
}

function renderFieldMap(crops) {
  const el = document.getElementById('field-map-grid');
  if (!el) return;

  const sc = {
    growing:   { bg:'#e8f5e9', border:'#4caf50', text:'#2e7d32', label:'Growing' },
    planted:   { bg:'#e3f2fd', border:'#2196f3', text:'#1565c0', label:'Planted' },
    harvest:   { bg:'#fff3e0', border:'#ff9800', text:'#e65100', label:'Ready to Harvest' },
    'at-risk': { bg:'#ffebee', border:'#f44336', text:'#b71c1c', label:'At Risk' }
  };

  if (!crops.length) {
    el.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:48px;color:var(--text-faint);">No crops yet. Add your first crop to see the field map.</div>`;
    return;
  }

  // Group by field
  const fields = {};
  crops.forEach(c => {
    const key = c.field || 'Unassigned';
    if (!fields[key]) fields[key] = [];
    fields[key].push(c);
  });

  el.innerHTML = Object.entries(fields).map(([field, fcrops]) => {
    const main = fcrops[0];
    const cfg  = sc[main.status] || { bg:'#f5f5f5', border:'#ccc', text:'#666', label: main.status };
    const daysGrowing   = main.planted ? Math.floor((Date.now() - new Date(main.planted)) / 86400000) : null;
    const daysToHarvest = main.harvest ? Math.ceil((new Date(main.harvest) - Date.now()) / 86400000) : null;

    return `
      <div style="background:${cfg.bg};border:2px solid ${cfg.border};border-radius:14px;padding:18px;transition:transform 0.15s,box-shadow 0.15s;cursor:default;"
        onmouseover="this.style.transform='translateY(-3px)';this.style.boxShadow='0 6px 20px rgba(0,0,0,0.1)'"
        onmouseout="this.style.transform='';this.style.boxShadow=''">
        <div style="font-size:11px;font-weight:700;color:${cfg.text};text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;">${field}</div>
        <div style="font-size:17px;font-weight:700;color:#1a1a1a;margin-bottom:2px;">${fcrops.map(c => c.name).join(', ')}</div>
        <div style="font-size:12px;color:${cfg.text};font-weight:600;margin-bottom:12px;">${cfg.label}</div>
        <div style="display:flex;flex-direction:column;gap:4px;font-size:12px;color:#555;">
          ${main.area ? `<span>📐 ${main.area} ha</span>` : ''}
          ${daysGrowing !== null ? `<span>🌱 Day ${daysGrowing} growing</span>` : ''}
          ${daysToHarvest !== null
            ? `<span>${daysToHarvest > 0 ? `🗓 ${daysToHarvest}d to harvest` : '✅ Ready to harvest'}</span>`
            : ''}
          ${main.yield ? `<span>📊 Est. ${main.yield} t/ha</span>` : ''}
        </div>
        ${fcrops.length > 1 ? `<div style="margin-top:8px;font-size:11px;color:${cfg.text};font-weight:600;">+${fcrops.length-1} more crop${fcrops.length > 2 ? 's' : ''}</div>` : ''}
      </div>`;
  }).join('');
}

// Expose field map renderer so firebase.js can call it on crop updates
window._renderFieldMap = renderFieldMap;