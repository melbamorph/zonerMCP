# Lebanon Zoning Lookup MCP Server

## Overview
A Model Context Protocol (MCP) server that provides zoning district lookup functionality for Lebanon, NH. This server exposes AI tools that can be used by Claude, ChatGPT, and other AI agents to query the Lebanon GIS system and retrieve zoning district information using either geographic coordinates or street addresses.

**Current State**: Fully functional MCP server v2.0 with two tools: coordinate-based and address-based zoning lookups. Features comprehensive error handling, input validation, and timeout protection.

## Recent Changes
- **November 6, 2025**: Major update to v2.0
  - Fixed coordinate lookup to use correct layer (24 - Official_Zoning)
  - Added address-based lookup using Master Address Table (layer 6)
  - Renamed tool to `lookup_zoning_by_coordinates` for clarity
  - Added new tool `lookup_zoning_by_address` for street address searches
  - Eliminated need for external geocoding API - all data from Lebanon GIS
  - Updated field extraction to use ACAD_TEXT for zoning designations
  - Enhanced test client to verify both tools

- **November 6, 2025**: Initial MCP conversion
  - Replaced Express REST API with MCP server implementation
  - Exposed zoning lookup as an AI-accessible tool
  - Added stdio transport for AI agent communication
  - Implemented strict coordinate validation (lat: -90 to 90, lon: -180 to 180)
  - Added 10-second timeout for ArcGIS requests
  - Moved old REST API to `reference/` folder for backup

- **October 20, 2025**: Initial project setup
  - Created Express server with POST endpoint
  - Integrated ArcGIS FeatureServer for zoning data queries

## Project Architecture

### Technology Stack
- **Runtime**: Node.js 20 (ES Modules)
- **Protocol**: Model Context Protocol (MCP)
- **Transport**: stdio (standard input/output)
- **Dependencies**:
  - `@modelcontextprotocol/sdk`: MCP server implementation

### Project Structure
```
lebanon-zoning-lookup/
├── mcp-server.js           # Main MCP server (v2.0)
├── test-mcp-client.js      # Test client for verification
├── package.json            # Project configuration
├── replit.md              # Project documentation
└── reference/
    └── rest-api-server.js  # Original REST API (backup)
```

### Data Sources
- **Layer 24 (Official_Zoning)**: Official zoning district polygons with designations in ACAD_TEXT field
- **Layer 6 (Master Address Table)**: Complete address database with coordinates and zoning in d_gis_zone field
- **Base URL**: `https://services8.arcgis.com/IS3r9gAO1V8yuCqO/ArcGIS/rest/services/OpenGov_Map_Service_WFL1/FeatureServer`

## MCP Tools

### 1. lookup_zoning_by_coordinates

Look up the zoning district for a location using latitude and longitude coordinates. Queries the Official Zoning layer (24) directly.

#### Input Schema
```json
{
  "lat": {
    "type": "number",
    "description": "Latitude coordinate (between -90 and 90)"
  },
  "lon": {
    "type": "number",
    "description": "Longitude coordinate (between -180 and 180)"
  }
}
```

#### Response Format

**Success (District Found)**:
```json
{
  "found": true,
  "district": "LD",
  "attributes": {
    "OBJECTID": 4,
    "ACAD_TEXT": "LD",
    "ACRES": 86.00585972,
    "maplot": "106-46"
  },
  "coordinates": {
    "lat": 43.6426,
    "lon": -72.2515
  },
  "source": "Lebanon Official Zoning Layer"
}
```

**No District Found**:
```json
{
  "found": false,
  "message": "No zoning district found for that location."
}
```

### 2. lookup_zoning_by_address

Look up the zoning district for a location using a street address. Searches the Master Address Table (layer 6) which contains all Lebanon addresses with associated zoning districts.

#### Input Schema
```json
{
  "address": {
    "type": "string",
    "description": "Street address or partial address (e.g., '123 Main Street', 'Main St', or '123')"
  }
}
```

#### Response Format

**Single Match**:
```json
{
  "found": true,
  "address": "14 AMSDEN ST",
  "district": "R3",
  "coordinates": {
    "lat": 43.64703254,
    "lon": -72.25890275
  },
  "zipCode": "03766",
  "matId": "{ED471DE2-3CFB-4130-9006-B42FB087DADE}",
  "source": "Lebanon Master Address Table"
}
```

**Multiple Matches**:
```json
{
  "found": true,
  "multipleMatches": true,
  "count": 10,
  "matches": [
    {
      "address": "81 CRAFTS HILL RD",
      "district": "RL3",
      "coordinates": {
        "lat": 43.65456668,
        "lon": -72.29464665
      },
      "zipCode": "03784",
      "matId": "{...}"
    }
  ],
  "message": "Found 10 matching addresses. Please be more specific.",
  "source": "Lebanon Master Address Table"
}
```

**No Match**:
```json
{
  "found": false,
  "message": "No addresses found matching your search. Try using just the street name or number."
}
```

**Error Response**:
```json
{
  "error": "address must be a non-empty string",
  "examples": {
    "coordinates": { "lat": 43.6426, "lon": -72.2515 },
    "address": "123 Main Street"
  }
}
```

## Features
- **AI Agent Integration**: Works with Claude, ChatGPT, and other MCP-compatible AI assistants
- **Dual Lookup Methods**: Query by coordinates OR street address
- **No API Key Required**: All data comes directly from Lebanon's public GIS system
- **Input Validation**: Validates latitude/longitude ranges and address format
- **Timeout Protection**: 10-second timeout on ArcGIS requests to prevent hung connections
- **Multiple Match Handling**: Returns all matches when address search is ambiguous
- **Error Handling**: Comprehensive handling of invalid inputs, ArcGIS API failures, and timeouts
- **Tool Discovery**: AI agents can automatically discover and understand both tools via MCP protocol

## Configuration
- **ZONING_LAYER**: Layer ID for official zoning (default: 24)
- **ADDRESS_LAYER**: Layer ID for address table (default: 6)
- **BASE_URL**: Configurable ArcGIS FeatureServer base URL

## Running the Server

### Start MCP Server
```bash
npm start
```

The server runs on stdio and waits for MCP client connections.

### Testing the Server
```bash
node test-mcp-client.js
```

This test client verifies:
- Tool discovery (lists both tools)
- Coordinate lookup with valid/invalid inputs
- Address lookup with exact match, partial match, and error cases
- Proper error handling and validation

## Using with AI Agents

### Claude Desktop
Add to your Claude Desktop MCP configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "lebanon-zoning": {
      "command": "node",
      "args": ["/path/to/lebanon-zoning-lookup/mcp-server.js"]
    }
  }
}
```

### Example Agent Usage
Once configured, AI agents can use natural language:

**Coordinate-based:**
- "What's the zoning district for coordinates 43.6426, -72.2515?"
- "Look up the zoning for latitude 43.64 and longitude -72.25"

**Address-based:**
- "What's the zoning for 123 Main Street in Lebanon, NH?"
- "Look up zoning for Main Street"
- "Find zoning districts on Maple Street"

The agent will automatically choose the appropriate tool and interpret the results.

## Zoning Districts
Common Lebanon zoning designations found in ACAD_TEXT field:
- **LD**: Low Density Residential
- **R3**: Residential 3
- **RL2**: Rural/Low Density 2
- **RL3**: Rural/Low Density 3
- **GC**: General Commercial
- (Additional zones available in the Official Zoning layer)

## Publishing Recommendations

### Deployment Type
**Recommended**: VM Deployment (not Autoscale)

### Why VM?
- MCP servers use stdio transport, not HTTP
- Need persistent process that AI clients can connect to
- Stateless but requires continuous availability for agent connections

### Configuration
- **Deployment Target**: VM
- **Run Command**: `npm start`
- **No Database Required**: The server is stateless and queries Lebanon GIS in real-time
- **No API Keys Required**: All data from public Lebanon GIS layers

## Development Notes

### ES Modules
This project uses ES modules (`"type": "module"` in package.json). All imports use `.js` extensions and ES6 import syntax.

### Error Handling Philosophy
- Validate inputs early with clear error messages
- Set timeouts to prevent hung requests
- Check for both HTTP errors and ArcGIS error payloads
- Provide helpful examples in error responses
- Return multiple matches for ambiguous address searches

### Testing Strategy
The included test client validates:
1. Server connection and tool discovery (2 tools)
2. Successful coordinate lookups with valid inputs
3. Validation errors with invalid coordinates
4. "Not found" responses for out-of-bounds locations
5. Address searches with exact matches, partial matches, and errors
6. Empty/invalid address handling

## User Preferences
- User wants MCP server for AI agent integration
- Focus on tool accessibility for building agents
- Stateless design preferred (no database needed)
- Wanted address-based lookup in addition to coordinates
- No external API keys preferred - using Lebanon's own GIS data
