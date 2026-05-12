const fs = require("fs");
const https = require("https");

const POST_URL = "https://www.reddit.com/r/ContagionCuriosity/comments/1t5i3u3/hantavirus_outbreak_timeline/.json";
const OUTPUT = "data/reddit_hantavirus.json";

const COORDS = [
  ["Zurich", 47.3769, 8.5417],
  ["Johannesburg", -26.2041, 28.0473],
  ["South Africa", -30.5595, 22.9375],
  ["Netherlands", 52.1326, 5.2913],
  ["Amsterdam", 52.3676, 4.9041],
  ["Switzerland", 46.8182, 8.2275],
  ["Germany", 51.1657, 10.4515],
  ["France", 46.2276, 2.2137],
  ["Nebraska", 41.4925, -99.9018],
  ["Georgia", 32.1656, -82.9001],
  ["Spain", 40.4637, -3.7492],
  ["Alicante", 38.3452, -0.4810],
  ["Tristan da Cunha", -37.1052, -12.2777],
  ["Saint Helena", -15.9650, -5.7089],
  ["Cape Verde", 16.5388, -23.0418],
  ["Ushuaia", -54.8019, -68.3030],
  ["Argentina", -38.4161, -63.6167],
  ["Chile", -35.6751, -71.5430],
  ["Uruguay", -32.5228, -55.7658],
  ["USA", 37.0902, -95.7129],
  ["UK", 55.3781, -3.4360],
  ["British", 55.3781, -3.4360],
  ["Dutch", 52.1326, 5.2913],
  ["German", 51.1657, 10.4515],
  ["Swiss", 46.8182, 8.2275],
  ["French", 46.2276, 2.2137],
  ["American", 37.0902, -95.7129],
  ["Spanish", 40.4637, -3.7490]
];

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "HantaTrackerCommunityBot/1.0" } }, response => {
      let body = "";
      response.on("data", chunk => body += chunk);
      response.on("end", () => {
        try { resolve(JSON.parse(body)); }
        catch (error) { reject(new Error(`Invalid Reddit JSON: ${body.slice(0, 200)}`)); }
      });
    }).on("error", reject);
  });
}

function findNumber(pattern, text, fallback = 0) {
  const match = text.match(pattern);
  return match ? Number(match[1]) : fallback;
}

function normalizeLine(line) {
  return line.replace(/^[-*]\s*/, "").trim();
}

function locationFromText(text) {
  for (const [name, lat, lon] of COORDS) {
    if (new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(text)) {
      return { location: name, lat, lon };
    }
  }
  return { location: "", lat: null, lon: null };
}

function statusFromText(line, id) {
  const s = line.toLowerCase();

  if (s.includes("deceased") || s.includes("died")) {
    if (s.includes("confirmed")) return "confirmed deceased";
    return "probable deceased";
  }

  if (s.includes("confirmed hantavirus") || s.includes("tests positive") || s.includes("prelim positive")) return "confirmed";
  if (id.startsWith("Suspected")) {
    if (s.includes("tested negative") || s.includes("currently negative")) return "suspected negative";
    return "suspected";
  }
  if (s.includes("waiting on testing") || s.includes("symptomatic")) return "probable";
  return "listed";
}

function parseCaseRecords(text) {
  const records = [];
  const lines = text.split(/\r?\n/).map(normalizeLine).filter(Boolean);

  for (const line of lines) {
    const match = line.match(/^(Case\s+\d+|Suspected\s+Case\s+[A-Z])\s*:\s*(.+)$/i);
    if (!match) continue;

    const id = match[1].replace(/\s+/g, " ");
    const summary = match[2].trim();
    const loc = locationFromText(summary);
    const status = statusFromText(summary, id);

    records.push({
      id,
      summary,
      status,
      location: loc.location,
      lat: loc.lat,
      lon: loc.lon
    });
  }

  return records;
}

function parseTimeline(text, records) {
  const events = [];
  const monthMap = { Jan: "01", Feb: "02", March: "03", Apr: "04", April: "04", May: "05", Jun: "06", Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12" };

  const lines = text.split(/\r?\n/).map(normalizeLine).filter(Boolean);
  let currentDate = "";

  for (const line of lines) {
    const dateMatch = line.match(/^(\d{1,2})\s+(Jan|Feb|March|Apr|April|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/i);
    if (dateMatch) {
      currentDate = `2026-${monthMap[dateMatch[2]]}-${String(dateMatch[1]).padStart(2, "0")}`;
    }

    if (!currentDate) continue;

    const hasCase = /\bCase\s+\d+\b/i.test(line);
    const hasSuspected = /\bSuspected\s+Case\s+[A-Z]\b/i.test(line);
    const hasDeath = /\bdies\b|\bdied\b|\bdeceased\b/i.test(line);

    if (hasCase || hasSuspected || hasDeath) {
      events.push({ date: currentDate, line, hasCase, hasSuspected, hasDeath });
    }
  }

  const buckets = new Map();
  const caseSeen = new Set();
  const suspectSeen = new Set();
  const deathsSeen = new Set();

  for (const event of events.sort((a, b) => a.date.localeCompare(b.date))) {
    const caseMatches = [...event.line.matchAll(/\bCase\s+(\d+)\b/gi)].map(m => `Case ${m[1]}`);
    const suspectMatches = [...event.line.matchAll(/\bSuspected\s+Case\s+([A-Z])\b/gi)].map(m => `Suspected Case ${m[1]}`);

    caseMatches.forEach(c => caseSeen.add(c));
    suspectMatches.forEach(s => suspectSeen.add(s));

    if (event.hasDeath) caseMatches.forEach(c => deathsSeen.add(c));

    buckets.set(event.date, {
      date: event.date.slice(5),
      cases: caseSeen.size,
      suspected: suspectSeen.size,
      deaths: deathsSeen.size
    });
  }

  if (!buckets.size) {
    return [{ date: new Date().toISOString().slice(5, 10), cases: records.filter(r => r.id.startsWith("Case")).length, suspected: records.filter(r => r.id.startsWith("Suspected")).length, deaths: records.filter(r => r.status.includes("deceased")).length }];
  }

  return [...buckets.values()];
}

async function main() {
  const reddit = await fetchJson(POST_URL);
  const post = reddit?.[0]?.data?.children?.[0]?.data;

  if (!post || !post.selftext) {
    throw new Error("Reddit post selftext not found.");
  }

  const text = post.selftext;
  const redditLastUpdated = (text.match(/Last updated:\s*(.+)/i) || [])[1] || "";
  const records = parseCaseRecords(text);
  const caseRecords = records.filter(r => r.id.startsWith("Case"));
  const suspectedRecords = records.filter(r => r.id.startsWith("Suspected"));

  const counts = {
    confirmedProbable: findNumber(/Confirmed\/Probable Cases:[\s\S]{0,120}?(\d+)\s+cases/i, text, caseRecords.length),
    labConfirmed: findNumber(/(\d+)\s+with labs/i, text, caseRecords.filter(r => r.status.includes("confirmed")).length),
    suspected: findNumber(/(\d+)\s+suspected cases/i, text, suspectedRecords.length),
    deaths: findNumber(/(\d+)\s+deaths/i, text, records.filter(r => r.status.includes("deceased")).length)
  };

  const output = {
    lastParsed: new Date().toISOString().slice(0, 10),
    sourceType: "community",
    sourceWarning: "Reddit is a community source. Data must be verified against official public health sources.",
    redditPostUrl: POST_URL.replace(".json", ""),
    redditLastUpdated,
    title: post.title,
    author: post.author,
    counts,
    caseRecordsCount: caseRecords.length,
    suspectedRecordsCount: suspectedRecords.length,
    timeline: parseTimeline(text, records),
    records
  };

  fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2) + "\n", "utf8");
  console.log(`Parsed ${records.length} records from Reddit.`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
