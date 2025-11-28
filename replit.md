# Lebanon Zoning Lookup MCP Server

## Overview
This project provides a Model Context Protocol (MCP) server for Lebanon, NH, enabling AI agents to look up zoning district information. It interfaces with the Lebanon GIS system to retrieve zoning data based on geographic coordinates or street addresses. The server exposes AI tools compatible with platforms like Claude and ChatGPT, offering comprehensive access to property data through an HTTP/SSE transport layer with robust error handling and stateless JSON-RPC 2.0 support.

## User Preferences
- User wants MCP server for AI agent integration
- Focus on tool accessibility for building agents
- Stateless design preferred (no database needed)
- Wanted address-based lookup in addition to coordinates
- No external API keys preferred - using Lebanon's own GIS data

## System Architecture

### UI/UX Decisions
The server itself does not have a UI. Its design focuses on providing structured data responses for AI agents. Error messages are designed to be informative, and responses are formatted for easy parsing by AI models, including examples for common errors. Comprehensive field exposure ensures AI agents have all necessary property data.

### Technical Implementations
The server is built on Node.js 20 using ES Modules. It leverages `express.js` to create an HTTP server, handling SSE (Server-Sent Events) for MCP transport. It supports stateless HTTP JSON-RPC 2.0 for direct tool calls, including `initialize`, `tools/list`, `tools/call`, and `notifications/initialized` methods. Input validation, timeout protection for ArcGIS requests (10 seconds), CORS support, and SSE keep-alive pings (15 seconds) are implemented for reliability.

### Feature Specifications
- **AI Agent Integration**: Compatible with MCP-enabled AI platforms.
- **Dual Lookup Methods**: `lookup_zoning_by_coordinates` and `lookup_zoning_by_address` tools.
- **Full Field Access**: Both tools return all available fields from the respective Lebanon GIS layers.
- **Input Validation**: Strict validation for coordinates and address formats.
- **Multiple Match Handling**: For ambiguous address searches, all matching addresses are returned.
- **Error Handling**: Comprehensive error messages for invalid inputs, API failures, and timeouts.
- **Tool Discovery**: AI agents can automatically discover available tools.

### System Design Choices
- **Protocol**: Model Context Protocol (MCP).
- **Transport**: SSE over HTTP, deployed via an Express web server on port 5000.
- **Statelessness**: The server is stateless, querying the Lebanon GIS system in real-time, requiring no database.
- **Endpoints**:
    - `/sse`: SSE connection for server-sent events.
    - `/messages?sessionId=<id>`: Receives client messages.
    - `/health`: Health check endpoint.
- **Deployment**: Designed for Autoscale deployment due to its stateless nature and HTTP-based transport.

## External Dependencies
- **ArcGIS FeatureServer**: `https://services8.arcgis.com/IS3r9gAO1V8yuCqO/ArcGIS/rest/services/OpenGov_Map_Service_WFL1/FeatureServer`
    - **Layer 24**: Official_Zoning (for coordinate lookups).
    - **Layer 6**: Master Address Table (for address lookups).
- **Node.js Modules**:
    - `@modelcontextprotocol/sdk`: For MCP server implementation.
    - `express`: For the HTTP server and SSE transport.
    - `cors`: For handling Cross-Origin Resource Sharing.