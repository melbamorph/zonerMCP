#!/usr/bin/env node

import express from "express";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const BASE_URL = "https://services8.arcgis.com/IS3r9gAO1V8yuCqO/ArcGIS/rest/services/OpenGov_Map_Service_WFL1/FeatureServer";
const ZONING_LAYER = process.env.ZONING_LAYER || "24";
const ADDRESS_LAYER = process.env.ADDRESS_LAYER || "6";

async function lookupZoningByCoordinates(lat, lon) {
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

  const url = `${BASE_URL}/${ZONING_LAYER}/query?${params.toString()}`;
  
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
        message: "No zoning district found for that location.",
      };
    }

    const attrs = feature.attributes || {};
    const district =
      attrs.ACAD_TEXT || attrs.ZONE || attrs.ZONING || attrs.DISTRICT || attrs.District || attrs.NAME || "Unknown";

    return {
      found: true,
      district,
      attributes: attrs,
      coordinates: { lat, lon },
      source: "Lebanon Official Zoning Layer",
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

async function lookupZoningByAddress(address) {
  if (typeof address !== "string" || !address.trim()) {
    throw new Error("address must be a non-empty string");
  }

  const addressUpper = address.toUpperCase().trim();
  const escapedAddress = addressUpper.replace(/'/g, "''");
  
  const parts = addressUpper.split(/\s+/);
  let whereClause;
  
  if (parts.length > 1 && /^\d/.test(parts[0])) {
    const addressNumber = parts[0].replace(/'/g, "''");
    const streetName = parts.slice(1).join(' ').replace(/'/g, "''");
    whereClause = `UPPER(AddNo_Full) LIKE '%${addressNumber}%' AND UPPER(StNam_Full) LIKE '%${streetName}%'`;
  } else {
    whereClause = `UPPER(StNam_Full) LIKE '%${escapedAddress}%' OR UPPER(AddNo_Full) LIKE '%${escapedAddress}%'`;
  }
  
  const params = new URLSearchParams({
    f: "json",
    where: whereClause,
    outFields: "*",
    returnGeometry: "false",
    resultRecordCount: "10",
  });

  const url = `${BASE_URL}/${ADDRESS_LAYER}/query?${params.toString()}`;
  
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

    if (!Array.isArray(data.features) || data.features.length === 0) {
      return {
        found: false,
        message: "No addresses found matching your search. Try using just the street name or number.",
      };
    }

    const matches = data.features.map(feature => {
      const attrs = feature.attributes || {};
      return {
        address: `${attrs.AddNo_Full || ''} ${attrs.StNam_Full || ''}`.trim(),
        district: attrs.d_gis_zone || "Unknown",
        coordinates: {
          lat: attrs.Latitude,
          lon: attrs.Longitude,
        },
        allAttributes: attrs,
      };
    });

    if (matches.length === 1) {
      return {
        found: true,
        ...matches[0],
        source: "Lebanon Master Address Table",
      };
    } else {
      return {
        found: true,
        multipleMatches: true,
        count: matches.length,
        matches: matches,
        message: `Found ${matches.length} matching addresses. Please be more specific.`,
        source: "Lebanon Master Address Table",
      };
    }
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
    version: "3.0.0",
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
        name: "lookup_zoning_by_coordinates",
        description:
          "Look up the zoning district for a location in Lebanon, NH using latitude and longitude coordinates. Returns the official zoning district from the Lebanon GIS Official Zoning layer.",
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
      {
        name: "lookup_zoning_by_address",
        description:
          "Look up the zoning district for a location in Lebanon, NH using a street address. Searches the Lebanon Master Address Table and returns the zoning district along with the full address and coordinates. Returns multiple matches if the address is ambiguous.",
        inputSchema: {
          type: "object",
          properties: {
            address: {
              type: "string",
              description: "Street address or partial address to search for (e.g., '123 Main Street', 'Main St', or just '123')",
            },
          },
          required: ["address"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const toolName = request.params.name;

  try {
    let result;

    if (toolName === "lookup_zoning_by_coordinates") {
      const { lat, lon } = request.params.arguments;
      result = await lookupZoningByCoordinates(lat, lon);
    } else if (toolName === "lookup_zoning_by_address") {
      const { address } = request.params.arguments;
      result = await lookupZoningByAddress(address);
    } else {
      throw new Error(`Unknown tool: ${toolName}`);
    }

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
            examples: {
              coordinates: { lat: 43.6426, lon: -72.2515 },
              address: "123 Main Street"
            },
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

const app = express();
app.use(express.json());

const transports = new Map();

app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '3.0.0', activeConnections: transports.size });
});

app.get('/sse', async (req, res) => {
  console.log('SSE connection request received');
  
  const transport = new SSEServerTransport('/messages', res);
  
  transports.set(transport.sessionId, transport);
  console.log(`Transport created: ${transport.sessionId}`);
  
  res.on('close', () => {
    console.log(`Connection closed: ${transport.sessionId}`);
    transports.delete(transport.sessionId);
  });
  
  await server.connect(transport);
});

app.post('/messages', async (req, res) => {
  const sessionId = req.query.sessionId;
  console.log(`POST /messages - Session: ${sessionId}`);
  
  const transport = transports.get(sessionId);
  if (!transport) {
    return res.status(400).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Invalid session. Please establish SSE connection first.'
      },
      id: null
    });
  }
  
  await transport.handlePostMessage(req, res, req.body);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Lebanon Zoning Lookup MCP Server v3.0.0 running on port ${PORT}`);
  console.log(`Using Zoning Layer ${ZONING_LAYER} and Address Layer ${ADDRESS_LAYER}`);
  console.log(`SSE endpoint: http://0.0.0.0:${PORT}/sse`);
  console.log(`Health check: http://0.0.0.0:${PORT}/health`);
});
