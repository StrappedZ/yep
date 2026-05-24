const API_KEY = '3a6eabeba51fc1405df366814f6de202';

function weatherIcon(main, size = 32) {
  const s = `width:${size}px;height:${size}px;stroke:currentColor;fill:none;stroke-width:1.8;`;
  if (main === 'Thunderstorm') return `<svg style="${s}" viewBox="0 0 24 24"><path d="M19 16.9A5 5 0 0018 7h-1.26A8 8 0 104 15.25"/><polyline points="13 11 11 15 14 15 12 19"/></svg>`;
  if (main === 'Rain' || main === 'Drizzle') return `<svg style="${s}" viewBox="0 0 24 24"><path d="M20 17.58A5 5 0 0018 8h-1.26A8 8 0 104 16.25"/><line x1="8" y1="19" x2="8" y2="21"/><line x1="8" y1="13" x2="8" y2="15"/><line x1="16" y1="19" x2="16" y2="21"/><line x1="16" y1="13" x2="16" y2="15"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="12" y1="15" x2="12" y2="17"/></svg>`;
  if (main === 'Clouds') return `<svg style="${s}" viewBox="0 0 24 24"><path d="M17.5 19H9a7 7 0 116.71-9h1.79a4.5 4.5 0 010 9z"/></svg>`;
  if (main === 'Snow') return `<svg style="${s}" viewBox="0 0 24 24"><line x1="12" y1="2" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="19.07" y2="4.93"/></svg>`;
  // Clear / default — sun
  return `<svg style="${s}" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
}

function farmingAdvice(main, temp, humidity) {
  if (main === 'Thunderstorm') return ['Avoid field operations — lightning risk.', 'Secure equipment and check drainage.'];
  if (main === 'Rain' || main === 'Drizzle') return ['Delay spraying and harvesting.', 'Good time for transplanting seedlings.'];
  if (temp > 36) return ['High heat stress risk for crops.', 'Irrigate early morning or evening.', 'Monitor livestock for heat stress.'];
  if (humidity > 80) return ['High humidity — watch for fungal disease.', 'Ensure good crop canopy airflow.'];
  if (main === 'Clear' && temp >= 28 && temp <= 35) return ['Conditions are normal — routine farm activities can proceed.', 'Good window for spraying and field scouting.'];
  return ['Conditions are normal — routine farm activities can proceed.'];
}

function getDayLabel(dt, tz, index) {
  const d = new Date((dt + tz) * 1000);
  if (index === 0) return 'Today';
  return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getUTCDay()];
}

export async function fetchWeather(city) {
  const [curRes, fcRes] = await Promise.all([
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)},PH&appid=${API_KEY}&units=metric`),
    fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)},PH&appid=${API_KEY}&units=metric`)
  ]);
  if (!curRes.ok) throw new Error('City not found. Try another Philippine city.');
  return { current: await curRes.json(), forecast: await fcRes.json() };
}

export function renderWeatherCard(containerId, defaultCity = 'Manila') {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <style>
      .wx-wrap { font-family: 'DM Sans', sans-serif; }
      .wx-search { display:flex; gap:10px; margin-bottom:20px; }
      .wx-search input { flex:1; padding:10px 14px 10px 36px; border:1.5px solid #d1d5db; border-radius:10px; font-size:14px; background:#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Ccircle cx='11' cy='11' r='8'/%3E%3Cpath d='m21 21-4.35-4.35'/%3E%3C/svg%3E") no-repeat 12px center; outline:none; }
      .wx-search input:focus { border-color:#2d6a2d; }
      .wx-search button { display:flex;align-items:center;gap:6px; background:#2d6a2d; color:#fff; border:none; border-radius:10px; padding:10px 20px; font-size:14px; font-weight:600; cursor:pointer; }
      .wx-search button:hover { background:#245824; }
      .wx-main-card { background:linear-gradient(135deg,#2d6a2d 0%,#3a8a3a 60%,#4aaa4a 100%); border-radius:18px; padding:28px; color:#fff; margin-bottom:16px; position:relative; overflow:hidden; }
      .wx-main-card::before { content:''; position:absolute; top:-40px; right:-40px; width:180px; height:180px; background:rgba(255,255,255,0.06); border-radius:50%; }
      .wx-city { font-size:22px; font-weight:700; margin-bottom:2px; }
      .wx-desc { font-size:14px; opacity:0.85; text-transform:capitalize; margin-bottom:18px; }
      .wx-top-row { display:flex; align-items:flex-start; justify-content:space-between; }
      .wx-temp { font-size:56px; font-weight:700; line-height:1; }
      .wx-icon-big { opacity:0.9; }
      .wx-metrics { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-top:22px; }
      .wx-metric { background:rgba(0,0,0,0.18); border-radius:12px; padding:14px; text-align:center; }
      .wx-metric-label { font-size:12px; opacity:0.8; margin:6px 0 4px; }
      .wx-metric-val { font-size:16px; font-weight:700; }
      .wx-section { background:#fff; border:1.5px solid #e5e7eb; border-radius:14px; padding:20px; margin-bottom:14px; }
      .wx-section-title { font-size:14px; font-weight:600; color:#374151; margin-bottom:14px; }
      .wx-5day { display:grid; grid-template-columns:repeat(5,1fr); gap:8px; }
      .wx-day { background:#f3f4f6; border-radius:10px; padding:10px 6px; text-align:center; }
      .wx-day-name { font-size:11px; font-weight:700; color:#6b7280; margin-bottom:6px; text-transform:uppercase; letter-spacing:0.05em; }
      .wx-day-icon { color:#2d6a2d; display:flex; justify-content:center; margin-bottom:6px; }
      .wx-day-hi { font-size:15px; font-weight:700; color:#111827; }
      .wx-day-lo { font-size:12px; color:#9ca3af; margin-top:2px; }
      .wx-extras { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:14px; }
      .wx-extra { background:#fff; border:1.5px solid #e5e7eb; border-radius:12px; padding:14px; text-align:center; }
      .wx-extra-label { font-size:11px; color:#9ca3af; margin-bottom:6px; }
      .wx-extra-val { font-size:15px; font-weight:700; color:#111827; }
      .wx-advice { background:#f0faf0; border:1.5px solid #bbf7d0; border-radius:14px; padding:18px 20px; }
      .wx-advice-title { font-size:14px; font-weight:700; color:#166534; display:flex; align-items:center; gap:8px; margin-bottom:10px; }
      .wx-advice ul { margin:0; padding-left:18px; }
      .wx-advice li { font-size:13px; color:#166534; margin-bottom:4px; }
      .wx-error { background:#fef2f2; border:1.5px solid #fecaca; border-radius:12px; padding:14px 18px; color:#dc2626; font-size:13px; }
      .wx-loading { color:#6b7280; font-size:13px; padding:12px 0; }
    </style>
    <div class="wx-wrap">
      <div class="wx-search">
        <input type="text" id="wx-input" placeholder="Enter city (e.g. Manila, Cebu, Davao)" value="${defaultCity}" />
        <button onclick="window._wxSearch()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          Search
        </button>
      </div>
      <div id="wx-output"><p class="wx-loading">Loading weather data…</p></div>
    </div>
  `;

  window._wxSearch = async function () {
    const city = document.getElementById('wx-input')?.value.trim() || defaultCity;
    const out = document.getElementById('wx-output');
    out.innerHTML = '<p class="wx-loading">Fetching weather data…</p>';
    try {
      const { current, forecast } = await fetchWeather(city);
      const tz = forecast.city.timezone;
      const main = current.weather[0].main;
      const temp = Math.round(current.main.temp);
      const feels = Math.round(current.main.feels_like);
      const humidity = current.main.humidity;
      const wind = Math.round(current.wind.speed);
      const pressure = current.main.pressure;
      const visibility = current.visibility ? (current.visibility / 1000).toFixed(1) : '—';
      const desc = current.weather[0].description;

      // 5-day: pick one slot per day (noon-ish)
      const days = [];
      const seen = new Set();
      for (const s of forecast.list) {
        const d = new Date((s.dt + tz) * 1000);
        const key = d.getUTCDay();
        if (!seen.has(key)) { seen.add(key); days.push(s); }
        if (days.length >= 5) break;
      }

      // Per-day hi/lo
      const hiLo = {};
      for (const s of forecast.list) {
        const d = new Date((s.dt + tz) * 1000);
        const key = d.getUTCDay();
        if (!hiLo[key]) hiLo[key] = { hi: s.main.temp_max, lo: s.main.temp_min };
        hiLo[key].hi = Math.max(hiLo[key].hi, s.main.temp_max);
        hiLo[key].lo = Math.min(hiLo[key].lo, s.main.temp_min);
      }

      const advice = farmingAdvice(main, temp, humidity);

      const fiveDayHTML = days.map((s, i) => {
        const d = new Date((s.dt + tz) * 1000);
        const key = d.getUTCDay();
        const hl = hiLo[key] || {};
        return `
          <div class="wx-day">
            <div class="wx-day-name">${getDayLabel(s.dt, tz, i)}</div>
            <div class="wx-day-icon" style="color:#2d6a2d;">${weatherIcon(s.weather[0].main, 24)}</div>
            <div class="wx-day-hi">${Math.round(hl.hi || s.main.temp_max)}°</div>
            <div class="wx-day-lo">${Math.round(hl.lo || s.main.temp_min)}°</div>
          </div>`;
      }).join('');

      out.innerHTML = `
        <div class="wx-main-card">
          <div class="wx-top-row">
            <div>
              <div class="wx-city">${current.name}</div>
              <div class="wx-desc">${desc}</div>
              <div class="wx-temp">${temp}°C</div>
            </div>
            <div class="wx-icon-big" style="color:#fff;">${weatherIcon(main, 56)}</div>
          </div>
          <div class="wx-metrics">
            <div class="wx-metric">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z"/></svg>
              <div class="wx-metric-label">Feels Like</div>
              <div class="wx-metric-val">${feels}°C</div>
            </div>
            <div class="wx-metric">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2a7 7 0 017 7c0 4.97-7 13-7 13S5 13.97 5 9a7 7 0 017-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
              <div class="wx-metric-label">Humidity</div>
              <div class="wx-metric-val">${humidity}%</div>
            </div>
            <div class="wx-metric">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9.59 4.59A2 2 0 1111 8H2m10.59 11.41A2 2 0 1014 16H2m15.73-8.27A2.5 2.5 0 1119.5 12H2"/></svg>
              <div class="wx-metric-label">Wind</div>
              <div class="wx-metric-val">${wind} m/s</div>
            </div>
          </div>
        </div>

        <div class="wx-section">
          <div class="wx-section-title">5-Day Forecast</div>
          <div class="wx-5day">${fiveDayHTML}</div>
        </div>

        <div class="wx-extras">
          <div class="wx-extra"><div class="wx-extra-label">Pressure</div><div class="wx-extra-val">${pressure} hPa</div></div>
          <div class="wx-extra"><div class="wx-extra-label">Visibility</div><div class="wx-extra-val">${visibility} km</div></div>
          <div class="wx-extra"><div class="wx-extra-label">Condition</div><div class="wx-extra-val">${desc.split(' ').map(w=>w[0].toUpperCase()+w.slice(1)).join(' ')}</div></div>
          <div class="wx-extra"><div class="wx-extra-label">Country</div><div class="wx-extra-val">PH</div></div>
        </div>

        <div class="wx-advice">
          <div class="wx-advice-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#166534" stroke-width="2"><path d="M12 22a7 7 0 007-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 007 7z"/></svg>
            Farming Advice
          </div>
          <ul>${advice.map(a => `<li>${a}</li>`).join('')}</ul>
        </div>
      `;
    } catch (err) {
      out.innerHTML = `<div class="wx-error">❌ ${err.message}</div>`;
    }
  };

  document.getElementById('wx-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') window._wxSearch();
  });

  window._wxSearch();
}