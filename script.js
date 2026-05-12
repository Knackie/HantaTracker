async function loadDashboardData() {
  const defaults = {
    lastUpdate: "2026-05-08",
    event: "Cluster associé au MV Hondius",
    summary: "Données initiales issues du bulletin OMS du 8 mai 2026.",
    totalCases: 8,
    confirmedCases: 6,
    suspectedCases: 2,
    deaths: 3,
    fatalityRate: "37,5%",
    timeline: [
      { date: "01/05", total: 1, confirmed: 0 },
      { date: "02/05", total: 1, confirmed: 0 },
      { date: "03/05", total: 2, confirmed: 1 },
      { date: "04/05", total: 3, confirmed: 2 },
      { date: "05/05", total: 4, confirmed: 3 },
      { date: "06/05", total: 6, confirmed: 4 },
      { date: "07/05", total: 6, confirmed: 5 },
      { date: "08/05", total: 8, confirmed: 6 }
    ],
    locations: [
      { name: "MV Hondius - signalement initial", lat: 14.92, lon: -23.51, cases: 8, type: "cluster" }
    ]
  };

  try {
    const response = await fetch("data/hantavirus.json", { cache: "no-store" });
    if (!response.ok) return defaults;
    return await response.json();
  } catch {
    return defaults;
  }
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function renderChart(data) {
  const canvas = document.getElementById("casesChart");
  if (!canvas || typeof Chart === "undefined") return;

  const timeline = data.timeline || [];

  new Chart(canvas, {
    type: "line",
    data: {
      labels: timeline.map(item => item.date),
      datasets: [
        {
          label: "Cas totaux",
          data: timeline.map(item => item.total),
          borderColor: "#1479d6",
          backgroundColor: "rgba(20, 121, 214, 0.14)",
          pointBackgroundColor: "#1479d6",
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 3,
          fill: true,
          tension: 0.35
        },
        {
          label: "Cas confirmés",
          data: timeline.map(item => item.confirmed),
          borderColor: "#d92d20",
          backgroundColor: "rgba(217, 45, 32, 0.08)",
          pointBackgroundColor: "#d92d20",
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 3,
          fill: true,
          tension: 0.35
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: "index" },
      plugins: {
        legend: {
          position: "top",
          align: "end",
          labels: {
            boxWidth: 10,
            boxHeight: 10,
            usePointStyle: true,
            color: "#475467",
            font: { family: "Inter", size: 13, weight: "700" }
          }
        },
        tooltip: {
          backgroundColor: "#101828",
          padding: 12,
          titleFont: { family: "Inter", size: 13, weight: "700" },
          bodyFont: { family: "Inter", size: 13 }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          suggestedMax: Math.max(10, ...timeline.map(item => item.total || 0)) + 1,
          ticks: { stepSize: 1, color: "#667085" },
          grid: { color: "rgba(16, 24, 40, 0.08)" },
          border: { display: false }
        },
        x: {
          ticks: { color: "#667085" },
          grid: { color: "rgba(16, 24, 40, 0.05)" },
          border: { display: false }
        }
      }
    }
  });
}

function markerSize(cases) {
  if (!cases || cases <= 1) return 10;
  if (cases <= 5) return 14;
  if (cases <= 10) return 18;
  return 24;
}

function renderMap(data) {
  const mapElement = document.getElementById("worldMap");
  if (!mapElement || typeof L === "undefined") return;

  const map = L.map("worldMap", {
    scrollWheelZoom: false,
    worldCopyJump: true
  }).setView([28, -10], 2);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 7,
    attribution: "&copy; OpenStreetMap"
  }).addTo(map);

  const locations = data.locations || [];

  locations.forEach(location => {
    const size = markerSize(location.cases);
    const color = location.type === "cluster" ? "#d92d20" : "#1479d6";

    const marker = L.circleMarker([location.lat, location.lon], {
      radius: size,
      color,
      weight: 2,
      fillColor: color,
      fillOpacity: 0.25
    }).addTo(map);

    marker.bindPopup(`
      <strong>${location.name}</strong><br>
      ${location.cases ?? "—"} cas associés<br>
      <small>${location.note || ""}</small>
    `);
  });

  if (locations.length > 1) {
    const bounds = L.latLngBounds(locations.map(location => [location.lat, location.lon]));
    map.fitBounds(bounds.pad(0.3));
  }
}

loadDashboardData().then(data => {
  setText("lastUpdate", data.lastUpdate || "Non renseignée");
  setText("eventName", data.event || "Signalement suivi");
  setText("totalCases", data.totalCases ?? "—");
  setText("confirmedCases", data.confirmedCases ?? "—");
  setText("suspectedCases", data.suspectedCases ?? "—");
  setText("deaths", data.deaths ?? "—");
  setText("fatalityRate", data.fatalityRate || "—");
  setText("clusterTitle", data.event || "Cluster suivi");
  setText("clusterSummary", data.summary || "Informations chargées depuis le fichier JSON public.");
  setText("miniTotal", data.totalCases ?? "—");
  setText("miniConfirmed", data.confirmedCases ?? "—");
  setText("miniSuspected", data.suspectedCases ?? "—");
  setText("miniDeaths", data.deaths ?? "—");

  renderChart(data);
  renderMap(data);
});
