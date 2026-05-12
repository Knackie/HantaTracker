async function loadDashboardData() {
  const defaults = {
    lastUpdate: "2026-05-08",
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
      interaction: {
        intersect: false,
        mode: "index"
      },
      plugins: {
        legend: {
          position: "top",
          align: "end",
          labels: {
            boxWidth: 10,
            boxHeight: 10,
            usePointStyle: true,
            color: "#475467",
            font: {
              family: "Inter",
              size: 13,
              weight: "700"
            }
          }
        },
        tooltip: {
          backgroundColor: "#101828",
          padding: 12,
          titleFont: {
            family: "Inter",
            size: 13,
            weight: "700"
          },
          bodyFont: {
            family: "Inter",
            size: 13
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          suggestedMax: 10,
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

loadDashboardData().then(data => {
  setText("totalCases", data.totalCases);
  setText("confirmedCases", data.confirmedCases);
  setText("suspectedCases", data.suspectedCases);
  setText("deaths", data.deaths);
  setText("fatalityRate", data.fatalityRate);
  renderChart(data);
});
