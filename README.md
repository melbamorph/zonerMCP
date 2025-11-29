# EXPERIMENTAL: Lebanon Zoning Lookup MCP Server

An experimental [Model Context Protocol](https://modelcontextprotocol.io) (MCP) server that provides AI agents with access to zoning district information for Lebanon, New Hampshire. Queries Lebanon's public ArcGIS data by street address or GPS coordinates.

## Status

This is an experimental project under active development. It may change significantly or break without notice. Not currently accepting contributions or issue reports.

## Running the Server

```bash
npm install
npm start
```

The server runs on port 5000. The MCP endpoint is available at `/mcp`.

## Available Tools

- `lookup_zoning_by_coordinates` - Look up zoning by latitude/longitude
- `lookup_zoning_by_address` - Look up zoning by street address

## Disclaimer

This is an unofficial tool and is not affiliated with the City of Lebanon, NH. All zoning data is sourced from publicly available GIS services. For official zoning determinations, please contact the Lebanon Planning Department.
