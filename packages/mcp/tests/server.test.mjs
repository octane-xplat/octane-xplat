// End-to-end: a real MCP client talking to the server over linked transports.

import assert from 'node:assert/strict'
import { createDevLogCapture } from '../../cli/dist/dev-logs.js'
import { test } from 'node:test'
import { join } from 'node:path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { createXplatMcpServer } from '../dist/server.js'
import { createWorkspaceContext } from '../dist/status.js'
import { makeConsumerApp, makeWorkspace } from './helpers.mjs'

async function connect(root, options = {}) {
	const context = createWorkspaceContext({
		workspaceRoot: root,
		evidenceRoot: join(root, '.ev'),
		...options,
	})

	const { server } = createXplatMcpServer(context)
	const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
	const client = new Client({ name: 'test-client', version: '0.0.0' })
	await Promise.all([server.connect(serverTransport), client.connect(clientTransport)])
	return { client, context }
}

test('project status reports identity, versions, capabilities, and boundaries', async () => {
	const root = makeWorkspace()
	makeConsumerApp(root, '.', { name: 'status-app', installed: { '@octane-xplat/ui': '0.14.0' } })
	const { client } = await connect(root)

	const result = await client.callTool({ name: 'xplat_project_status', arguments: {} })
	const report = result.structuredContent.data
	assert.ok(!result.isError)
	assert.equal(report.identity.selection.state, 'bound')
	assert.equal(report.identity.selection.reason, 'sole-app')
	assert.equal(report.identity.framework.packages[0].version, '0.14.0')
	assert.equal(report.docs.state, 'ready')
	assert.equal(report.codeIndex.state, 'not_provided')
	assert.ok(Array.isArray(report.capabilities))
	assert.ok(report.boundaries.length > 0)
	assert.ok(report.permissions.find((g) => g.scope === 'visual-capture'))
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

test('capability matrix separates capabilities and explains gaps', async () => {
	const root = makeWorkspace()
	makeConsumerApp(root, '.', { name: 'cap-app' })
	const { client } = await connect(root, { runtime: { exec: () => '1.0.0\n' } })

	const result = await client.callTool({ name: 'xplat_capability_matrix', arguments: {} })
	const [matrix] = result.structuredContent.data.capabilities
	assert.equal(matrix.platform, 'web')
	const byId = Object.fromEntries(matrix.capabilities.map((c) => [c.capability, c]))
	for (const id of ['build', 'launch', 'logs', 'ui_inspection', 'screenshot', 'interaction']) {
		assert.ok(byId[id], `missing ${id}`)
	}

	// Runtime providers (item D) report real support; E capabilities still
	// carry their honest defaults.
	assert.equal(byId.build.status, 'supported')
	assert.equal(byId.launch.status, 'supported')
	assert.equal(byId.target_discovery.status, 'supported')
	assert.equal(byId.screenshot.requiresPermission, 'visual-capture')
	assert.equal(byId.screenshot.status, 'partial')
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
	assert.match(data.check.error.recovery.action, /developer/)
})

test('sessions, jobs, and evidence tools expose the shared contracts', async () => {
	const root = makeWorkspace()
	makeConsumerApp(root, '.', { name: 'sess-app' })
	const { client, context } = await connect(root)

	// Attach a user-owned session through the registry (runtime tools in D do
	// the same through providers) and end it via the tool.
	const session = context.sessions.attach({
		appId: '.',
		platform: 'web',
		targetId: 'web',
	})

	const listed = await client.callTool({ name: 'xplat_sessions', arguments: {} })
	assert.equal(listed.structuredContent.data.sessions.length, 1)

	const ended = await client.callTool({
		name: 'xplat_session_end',
		arguments: { sessionId: session.sessionId },
	})

	assert.equal(ended.structuredContent.data.result.ended, true)
	assert.match(ended.structuredContent.data.result.preserved[0], /user-owned/)

	// Jobs: unknown ids fail honestly.
	const missing = await client.callTool({
		name: 'xplat_job_status',
		arguments: { jobId: 'job_missing' },
	})

	assert.equal(missing.isError, true)
	assert.equal(missing.structuredContent.error.code, 'not_found')

	// Evidence: retain/delete carry the transcript limitation note.
	const record = context.evidence.record({
		kind: 'inspection',
		summary: 'tree',
		provenance: { platform: 'web', mechanism: 'none' },
	})

	const retained = await client.callTool({
		name: 'xplat_evidence',
		arguments: { op: 'retain', id: record.id },
	})

	assert.match(retained.structuredContent.data.transcriptNote, /transcript/)

	const listed2 = await client.callTool({
		name: 'xplat_evidence',
		arguments: { op: 'list' },
	})

	assert.equal(listed2.structuredContent.data.evidence.length, 1)

	const deleted = await client.callTool({
		name: 'xplat_evidence',
		arguments: { op: 'delete', id: record.id },
	})

	assert.equal(deleted.structuredContent.data.deleted, true)
})

test('shutdown releases owned sessions and session-scoped evidence only', async () => {
	const root = makeWorkspace()
	makeConsumerApp(root, '.', { name: 'own-app' })
	const context = createWorkspaceContext({ workspaceRoot: root, evidenceRoot: join(root, '.ev') })
	const { shutdown } = createXplatMcpServer(context)

	let cleaned = false
	context.sessions.bindOwned({
		appId: '.',
		platform: 'web',
		targetId: 'web',
		cleanup: () => {
			cleaned = true
		},
	})

	context.sessions.attach({ appId: '.', platform: 'web', targetId: 'web' })
	const keep = context.evidence.record({ kind: 'note', summary: 'k', provenance: {} })
	context.evidence.record({ kind: 'log', summary: 't', provenance: {} })
	context.evidence.retain(keep.id)

	const result = await shutdown()
	assert.equal(cleaned, true)
	assert.equal(result.sessions.length, 2)
	assert.equal(result.evidence.deleted, 1)
	assert.equal(context.evidence.list().length, 1)
})

test('diagnostics MCP tool lists retained runs and shares CLI selector and envelope semantics', async () => {
	const root = makeWorkspace()
	makeConsumerApp(root, '.', { name: 'diagnostic-app' })
	const capture = createDevLogCapture(root, { platform: 'web', targetId: 'web' })
	capture.append({ stream: 'stderr', line: 'before MCP connection' })
	capture.close()
	const { client } = await connect(root)
	try {
		const tools = await client.listTools()
		assert.ok(tools.tools.some((tool) => tool.name === 'xplat_diagnostics'))
		assert.ok(!tools.tools.some((tool) => tool.name === 'xplat_logs'))
		const listed = await client.callTool({ name: 'xplat_diagnostics', arguments: {} })
		assert.equal(listed.structuredContent.data.runs[0].runId, capture.runId)
		const result = await client.callTool({
			name: 'xplat_diagnostics',
			arguments: { runId: capture.runId, cursor: 0 },
		})
		assert.ok(
			result.structuredContent.data.logs.records.some(
				(record) => record.line === 'before MCP connection',
			),
		)
		assert.equal(result.structuredContent.data.coverage.nativeReports.status, 'unsupported')
		const invalid = await client.callTool({
			name: 'xplat_diagnostics',
			arguments: { runId: capture.runId, sessionId: 'sess_x' },
		})
		assert.equal(invalid.structuredContent.error.code, 'invalid_selection')
	} finally {
		await client.close()
	}
})
