# MCP Server Template

## Overview
This is a Model Context Protocol (MCP) server template designed for building AI-accessible tools. It uses Streamable HTTP transport for compatibility with OpenAI Agent Builder, Claude Desktop, and other MCP clients. The server exposes custom tools that AI agents can discover and use.

## User Preferences
- Streamable HTTP transport for broad compatibility
- Stateless design (no database required)
- Auto-initialization for clients that skip the MCP handshake
- CORS enabled for cross-origin access

## System Architecture

### Project Structure
```
mcp-server.js      # Main server with 5 clearly marked sections
package.json       # Project configuration and dependencies
.env.example       # Environment variable template
.gitignore         # Standard Node.js ignores
```

### Technical Implementation
- **Runtime**: Node.js 20 with ES Modules
- **Framework**: Express.js for HTTP handling
- **Protocol**: MCP v2024-11-05 via @modelcontextprotocol/sdk
- **Transport**: Streamable HTTP (POST /mcp)
- **Port**: 5000 (configurable via PORT env var)

### Key Endpoints
- `POST /mcp` - Main MCP endpoint for all tool operations
- `GET /mcp` - Server info (no session) or SSE stream (with session)
- `DELETE /mcp` - Session cleanup
- `GET /health` - Health check for monitoring

### Code Organization (mcp-server.js)
The main file is organized into 5 sections:
1. **Server Configuration** - Name, version, port
2. **Custom Configuration** - Your API URLs and settings
3. **Business Logic Functions** - Your tool implementations
4. **Tool Definitions** - MCP tool schemas and handlers
5. **MCP Boilerplate** - Protocol handling (rarely modified)

## Customization Guide

### Adding a New Tool
1. Add configuration variables in Section 2
2. Implement your function in Section 3
3. Define the tool schema in Section 4 (TOOLS array)
4. Add the handler in Section 4 (TOOL_HANDLERS map)

### Deployment
- Works with Replit Autoscale deployment
- Health check endpoint at /health for load balancers
- CORS pre-configured for all origins

## External Dependencies
- `@modelcontextprotocol/sdk` - MCP protocol implementation
- `express` - HTTP server framework
- `cors` - Cross-origin request handling
