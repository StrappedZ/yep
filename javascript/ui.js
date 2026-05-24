import { renderForecastCharts, renderAnalyticsCharts } from './chart.js';
import { renderWeatherCard } from './weather.js';

// ── Page navigation ──────────────────────────────────────────────
export function showPage(name, el) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const page = document.getElementById('page-' + name);
  if (!page) { console.warn('Page not found:', name); return; }
  page.classList.add('active');

  if (el) el.classList.add('active');

  const titles = {
    dashboard: 'Dashboard', crops: 'Crops', forecast: 'Forecast',
    weather: 'Weather', alerts: 'Alerts', activity: 'Activity Log',
    harvest: 'Harvest Records', tasks: 'Tasks', fieldmap: 'Field Map',
    analytics: 'Analytics', settings: 'Settings'
  };
  document.getElementById('page-title').textContent = titles[name] || name;

  if (name === 'forecast')  renderForecastCharts();
  if (name === 'analytics') renderAnalyticsCharts();
  if (name === 'weather')   renderWeatherCard('weather-page-container', 'Manila');
}

// ── Modal helpers ────────────────────────────────────────────────
export function openAddCrop() {
  document.getElementById('add-crop-modal').classList.add('open');
}
export function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

// ── Dashboard crop list ──────────────────────────────────────────
export function renderCropTable(crops, elId, limit) {
  const el = document.getElementById(elId);
  if (!el) return;
  const list = limit ? crops.slice(0, limit) : crops;
  if (!list.length) {
    el.innerHTML = '<p style="color:var(--text-faint);font-size:13px;padding:12px 0;">No crops found.</p>';
    return;
  }
  el.innerHTML = list.map(c => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);">
      <div>
        <div style="font-weight:500;font-size:14px;">${c.name}</div>
        <div style="font-size:12px;color:var(--text-faint);">${c.field || '—'} · ${c.type || '—'}</div>
      </div>
      <span class="badge ${c.status}">${c.status}</span>
    </div>
  `).join('');
}

// ── Harvest calendar ─────────────────────────────────────────────
export function renderHarvestCalendar(crops) {
  const el = document.getElementById('harvest-calendar');
  if (!el) return;
  const upcoming = crops.filter(c => c.harvest).sort((a, b) => new Date(a.harvest) - new Date(b.harvest));
  if (!upcoming.length) {
    el.innerHTML = '<p style="color:var(--text-faint);font-size:13px;padding:12px 0;">No upcoming harvests.</p>';
    return;
  }
  el.innerHTML = upcoming.map(c => {
    const days = Math.ceil((new Date(c.harvest) - new Date()) / 86400000);
    return `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);">
        <div>
          <div style="font-weight:500;font-size:14px;">${c.name}</div>
          <div style="font-size:12px;color:var(--text-faint);">${c.field || '—'} · Est. harvest ${c.harvest}</div>
        </div>
        <span style="font-size:12px;font-weight:600;color:${days <= 7 ? 'var(--red-600)' : days <= 14 ? 'var(--amber-600)' : 'var(--green-600)'};">
          ${days > 0 ? `${days}d away` : 'Today'}
        </span>
      </div>`;
  }).join('');
}

// ── Toast ────────────────────────────────────────────────────────
export function showToast(msg, type = 'info') {
  const wrap = document.getElementById('toast-wrap');
  if (!wrap) return;
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  wrap.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// ── Expose globals ───────────────────────────────────────────────
window.showPage   = showPage;
window.openAddCrop = openAddCrop;
window.closeModal  = closeModal;
window.showToast   = showToast;