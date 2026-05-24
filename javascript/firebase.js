import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";
import { getDatabase, ref, push, onValue, remove, update } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-database.js";
import { renderCropTable, renderHarvestCalendar, showToast } from './ui.js';

const firebaseConfig = {
  apiKey: "AIzaSyDEcs8GSYIo2DZw1UERVJQ5wgt9i-yKyl0",
  authDomain: "leefrancis-5ec8f.firebaseapp.com",
  databaseURL: "https://leefrancis-5ec8f-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "leefrancis-5ec8f",
  storageBucket: "leefrancis-5ec8f.firebasestorage.app",
  messagingSenderId: "965812133410",
  appId: "1:965812133410:web:9ba0c0f4bd2b486185347b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

let currentUser = null;

// ── Auth ─────────────────────────────────────────────────────────
onAuthStateChanged(auth, user => {
  if (!user) { window.location.href = '/index.html'; return; }
  currentUser = user;

  document.getElementById('user-name').textContent = user.displayName || user.email.split('@')[0];
  document.getElementById('fb-dot').classList.add('online');
  document.getElementById('fb-status-text').textContent = 'Connected';

  const initials = (user.displayName || user.email).slice(0, 2).toUpperCase();
  document.getElementById('user-avatar').textContent = initials;
  document.getElementById('sidebar-user-name').textContent = user.displayName || user.email.split('@')[0];
  document.getElementById('sidebar-user-email').textContent = user.email;

  listenCrops();
});

// ── Listen crops ─────────────────────────────────────────────────
function listenCrops() {
  onValue(ref(db, `crops/${currentUser.uid}`), snapshot => {
    const data = snapshot.val() || {};
    const crops = Object.entries(data).map(([id, val]) => ({ id, ...val }));

    document.getElementById('stat-total-crops').textContent = crops.length;
    document.getElementById('nav-crop-count').textContent = crops.length;

    const avgYield = crops.length
      ? (crops.reduce((s, c) => s + (c.yield || 0), 0) / crops.length).toFixed(1) : '—';
    document.getElementById('stat-yield').textContent = avgYield;
    document.getElementById('stat-at-risk').textContent = crops.filter(c => c.status === 'at-risk').length;

    renderCropTable(crops, 'dash-crop-list', 5);
    renderCropCards(crops);
    renderHarvestCalendar(crops);

    const totalArea = crops.reduce((s, c) => s + (c.area || 0), 0);
    const areaEl = document.getElementById('total-area');
    if (areaEl) areaEl.textContent = totalArea.toFixed(1) + ' ha';

    // Also update field map if it exists
    if (window._renderFieldMap) window._renderFieldMap(crops);
  });
}

// ── Status config ────────────────────────────────────────────────
const statusConfig = {
  growing:   { bg: '#f0faf0', border: '#4caf50', badge: '#e8f5e9', text: '#2e7d32', label: 'Growing' },
  planted:   { bg: '#f0f7ff', border: '#2196f3', badge: '#e3f2fd', text: '#1565c0', label: 'Planted' },
  harvest:   { bg: '#fff8f0', border: '#ff9800', badge: '#fff3e0', text: '#e65100', label: 'Ready to Harvest' },
  'at-risk': { bg: '#fff5f5', border: '#f44336', badge: '#ffebee', text: '#b71c1c', label: 'At Risk' }
};

// ── Render crop cards ────────────────────────────────────────────
function renderCropCards(crops) {
  const container = document.getElementById('crop-cards-grid');
  if (!container) return;

  if (!crops.length) {
    container.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:64px 24px;">
        <div style="font-size:48px;margin-bottom:16px;">🌱</div>
        <div style="font-size:16px;font-weight:500;margin-bottom:8px;">No crops yet</div>
        <div style="font-size:13px;color:var(--text-faint);margin-bottom:20px;">Add your first crop to get started</div>
        <button class="tb-btn primary" onclick="openAddCrop()">+ Add Crop</button>
      </div>`;
    return;
  }

  container.innerHTML = crops.map(c => {
    const sc = statusConfig[c.status] || { bg:'#f9f9f9', border:'#ddd', badge:'#eee', text:'#666', label: c.status };
    const planted = c.planted ? new Date(c.planted).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : null;
    const harvest = c.harvest ? new Date(c.harvest).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : null;

    return `
      <div style="background:${sc.bg};border:1.5px solid ${sc.border};border-radius:14px;padding:20px;display:flex;flex-direction:column;transition:box-shadow 0.2s;"
        onmouseover="this.style.boxShadow='0 4px 16px rgba(0,0,0,0.08)'" onmouseout="this.style.boxShadow=''">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:4px;">
          <div style="font-size:18px;font-weight:700;color:#1a1a1a;">${c.name}</div>
          <span style="background:${sc.badge};color:${sc.text};font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;">${sc.label}</span>
        </div>
        <div style="font-size:13px;color:var(--text-faint);margin-bottom:14px;">${c.field || 'No field assigned'}</div>
        <div style="display:flex;flex-direction:column;gap:4px;font-size:13px;color:#444;margin-bottom:16px;flex:1;">
          ${c.area ? `<span>Area: ${c.area} ha</span>` : ''}
          ${planted ? `<span>Planted: ${planted}</span>` : ''}
          ${harvest ? `<span>Harvest: ${harvest}</span>` : ''}
          ${c.yield ? `<span>Est. Yield: ${c.yield} t/ha</span>` : ''}
          ${c.notes ? `<span style="color:var(--text-faint);font-style:italic;">${c.notes}</span>` : ''}
        </div>
        <div style="display:flex;gap:8px;">
          <button onclick="openEditCrop('${c.id}')"
            style="flex:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:8px;border:1.5px solid ${sc.border};border-radius:8px;background:#fff;color:#333;font-size:13px;cursor:pointer;font-family:inherit;">
            ✏ Edit
          </button>
          <button onclick="window.deleteCrop('${c.id}')"
            style="width:38px;height:38px;display:flex;align-items:center;justify-content:center;border:1.5px solid #fecaca;border-radius:8px;background:#fff;color:#ef4444;font-size:16px;cursor:pointer;">
            🗑
          </button>
        </div>
      </div>`;
  }).join('');
}

// ── Edit crop ────────────────────────────────────────────────────
let editingCropId = null;

window.openEditCrop = function(id) {
  onValue(ref(db, `crops/${currentUser.uid}/${id}`), snap => {
    const c = snap.val();
    if (!c) return;
    editingCropId = id;
    document.getElementById('e-name').value    = c.name    || '';
    document.getElementById('e-type').value    = c.type    || 'Cereal';
    document.getElementById('e-field').value   = c.field   || '';
    document.getElementById('e-area').value    = c.area    || '';
    document.getElementById('e-planted').value = c.planted || '';
    document.getElementById('e-harvest').value = c.harvest || '';
    document.getElementById('e-status').value  = c.status  || 'planted';
    document.getElementById('e-yield').value   = c.yield   || '';
    document.getElementById('e-notes').value   = c.notes   || '';
    document.getElementById('edit-crop-modal').classList.add('open');
  }, { onlyOnce: true });
};

window.saveEditCrop = async function() {
  if (!editingCropId) return;
  const data = {
    name:    document.getElementById('e-name').value.trim(),
    type:    document.getElementById('e-type').value,
    field:   document.getElementById('e-field').value.trim(),
    area:    parseFloat(document.getElementById('e-area').value) || 0,
    planted: document.getElementById('e-planted').value,
    harvest: document.getElementById('e-harvest').value,
    status:  document.getElementById('e-status').value,
    yield:   parseFloat(document.getElementById('e-yield').value) || 0,
    notes:   document.getElementById('e-notes').value.trim(),
  };
  if (!data.name) { showToast('Crop name is required.', 'warn'); return; }
  try {
    await update(ref(db, `crops/${currentUser.uid}/${editingCropId}`), data);
    document.getElementById('edit-crop-modal').classList.remove('open');
    showToast('Crop updated!', 'success');
    editingCropId = null;
  } catch(e) { showToast('Failed to update: ' + e.message, 'error'); }
};

// ── Save crop ────────────────────────────────────────────────────
window.saveCrop = async function() {
  const name = document.getElementById('f-name')?.value.trim();
  if (!name) { showToast('Crop name is required.', 'warn'); return; }
  const data = {
    name,
    type:    document.getElementById('f-type').value,
    field:   document.getElementById('f-field').value.trim(),
    area:    parseFloat(document.getElementById('f-area').value) || 0,
    planted: document.getElementById('f-planted').value,
    harvest: document.getElementById('f-harvest').value,
    status:  document.getElementById('f-status').value,
    yield:   parseFloat(document.getElementById('f-yield').value) || 0,
    notes:   document.getElementById('f-notes').value.trim(),
    created: Date.now()
  };
  try {
    await push(ref(db, `crops/${currentUser.uid}`), data);
    document.getElementById('add-crop-modal').classList.remove('open');
    ['f-name','f-field','f-area','f-planted','f-harvest','f-yield','f-notes'].forEach(id => {
      const el = document.getElementById(id); if (el) el.value = '';
    });
    showToast('Crop saved!', 'success');
  } catch(e) { showToast('Failed to save: ' + e.message, 'error'); }
};

// ── Delete crop ──────────────────────────────────────────────────
window.deleteCrop = async function(id) {
  if (!confirm('Delete this crop?')) return;
  try {
    await remove(ref(db, `crops/${currentUser.uid}/${id}`));
    showToast('Crop deleted.', 'success');
  } catch(e) { showToast('Failed to delete: ' + e.message, 'error'); }
};

// ── Sign out ─────────────────────────────────────────────────────
window.signOutUser = async function() {
  await signOut(auth);
  window.location.href = '/login.html';
};