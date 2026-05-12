const fs = require("fs");
const https = require("https");

const DATA_PATH = "data/hantavirus.json";
const SOURCE_URL = "https://www.who.int/emergencies/disease-outbreak-news/item/2026-DON600";

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        "User-Agent": "HantaTrackerBot/1.0 (+https://github.com/knackie/HantaTracker)"
      }
    }, response => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        return resolve(fetchUrl(response.headers.location));
      }

      let data = "";
      response.on("data", chunk => data += chunk);
      response.on("end", () => resolve(data));
    }).on("error", reject);
  });
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function firstNumber(patterns, text, fallback) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) return Number(match[1]);
  }
  return fallback;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function todayLabel() {
  const now = new Date();
  return `${String(now.getUTCDate()).padStart(2, "0")}/${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

async function main() {
  const current = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  const html = await fetchUrl(SOURCE_URL);
  const text = stripHtml(html);

  const totalCases = firstNumber([
    /([0-9]+)\s+cases?\b/i,
    /cluster[^.]{0,80}?([0-9]+)\s+(?:confirmed\s+and\s+suspected\s+)?cases?/i
  ], text, current.totalCases);

  const confirmedCases = firstNumber([
    /([0-9]+)\s+confirmed\s+cases?/i,
    /([0-9]+)\s+laboratory-confirmed\s+cases?/i,
    /([0-9]+)\s+cases?\s+were\s+confirmed/i
  ], text, current.confirmedCases);

  const deaths = firstNumber([
    /([0-9]+)\s+deaths?/i,
    /including\s+([0-9]+)\s+deaths?/i
  ], text, current.deaths);

  const suspectedCases = Math.max(0, totalCases - confirmedCases);
  const fatalityRate = totalCases > 0
    ? `${String(((deaths / totalCases) * 100).toFixed(1)).replace(".", ",")}%`
    : current.fatalityRate;

  const timeline = Array.isArray(current.timeline) ? [...current.timeline] : [];
  const lastPoint = timeline[timeline.length - 1];
  const label = todayLabel();

  if (!lastPoint || lastPoint.total !== totalCases || lastPoint.confirmed !== confirmedCases) {
    timeline.push({ date: label, total: totalCases, confirmed: confirmedCases });
  }

  const updated = {
    ...current,
    lastUpdate: todayIso(),
    sourceUrl: SOURCE_URL,
    totalCases,
    confirmedCases,
    suspectedCases,
    deaths,
    fatalityRate,
    timeline
  };

  fs.writeFileSync(DATA_PATH, JSON.stringify(updated, null, 2) + "\n", "utf8");
  console.log(`HantaTracker updated: total=${totalCases}, confirmed=${confirmedCases}, deaths=${deaths}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
