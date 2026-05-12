async function loadData() {
  const fallback = {
    lastParsed: "Non synchronisé",
    redditLastUpdated: "Non renseigné",
    counts: { confirmedProbable: 0, labConfirmed: 0, suspected: 0, deaths: 0 },
    timeline: [],
    records: []
  };

  try {
    const response = await fetch("data/reddit_hantavirus.json", { cache: "no-store" });
    if (!response.ok) return fallback;
    return await response.json();
  } catch {
    return fallback;
  }
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function colorForStatus(status) {
  const s = String(status || "").toLowerCase();
  if (s.includes("deceased")) return "#d92d20";
  if (s.includes("confirmed")) return "#1479d6";
  if (s.includes("probable")) return "#7a5af8";
  if (s.includes("negative")) return "#667085";
  return "#f79009";
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
        { label: "Cas listés", data: timeline.map(i => i.cases), borderColor: "#1479d6", backgroundColor: "rgba(20,121,214,.14)", fill: true, tension: .25, pointRadius: 4, borderWidth: 3 },
        { label: "Suspects", data: timeline.map(i => i.suspected), borderColor: "#f79009", backgroundColor: "rgba(247,144,9,.10)", fill: true, tension: .25, pointRadius: 4, borderWidth: 3 },
        { label: "Décès", data: timeline.map(i => i.deaths), borderColor: "#d92d20", backgroundColor: "rgba(217,45,32,.08)", fill: true, tension: .25, pointRadius: 4, borderWidth: 3 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: "index" },
      plugins: { legend: { position: "top", align: "end", labels: { usePointStyle: true, color: "#475467", font: { family: "Inter", weight: "700" } } }, tooltip: { backgroundColor: "#101828", padding: 12 } },
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1, color: "#667085" }, grid: { color: "rgba(16,24,40,.08)" }, border: { display: false } }, x: { ticks: { color: "#667085" }, grid: { color: "rgba(16,24,40,.05)" }, border: { display: false } } }
    }
  });
}

function renderMap(data) {
  const mapElement = document.getElementById("worldMap");
  if (!mapElement || typeof L === "undefined") return;

  const map = L.map("worldMap", { scrollWheelZoom: false, worldCopyJump: true }).setView([20, 0], 2);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 8, attribution: "&copy; OpenStreetMap" }).addTo(map);

  const records = (data.records || []).filter(item => Number.isFinite(item.lat) && Number.isFinite(item.lon));

  records.forEach(item => {
    const color = colorForStatus(item.status);
    const marker = L.circleMarker([item.lat, item.lon], { radius: 10, color, weight: 2, fillColor: color, fillOpacity: .24 }).addTo(map);
    marker.bindPopup(`<strong>${item.id}</strong><br>${item.status}<br>${item.location || "Lieu déduit"}<br><small>${item.summary || ""}</small>`);
  });

  if (records.length > 1) {
    const bounds = L.latLngBounds(records.map(item => [item.lat, item.lon]));
    map.fitBounds(bounds.pad(.25));
  }
}

loadData().then(data => {
  setText("lastUpdate", data.lastParsed || "Non renseigné");
  setText("redditUpdated", data.redditLastUpdated ? `Post Reddit : ${data.redditLastUpdated}` : "Date Reddit non détectée");
  setText("confirmedProbable", data.counts?.confirmedProbable ?? 0);
  setText("labConfirmed", data.counts?.labConfirmed ?? 0);
  setText("suspectedCases", data.counts?.suspected ?? 0);
  setText("deaths", data.counts?.deaths ?? 0);
  setText("miniCases", data.caseRecordsCount ?? 0);
  setText("miniConfirmed", data.counts?.labConfirmed ?? 0);
  setText("miniSuspected", data.counts?.suspected ?? 0);
  setText("miniDeaths", data.counts?.deaths ?? 0);

  renderChart(data);
  renderMap(data);
});
