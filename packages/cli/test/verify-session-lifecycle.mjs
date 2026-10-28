// Optional real-Chromium qualification. Build the CLI first; excluded from PR tests.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, writeFileSync, existsSync, readFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
const base = resolve('packages/cli/node_modules/.cache')
mkdirSync(base, { recursive: true })
const root = mkdtempSync(join(base, 'session-lifecycle-'))
writeFileSync(
	join(root, 'package.json'),
	JSON.stringify({
		name: 'session-lifecycle-proof',
		private: true,
		dependencies: {
			'@octane-xplat/ui': JSON.parse(
				readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
			).version,
		},
	}),
)

const bridge = new URL('../dist/mcp/dev-bridge.js', import.meta.url).href
writeFileSync(
	join(root, 'vite.config.mjs'),
	`import {xplatDevBridge} from ${JSON.stringify(bridge)};export default {plugins:[xplatDevBridge()],server:{host:'127.0.0.1',port:0}}`,
)

writeFileSync(
	join(root, 'index.html'),
	'<html><head></head><body><script type="module">console.warn("SESSION_STARTUP_WARNING")</script></body></html>',
)

const cli = resolve('packages/cli/dist/cli.js')
const env = { ...process.env, XPLAT_AGENT_HOST_IDLE_MS: '1000' }
const call = (args) =>
	JSON.parse(
		execFileSync(process.execPath, [cli, ...args, '--project', root, '--json'], {
			encoding: 'utf8',
			env,
		}),
	)

const launch = call(['session', 'start', 'web'])
assert.equal(launch.ok, true)
assert.equal(launch.data.job, undefined)
const id = launch.data.session.sessionId
try {
	let status
	for (let i = 0; i < 200; i++) {
		status = call(['session', 'status', id])
		if (status.data?.session.state !== 'starting') {
			break
		}

		await new Promise((r) => setTimeout(r, 100))
	}

	assert.equal(status.data.session.state, 'ready', JSON.stringify(status))
	let diagnostic
	for (let i = 0; i < 100; i++) {
		diagnostic = call(['diagnostics', '--session', id, '--cursor', '0'])
		if (diagnostic.data?.logs.records.some((r) => r.line.includes('SESSION_STARTUP_WARNING'))) {
			break
		}

		await new Promise((r) => setTimeout(r, 100))
	}

	assert.ok(
		diagnostic.data.logs.records.some(
			(r) => r.line.includes('SESSION_STARTUP_WARNING') && r.source === 'browser',
		),
	)

	const end = call(['session', 'end', id])
	assert.equal(end.data.result.ended, true)
	await new Promise((r) => setTimeout(r, 2000))
	const after = call(['diagnostics', '--session', id, '--cursor', '0'])
	assert.equal(after.ok, true)
	assert.equal(after.data.logs.historical, true)
	assert.ok(after.data.logs.records.some((r) => r.line.includes('SESSION_STARTUP_WARNING')))
	assert.equal(call(['session', 'status', id]).data.session.state, 'stopped')
	assert.equal(existsSync(join(root, 'node_modules/.cache/xplat/agent/host.json')), false)
	console.log(
		JSON.stringify({
			sessionId: id,
			root,
			returnedJob: false,
			ready: true,
			browserWarningRetained: true,
			postOwnerRead: true,
			passed: true,
		}),
	)
} finally {
	try {
		call(['session', 'end', id])
	} catch {}
}
