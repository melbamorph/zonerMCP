# Lebanon Zoning Lookup MCP Server

## Overview
A Model Context Protocol (MCP) server that provides zoning district lookup functionality for Lebanon, NH. This server exposes an AI tool that can be used by Claude, ChatGPT, and other AI agents to query the ArcGIS FeatureServer and retrieve zoning district information based on geographic coordinates.

**Current State**: Fully functional MCP server with `lookup_zoning_district` tool, comprehensive error handling, input validation, and timeout protection.

## Recent Changes
- **November 6, 2025**: Converted to MCP server
  - Replaced Express REST API with MCP server implementation
  - Exposed `lookup_zoning_district` as an AI-accessible tool
  - Added stdio transport for AI agent communication
  - Implemented strict coordinate validation (lat: -90 to 90, lon: -180 to 180)
  - Added 10-second timeout for ArcGIS requests
  - Enhanced error handling for ArcGIS API failures
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
├── mcp-server.js           # Main MCP server
├── test-mcp-client.js      # Test client for verification
├── package.json            # Project configuration
├── replit.md              # Project documentation
└── reference/
    └── rest-api-server.js  # Original REST API (backup)
```

## MCP Tool: lookup_zoning_district

### Description
Look up the zoning district for a location in Lebanon, NH using latitude and longitude coordinates. Returns the zoning district name and additional attributes from the ArcGIS FeatureServer.

### Input Schema
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

### Response Format

**Success (District Found)**:
```json
{
  "found": true,
  "district": "Unknown",
  "attributes": {
    "OBJECTID": 1,
    "Shape__Area": 13963296.026534647,
    "Shape__Length": 244307.70063052434
  },
  "layerId": 0,
  "source": "ArcGIS FeatureServer"
}
```

**No District Found**:
```json
{
  "found": false,
  "message": "No district found for that point."
}
```

**Error Response**:
```json
{
  "error": "lat must be between -90 and 90",
  "example": {
    "lat": 43.6426,
    "lon": -72.2515
  }
}
```

## Features
- **AI Agent Integration**: Works with Claude, ChatGPT, and other MCP-compatible AI assistants
- **Input Validation**: Validates latitude (-90 to 90) and longitude (-180 to 180) ranges
- **Timeout Protection**: 10-second timeout on ArcGIS requests to prevent hung connections
- **Error Handling**: Comprehensive handling of invalid inputs, ArcGIS API failures, and timeouts
- **Tool Discovery**: AI agents can automatically discover and understand the tool via MCP protocol

## Configuration
- **ArcGIS URL**: Configurable via `FEATURE_URL` environment variable
- Default FeatureServer: `https://services8.arcgis.com/IS3r9gAO1V8yuCqO/ArcGIS/rest/services/OpenGov_Map_Service_WFL1/FeatureServer/0/query`

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
- Tool discovery (lists available tools)
- Valid coordinate lookup
- Invalid coordinate error handling
- Out-of-bounds location handling

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
- "What's the zoning district for coordinates 43.6426, -72.2515?"
- "Look up the zoning for latitude 43.64 and longitude -72.25"
- "Check zoning at 43.6426, -72.2515 in Lebanon, NH"

The agent will automatically call the `lookup_zoning_district` tool and interpret the results.

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
- **No Database Required**: The server is stateless and queries ArcGIS in real-time

## Development Notes

### ES Modules
This project uses ES modules (`"type": "module"` in package.json). All imports use `.js` extensions and ES6 import syntax.

### Error Handling Philosophy
- Validate inputs early with clear error messages
- Set timeouts to prevent hung requests
- Check for both HTTP errors and ArcGIS error payloads
- Provide helpful examples in error responses

### Testing Strategy
The included test client validates:
1. Server connection and tool discovery
2. Successful lookups with valid coordinates
3. Validation errors with invalid coordinates
4. "Not found" responses for out-of-bounds locations

## User Preferences
- User wants MCP server for AI agent integration
- Focus on tool accessibility for building agents
- Stateless design preferred (no database needed)
