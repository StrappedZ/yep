// ── Yield Chart (Dashboard) ──────────────────────────────────────
function initYieldChart() {
  const el = document.getElementById('yieldChart');
  if (!el) return;
  new Chart(el.getContext('2d'), {
    type: 'line',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [{
        label: 'Yield (t/ha)',
        data: [2, 2.5, 3, 3.2, 3.5, 3.8],
        borderColor: 'green',
        backgroundColor: 'rgba(0,128,0,0.2)',
        fill: true,
        tension: 0.4
      }]
    },
    options: { responsive: true, plugins: { legend: { display: true } } }
  });
}

// ── Forecast Charts (Forecast Page) ─────────────────────────────
export function renderForecastCharts() {
  const fc = document.getElementById('forecastChart');
  if (fc && !fc._chartInstance) {
    fc._chartInstance = new Chart(fc.getContext('2d'), {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'Projected Yield (t/ha)',
          data: [3.0, 3.2, 3.5, 3.8, 4.0, 4.2],
          borderColor: '#2e7d32',
          backgroundColor: 'rgba(46,125,50,0.15)',
          fill: true,
          tension: 0.4
        }]
      },
      options: { responsive: true, plugins: { legend: { display: true } } }
    });
  }

  const pie = document.getElementById('pieChart');
  if (pie && !pie._chartInstance) {
    pie._chartInstance = new Chart(pie.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: ['Maize', 'Soybean', 'Rice', 'Wheat'],
        datasets: [{
          data: [35, 25, 25, 15],
          backgroundColor: ['#4caf50', '#ff9800', '#2196f3', '#9c27b0']
        }]
      },
      options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });
  }
}

// ── Analytics Charts (Analytics Page) ───────────────────────────
export function renderAnalyticsCharts() {
  const bar = document.getElementById('barChart');
  if (bar && !bar._chartInstance) {
    bar._chartInstance = new Chart(bar.getContext('2d'), {
      type: 'bar',
      data: {
        labels: ['Maize', 'Soybean', 'Rice', 'Wheat'],
        datasets: [{
          label: 'Yield (t/ha)',
          data: [4.8, 3.2, 3.9, 2.7],
          backgroundColor: ['#4caf50', '#ff9800', '#2196f3', '#9c27b0']
        }]
      },
      options: { responsive: true, plugins: { legend: { display: false } } }
    });
  }

  const moisture = document.getElementById('moistureChart');
  if (moisture && !moisture._chartInstance) {
    moisture._chartInstance = new Chart(moisture.getContext('2d'), {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Soil Moisture (%)',
          data: [58, 61, 63, 60, 62, 65, 62],
          borderColor: '#2196f3',
          backgroundColor: 'rgba(33,150,243,0.15)',
          fill: true,
          tension: 0.4
        }]
      },
      options: { responsive: true, plugins: { legend: { display: true } } }
    });
  }
}

// ── Init on load ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', initYieldChart);