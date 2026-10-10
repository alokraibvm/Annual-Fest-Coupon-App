'use strict';

const API_URL = 'https://script.google.com/macros/s/AKfycbwhkkTho7BS6lHdyP3Dt2HV5HTYIRabEYMTQ42e2RKb2yBHqAoR9BHYhRnrdwle1We2og/exec';

const $ = id => document.getElementById(id);
const money = value => 'Rs ' + Number(value || 0).toLocaleString('en-IN');
let charts = {};
let busy = false;

function callApi(action, params = {}) {
  return new Promise((resolve, reject) => {
    const callbackName = '__couponCallback' + Date.now() + Math.random().toString(36).slice(2);
    const query = new URLSearchParams({ action, callback: callbackName, ...params });
    const script = document.createElement('script');
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error('Request timed out. Please check the Apps Script deployment.'));
    }, 20000);

    function cleanup() {
      window.clearTimeout(timeout);
      delete window[callbackName];
      script.remove();
    }

    window[callbackName] = data => {
      cleanup();
      if (data && data.ok === false) {
        reject(new Error(data.message || 'The request failed.'));
      } else {
        resolve(data);
      }
    };

    script.onerror = () => {
      cleanup();
      reject(new Error('Unable to reach the Apps Script web app.'));
    };

    script.src = API_URL + '?' + query.toString();
    document.body.appendChild(script);
  });
}

document.querySelectorAll('.nav button').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.nav button').forEach(item => item.classList.toggle('active', item === button));
    document.querySelectorAll('.page').forEach(section => section.classList.toggle('active', section.id === button.dataset.page));
    if (button.dataset.page === 'dashboard') loadDashboard();
  });
});

function showEntryMessage(text, kind) {
  const box = $('entryMessage');
  box.textContent = text;
  box.className = 'message show ' + kind;
}

function readForm(couponOverride) {
  return {
    society: $('society').value,
    category: $('category').value,
    coupon: couponOverride || (document.querySelector('input[name="coupon"]:checked') || {}).value
  };
}

function validateEntry(entry) {
  if (!entry.society) return 'Please select a society.';
  if (!entry.category) return 'Please select a category.';
  if (!entry.coupon) return 'Please select Rs 20 or Rs 50.';
  return '';
}

function setBusy(isBusy) {
  busy = isBusy;
  $('submitButton').disabled = isBusy;
  document.querySelectorAll('.quick').forEach(button => {
    button.disabled = isBusy;
  });
}

function saveCurrent(couponOverride) {
  if (busy) return;
  const entry = readForm(couponOverride);
  const issue = validateEntry(entry);
  if (issue) {
    showEntryMessage(issue, 'error');
    return;
  }

  setBusy(true);
  $('entryMessage').className = 'message';
  callApi('save', entry)
    .then(() => {
      showEntryMessage('Entry saved successfully.', 'success');
      document.querySelectorAll('input[name="coupon"]').forEach(input => {
        input.checked = false;
      });
    })
    .catch(error => {
      showEntryMessage(error.message || 'Unable to save entry. Please try again.', 'error');
    })
    .finally(() => setBusy(false));
}

$('entryForm').addEventListener('submit', event => {
  event.preventDefault();
  saveCurrent();
});

document.querySelectorAll('.quick').forEach(button => {
  button.addEventListener('click', () => {
    const coupon = button.dataset.coupon;
    document.querySelector('input[name="coupon"][value="' + coupon + '"]').checked = true;
    saveCurrent(coupon);
  });
});

function setLeader(nameId, totalId, leader) {
  $(nameId).textContent = leader.societies.length ? leader.societies.join(' | ') : 'No entries yet';
  $(totalId).textContent = leader.societies.length ? money(leader.total) : '';
}

function renderDashboard(data) {
  $('winnerName').textContent = data.winner.societies.length ? data.winner.societies.join(' | ') : 'No entries yet';
  $('winnerTotal').textContent = data.winner.societies.length ? 'Total Collection: ' + money(data.winner.total) : 'Add the first coupon to start the leaderboard.';
  setLeader('juniorLeaderName', 'juniorLeaderTotal', data.juniorLeader);
  setLeader('seniorLeaderName', 'seniorLeaderTotal', data.seniorLeader);

  const s = data.stats;
  $('coupon20Count').textContent = s.coupon20.count.toLocaleString('en-IN') + ' coupons';
  $('coupon20Total').textContent = money(s.coupon20.total) + ' total value';
  $('coupon50Count').textContent = s.coupon50.count.toLocaleString('en-IN') + ' coupons';
  $('coupon50Total').textContent = money(s.coupon50.total) + ' total value';
  $('grandCount').textContent = s.grandTotal.count.toLocaleString('en-IN') + ' coupons';
  $('grandTotal').textContent = money(s.grandTotal.total);
  $('juniorCount').textContent = s.categories.Junior.count.toLocaleString('en-IN') + ' coupons';
  $('juniorTotal').textContent = money(s.categories.Junior.total) + ' collection';
  $('seniorCount').textContent = s.categories.Senior.count.toLocaleString('en-IN') + ' coupons';
  $('seniorTotal').textContent = money(s.categories.Senior.total) + ' collection';

  $('societyTable').innerHTML = data.societies.map(row => (
    '<tr><td>' + escapeHtml(row.society) + '</td><td>' +
    money(row.junior20Total) + '</td><td>' +
    money(row.junior50Total) + '</td><td>' +
    money(row.juniorTotal) + '</td><td>' +
    money(row.senior20Total) + '</td><td>' +
    money(row.senior50Total) + '</td><td>' +
    money(row.seniorTotal) + '</td><td class="last-total">' +
    money(row.overallTotal) + '</td></tr>'
  )).join('');

  drawCharts(data);
  $('lastUpdated').textContent = 'Updated ' + new Date(data.generatedAt).toLocaleString('en-IN');
  $('dashboardMessage').className = 'message';
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

function drawCharts(data) {
  if (typeof Chart === 'undefined') {
    document.querySelectorAll('.no-chart').forEach(el => {
      el.hidden = false;
      el.textContent = 'Charts are unavailable. Refresh to try again.';
    });
    return;
  }

  document.querySelectorAll('.no-chart').forEach(el => {
    el.hidden = true;
  });
  Object.values(charts).forEach(chart => chart.destroy());

  charts.society = new Chart($('societyChart'), {
    type: 'bar',
    data: {
      labels: data.societies.map(item => item.society),
      datasets: [{ data: data.societies.map(item => item.overallTotal), backgroundColor: '#3157c8', borderRadius: 6 }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => money(ctx.raw) } } },
      scales: { x: { beginAtZero: true, ticks: { callback: value => money(value) } }, y: { ticks: { font: { size: 10 } } } }
    }
  });

  charts.category = new Chart($('categoryChart'), {
    type: 'bar',
    data: {
      labels: ['Junior', 'Senior'],
      datasets: [{ data: [data.stats.categories.Junior.total, data.stats.categories.Senior.total], backgroundColor: ['#078b84', '#f2ac34'], borderRadius: 7 }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => money(ctx.raw) } } },
      scales: { y: { beginAtZero: true, ticks: { callback: value => money(value) } } }
    }
  });

  charts.coupon = new Chart($('couponChart'), {
    type: 'doughnut',
    data: {
      labels: ['Rs 20 coupons', 'Rs 50 coupons'],
      datasets: [{ data: [data.stats.coupon20.total, data.stats.coupon50.total], backgroundColor: ['#3157c8', '#f2ac34'], borderWidth: 0, hoverOffset: 4 }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '64%',
      plugins: { legend: { position: 'bottom', labels: { boxWidth: 11, padding: 14 } }, tooltip: { callbacks: { label: ctx => ctx.label + ': ' + money(ctx.raw) } } }
    }
  });
}

function loadDashboard() {
  $('refreshButton').disabled = true;
  $('refreshButton').textContent = 'Loading...';
  $('dashboardMessage').className = 'message';

  callApi('dashboard')
    .then(renderDashboard)
    .catch(error => {
      $('dashboardMessage').textContent = error.message || 'Unable to load dashboard data. Please refresh and try again.';
      $('dashboardMessage').className = 'message show error';
    })
    .finally(() => {
      $('refreshButton').disabled = false;
      $('refreshButton').textContent = 'Refresh Dashboard';
    });
}

$('refreshButton').addEventListener('click', loadDashboard);

function exportReport() {
  const rows = Array.from(document.querySelectorAll('#societyTable tr')).map(tr => Array.from(tr.children).map(td => td.textContent));
  const headings = ['Society', 'Junior Rs 20', 'Junior Rs 50', 'Junior Total', 'Senior Rs 20', 'Senior Rs 50', 'Senior Total', 'Overall Total'];
  const lines = [headings, ...rows].map(row => row.map(value => '"' + String(value).replace(/"/g, '""') + '"').join(',')).join('\r\n');
  const blob = new Blob(['\uFEFF' + lines], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'annual-fest-2026-society-report.csv';
  link.click();
  URL.revokeObjectURL(url);
}

$('exportButton').addEventListener('click', exportReport);
loadDashboard();
