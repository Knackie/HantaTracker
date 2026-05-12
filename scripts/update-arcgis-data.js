const fs = require("fs");
const https = require("https");

const DASHBOARD_ID = "5c68442d2afc42d7ba2696e4cd393729";
const DASHBOARD_DATA_URL = `https://www.arcgis.com/sharing/rest/content/items/${DASHBOARD_ID}/data?f=json`;
const OUTPUT = "data/arcgis_hantavirus.json";

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "HantaTrackerArcGIS/1.0" } }, response => {
      let body = "";
      response.on("data", chunk => body += chunk);
      response.on("end", () => {
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(new Error(`Invalid JSON from ${url}: ${body.slice(0, 120)}`));
        }
      });
    }).on("error", reject);
  });
}

function walk(value, urls = new Set()) {
  if (typeof value === "string") {
    const matches = value.match(/https:\/\/[^"'\\\s]+FeatureServer(?:\/\d+)?/gi);
    if (matches) matches.forEach(url => urls.add(url.replace(/\/$/, "")));
  } else if (Array.isArray(value)) {
    value.forEach(item => walk(item, urls));
  } else if (value && typeof value === "object") {
    Object.values(value).forEach(item => walk(item, urls));
  }
  return urls;
}

function normalizeLayerUrl(url) {
  if (/FeatureServer\/\d+$/i.test(url)) return url;
  return `${url.replace(/\/$/, "")}/0`;
}

function toLonLat(geometry) {
  if (!geometry) return {};
  let x = geometry.x;
  let y = geometry.y;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return {};

  if (Math.abs(x) > 180 || Math.abs(y) > 90) {
    const lon = x * 180 / 20037508.34;
    const lat = (Math.atan(Math.exp(y * Math.PI / 20037508.34)) * 360 / Math.PI) - 90;
    return { lon, lat };
  }

  return { lon: x, lat: y };
}

function pickField(attrs, candidates) {
  const keys = Object.keys(attrs || {});
  const lower = new Map(keys.map(k => [k.toLowerCase(), k]));

  for (const candidate of candidates) {
    if (lower.has(candidate.toLowerCase())) return attrs[lower.get(candidate.toLowerCase())];
  }

  for (const key of keys) {
    const lk = key.toLowerCase();
    if (candidates.some(c => lk.includes(c.toLowerCase()))) return attrs[key];
  }

  return "";
}

function statusOf(attrs) {
  return String(pickField(attrs, [
    "status", "case_status", "classification", "caseclassification", "outcome", "result", "type"
  ]) || "");
}

function countryOf(attrs) {
  return String(pickField(attrs, [
    "country", "country_name", "nation", "location", "place", "admin0", "name"
  ]) || "");
}

function titleOf(attrs, index) {
  return String(pickField(attrs, [
    "title", "name", "case_id", "id", "objectid", "globalid"
  ]) || `Cas ${index + 1}`);
}

function dateOf(attrs) {
  const raw = pickField(attrs, [
    "date", "report_date", "reported_date", "onset_date", "created_date", "last_edited_date", "date_reported"
  ]);

  if (!raw) return "";
  if (typeof raw === "number") {
    const d = new Date(raw);
    if (!isNaN(d)) return d.toISOString().slice(0, 10);
  }

  const d = new Date(raw);
  if (!isNaN(d)) return d.toISOString().slice(0, 10);

  return String(raw);
}

function classify(records) {
  let confirmed = 0;
  let suspected = 0;
  let deaths = 0;

  for (const record of records) {
    const s = String(record.status || "").toLowerCase();

    if (s.includes("confirm")) confirmed++;
    else if (s.includes("suspect") || s.includes("probable")) suspected++;

    if (s.includes("death") || s.includes("deceased") || s.includes("décès") || s.includes("dead")) deaths++;
  }

  return {
    totalCases: records.length,
    confirmedCases: confirmed,
    suspectedCases: suspected,
    deaths
  };
}

function buildTimeline(records) {
  const buckets = new Map();

  for (const record of records) {
    const date = record.date || new Date().toISOString().slice(0, 10);
    if (!buckets.has(date)) buckets.set(date, { date, total: 0, confirmed: 0, deaths: 0 });
    const bucket = buckets.get(date);
    bucket.total++;
    const status = String(record.status || "").toLowerCase();
    if (status.includes("confirm")) bucket.confirmed++;
    if (status.includes("death") || status.includes("deceased") || status.includes("décès") || status.includes("dead")) bucket.deaths++;
  }

  let runningTotal = 0;
  let runningConfirmed = 0;
  let runningDeaths = 0;

  return [...buckets.values()]
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .map(item => {
      runningTotal += item.total;
      runningConfirmed += item.confirmed;
      runningDeaths += item.deaths;
      return {
        date: item.date.slice(5) || item.date,
        total: runningTotal,
        confirmed: runningConfirmed,
        deaths: runningDeaths
      };
    });
}

async function queryLayer(layerUrl) {
  const queryUrl = `${layerUrl}/query?where=1%3D1&outFields=*&returnGeometry=true&f=json`;
  const json = await fetchJson(queryUrl);
  if (!json.features || !Array.isArray(json.features)) return [];

  return json.features.map((feature, index) => {
    const attrs = feature.attributes || {};
    const coords = toLonLat(feature.geometry);
    return {
      title: titleOf(attrs, index),
      status: statusOf(attrs),
      country: countryOf(attrs),
      date: dateOf(attrs),
      lat: coords.lat,
      lon: coords.lon,
      attributes: attrs
    };
  });
}

async function main() {
  const dashboard = await fetchJson(DASHBOARD_DATA_URL);
  const rawUrls = [...walk(dashboard)].map(normalizeLayerUrl);
  const uniqueUrls = [...new Set(rawUrls)];

  if (!uniqueUrls.length) {
    throw new Error("No public FeatureServer URL detected in dashboard JSON.");
  }

  let best = { url: "", records: [] };

  for (const url of uniqueUrls) {
    try {
      const records = await queryLayer(url);
      const geoRecords = records.filter(r => Number.isFinite(r.lat) && Number.isFinite(r.lon));
      if (geoRecords.length > best.records.length) {
        best = { url, records: geoRecords };
      }
    } catch (error) {
      console.warn(`Skipping ${url}: ${error.message}`);
    }
  }

  if (!best.records.length) {
    throw new Error("FeatureServer detected, but no geolocated records found.");
  }

  const counts = classify(best.records);
  const output = {
    lastUpdate: new Date().toISOString().slice(0, 10),
    sourceName: "ArcGIS Dashboard - Hantavirus",
    dashboardId: DASHBOARD_ID,
    dashboardUrl: `https://www.arcgis.com/apps/dashboards/${DASHBOARD_ID}`,
    sourceLayerUrl: best.url,
    ...counts,
    timeline: buildTimeline(best.records),
    records: best.records
  };

  fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2) + "\n", "utf8");
  console.log(`Wrote ${OUTPUT} from ${best.url} with ${best.records.length} records.`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
