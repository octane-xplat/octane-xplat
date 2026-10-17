#!/usr/bin/env node
// Octane Xplat MCP server — stdio transport. stdout is the protocol channel;
// diagnostics go to stderr only.

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createCodeService } from '@octane-xplat/cli/mcp/code-service'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PERMISSION_SCOPES } from './contracts/policy.ts'
import { createXplatMcpServer } from './server.ts'
import { createWorkspaceContext } from './status.ts'
import type { WorkspaceContext } from './context.ts'
import type { PermissionScope } from '../types/contracts/policy'

const usage = `xplat-mcp — Octane Xplat MCP server (stdio)

Usage: xplat-mcp [--workspace <path>] [--app <id|path|name>]
                 [--permissions <scope,scope>] [--evidence-dir <path>]

Options may also come from the environment:
  XPLAT_MCP_WORKSPACE, XPLAT_MCP_APP, XPLAT_MCP_PERMISSIONS, XPLAT_MCP_EVIDENCE_DIR

Scopes: ${PERMISSION_SCOPES.join(', ')}
Workspace reads and ordinary runtime actions reuse the developer's task
authorization; visual-capture always needs an explicit per-task grant.
`

const arg = (name: string): string | undefined => {
	const index = process.argv.indexOf(`--${name}`)
	return index >= 0 ? process.argv[index + 1] : undefined
}

if (process.argv.includes('--help') || process.argv.includes('-h')) {
	process.stderr.write(usage)
	process.exit(0)
}

const permissionScopes = (arg('permissions') ?? process.env.XPLAT_MCP_PERMISSIONS ?? '')
	.split(',')
	.map((s) => s.trim())
	.filter(Boolean)

const unknown = permissionScopes.filter((s) => !PERMISSION_SCOPES.includes(s as PermissionScope))
if (unknown.length) {
	process.stderr.write(`xplat-mcp: ignoring unknown permission scopes: ${unknown.join(', ')}\n`)
}

const workspaceRoot = arg('workspace') ?? process.env.XPLAT_MCP_WORKSPACE ?? process.cwd()

// The status report's `server` field identifies this entry point — the
// manifest version follows lockstep bumps automatically.
const manifest = JSON.parse(
	readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../package.json'), 'utf8'),
)

const context: WorkspaceContext = createWorkspaceContext({
	workspaceRoot,
	serverIdentity: { name: '@octane-xplat/mcp', version: manifest.version },
	appSelector: arg('app') ?? process.env.XPLAT_MCP_APP,
	permissionScopes: permissionScopes.filter((s): s is PermissionScope =>
		PERMISSION_SCOPES.includes(s as PermissionScope),
	),
	evidenceRoot: arg('evidence-dir') ?? process.env.XPLAT_MCP_EVIDENCE_DIR,
	code: createCodeService({
		workspaceRoot,
		workspaceKind: () => context.discovery.workspace.kind,
	}),
	// The shared layer attaches docs/devActions/runtime/inspection providers
	// after creating the literal — the .mjs inference cannot see them.
}) as unknown as WorkspaceContext

const { server, shutdown } = createXplatMcpServer(context)

let closing = false
const close = async () => {
	if (closing) {
		return
	}

	closing = true
	try {
		await shutdown()
	} catch (error) {
		const detail = error instanceof Error ? error.message : String(error)
		process.stderr.write(`xplat-mcp: shutdown cleanup failed: ${detail}\n`)
	} finally {
		await server.close()
		process.exit(0)
	}
}

process.on('SIGINT', close)
process.on('SIGTERM', close)

await server.connect(new StdioServerTransport())
