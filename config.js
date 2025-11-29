// ============================================================================
// MCP SERVER CONFIGURATION
// ============================================================================
// 
// IMPORTANT: When forking this template, update ALL values in this file
// to match your use case. This is the ONLY file you need to modify for
// basic customization.
//
// ============================================================================

// ----------------------------------------------------------------------------
// SERVER IDENTITY
// ----------------------------------------------------------------------------
// These values identify your MCP server to clients

export const SERVER_NAME = "lebanon-zoning-lookup";  // Change to your-project-name
export const SERVER_VERSION = "3.2.0";

// ----------------------------------------------------------------------------
// DATA SOURCE CONFIGURATION
// ----------------------------------------------------------------------------
// The data source URL must be configured via the ARCGIS_BASE_URL secret.
// This keeps the endpoint URL private and out of the public codebase.
// 
// To set up: Add ARCGIS_BASE_URL to your Replit Secrets with your 
// FeatureServer URL (e.g., https://services.arcgis.com/.../FeatureServer)

export const BASE_URL = process.env.ARCGIS_BASE_URL;

if (!BASE_URL) {
  console.error("ERROR: ARCGIS_BASE_URL secret is required but not set.");
  console.error("Please add this secret in Replit's Secrets tab.");
  process.exit(1);
}

export const ZONING_LAYER = process.env.ZONING_LAYER || "24";
export const ADDRESS_LAYER = process.env.ADDRESS_LAYER || "6";

// ----------------------------------------------------------------------------
// LOCATION-SPECIFIC STRINGS
// ----------------------------------------------------------------------------
// Update these to match your municipality/region

export const LOCATION_NAME = "Lebanon, NH";  // e.g., "Anytown, USA", "Portland, OR"

export const DATA_SOURCES = {
  zoningLayer: "Lebanon Official Zoning Layer",      // Your zoning data source name
  addressTable: "Lebanon Master Address Table",      // Your address data source name
};

// ----------------------------------------------------------------------------
// TOOL DESCRIPTIONS
// ----------------------------------------------------------------------------
// Update these descriptions to match your location and data sources

export const TOOL_DESCRIPTIONS = {
  lookupByCoordinates: 
    `Look up the zoning district for a location in ${LOCATION_NAME} using latitude and longitude coordinates. Returns the official zoning district from the ${DATA_SOURCES.zoningLayer}.`,
  
  lookupByAddress: 
    `Look up the zoning district for a location in ${LOCATION_NAME} using a street address. Searches the ${DATA_SOURCES.addressTable} and returns the zoning district along with the full address and coordinates. Returns multiple matches if the address is ambiguous.`,
};

// ----------------------------------------------------------------------------
// ERROR EXAMPLES
// ----------------------------------------------------------------------------
// Provide example values for your location to help AI recover from errors

export const ERROR_EXAMPLES = {
  coordinates: { lat: 43.6426, lon: -72.2515 },  // A valid lat/lon in your area
  address: "123 Main Street"                      // An example address format
};

// ----------------------------------------------------------------------------
// SERVER PORT
// ----------------------------------------------------------------------------

export const PORT = process.env.PORT || 5000;
