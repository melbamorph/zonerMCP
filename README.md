# MCP Server Template for OpenAI Agent Builder

A reusable [Model Context Protocol](https://modelcontextprotocol.io) (MCP) server template designed for use with OpenAI Agent Builder and other MCP-compatible AI platforms. This template uses Streamable HTTP transport for broad compatibility.

## Quick Start

```bash
npm install
npm start
```

The server runs on port 5000. The MCP endpoint is available at `POST /mcp`.

## Using with OpenAI Agent Builder

1. Deploy this server to a publicly accessible URL (e.g., using Replit Deployments)
2. In OpenAI Agent Builder, add a new MCP tool
3. Enter your server URL with the `/mcp` endpoint (e.g., `https://your-app.replit.app/mcp`)
4. The Agent Builder will automatically discover your available tools

## Project Structure

```
mcp-server.js      # Main server file (see sections below)
package.json       # Dependencies and scripts
.env.example       # Example environment variables
.gitignore         # Git ignore rules
```

## Customizing for Your Use Case

The `mcp-server.js` file is organized into clearly marked sections:

### Section 1: Server Configuration
Basic server settings like name, version, and port.

### Section 2: Your Custom Configuration  
Add your API URLs, keys, and other configuration here.

### Section 3: Your Business Logic Functions
Implement your tool functions here. Each function should:
- Accept the parameters defined in your tool's inputSchema
- Return a result object (will be JSON stringified for the AI)
- Throw an Error with a helpful message if something goes wrong

### Section 4: Tool Definitions
Define your MCP tools with:
- `name`: Unique identifier (snake_case recommended)
- `description`: What the tool does (helps AI decide when to use it)
- `inputSchema`: JSON Schema defining the parameters

Then add handlers in `TOOL_HANDLERS` to connect tools to your functions.

### Section 5: MCP Boilerplate
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

## Environment Variables

Copy `.env.example` to `.env` and customize:

```bash
PORT=5000                    # Server port
FEATURE_URL=https://...      # Your data source URL
```

## Features

- **Streamable HTTP Transport**: Works with OpenAI Agent Builder and MCP Inspector
- **Stateless Client Support**: Auto-initializes sessions for clients that don't handle the MCP handshake
- **CORS Enabled**: Ready for cross-origin requests
- **Health Check Endpoint**: For monitoring and load balancers

## Dependencies

- `@modelcontextprotocol/sdk`: MCP protocol implementation
- `express`: HTTP server
- `cors`: Cross-origin support

## License

ISC License - See LICENSE file for details.
