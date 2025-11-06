// server.js
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const app = express();

// --- config ---
const PORT = process.env.PORT || 8080;
const FEATURE_URL =
  process.env.FEATURE_URL ||
  "https://services8.arcgis.com/IS3r9gAO1V8yuCqO/ArcGIS/rest/services/OpenGov_Map_Service_WFL1/FeatureServer/0/query";

// --- middleware ---
app.use(express.json());
app.use(
  cors({
    origin: "*", // dev-friendly; tighten later to your ChatKit domain
  })
);
app.use(
  "/lookup_zoning_district",
  rateLimit({
    windowMs: 60 * 1000,
    max: 60, // at most 60 lookups per minute
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// --- health check ---
app.get("/healthz", (_req, res) => {
  res.json({ ok: true, featureUrl: FEATURE_URL });
});

// --- core endpoint ---
app.post("/lookup_zoning_district", async (req, res) => {
  try {
    const { lat, lon } = req.body || {};

    if (typeof lat !== "number" || typeof lon !== "number") {
      return res.status(400).json({
        error: "lat and lon must be numbers",
        example: { lat: 43.6426, lon: -72.2515 },
      });
    }

    const params = new URLSearchParams({
      f: "json",
      geometry: JSON.stringify({
        x: lon,
        y: lat,
        spatialReference: { wkid: 4326 },
      }),
      geometryType: "esriGeometryPoint",
      inSR: "4326",
      spatialRel: "esriSpatialRelIntersects",
      outFields: "*", // you can narrow this later to only needed fields
      returnGeometry: "false",
    });

    const url = `${FEATURE_URL}?${params.toString()}`;
    const resp = await fetch(url);
    if (!resp.ok) {
      const text = await resp.text();
      return res.status(502).json({ error: "ArcGIS query failed", status: resp.status, body: text });
    }
    const data = await resp.json();

    const feature = Array.isArray(data.features) && data.features.length ? data.features[0] : null;
    if (!feature) {
      return res.json({ found: false, message: "No district found for that point." });
    }

    // Try common field names; adjust as needed for your layer
    const attrs = feature.attributes || {};
    const district =
      attrs.DISTRICT || attrs.ZONE || attrs.ZONING || attrs.District || "Unknown";

    return res.json({
      found: true,
      district,
      attributes: attrs,
      layerId: feature.layerId ?? 0,
      source: "ArcGIS FeatureServer",
    });
  } catch (err) {
    console.error("Lookup error:", err);
    return res.status(500).json({ error: "Server error during lookup." });
  }
});

// --- start ---
app.listen(PORT, () => {
  console.log(`Zoning lookup server listening on http://localhost:${PORT}`);
});
