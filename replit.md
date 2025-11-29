# MCP Server Template

## Overview
This is a minimal, UI-agnostic Model Context Protocol (MCP) server template designed for building AI-accessible tools. It uses Streamable HTTP transport for compatibility with OpenAI Agent Builder, Claude Desktop, and other MCP clients. The template is intentionally minimal to allow easy customization for different data sources and use cases.

## User Preferences
- Streamable HTTP transport for broad compatibility
- Stateless design (no database required)
- Auto-initialization for clients that skip the MCP handshake
- CORS enabled for cross-origin access
- Centralized configuration in config.js for easy forking

## System Architecture

### Project Structure
```
config.js          # All customizable configuration (START HERE when forking)
mcp-server.js      # Main server with business logic and MCP boilerplate
package.json       # Project configuration and dependencies
.env.example       # Environment variable template
.gitignore         # Standard Node.js ignores
README.md          # Documentation with customization checklist
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

### Code Organization

**config.js** - All customizable values:
- SERVER_NAME, SERVER_VERSION - Server identity
- BASE_URL, ZONING_LAYER, ADDRESS_LAYER - Data source endpoints
- LOCATION_NAME - Municipality/region name
- DATA_SOURCES - Source labels for responses
- TOOL_DESCRIPTIONS - AI-facing tool descriptions
- ERROR_EXAMPLES - Example values for error recovery

**mcp-server.js** - Server implementation:
1. **Configuration imports** - Loads from config.js
2. **Business Logic Functions** - Your tool implementations
3. **Tool Definitions** - MCP tool schemas and handlers
4. **MCP Boilerplate** - Protocol handling (rarely modified)

## Customization Guide

### Forking This Template
1. Update ALL values in `config.js`
2. Modify business logic functions in `mcp-server.js`
3. Update tool definitions (TOOLS array and TOOL_HANDLERS)
4. Update `package.json` name, description, author
5. Copy `.env.example` to `.env` and set your values

### Adding a New Tool
1. Add configuration variables in `config.js`
2. Implement your function in Section 1 of `mcp-server.js`
3. Define the tool schema in Section 2 (TOOLS array)
4. Add the handler in Section 2 (TOOL_HANDLERS map)

### Deployment
- Works with Replit Autoscale deployment
- Health check endpoint at /health for load balancers
- CORS pre-configured for all origins

## External Dependencies
- `@modelcontextprotocol/sdk` - MCP protocol implementation
- `express` - HTTP server framework
- `cors` - Cross-origin request handling

## Recent Changes
- 2025-11-29: Extracted configuration to separate config.js file
- 2025-11-29: Added customization checklist to README
- 2025-11-29: Added badges and improved documentation
- 2025-11-29: Made package.json more template-friendly
