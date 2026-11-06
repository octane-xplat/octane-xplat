// End-to-end: a real MCP client talking to the server over linked transports,
// with the Go CLI boundary stubbed by a recording fake transport.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { createXplatMcpServer } from '../dist/server.js'
import { createWorkspaceContext } from '../dist/status.js'
import { makeConsumerApp, makeWorkspace } from './helpers.mjs'
import { fakeTransport, statusFixture, ok, fail } from './transport.mjs'

async function connect(root, options = {}) {
	const transport = fakeTransport(options.handlers ?? {})
	const context = createWorkspaceContext({ workspaceRoot: root, transport, ...options })
	transport.handlers.status ??= () => ok(statusFixture(context))

	const { server } = createXplatMcpServer(context)
	const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
	const client = new Client({ name: 'test-client', version: '0.0.0' })
	await Promise.all([server.connect(serverTransport), client.connect(clientTransport)])
	return { client, context, transport }
}

test('project status reports identity, versions, capabilities, and boundaries', async () => {
	const root = makeWorkspace()
	makeConsumerApp(root, '.', { name: 'status-app', installed: { '@octane-xplat/ui': '0.14.0' } })
	const { client, transport } = await connect(root, {
		handlers: {
			status: (call) =>
				ok(
					statusFixture({ boundApp: null, discovery: { workspace: { kind: 'consumer' }, apps: [{ id: '.', name: 'status-app', platforms: ['web'] }] } }, {
						identity: {
							workspace: { kind: 'consumer' },
							apps: [],
							selection: { state: 'bound', reason: 'sole-app', app: { id: '.' } },
							framework: { status: 'installed', packages: [{ name: '@octane-xplat/ui', version: '0.14.0' }] },
						},
						prerequisites: [],
						capabilities: [{ platform: 'web', capabilities: [] }],
					}),
				),
		},
	})

	const result = await client.callTool({ name: 'xplat_project_status', arguments: {} })
	const report = result.structuredContent.data
	assert.ok(!result.isError)
	assert.equal(report.identity.selection.state, 'bound')
	assert.equal(report.identity.selection.reason, 'sole-app')
	assert.equal(report.identity.framework.packages[0].version, '0.14.0')
	assert.equal(report.server.name, '@octane-xplat/mcp')
	assert.ok(Array.isArray(report.capabilities))
	assert.ok(report.boundaries.length > 0)
	assert.ok(report.permissions.find((g) => g.scope === 'visual-capture'))
	// The status report is the Go contract — one implementation, two transports.
	assert.deepEqual(transport.calls[0].command, ['status'])
})

test('ambiguous workspaces require explicit selection', async () => {
	const root = makeWorkspace()
	makeConsumerApp(root, 'apps/a', { name: 'a' })
	makeConsumerApp(root, 'apps/b', { name: 'b' })
	const { client } = await connect(root)

	const status = await client.callTool({ name: 'xplat_project_status', arguments: {} })
	assert.equal(status.structuredContent.data.identity.selection.state, 'ambiguous')

	const bad = await client.callTool({ name: 'xplat_select_app', arguments: { app: 'nope' } })
	assert.equal(bad.isError, true)
	assert.equal(bad.structuredContent.error.code, 'invalid_selection')
	assert.equal(bad.structuredContent.error.context.candidates.length, 2)

	const bound = await client.callTool({ name: 'xplat_select_app', arguments: { app: 'apps/a' } })
	assert.equal(bound.structuredContent.data.bound.name, 'a')
})

test('capability matrix proxies the Go capability contract', async () => {
	const root = makeWorkspace()
	makeConsumerApp(root, '.', { name: 'cap-app' })
	const { client, transport } = await connect(root, {
		handlers: {
			capabilities: (call) =>
				ok({
					capabilities: [
						{
							platform: call.flags.platform ?? 'web',
							declared: true,
							capabilities: [
								{ capability: 'project_status', status: 'supported' },
								{ capability: 'screenshot', status: 'unavailable', requiresPermission: 'visual-capture' },
							],
						},
					],
				}),
		},
	})

	const result = await client.callTool({
		name: 'xplat_capability_matrix',
		arguments: { platform: 'web' },
	})
	const [matrix] = result.structuredContent.data.capabilities
	const byId = Object.fromEntries(matrix.capabilities.map((c) => [c.capability, c]))
	assert.equal(byId.project_status.status, 'supported')
	assert.equal(byId.screenshot.requiresPermission, 'visual-capture')
	assert.deepEqual(transport.calls.at(-1).command, ['capabilities'])
	assert.equal(transport.calls.at(-1).flags.platform, 'web')
})

test('permissions report grant states; screenshots are never baseline-granted', async () => {
	const root = makeWorkspace()
	makeConsumerApp(root, '.', { name: 'perm-app' })
	const { client } = await connect(root)

	const result = await client.callTool({
		name: 'xplat_permissions',
		arguments: { scope: 'visual-capture' },
	})

	const data = result.structuredContent.data
	assert.equal(data.check.granted, false)
	assert.equal(data.check.error.code, 'permission_denied')
	assert.match(data.check.error.recovery.action, /developer|grant/i)
})

test('sessions, jobs, and evidence tools expose the shared contracts', async () => {
	const root = makeWorkspace()
	makeConsumerApp(root, '.', { name: 'sess-app' })
	const { client, transport } = await connect(root, {
		handlers: {
			'session list': ok({ sessions: [{ sessionId: 'sess_1', state: 'ready' }] }),
			'session status': (call) => ok({ session: { sessionId: call.positionals[0], state: 'ready' } }),
			'actions status': fail('not_found', 'unknown job'),
			'evidence list': ok({ evidence: [{ id: 'ev_1', kind: 'inspection' }] }),
			'evidence retain': ok({ retained: true, transcriptNote: 'Client transcripts are not erased.' }),
			'evidence delete': ok({ deleted: true }),
		},
	})

	const listed = await client.callTool({ name: 'xplat_sessions', arguments: {} })
	assert.equal(listed.structuredContent.data.sessions.length, 1)

	const status = await client.callTool({
		name: 'xplat_sessions',
		arguments: { sessionId: 'sess_1' },
	})
	assert.equal(status.structuredContent.data.session.sessionId, 'sess_1')
	assert.deepEqual(transport.calls.at(-1).positionals, ['sess_1'])

	// Session end is honestly unavailable in the current contract.
	const ended = await client.callTool({
		name: 'xplat_session_end',
		arguments: { sessionId: 'sess_1' },
	})
	assert.equal(ended.isError, true)
	assert.equal(ended.structuredContent.error.code, 'unsupported_capability')

	const missing = await client.callTool({
		name: 'xplat_job_status',
		arguments: { jobId: 'job_missing' },
	})
	assert.equal(missing.isError, true)
	assert.equal(missing.structuredContent.error.code, 'not_found')

	// Retention is permission-gated before it reaches the service.
	const denied = await client.callTool({
		name: 'xplat_evidence',
		arguments: { op: 'retain', id: 'ev_1' },
	})
	assert.equal(denied.structuredContent.error.code, 'permission_denied')

	const listed2 = await client.callTool({
		name: 'xplat_evidence',
		arguments: { op: 'list' },
	})
	assert.equal(listed2.structuredContent.data.evidence.length, 1)

	const deleted = await client.callTool({
		name: 'xplat_evidence',
		arguments: { op: 'delete', id: 'ev_1' },
	})
	assert.equal(deleted.structuredContent.data.deleted, true)
	assert.deepEqual(transport.calls.at(-1).command, ['evidence', 'delete'])
})

test('diagnostics MCP tool maps selectors onto the contract flags', async () => {
	const root = makeWorkspace()
	makeConsumerApp(root, '.', { name: 'diagnostic-app' })
	const { client, transport } = await connect(root, {
		handlers: {
			diagnostics: (call) =>
				ok({ logs: { records: [], nextCursor: null }, flags: call.flags }),
		},
	})
	try {
		const tools = await client.listTools()
		assert.ok(tools.tools.some((tool) => tool.name === 'xplat_diagnostics'))
		assert.ok(!tools.tools.some((tool) => tool.name === 'xplat_logs'))

		const result = await client.callTool({
			name: 'xplat_diagnostics',
			arguments: { sessionId: 'sess_abc', cursor: 0, stream: 'stderr', limit: 50 },
		})
		const flags = result.structuredContent.data.flags
		assert.equal(flags.session, 'sess_abc')
		assert.equal(flags.cursor, 0)
		assert.equal(flags.stream, 'stderr')
		assert.equal(flags.limit, 50)
		assert.deepEqual(transport.calls.at(-1).command, ['diagnostics'])
	} finally {
		await client.close()
	}
})
