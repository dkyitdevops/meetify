# Figma MCP Server Configuration

## Status
✅ Token configured
⏳ MCP Server setup pending

## Credentials
- Token saved in: `credentials/figma.env`
- Permissions: 600 (owner read/write only)

## MCP Server Endpoint
- URL: `https://mcp.figma.com/mcp`
- Type: Remote SSE server

## Available Tools
- `figma_use` — use Figma as a design tool
- `figma_create_new_file` — create new Figma file
- `figma_implement_design` — implement design from Figma
- `figma_code_generation` — generate code from design
- `figma_code_to_canvas` — convert code to design
- `figma_figjam_diagrams` — create FigJam diagrams

## Usage Limits (Starter Plan)
- 6 calls/month for write operations
- Read operations: unlimited
- Write-to-canvas requires paid plan

## Next Steps
1. Configure MCP server in OpenClaw settings
2. Test connection with simple design creation
3. Document usage patterns for team
