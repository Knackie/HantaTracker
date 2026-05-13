const fs = require("fs");
const https = require("https");

const DASHBOARD_ID = "5c68442d2afc42d7ba2696e4cd393729";
const ITEM_ID = "b8e81eac2762420fac16601290f547f6";
const LAYER_ID = "19dff6a5782-layer-2";
const OUTPUT = "data/arcgis_hantavirus.json";

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "HantaTrackerArcGIS/1.0" } }, (res) => {
        let body = "";

        res.on("data", (chunk) => {
          body += chunk;
        });

        res.on("end", () => {
          try {
            resolve(JSON.parse(body));
          } catch {
            console.log(body.slice(0, 1000));
            reject(new Error("Invalid JSON"));
          }
        });
      })
      .on("error", reject);
  });
}

function findLayer(obj) {
  if (!obj) return null;

  if (Array.isArray(obj.operationalLayers)) {
    for (const layer of obj.operationalLayers) {
      if (layer.id === LAYER_ID) return layer;

      if (Array.isArray(layer.layers)) {
        const subLayer = layer.layers.find((sub) => sub.id === LAYER_ID || String(sub.id) === "2");
        if (subLayer) return subLayer;
      }
    }
  }

  if (Array.isArray(obj.layers)) {
    for (const layer of obj.layers) {
      if (layer.id === LAYER_ID || String(layer.id) === "2") return layer;
    }
  }

  return null;
}

function toLonLat(geometry) {
  if (!geometry) return {};

  let x = geometry.x;
  let y = geometry.y;

  if (!Number.isFinite(x) || !Number.isFinite(y)) return {};

  if (Math.abs(x) > 180 || Math.abs(y) > 90) {
    const lon = (x * 180) / 20037508.34;
    const lat = (Math.atan(Math.exp((y * Math.PI) / 20037508.34)) * 360) / Math.PI - 90;
    return { lon, lat };
  }

  return { lon: x, lat: y };
}

function pick(attrs, names) {
  const keys = Object.keys(attrs || {});
  const lower = new Map(keys.map((key) => [key.toLowerCase(), key]));

  for (const name of names) {
    const exact = lower.get(name.toLowerCase());
    if (exact) return attrs[exact];
  }

  for (const key of keys) {
    const normalized = key.toLowerCase();

    if (names.some((name) => normalized.includes(name.toLowerCase()))) {
      return attrs[key];
    }
  }

  return "";
}

function clean(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function normalizeStatus(attrs) {
  return clean(
    pick(attrs, [
      "STATUS",
      "status",
      "CASE_STATUS",
      "classification",
      "outcome",
      "result",
      "type"
    ])
  );
}

function normalizeCountry(attrs) {
  return clean(
    pick(attrs, [
      "COUNTRY",
      "country",
      "COUNTRY_NAME",
      "LASTLOCATION",
      "location",
      "place",
      "nation"
    ])
  );
}

function normalizeTitle(attrs, index) {
  return (
    clean(
      pick(attrs, [
        "CASE_",
        "case",
        "CASE_ID",
        "id",
        "OBJECTID",
        "objectid",
        "name",
        "title"
      ])
    ) || `Cas ${index + 1}`
  );
}

function normalizeDate(attrs) {
  const raw = pick(attrs, [
    "DATE",
    "date",
    "REPORT_DATE",
    "reported",
    "created_date",
    "last_edited_date"
  ]);

  if (!raw) return "";

  if (typeof raw === "number") {
    const d = new Date(raw);
    if (!isNaN(d)) return d.toISOString().slice(0, 10);
  }

  const d = new Date(raw);
  if (!isNaN(d)) return d.toISOString().slice(0, 10);

  return clean(raw);
}

function classify(records) {
  let confirmed = 0;
  let suspected = 0;
  let deaths = 0;
  let monitoring = 0;
  let unknown = 0;

  for (const record of records) {
    const status = String(record.status || "").toLowerCase();

    if (
      status.includes("deceased") ||
      status.includes("death") ||
      status.includes("dead")
    ) {
      deaths++;
    } else if (status.includes("confirm")) {
      confirmed++;
    } else if (status.includes("suspect")) {
      suspected++;
    } else if (
      status.includes("monitoring") ||
      status.includes("quarantine")
    ) {
      monitoring++;
    } else {
      unknown++;
    }
  }

  return {
    totalCases: confirmed + suspected + deaths,
    confirmedCases: confirmed,
    suspectedCases: suspected,
    deaths,
    monitoring,
    unknown,
    totalRecords: records.length
  };
}

function buildTimeline(records) {
  const buckets = new Map();

  for (const record of records) {
    const date = record.date || new Date().toISOString().slice(0, 10);

    if (!buckets.has(date)) {
      buckets.set(date, {
        date,
        total: 0,
        confirmed: 0,
        deaths: 0
      });
    }

    const bucket = buckets.get(date);
    const status = String(record.status || "").toLowerCase();

    bucket.total++;

    if (status.includes("confirm")) bucket.confirmed++;

    if (
      status.includes("death") ||
      status.includes("deceased") ||
      status.includes("décès") ||
      status.includes("dead")
    ) {
      bucket.deaths++;
    }
  }

  let total = 0;
  let confirmed = 0;
  let deaths = 0;

  return [...buckets.values()]
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .map((item) => {
      total += item.total;
      confirmed += item.confirmed;
      deaths += item.deaths;

      return {
        date: item.date.slice(5) || item.date,
        total,
        confirmed,
        deaths
      };
    });
}

async function getLayerUrl() {
  const itemDataUrl =
    "https://www.arcgis.com/sharing/rest/content/items/" + ITEM_ID + "/data?f=json";

  const itemData = await fetchJson(itemDataUrl);
  const layer = findLayer(itemData);

  if (layer && layer.url) {
    return layer.url.replace(/\/$/, "");
  }

  const itemInfoUrl =
    "https://www.arcgis.com/sharing/rest/content/items/" + ITEM_ID + "?f=json";

  const itemInfo = await fetchJson(itemInfoUrl);

  if (itemInfo.url) {
    return itemInfo.url.replace(/\/$/, "") + "/2";
  }

  throw new Error("Impossible de trouver l’URL de couche ArcGIS depuis l’itemId.");
}

async function queryLayer(layerUrl) {
  const pageSize = 2000;
  let offset = 0;
  let allFeatures = [];

  while (true) {
    const url =
      layerUrl +
      "/query?where=1%3D1" +
      "&outFields=*" +
      "&returnGeometry=true" +
      "&f=json" +
      "&resultRecordCount=" +
      pageSize +
      "&resultOffset=" +
      offset;

    const json = await fetchJson(url);

    if (!json.features || !Array.isArray(json.features)) {
      console.log(JSON.stringify(json, null, 2).slice(0, 2000));
      throw new Error("La couche ne retourne pas de features.");
    }

    allFeatures = allFeatures.concat(json.features);

    if (!json.exceededTransferLimit || json.features.length === 0) {
      break;
    }

    offset += pageSize;
  }

  return allFeatures.map((feature, index) => {
    const attrs = feature.attributes || {};
    const coords = toLonLat(feature.geometry);

    return {
      title: normalizeTitle(attrs, index),
      status: normalizeStatus(attrs),
      country: normalizeCountry(attrs),
      date: normalizeDate(attrs),
      lat: coords.lat,
      lon: coords.lon,
      attributes: attrs,
    };
  });
}

async function main() {
  const layerUrl = await getLayerUrl();
  console.log("Layer URL:", layerUrl);

  const allRecords = await queryLayer(layerUrl);
  const records = allRecords.filter(
    (record) => Number.isFinite(record.lat) && Number.isFinite(record.lon)
  );

  const counts = classify(records);

  const output = {
    lastUpdate: new Date().toISOString().slice(0, 10),
    sourceName: "ArcGIS Dashboard - Hantavirus",
    dashboardId: DASHBOARD_ID,
    dashboardUrl: "https://www.arcgis.com/apps/dashboards/" + DASHBOARD_ID,
    sourceItemId: ITEM_ID,
    sourceLayerId: LAYER_ID,
    sourceLayerUrl: layerUrl,
    ...counts,
    timeline: buildTimeline(records),
    records
  };

  fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2) + "\n", "utf8");

  console.log(
    `OK: ${records.length} records, confirmed=${counts.confirmedCases}, suspected=${counts.suspectedCases}, deaths=${counts.deaths}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
