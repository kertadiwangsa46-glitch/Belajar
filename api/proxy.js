// pages/api/proxy.js
// 🧩 Universal Proxy untuk Komikstation (anti-CORS, dynamic slug, full endpoint support)
// Deploy langsung di Vercel/Next.js

export const config = {
  api: {
    bodyParser: false,
  },
};

const BASE_URL = "https://www.sankavollerei.com";
const ALLOWLIST = [BASE_URL];

// Semua endpoint dasar Komikstation
const KOMIKSTATION_ENDPOINTS = {
  list: "/comic/komikstation/list",
  home: "/comic/komikstation/home",
  popular: "/comic/komikstation/popular",
  recommendation: "/comic/komikstation/recommendation",
  "top-weekly": "/comic/komikstation/top-weekly",
  ongoing: "/comic/komikstation/ongoing",
  "az-list": "/comic/komikstation/az-list",
  genres: "/comic/komikstation/genres",
  genre: "/comic/komikstation/genre",
  search: "/comic/komikstation/search",
  manga: "/comic/komikstation/manga",
  chapter: "/comic/komikstation/chapter"
};

// ✅ Validasi domain target
function isAllowed(url) {
  try {
    const origin = new URL(url).origin;
    return ALLOWLIST.includes(origin);
  } catch {
    return false;
  }
}

// ✅ Bangun target URL dinamis dari path
function buildTarget(reqPath, queryString) {
  // contoh reqPath: /komikstation/manga/solo-leveling
  const parts = reqPath.split("/").filter(Boolean);
  const prefix = parts[0]; // komikstation
  const action = parts[1]; // manga, search, list, dll
  const extra = parts.slice(2).join("/"); // slug, query, page, dsb.

  if (prefix !== "komikstation") return null;
  const basePath = KOMIKSTATION_ENDPOINTS[action];
  if (!basePath) return null;

  let full = `${BASE_URL}${basePath}`;
  if (extra) full += `/${extra}`;
  if (queryString) full += `?${queryString}`;

  return full;
}

// ✅ Handler utama
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();

  const [pathPart, queryPart] = req.url.replace(/^\/?api\/proxy\/?/, "").split("?");
  const target = buildTarget(`/${pathPart}`, queryPart);

  if (!target || !isAllowed(target)) {
    return res.status(400).json({
      success: false,
      error: "Endpoint tidak dikenal atau domain tidak diizinkan.",
      hint: "Gunakan path seperti /api/proxy/komikstation/home atau /api/proxy/komikstation/manga/solo-leveling"
    });
  }

  try {
    const upstream = await fetch(target, { method: "GET" });
    const text = await upstream.text();
    const contentType = upstream.headers.get("content-type");
    res.setHeader("Content-Type", contentType || "application/json");
    res.status(upstream.status).send(text);
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "Gagal fetch dari upstream",
      details: err.message
    });
  }
}
