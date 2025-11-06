#!/usr/bin/env node

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function testMCPServer() {
  console.log("Testing Lebanon Zoning Lookup MCP Server...\n");

  const transport = new StdioClientTransport({
    command: "node",
    args: ["mcp-server.js"],
  });

  const client = new Client(
    {
      name: "test-client",
      version: "1.0.0",
    },
    {
      capabilities: {},
    }
  );

  try {
    await client.connect(transport);
    console.log("✓ Connected to MCP server\n");

    console.log("1. Listing available tools...");
    const tools = await client.listTools();
    console.log(`✓ Found ${tools.tools.length} tool(s):\n`);
    
    tools.tools.forEach((tool) => {
      console.log(`   Tool: ${tool.name}`);
      console.log(`   Description: ${tool.description}`);
      console.log(`   Input Schema:`, JSON.stringify(tool.inputSchema, null, 4));
      console.log();
    });

    console.log("2. Testing lookup_zoning_district with valid coordinates...");
    const result1 = await client.callTool({
      name: "lookup_zoning_district",
      arguments: {
        lat: 43.6426,
        lon: -72.2515,
      },
    });
    
    if (result1.isError) {
      throw new Error("Valid coordinates returned an error: " + result1.content[0].text);
    }
    console.log("✓ Response:");
    console.log(result1.content[0].text);
    console.log();

    console.log("3. Testing with invalid coordinates (should handle error)...");
    const result2 = await client.callTool({
      name: "lookup_zoning_district",
      arguments: {
        lat: 200,
        lon: -72.2515,
      },
    });
    
    if (!result2.isError) {
      throw new Error("Invalid coordinates should have returned an error");
    }
    console.log("✓ Error handling response (correctly marked as error):");
    console.log(result2.content[0].text);
    console.log();

    console.log("4. Testing with point outside Lebanon (should return not found)...");
    const result3 = await client.callTool({
      name: "lookup_zoning_district",
      arguments: {
        lat: 40.7128,
        lon: -74.0060,
      },
    });
    
    if (result3.isError) {
      throw new Error("Valid out-of-bounds coordinates should not return an error, just not found");
    }
    console.log("✓ Not found response:");
    console.log(result3.content[0].text);
    console.log();

    console.log("✅ All tests passed! MCP server is working correctly.");

    await client.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

testMCPServer();
