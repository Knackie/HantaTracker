const https = require("https");

const DASHBOARD_ID = "5c68442d2afc42d7ba2696e4cd393729";
const URL = `https://www.arcgis.com/sharing/rest/content/items/${DASHBOARD_ID}/data?f=json`;

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "HantaTrackerDebug/1.0" } }, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          console.log(body.slice(0, 1000));
          reject(new Error("Invalid JSON"));
        }
      });
    }).on("error", reject);
  });
}

function walk(obj, path = "") {
  if (!obj) return;

  if (typeof obj === "string") {
    if (
      obj.includes("FeatureServer") ||
      obj.includes("MapServer") ||
      obj.includes("itemId") ||
      obj.includes("layer")
    ) {
      console.log(path, "=>", obj);
    }
    return;
  }

  if (Array.isArray(obj)) {
    obj.forEach((item, index) => walk(item, `${path}[${index}]`));
    return;
  }

  if (typeof obj === "object") {
    for (const [key, value] of Object.entries(obj)) {
      if (
        key.toLowerCase().includes("item") ||
        key.toLowerCase().includes("layer") ||
        key.toLowerCase().includes("url") ||
        key.toLowerCase().includes("data")
      ) {
        console.log(path ? `${path}.${key}` : key, "=", value);
      }

      walk(value, path ? `${path}.${key}` : key);
    }
  }
}

async function main() {
  const json = await fetchJson(URL);

  console.log("Dashboard JSON loaded");
  console.log("Top-level keys:", Object.keys(json));

  walk(json);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
