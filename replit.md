# Lebanon Zoning Lookup MCP Server

## Overview
A Model Context Protocol (MCP) server that provides zoning district lookup functionality for Lebanon, NH. This server exposes AI tools that can be used by Claude, ChatGPT, and other AI agents to query the Lebanon GIS system and retrieve zoning district information using either geographic coordinates or street addresses.

**Current State**: Fully functional MCP server v3.1.0 with HTTP/SSE transport for remote deployment and OpenAI integration. Two tools: coordinate-based and address-based zoning lookups. Features comprehensive error handling, input validation, timeout protection, CORS support, and SSE keep-alive pings. All GIS layer fields are now exposed to AI agents for complete property data access.

## Recent Changes
- **November 27, 2025**: Stability update v3.1.0 - Connection Reliability
  - Added CORS headers to allow OpenAI agent connections from any origin
  - Added SSE keep-alive pings (every 15 seconds) to prevent connection timeouts
  - Fixed "Session terminated" error (code 32600) during address lookups
  - Improved error handling with timestamped logging for debugging
  - Added session error recovery and better cleanup on disconnect
  - Added `cors` package dependency

- **November 8, 2025**: Major v3.0.0 - HTTP/SSE Transport for OpenAI
  - Converted from stdio to SSE (Server-Sent Events) HTTP transport for cloud deployment
  - Added Express web server on port 5000
  - Compatible with OpenAI Agents SDK and Responses API
  - Health check endpoint at /health
  - SSE MCP endpoint at /sse
  - Deployed as web server for remote AI agent access

- **November 7, 2025**: Enhanced v2.1 - Full Field Access
  - Updated both tools to return ALL available fields from Lebanon GIS layers
  - Address lookups now include 27 fields: property owners, lot size, parcel IDs, utilities, and more
  - Coordinate lookups return complete zoning layer attributes including acreage and boundaries
  - All property data accessible to AI agents for comprehensive queries

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
- **Transport**: SSE (Server-Sent Events) over HTTP
- **Web Server**: Express.js on port 5000
- **Dependencies**:
  - `@modelcontextprotocol/sdk`: MCP server implementation
  - `express`: HTTP server for SSE transport
  - `cors`: Cross-origin resource sharing middleware

### Project Structure
```
lebanon-zoning-lookup/
├── mcp-server.js           # Main MCP server (v3.1.0)
├── test-mcp-client.js      # Test client for verification
├── package.json            # Project configuration
├── replit.md              # Project documentation
└── reference/
    └── rest-api-server.js  # Original REST API (backup)
```

### Endpoints
- **SSE Connection**: `GET http://your-server:5000/sse` - Establishes SSE stream (server → client)
- **Message Handler**: `POST http://your-server:5000/messages?sessionId=<id>` - Receives client messages (client → server)
- **Health Check**: `GET http://your-server:5000/health` - Server status and active connections

### Data Sources

**Layer 24 (Official_Zoning)** - 8 fields:
- `OBJECTID`: Unique object identifier
- `Text_`: Parcel text identifier
- `maplot`: Map lot number
- `ACAD_TEXT`: Zoning district code (e.g., "LD", "R3")
- `ACRES`: Acreage of the zone
- `F2017_CHANGE`: Flag for 2017 zoning changes
- `Shape__Area`: Polygon area in square units
- `Shape__Length`: Polygon perimeter length

**Layer 6 (Master Address Table)** - 27 fields:
- `OBJECTID`: Unique object identifier
- `AddNo_Full`: Full address number (including suffixes like "14A")
- `StNam_Full`: Full street name
- `SubAddress`: Sub-address (apt/unit)
- `County`, `Inc_Muni`, `Nbrhd_Comm`, `State`, `Zip_Code`: Location details
- `Longitude`, `Latitude`: GPS coordinates
- `Parcel_ID`: Tax parcel identifier
- `MATID`: Master Address Table ID
- `Sewer`, `Water`: Utility service information
- `propertyid`: Property ID reference
- `d_gis_lot_size`: Lot size in acres
- `d_gis_zone`: Zoning district
- `d_gis_owner1`, `d_gis_owner2`: Property owner names
- `d_gis_own_addr1`, `d_gis_own_city`, `d_gis_own_state`, `d_gis_own_zip`: Owner address
- `d_gis_ls_book`, `d_gis_ls_page`: Land sale book/page references
- `D_GIS_PRC_USRFLD_02`: Additional parcel field

**Base URL**: `https://services8.arcgis.com/IS3r9gAO1V8yuCqO/ArcGIS/rest/services/OpenGov_Map_Service_WFL1/FeatureServer`

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
  "allAttributes": {
    "OBJECTID": 123,
    "AddNo_Full": "14",
    "StNam_Full": "AMSDEN ST",
    "SubAddress": null,
    "County": "Grafton",
    "Inc_Muni": "Lebanon",
    "State": "NH",
    "Zip_Code": "03766",
    "Longitude": -72.25890275,
    "Latitude": 43.64703254,
    "Parcel_ID": "0077 0048 00000",
    "MATID": "{ED471DE2-3CFB-4130-9006-B42FB087DADE}",
    "Sewer": "Municipal Sewer",
    "Water": "Municipal Water",
    "propertyid": "...",
    "d_gis_lot_size": 0.28,
    "d_gis_zone": "R3",
    "d_gis_owner1": "RANCOURT, WILLIAM",
    "d_gis_owner2": null,
    "d_gis_own_addr1": "...",
    "...": "... (all 27 fields included)"
  },
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
      "allAttributes": {
        "OBJECTID": 456,
        "AddNo_Full": "81",
        "StNam_Full": "CRAFTS HILL RD",
        "d_gis_zone": "RL3",
        "d_gis_lot_size": 2.5,
        "d_gis_owner1": "SMITH, JOHN",
        "...": "... (all 27 fields included)"
      }
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

The server starts an HTTP server on port 5000 with SSE transport for MCP connections.

## Using with AI Agents

### OpenAI Agents SDK (Python)

**Installation:**
```bash
pip install openai-agents
```

**Basic Usage:**
```python
import asyncio
from agents import Agent, MCPServerSse, Runner

async def main():
    # Connect to the MCP server via SSE
    async with MCPServerSse(
        url="http://your-replit-url:5000/sse"
    ) as server:
        agent = Agent(
            name="Zoning Assistant",
            model="gpt-4",
            mcp_servers=[server]
        )
        
        result = await Runner.run(
            agent,
            "What's the zoning for 14 Amsden St in Lebanon, NH?"
        )
        
        print(result.final_output)

asyncio.run(main())
```

### OpenAI Responses API (Direct)

**Using the Responses API with MCP:**
```python
from openai import OpenAI

client = OpenAI()

response = client.responses.create(
    model="gpt-4.1",
    tools=[
        {
            "type": "mcp",
            "server_label": "lebanon_zoning",
            "server_url": "http://your-replit-url:5000/sse",
            "require_approval": "never"
        }
    ],
    input="What is the zoning district for coordinates 43.6426, -72.2515?"
)

print(response.output_text)
```

### Example Queries
Once connected, AI agents can use natural language:

**Coordinate-based:**
- "What's the zoning district for coordinates 43.6426, -72.2515?"
- "Look up the zoning for latitude 43.64 and longitude -72.25"

**Address-based:**
- "What's the zoning for 14 Amsden St in Lebanon, NH?"
- "Look up zoning for Main Street"
- "Find zoning districts on Maple Street"
- "Show me property details for 81 Crafts Hill Rd"

The agent will automatically discover tools, choose the appropriate one, and interpret the results including all property data fields.

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
**Recommended**: Autoscale Deployment

### Why Autoscale?
- MCP server runs as HTTP web service on port 5000
- SSE transport is HTTP-based and works with autoscale
- Stateless server - no persistent state to maintain
- Cost-effective for intermittent AI agent requests
- Automatically scales to zero when not in use

### Configuration
- **Deployment Target**: Autoscale
- **Run Command**: `node mcp-server.js`
- **Port**: 5000 (required for webview)
- **No Database Required**: The server is stateless and queries Lebanon GIS in real-time
- **No API Keys Required**: All data from public Lebanon GIS layers

### After Publishing
Your MCP server will be available at:
- SSE endpoint: `https://your-repl-name.your-username.repl.co/sse`
- Health check: `https://your-repl-name.your-username.repl.co/health`

Use the SSE endpoint URL in your OpenAI Agents SDK or Responses API configuration.

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
