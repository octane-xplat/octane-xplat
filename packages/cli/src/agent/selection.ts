// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
// Client/workspace app-selection preference. `xplat app select` writes here;
// every agent command resolves selection with the plan's precedence:
//   explicit flag → this client/workspace preference → unique cwd discovery.
// Scoped per client so two agents sharing a workspace never retarget each
// other — it is never a global default.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

// Same cache root convention as the dev-bridge session files
// (node_modules/.cache/xplat/) — ephemeral and already out of source control.
const AGENT_DIR = join('node_modules', '.cache', 'xplat', 'agent')
const CLIENT_SAFE = /^[a-zA-Z0-9_-]{1,64}$/

export const defaultClient = (env = process.env) => env.XPLAT_AGENT_CLIENT || 'default'

export const agentDir = (workspaceRoot) => join(workspaceRoot, AGENT_DIR)

export const preferencePath = (workspaceRoot, client) =>
	join(agentDir(workspaceRoot), `${client}.json`)

export function readPreference(workspaceRoot, client) {
	if (!CLIENT_SAFE.test(client)) {
		return null
	}

	try {
		const parsed = JSON.parse(readFileSync(preferencePath(workspaceRoot, client), 'utf8'))
		return parsed && typeof parsed.appId === 'string' ? parsed : null
	} catch {
		return null
	}
}

export function writePreference(workspaceRoot, client, app) {
	const path = preferencePath(workspaceRoot, client)
	mkdirSync(agentDir(workspaceRoot), { recursive: true })
	writeFileSync(
		path,
		`${JSON.stringify(
			{
				client,
				appId: app.id,
				appName: app.name,
				selectedAt: new Date().toISOString(),
			},
			null,
			'\t',
		)}\n`,
	)

	return path
}
