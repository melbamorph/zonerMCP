# Lebanon Zoning Lookup Server

## Overview
A Node.js + Express API server that provides zoning district lookup functionality for Lebanon, NH by querying the ArcGIS FeatureServer. The server accepts geographic coordinates (latitude/longitude) and returns the corresponding zoning district information.

**Current State**: Fully functional API server running on port 8080 with rate limiting, CORS support, and error handling.

## Recent Changes
- **October 20, 2025**: Initial project setup
  - Created Express server with POST `/lookup_zoning_district` endpoint
  - Integrated ArcGIS FeatureServer for zoning data queries
  - Added rate limiting (60 requests per minute)
  - Configured CORS for cross-origin requests
  - Added health check endpoint at `/healthz`
  - Set up project with Node.js 20 and required dependencies

## Project Architecture

### Technology Stack
- **Runtime**: Node.js 20
- **Framework**: Express.js
- **Dependencies**:
  - `express`: Web framework
  - `cors`: Cross-origin resource sharing middleware
  - `express-rate-limit`: API rate limiting

### Project Structure
```
lebanon-zoning-lookup/
├── server.js          # Main server application
├── package.json       # Project configuration and dependencies
└── replit.md         # Project documentation
```

### API Endpoints

#### POST /lookup_zoning_district
Accepts coordinates and returns zoning district information.

**Request Body**:
```json
{
  "lat": 43.6426,
  "lon": -72.2515
}
```

**Success Response** (200):
```json
{
  "found": true,
  "district": "Unknown",
  "attributes": {
    "OBJECTID": 1,
    "Shape__Area": 13963296.026534647,
    "Shape__Length": 244307.70063052434
  },
  "layerId": 0,
  "source": "ArcGIS FeatureServer"
}
```

**No Match Response** (200):
```json
{
  "found": false,
  "message": "No district found for that point."
}
```

**Error Response** (400):
```json
{
  "error": "lat and lon must be numbers",
  "example": { "lat": 43.6426, "lon": -72.2515 }
}
```

#### GET /healthz
Health check endpoint for monitoring server status.

**Response** (200):
```json
{
  "ok": true,
  "featureUrl": "https://services8.arcgis.com/IS3r9gAO1V8yuCqO/ArcGIS/rest/services/OpenGov_Map_Service_WFL1/FeatureServer/0/query"
}
```

### Features
- **Rate Limiting**: 60 requests per minute per IP address
- **CORS Enabled**: Accepts cross-origin requests (currently set to `*` for development)
- **Error Handling**: Graceful handling of invalid inputs and ArcGIS API failures
- **Input Validation**: Ensures latitude and longitude are valid numbers
- **Native Fetch**: Uses Node.js built-in fetch API (no external HTTP library needed)

### Configuration
- **Port**: 8080 (configurable via `PORT` environment variable)
- **ArcGIS URL**: Configurable via `FEATURE_URL` environment variable
- Default FeatureServer: `https://services8.arcgis.com/IS3r9gAO1V8yuCqO/ArcGIS/rest/services/OpenGov_Map_Service_WFL1/FeatureServer/0/query`

### Running the Server
```bash
npm start
```

### Testing Examples
```bash
# Valid lookup
curl -X POST http://localhost:8080/lookup_zoning_district \
  -H "Content-Type: application/json" \
  -d '{"lat": 43.6426, "lon": -72.2515}'

# Health check
curl http://localhost:8080/healthz

# Invalid input (error handling)
curl -X POST http://localhost:8080/lookup_zoning_district \
  -H "Content-Type: application/json" \
  -d '{"lat": "invalid", "lon": -72.2515}'
```

## User Preferences
No specific user preferences documented yet.
