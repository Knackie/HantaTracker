async function loadData() {
  const response = await fetch('data/hantavirus.json');
  if (!response.ok) throw new Error('Impossible de charger les données');
  return response.json();
}

function formatNumber(value) {
  return new Intl.NumberFormat('fr-FR').format(value);
}

function renderStatus(data) {
  const items = [
    { label: 'Cas totaux', value: data.metrics.totalCases, detail: 'confirmés + suspects' },
    { label: 'Cas confirmés', value: data.metrics.confirmedCases, detail: 'confirmation laboratoire' },
    { label: 'Décès', value: data.metrics.deaths, detail: 'signalés dans la source' },
    { label: 'Létalité observée', value: `${data.metrics.caseFatalityRate}%`, detail: 'sur ce cluster uniquement' }
  ];

  document.querySelector('#status').innerHTML = items.map(item => `
    <article class="card stat-card">
      <span>${item.label}</span>
      <strong>${typeof item.value === 'number' ? formatNumber(item.value) : item.value}</strong>
      <p class="muted">${item.detail}</p>
    </article>
  `).join('');
}

function renderSummary(data) {
  document.querySelector('#eventTitle').textContent = data.event.title;
  document.querySelector('#eventSummary').textContent = data.event.summary;
  document.querySelector('#lastUpdate').textContent = data.lastUpdate;
  document.querySelector('#mainSource').textContent = data.source.name;
  document.querySelector('#area').textContent = data.event.area;
}

function renderRegions(data) {
  document.querySelector('#regions').innerHTML = data.locations.map(location => `
    <article class="card region-card">
      <p class="eyebrow">${location.type}</p>
      <h2>${location.name}</h2>
      <p>${location.description}</p>
      <p><strong>${location.cases}</strong> cas rattachés</p>
    </article>
  `).join('');
}

function renderChart(data) {
  const ctx = document.querySelector('#casesChart');
  const labels = data.timeline.map(item => item.date);
  const confirmed = data.timeline.map(item => item.confirmedCases);
  const total = data.timeline.map(item => item.totalCases);

  new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Cas totaux',
          data: total,
          borderWidth: 3,
          tension: 0.35
        },
        {
          label: 'Cas confirmés',
          data: confirmed,
          borderWidth: 3,
          tension: 0.35
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: { color: '#eef6ff' }
        }
      },
      scales: {
        x: {
          ticks: { color: '#a9b8cb' },
          grid: { color: 'rgba(255,255,255,0.08)' }
        },
        y: {
          beginAtZero: true,
          ticks: { color: '#a9b8cb', precision: 0 },
          grid: { color: 'rgba(255,255,255,0.08)' }
        }
      }
    }
  });
}

loadData()
  .then(data => {
    renderStatus(data);
    renderSummary(data);
    renderRegions(data);
    renderChart(data);
  })
  .catch(error => {
    document.querySelector('main').innerHTML = `<section class="container"><article class="card"><h2>Erreur</h2><p>${error.message}</p></article></section>`;
  });
