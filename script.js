async function loadData() {
  const fallback = {
    lastUpdate: "Non synchronisé",
    sourceName: "ArcGIS Dashboard - Hantavirus",
    sourceLayerUrl: "",
    totalCases: 0,
    confirmedCases: 0,
    suspectedCases: 0,
    deaths: 0,
    timeline: [],
    records: []
  };

  try {
    const response = await fetch("data/arcgis_hantavirus.json", { cache: "no-store" });
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

  if (s.includes("death") || s.includes("deceased") || s.includes("décès") || s.includes("dead")) return "#d92d20";
  if (s.includes("confirm")) return "#1479d6";
  if (s.includes("suspect") || s.includes("probable")) return "#f79009";

  return "#667085";
}

function renderChart(data) {
  const canvas = document.getElementById("casesChart");
  if (!canvas || typeof Chart === "undefined") return;

  const timeline = data.timeline || [];

  new Chart(canvas, {
    type: "line",
    data: {
      labels: timeline.map((item) => item.date),
      datasets: [
        {
          label: "Cas documentés",
          data: timeline.map((item) => item.total),
          borderColor: "#1479d6",
          backgroundColor: "rgba(20, 121, 214, 0.14)",
          fill: true,
          tension: 0.25,
          pointRadius: 4,
          borderWidth: 3
        },
        {
          label: "Confirmés",
          data: timeline.map((item) => item.confirmed),
          borderColor: "#079455",
          backgroundColor: "rgba(7, 148, 85, 0.08)",
          fill: true,
          tension: 0.25,
          pointRadius: 4,
          borderWidth: 3
        },
        {
          label: "Décès",
          data: timeline.map((item) => item.deaths),
          borderColor: "#d92d20",
          backgroundColor: "rgba(217, 45, 32, 0.08)",
          fill: true,
          tension: 0.25,
          pointRadius: 4,
          borderWidth: 3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: "index"
      },
      plugins: {
        legend: {
          position: "top",
          align: "end",
          labels: {
            usePointStyle: true,
            color: "#475467",
            font: {
              family: "Inter",
              weight: "700"
            }
          }
        },
        tooltip: {
          backgroundColor: "#101828",
          padding: 12
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            color: "#667085"
          },
          grid: {
            color: "rgba(16, 24, 40, 0.08)"
          },
          border: {
            display: false
          }
        },
        x: {
          ticks: {
            color: "#667085"
          },
          grid: {
            color: "rgba(16, 24, 40, 0.05)"
          },
          border: {
            display: false
          }
        }
      }
    }
  });
}

function renderMap(data) {
  const mapElement = document.getElementById("worldMap");
  if (!mapElement || typeof L === "undefined") return;

  const map = L.map("worldMap", {
    scrollWheelZoom: false,
    worldCopyJump: true
  }).setView([20, 0], 2);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 8,
    attribution: "&copy; OpenStreetMap"
  }).addTo(map);

  const records = (data.records || []).filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lon));

  records.forEach((item) => {
    const color = colorForStatus(item.status);
    const marker = L.circleMarker([item.lat, item.lon], {
      radius: 10,
      color,
      weight: 2,
      fillColor: color,
      fillOpacity: 0.24
    }).addTo(map);

    marker.bindPopup(`
      <strong>${item.title || item.country || "Cas documenté"}</strong><br>
      Statut : ${item.status || "Non renseigné"}<br>
      Pays / lieu : ${item.country || "Non renseigné"}<br>
      Date : ${item.date || "Non renseignée"}
    `);
  });

  if (records.length > 1) {
    const bounds = L.latLngBounds(records.map((item) => [item.lat, item.lon]));
    map.fitBounds(bounds.pad(0.25));
  }
}

loadData().then((data) => {
  setText("lastUpdate", data.lastUpdate || "Non renseignée");
  setText("dataSourceName", data.sourceName || "ArcGIS Dashboard - Hantavirus");
  setText("totalCases", data.totalCases ?? 0);
  setText("confirmedCases", data.confirmedCases ?? 0);
  setText("suspectedCases", data.suspectedCases ?? 0);
  setText("deaths", data.deaths ?? 0);
  setText("monitoringCases", data.monitoring ?? 0);
  setText("totalRecords", data.totalRecords ?? 0);
  setText("miniTotal", data.totalCases ?? 0);
  setText("miniConfirmed", data.confirmedCases ?? 0);
  setText("miniSuspected", data.suspectedCases ?? 0);
  setText("miniDeaths", data.deaths ?? 0);

  const layerLink = document.getElementById("featureLayerLink");

  if (layerLink && data.sourceLayerUrl) {
    layerLink.href = data.sourceLayerUrl;
    layerLink.textContent = "Couche ArcGIS utilisée";
  } else if (layerLink) {
    layerLink.style.display = "none";
  }

  setText(
    "sourceLayerText",
    data.sourceLayerUrl
      ? `Couche utilisée : ${data.sourceLayerUrl}`
      : "Aucune couche ArcGIS n'a encore été générée. Lance le workflow GitHub Actions."
  );

  renderChart(data);
  renderMap(data);
});
