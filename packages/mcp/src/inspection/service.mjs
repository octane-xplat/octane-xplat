// The inspection service moved to @octane-xplat/cli (shared agent service
// layer); the MCP tool registration lives in ./tools.mjs. Both names are
// re-exported here so existing importers keep working.
export { createInspectionService } from '@octane-xplat/cli/mcp/inspection/service'
export { registerInspectionTools } from './tools.mjs'
