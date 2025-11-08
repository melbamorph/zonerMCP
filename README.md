# **EXPERIMENTAL** Zoning Lookup MCP Server

A [Model Context Protocol](https://modelcontextprotocol.io) (MCP) server that provides AI agents with real-time access to zoning district information for Lebanon, New Hampshire. Query by street address or GPS coordinates to retrieve official zoning designations, property details, lot sizes, and owner information from the Lebanon GIS system.

[![MCP](https://img.shields.io/badge/MCP-Compatible-green)](https://modelcontextprotocol.io)
[![Node.js](https://img.shields.io/badge/Node.js-20+-blue)](https://nodejs.org)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

## Features

✨ **Two Lookup Methods**
- Query by GPS coordinates (latitude/longitude)
- Search by street address (full or partial)

🏘️ **Comprehensive Property Data**
- Official zoning designations (LD, R3, RL2, RL3, GC, etc.)
- Lot size in acres
- Parcel IDs and tax map numbers
- Utility service information (water, sewer)

🔓 **No API Key Required**
- Queries Lebanon's public ArcGIS FeatureServer directly
- No rate limits or authentication needed

🚀 **Remote Deployment**
- **SSE/HTTP transport**: Deploy to cloud and connect with OpenAI Agents SDK
- Runs as a web service on port 5000

## Quick Start

### Deploy and Use with OpenAI Agents

1. **Deploy to Replit, Railway, or your preferred platform**

2. **Use with OpenAI Agents SDK:**
```python
from agents import Agent, MCPServerSse, Runner

async with MCPServerSse(url="https://your-server.com/sse") as server:
    agent = Agent(name="Zoning Assistant", model="gpt-4", mcp_servers=[server])
    result = await Runner.run(agent, "What's the zoning for coordinates 43.6426, -72.2515?")
    print(result.final_output)
```

## Installation

### Prerequisites
- Node.js 20 or higher
- npm or yarn

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/lebanon-zoning-lookup.git
cd lebanon-zoning-lookup

# Install dependencies
npm install

# Start the server
npm start
```

The server runs as a web service on port 5000:
- SSE endpoint: `http://localhost:5000/sse`
- Health check: `http://localhost:5000/health`

## Available Tools

### 1. `lookup_zoning_by_coordinates`

Look up zoning information using GPS coordinates.

**Input:**
```json
{
  "lat": 43.6426,
  "lon": -72.2515
}
```

**Output:**
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

### 2. `lookup_zoning_by_address`

Search for properties by street address (supports partial matching).

**Input:**
```json
{
  "address": "14 Amsden St"
}
```

**Output:**
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
    "County": "Grafton",
    "Inc_Muni": "Lebanon",
    "State": "NH",
    "Zip_Code": "03766",
    "Parcel_ID": "0077 0048 00000",
    "d_gis_lot_size": 0.28,
    "d_gis_zone": "R3",
    "d_gis_owner1": "RANCOURT, WILLIAM",
    "Sewer": "Municipal Sewer",
    "Water": "Municipal Water"
  },
  "source": "Lebanon Master Address Table"
}
```

## Usage with AI Agents

### OpenAI Agents SDK (Python)

```python
import asyncio
from agents import Agent, MCPServerSse, Runner

async def main():
    async with MCPServerSse(url="https://your-deployment-url.com/sse") as server:
        agent = Agent(
            name="Zoning Assistant",
            model="gpt-4",
            mcp_servers=[server]
        )
        
        # Natural language queries
        result = await Runner.run(
            agent,
            "What's the zoning district for 81 Crafts Hill Road in Lebanon, NH?"
        )
        
        print(result.final_output)

asyncio.run(main())
```

### OpenAI Responses API

```python
from openai import OpenAI

client = OpenAI()

response = client.responses.create(
    model="gpt-4.1",
    tools=[
        {
            "type": "mcp",
            "server_label": "lebanon_zoning",
            "server_url": "https://your-deployment-url.com/sse",
            "require_approval": "never"
        }
    ],
    input="What is the zoning district for coordinates 43.6426, -72.2515?"
)

print(response.output_text)
```

## Example Queries

Once connected, AI agents can answer questions like:

**Coordinate-based:**
- "What's the zoning district for coordinates 43.6426, -72.2515?"
- "Look up the zoning for latitude 43.64 and longitude -72.25"

**Address-based:**
- "What's the zoning for 14 Amsden St in Lebanon, NH?"
- "Find all properties on Main Street"
- "What's the lot size for 81 Crafts Hill Road?"
- "Who owns the property at 123 Maple Street?"

**Property details:**
- "Show me all property information for 14 Amsden St"
- "What utilities are available at this address?"
- "What's the parcel ID for this property?"

## Deployment

### Deploy to Replit

1. Fork this repository to Replit
2. Configure as **Autoscale** deployment:
   - Run command: `node mcp-server.js`
   - Port: 5000
3. Click **Deploy**
4. Use your deployment URL: `https://your-repl.repl.co/sse`

### Deploy to Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Deploy to Render/Heroku

Standard Node.js deployment. Ensure:
- Start command: `node mcp-server.js`
- Port: Set via `PORT` environment variable (defaults to 5000)

## Configuration

Environment variables (optional):

```bash
PORT=5000                    # Server port (default: 5000)
ZONING_LAYER=24             # ArcGIS layer for zoning data
ADDRESS_LAYER=6             # ArcGIS layer for addresses
```

## API Endpoints (HTTP Mode)

- `GET /sse` - Establishes SSE connection for MCP protocol
- `POST /messages?sessionId=<id>` - Receives client messages
- `GET /health` - Server health check

## Lebanon Zoning Districts

Common zoning designations:
- **LD** - Low Density Residential
- **R3** - Residential 3
- **RL2** - Rural/Low Density 2
- **RL3** - Rural/Low Density 3
- **GC** - General Commercial
- And more...

## Development

### Project Structure

```
lebanon-zoning-lookup/
├── mcp-server.js           # Main MCP server (v3.0.0)
├── test-mcp-client.js      # Test client for verification
├── package.json            # Project configuration
├── README.md              # This file
├── replit.md              # Project documentation
└── reference/
    └── rest-api-server.js  # Original REST API (backup)
```

### Testing

Test the server locally:
```bash
# Start server
npm start

# In another terminal, test health endpoint
curl http://localhost:5000/health

# Test SSE connection
curl -N http://localhost:5000/sse
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Ideas for Contributions
- Add caching for frequently queried addresses
- Support for neighboring municipalities
- Additional property data fields
- Performance optimizations
- Documentation improvements

## License

ISC License - See [LICENSE](LICENSE) file for details

## Acknowledgments

- Data provided by the City of Lebanon, New Hampshire
- Built with the [Model Context Protocol SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- Inspired by the MCP community's mission to make data accessible to AI agents

## Support

- **Issues**: [GitHub Issues](https://github.com/melbamorph/lebanon-zoning-lookup/issues)
- **Lebanon GIS**: [City of Lebanon GIS](https://lebanonnh.gov/GIS)

---

**Note**: This is an unofficial tool and is not affiliated with the City of Lebanon, NH. All zoning data is sourced from publicly available GIS services. For official zoning determinations, please contact the Lebanon Planning Department.
