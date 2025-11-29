#!/usr/bin/env node

import express from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// ============================================================================
// SECTION 1: SERVER CONFIGURATION
// ============================================================================
// Customize these values for your MCP server

const SERVER_NAME = "lebanon-zoning-lookup";
const SERVER_VERSION = "3.2.0";
const PORT = process.env.PORT || 5000;

// ============================================================================
// SECTION 2: YOUR CUSTOM CONFIGURATION
// ============================================================================
// Add your own configuration variables here

const BASE_URL = "https://services8.arcgis.com/IS3r9gAO1V8yuCqO/ArcGIS/rest/services/OpenGov_Map_Service_WFL1/FeatureServer";
const ZONING_LAYER = process.env.ZONING_LAYER || "24";
const ADDRESS_LAYER = process.env.ADDRESS_LAYER || "6";

// ============================================================================
// SECTION 3: YOUR BUSINESS LOGIC FUNCTIONS
// ============================================================================
// Implement your tool functions here. These are the functions that do the
// actual work when a tool is called. Each function should:
// - Accept the parameters defined in your tool's inputSchema
// - Return a result object (will be JSON stringified for the AI)
// - Throw an Error with a helpful message if something goes wrong

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

// ============================================================================
// SECTION 4: TOOL DEFINITIONS
// ============================================================================
// Define your MCP tools here. Each tool needs:
// - name: A unique identifier (snake_case recommended)
// - description: What the tool does (helps AI decide when to use it)
// - inputSchema: JSON Schema defining the parameters
//
// Then add the tool to the TOOL_HANDLERS map below to connect it to your function.

const TOOLS = [
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
];

const TOOL_HANDLERS = {
  lookup_zoning_by_coordinates: async (args) => {
    return await lookupZoningByCoordinates(args.lat, args.lon);
  },
  lookup_zoning_by_address: async (args) => {
    return await lookupZoningByAddress(args.address);
  },
};

const ERROR_EXAMPLES = {
  coordinates: { lat: 43.6426, lon: -72.2515 },
  address: "123 Main Street"
};

// ============================================================================
// SECTION 5: MCP SERVER BOILERPLATE (Rarely needs modification)
// ============================================================================
// The code below handles the MCP protocol, session management, and HTTP
// transport. You typically don't need to modify this unless you're adding
// advanced features like authentication or custom middleware.

function createMcpServer() {
  const mcpServer = new Server(
    {
      name: SERVER_NAME,
      version: SERVER_VERSION,
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: TOOLS };
  });

  mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
    const toolName = request.params.name;
    const handler = TOOL_HANDLERS[toolName];

    if (!handler) {
      throw new Error(`Unknown tool: ${toolName}`);
    }

    try {
      const result = await handler(request.params.arguments);
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
              examples: ERROR_EXAMPLES,
            }, null, 2),
          },
        ],
        isError: true,
      };
    }
  });

  return mcpServer;
}

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Cache-Control', 'mcp-session-id', 'last-event-id', 'mcp-protocol-version'],
  exposedHeaders: ['mcp-session-id', 'last-event-id', 'mcp-protocol-version'],
  credentials: false
}));

app.use(express.json());

const transports = new Map();

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    version: SERVER_VERSION, 
    activeConnections: transports.size,
    timestamp: new Date().toISOString()
  });
});

async function createAndInitializeSession() {
  const sessionServer = createMcpServer();
  let resolveSessionId;
  const sessionIdPromise = new Promise((resolve) => { resolveSessionId = resolve; });

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    onsessioninitialized: (newSessionId) => {
      console.log(`[${new Date().toISOString()}] Session initialized: ${newSessionId}`);
      transports.set(newSessionId, transport);
      resolveSessionId(newSessionId);
    }
  });

  sessionServer.onclose = async () => {
    const sid = transport.sessionId;
    if (sid && transports.has(sid)) {
      console.log(`[${new Date().toISOString()}] Session closed: ${sid}`);
      transports.delete(sid);
    }
  };

  await sessionServer.connect(transport);
  
  return { transport, sessionServer, sessionIdPromise };
}

app.post('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  const method = req.body?.method;
  
  console.log(`[${new Date().toISOString()}] POST /mcp - Method: ${method}, Session: ${sessionId || 'none'}`);

  try {
    if (sessionId && transports.has(sessionId)) {
      const transport = transports.get(sessionId);
      await transport.handleRequest(req, res, req.body);
      return;
    }
    
    if (method === 'initialize') {
      const { transport } = await createAndInitializeSession();
      await transport.handleRequest(req, res, req.body);
      return;
    }
    
    console.log(`[${new Date().toISOString()}] Auto-initializing session for stateless client`);
    
    const { transport, sessionIdPromise } = await createAndInitializeSession();
    
    const initRequest = {
      jsonrpc: '2.0',
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'auto-init', version: '1.0.0' }
      },
      id: `auto-init-${Date.now()}`
    };
    
    const { PassThrough } = await import('node:stream');
    const mockRes = new PassThrough();
    mockRes.setHeader = () => {};
    mockRes.writeHead = () => {};
    mockRes.status = () => mockRes;
    mockRes.json = () => {};
    mockRes.end = () => {};
    
    const mockReq = {
      method: 'POST',
      headers: { ...req.headers },
      body: initRequest
    };
    delete mockReq.headers['mcp-session-id'];
    
    await transport.handleRequest(mockReq, mockRes, initRequest);
    
    const newSessionId = await sessionIdPromise;
    res.setHeader('mcp-session-id', newSessionId);
    
    const modifiedReq = {
      ...req,
      headers: {
        ...req.headers,
        'mcp-session-id': newSessionId
      }
    };
    
    await transport.handleRequest(modifiedReq, res, req.body);
    
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error:`, err.message);
    
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: `Internal error: ${err.message}`
        },
        id: req.body?.id ?? null
      });
    }
  }
});

app.get('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  
  if (!sessionId) {
    res.json({
      name: SERVER_NAME,
      version: SERVER_VERSION,
      protocol: 'mcp',
      protocolVersion: '2024-11-05',
      transport: 'streamable-http',
      description: `${SERVER_NAME} MCP Server - POST /mcp with initialize method to start`,
      tools: TOOLS.map(t => t.name)
    });
    return;
  }
  
  if (!transports.has(sessionId)) {
    res.status(400).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Session not found or expired',
      },
      id: null
    });
    return;
  }

  const transport = transports.get(sessionId);
  await transport.handleRequest(req, res);
});

app.delete('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  
  if (!sessionId || !transports.has(sessionId)) {
    res.status(400).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'No valid session ID provided',
      },
      id: null
    });
    return;
  }

  try {
    const transport = transports.get(sessionId);
    await transport.handleRequest(req, res);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Session termination error:`, err.message);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Error handling session termination',
        },
        id: null
      });
    }
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[${new Date().toISOString()}] ${SERVER_NAME} v${SERVER_VERSION} running on port ${PORT}`);
  console.log(`[${new Date().toISOString()}] MCP endpoint: POST http://0.0.0.0:${PORT}/mcp`);
  console.log(`[${new Date().toISOString()}] Health check: GET http://0.0.0.0:${PORT}/health`);
});
