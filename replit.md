# Lebanon Zoning Lookup MCP Server

## Overview
This project provides a Model Context Protocol (MCP) server for Lebanon, NH, enabling AI agents to look up zoning district information. It interfaces with the Lebanon GIS system to retrieve zoning data based on geographic coordinates or street addresses. The server exposes AI tools compatible with platforms like Claude, ChatGPT, and OpenAI's Agent Builder, offering comprehensive access to property data through Streamable HTTP transport with robust error handling.

## User Preferences
- User wants MCP server for AI agent integration
- Focus on tool accessibility for building agents
- Stateless design preferred (no database needed)
- Wanted address-based lookup in addition to coordinates
- No external API keys preferred - using Lebanon's own GIS data
- Prefer Streamable HTTP transport over SSE for better compatibility with OpenAI Agent Builder

## Recent Changes
- **2025-11-29**: Added stateless client support for OpenAI Agent Builder. The server now auto-initializes sessions when non-initialize requests arrive without a valid session, enabling Agent Builder to send tool calls directly without the handshake. Fixed CORS to include `mcp-protocol-version` in allowed headers.
- **2025-11-28**: Migrated from SSE transport to Streamable HTTP transport (`POST /mcp`) for better compatibility with OpenAI Responses API and Agent Builder. Removed `/sse` and `/messages` endpoints. Updated server version to 3.2.0.

## System Architecture

### UI/UX Decisions
The server itself does not have a UI. Its design focuses on providing structured data responses for AI agents. Error messages are designed to be informative, and responses are formatted for easy parsing by AI models, including examples for common errors. Comprehensive field exposure ensures AI agents have all necessary property data.

### Technical Implementations
The server is built on Node.js 20 using ES Modules. It leverages `express.js` to create an HTTP server with Streamable HTTP transport using `StreamableHTTPServerTransport` from the MCP SDK. Input validation, timeout protection for ArcGIS requests (10 seconds), and CORS support are implemented for reliability. Session management is handled via `mcp-session-id` headers.

### Feature Specifications
- **AI Agent Integration**: Compatible with MCP-enabled AI platforms including OpenAI Agent Builder and MCP Inspector.
- **Dual Lookup Methods**: `lookup_zoning_by_coordinates` and `lookup_zoning_by_address` tools.
- **Full Field Access**: Both tools return all available fields from the respective Lebanon GIS layers.
- **Input Validation**: Strict validation for coordinates and address formats.
- **Multiple Match Handling**: For ambiguous address searches, all matching addresses are returned.
- **Error Handling**: Comprehensive error messages for invalid inputs, API failures, and timeouts.
- **Tool Discovery**: AI agents can automatically discover available tools via `tools/list`.

### System Design Choices
- **Protocol**: Model Context Protocol (MCP) v2024-11-05.
- **Transport**: Streamable HTTP via Express web server on port 5000.
- **Session Management**: Per-request session creation with `mcp-session-id` header.
- **Endpoints**:
    - `POST /mcp`: Main Streamable HTTP MCP endpoint (initialize, tools/list, tools/call).
    - `GET /mcp`: SSE stream for server-initiated messages (requires session ID).
    - `DELETE /mcp`: Session termination (requires session ID).
    - `GET /health`: Health check endpoint.
- **Deployment**: Designed for Autoscale deployment due to its stateless nature and HTTP-based transport.

## External Dependencies
- **ArcGIS FeatureServer**: `https://services8.arcgis.com/IS3r9gAO1V8yuCqO/ArcGIS/rest/services/OpenGov_Map_Service_WFL1/FeatureServer`
    - **Layer 24**: Official_Zoning (for coordinate lookups).
    - **Layer 6**: Master Address Table (for address lookups).
- **Node.js Modules**:
    - `@modelcontextprotocol/sdk`: For MCP server implementation.
    - `express`: For the HTTP server and SSE transport.
    - `cors`: For handling Cross-Origin Resource Sharing.