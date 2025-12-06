# MCP Server Template for OpenAI Agent Builder

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![MCP Protocol](https://img.shields.io/badge/MCP-2024--11--05-purple.svg)](https://modelcontextprotocol.io)

A minimal, reusable [Model Context Protocol](https://modelcontextprotocol.io) (MCP) server template designed for use with OpenAI Agent Builder and other MCP-compatible AI platforms. This template uses Streamable HTTP transport for broad compatibility.

## Design Philosophy

This template is intentionally **minimal and UI-agnostic**. It provides only the MCP server infrastructure, allowing you to:

- Connect it to **any AI interface** (OpenAI Agent Builder, Claude, custom UIs, etc.)
- Build your own frontend or use existing AI chat interfaces.
- Focus on your business logic without UI constraints.
- Deploy as a standalone microservice.

The template includes a working example (Lebanon, NH zoning lookup) that demonstrates the pattern. Replace it with your own data source and tools.

## Quick Start

```bash
npm install
npm start
```

The server runs on port 5000. The MCP endpoint is available at `POST /mcp`.

## Customization Checklist

When forking this template, update the following:

### Required Changes

- [ ] **`config.js`** - Update all values:
  - `SERVER_NAME` - Your project name (e.g., "anytown-permits")
  - `LOCATION_NAME` - Your municipality/region (e.g., "Anytown, USA")
  - `DATA_SOURCES` - Your data source names
  - `TOOL_DESCRIPTIONS` - Descriptions for your tools
  - `ERROR_EXAMPLES` - Example values for your location
  - `ZONING_LAYER`, `ADDRESS_LAYER` - Your layer IDs

- [ ] **Secrets** - Add required secrets:
  - `ARCGIS_BASE_URL` - Your FeatureServer endpoint URL (see Environment Variables section)

- [ ] **`package.json`** - Update:
  - `name` - Your package name
  - `description` - What your server does
  - `author` - Your name or organization
  - `keywords` - Relevant keywords

- [ ] **`mcp-server.js`** - Update business logic:
  - Modify `lookupZoningByCoordinates()` and `lookupZoningByAddress()` for your data
  - Update `TOOLS` array with your tool definitions
  - Update `TOOL_HANDLERS` to map tools to functions

### Optional Changes

- [ ] **`.env`** - Copy from `.env.example` and set your environment variables
- [ ] **`README.md`** - Update documentation for your use case

## Using with OpenAI Agent Builder

1. Deploy this server to a publicly accessible URL (e.g., using Replit Deployments)
2. In OpenAI Agent Builder, add a new MCP tool
3. Enter your server URL with the `/mcp` endpoint (e.g., `https://your-app.replit.app/mcp`)
4. The Agent Builder will automatically discover your available tools

## Project Structure

```
config.js          # All customizable configuration (START HERE)
mcp-server.js      # Main server file with business logic
package.json       # Dependencies and scripts
.env.example       # Example environment variables
.gitignore         # Git ignore rules
```

## Customizing for Your Use Case

### Step 1: Update Configuration (`config.js`)

All location-specific strings and API endpoints are centralized in `config.js`:

```javascript
export const SERVER_NAME = "my-city-lookup";
export const LOCATION_NAME = "My City, ST";
export const DATA_SOURCES = {
  zoningLayer: "My City Zoning Data",
  addressTable: "My City Address Database",
};
```

### Step 2: Update Business Logic (`mcp-server.js`)

The server is organized into sections:

**Section 1: Business Logic Functions**
Implement your tool functions here. Each function should:
- Accept the parameters defined in your tool's inputSchema
- Return a result object (will be JSON stringified for the AI)
- Throw an Error with a helpful message if something goes wrong

**Section 2: Tool Definitions**
Define your MCP tools with:
- `name`: Unique identifier (snake_case recommended)
- `description`: What the tool does (imported from config.js)
- `inputSchema`: JSON Schema defining the parameters

Then add handlers in `TOOL_HANDLERS` to connect tools to your functions.

**Section 3: MCP Boilerplate**
Standard MCP protocol handling. Rarely needs modification.

## Example Tool Definition

```javascript
const TOOLS = [
  {
    name: "my_custom_tool",
    description: "Description of what this tool does",
    inputSchema: {
      type: "object",
      properties: {
        param1: {
          type: "string",
          description: "Description of param1",
        },
      },
      required: ["param1"],
    },
  },
];

const TOOL_HANDLERS = {
  my_custom_tool: async (args) => {
    return await myFunction(args.param1);
  },
};
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/mcp` | POST | Main MCP endpoint (initialize, tools/list, tools/call) |
| `/mcp` | GET | Server info (without session) or SSE stream (with session) |
| `/mcp` | DELETE | Session termination |
| `/health` | GET | Health check |

## Example Response

When an AI calls your tool, it receives a JSON response:

```json
{
  "found": true,
  "district": "R-1",
  "attributes": { ... },
  "source": "Your Data Source"
}
```

## Environment Variables & Secrets

### Required Secret

This server requires the data source URL to be stored as a **secret** (not in code):

| Secret Name | Description |
|-------------|-------------|
| `ARCGIS_BASE_URL` | Your FeatureServer endpoint URL (required) |

**On Replit:** Add this in the Secrets tab (padlock icon in the Tools panel).

**Why a secret?** While the endpoint may be publicly accessible, storing it as a secret keeps it out of the public codebase and prevents unintended discovery.

### Optional Environment Variables

These can be set as regular environment variables or secrets:

```bash
PORT=5000                    # Server port (default: 5000)
ZONING_LAYER=24              # Your zoning layer ID
ADDRESS_LAYER=6              # Your address layer ID
```

## Features

- **Streamable HTTP Transport**: Works with OpenAI Agent Builder and MCP Inspector
- **Stateless Client Support**: Auto-initializes sessions for clients that don't handle the MCP handshake
- **CORS Enabled**: Ready for cross-origin requests
- **Health Check Endpoint**: For monitoring and load balancers
- **Centralized Configuration**: Easy customization via `config.js`

## Dependencies

- `@modelcontextprotocol/sdk`: MCP protocol implementation
- `express`: HTTP server
- `cors`: Cross-origin support

## License

ISC License - See LICENSE file for details.
