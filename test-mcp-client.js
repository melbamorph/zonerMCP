#!/usr/bin/env node

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function testMCPServer() {
  console.log("Testing Lebanon Zoning Lookup MCP Server v2.0...\n");

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

    console.log("=== TOOL DISCOVERY ===");
    const tools = await client.listTools();
    console.log(`✓ Found ${tools.tools.length} tool(s):\n`);
    
    tools.tools.forEach((tool) => {
      console.log(`   Tool: ${tool.name}`);
      console.log(`   Description: ${tool.description}`);
      console.log(`   Input Schema:`, JSON.stringify(tool.inputSchema, null, 4));
      console.log();
    });

    console.log("=== COORDINATE LOOKUP TESTS ===\n");

    console.log("1. Testing lookup_zoning_by_coordinates with valid Lebanon coordinates...");
    const result1 = await client.callTool({
      name: "lookup_zoning_by_coordinates",
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

    console.log("2. Testing with invalid coordinates (should handle error)...");
    const result2 = await client.callTool({
      name: "lookup_zoning_by_coordinates",
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

    console.log("3. Testing with point outside Lebanon (should return not found)...");
    const result3 = await client.callTool({
      name: "lookup_zoning_by_coordinates",
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

    console.log("=== ADDRESS LOOKUP TESTS ===\n");

    console.log("4. Testing lookup_zoning_by_address with a known address...");
    const result4 = await client.callTool({
      name: "lookup_zoning_by_address",
      arguments: {
        address: "14 AMSDEN ST",
      },
    });
    
    if (result4.isError) {
      throw new Error("Known address lookup failed: " + result4.content[0].text);
    }
    const data4 = JSON.parse(result4.content[0].text);
    if (!data4.found) {
      throw new Error("Known address '14 AMSDEN ST' should have been found");
    }
    console.log("✓ Address lookup response:");
    console.log(result4.content[0].text);
    console.log();

    console.log("5. Testing lookup_zoning_by_address with partial street name (multiple matches)...");
    const result5 = await client.callTool({
      name: "lookup_zoning_by_address",
      arguments: {
        address: "AMSDEN",
      },
    });
    
    if (result5.isError) {
      throw new Error("Partial address search failed: " + result5.content[0].text);
    }
    const data5 = JSON.parse(result5.content[0].text);
    if (!data5.found) {
      throw new Error("Partial address 'AMSDEN' should have found matches");
    }
    console.log("✓ Address lookup response (should show multiple matches):");
    console.log(result5.content[0].text);
    console.log();

    console.log("6. Testing lookup_zoning_by_address with address containing suffix letter...");
    const result6a = await client.callTool({
      name: "lookup_zoning_by_address",
      arguments: {
        address: "14A FAIRVIEW AVE",
      },
    });
    
    if (result6a.isError) {
      throw new Error("Address with suffix lookup failed: " + result6a.content[0].text);
    }
    const data6a = JSON.parse(result6a.content[0].text);
    if (!data6a.found) {
      throw new Error("Address '14A FAIRVIEW AVE' should have been found");
    }
    console.log("✓ Address with suffix lookup response:");
    console.log(result6a.content[0].text);
    console.log();

    console.log("7. Testing lookup_zoning_by_address with empty string (should error)...");
    const result6 = await client.callTool({
      name: "lookup_zoning_by_address",
      arguments: {
        address: "",
      },
    });
    
    if (!result6.isError) {
      throw new Error("Empty address should have returned an error");
    }
    console.log("✓ Error handling response (correctly marked as error):");
    console.log(result6.content[0].text);
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
