#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const FEATURE_URL =
  process.env.FEATURE_URL ||
  "https://services8.arcgis.com/IS3r9gAO1V8yuCqO/ArcGIS/rest/services/OpenGov_Map_Service_WFL1/FeatureServer/0/query";

async function lookupZoningDistrict(lat, lon) {
  if (typeof lat !== "number" || typeof lon !== "number") {
    throw new Error("lat and lon must be numbers");
  }

  if (!isFinite(lat) || !isFinite(lon)) {
    throw new Error("lat and lon must be finite numbers");
  }

  if (lat < -90 || lat > 90) {
    throw new Error("lat must be between -90 and 90");
  }

  if (lon < -180 || lon > 180) {
    throw new Error("lon must be between -180 and 180");
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
    outFields: "*",
    returnGeometry: "false",
  });

  const url = `${FEATURE_URL}?${params.toString()}`;
  
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const resp = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`ArcGIS query failed: ${resp.status} - ${text}`);
    }

    const data = await resp.json();

    if (data.error) {
      throw new Error(`ArcGIS error: ${JSON.stringify(data.error)}`);
    }

    const feature =
      Array.isArray(data.features) && data.features.length
        ? data.features[0]
        : null;

    if (!feature) {
      return {
        found: false,
        message: "No district found for that point.",
      };
    }

    const attrs = feature.attributes || {};
    const district =
      attrs.DISTRICT || attrs.ZONE || attrs.ZONING || attrs.District || "Unknown";

    return {
      found: true,
      district,
      attributes: attrs,
      layerId: feature.layerId ?? 0,
      source: "ArcGIS FeatureServer",
    };
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Request timeout: ArcGIS server took too long to respond');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

const server = new Server(
  {
    name: "lebanon-zoning-lookup",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "lookup_zoning_district",
        description:
          "Look up the zoning district for a location in Lebanon, NH using latitude and longitude coordinates. Returns the zoning district name and additional attributes from the ArcGIS FeatureServer.",
        inputSchema: {
          type: "object",
          properties: {
            lat: {
              type: "number",
              description: "Latitude coordinate (between -90 and 90)",
            },
            lon: {
              type: "number",
              description: "Longitude coordinate (between -180 and 180)",
            },
          },
          required: ["lat", "lon"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== "lookup_zoning_district") {
    throw new Error(`Unknown tool: ${request.params.name}`);
  }

  const { lat, lon } = request.params.arguments;

  try {
    const result = await lookupZoningDistrict(lat, lon);
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (err) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            error: err.message,
            example: { lat: 43.6426, lon: -72.2515 },
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Lebanon Zoning Lookup MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
