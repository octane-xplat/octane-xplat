// End-to-end code retrieval: a real MCP client exercising xplat_code_search
// and xplat_code_read over linked transports (work item C).

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { join } from 'node:path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { createCodeService } from '@octane-xplat/cli/mcp/code-service'
import { createXplatMcpServer } from '../dist/server.js'
import { createWorkspaceContext } from '../dist/status.js'
import { makeConsumerApp, makeWorkspace, writeFile, writeJson } from './helpers.mjs'

async function connect(root, options = {}) {
	const context = createWorkspaceContext({
		workspaceRoot: root,
		evidenceRoot: join(root, '.ev'),
		...options,
	})

	context.code =
		options.code ??
		createCodeService({
			workspaceRoot: root,
			workspaceKind: () => context.discovery.workspace.kind,
		})

	if (context.code) {
		context.codeIndexStatus = (app) => context.code.status(app)
	}

	const { server } = createXplatMcpServer(context)
	const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
	const client = new Client({ name: 'test-client', version: '0.0.0' })
	await Promise.all([server.connect(serverTransport), client.connect(clientTransport)])
	return { client, context }
}

test('code search/read work over the real service on the bound app', async () => {
	const root = makeWorkspace()
	makeConsumerApp(root, '.', { name: 'code-app' })
	writeFile(root, 'src/App.tsrx', 'export function App() {\n\treturn <Meter />\n}\n')
	writeJson(root, 'node_modules/@octane-xplat/ui/package.json', {
		name: '@octane-xplat/ui',
		version: '0.14.0',
	})

	writeFile(root, 'node_modules/@octane-xplat/ui/src/Meter.ts', 'export const Meter = 1\n')

	const { client } = await connect(root)

	const found = await client.callTool({
		name: 'xplat_code_search',
		arguments: { query: 'Meter', mode: 'exact' },
	})

	assert.ok(!found.isError)
	const data = found.structuredContent.data
	assert.ok(data.results.length > 0)
	const byCorpus = Object.fromEntries(data.results.map((r) => [r.corpus, r]))
	assert.equal(byCorpus.app.path, 'src/App.tsrx')
	assert.equal(byCorpus.framework.package, '@octane-xplat/ui')
	assert.equal(byCorpus.framework.provenance.servedVersion, '0.14.0')
	assert.ok(data.tree)

	const page = await client.callTool({
		name: 'xplat_code_read',
		arguments: { ref: byCorpus.framework.ref },
	})

	assert.ok(!page.isError)
	assert.match(page.structuredContent.data.content, /export const Meter/)

	// Secrets never surface through the tool surface.
	writeFile(root, '.env', 'TOKEN=x\n')
	const env = await client.callTool({
		name: 'xplat_code_read',
		arguments: { corpus: 'app', path: '.env' },
	})

	assert.equal(env.isError, true)
	assert.equal(env.structuredContent.error.code, 'invalid_selection')
})

test('project status and the capability matrix reflect the wired provider', async () => {
	const root = makeWorkspace()
	makeConsumerApp(root, '.', { name: 'cap-code-app' })
	const { client } = await connect(root)

	const status = await client.callTool({ name: 'xplat_project_status', arguments: {} })
	assert.equal(status.structuredContent.data.codeIndex.state, 'ready')
	assert.equal(status.structuredContent.data.codeIndex.semantic.backend, 'local-tfidf')

	const matrix = await client.callTool({ name: 'xplat_capability_matrix', arguments: {} })
	const byId = Object.fromEntries(
		matrix.structuredContent.data.capabilities[0].capabilities.map((c) => [c.capability, c]),
	)

	assert.equal(byId.code_search.status, 'supported')
})

test('ambiguous selection fails honestly; missing provider reports unavailable', async () => {
	const root = makeWorkspace()
	makeConsumerApp(root, 'apps/a', { name: 'a' })
	makeConsumerApp(root, 'apps/b', { name: 'b' })
	const { client } = await connect(root)

	const ambiguous = await client.callTool({
		name: 'xplat_code_search',
		arguments: { query: 'anything' },
	})

	assert.equal(ambiguous.isError, true)
	assert.equal(ambiguous.structuredContent.error.code, 'ambiguous_selection')

	// A context with no provider wired keeps the tools honest.
	const bare = createWorkspaceContext({ workspaceRoot: root, evidenceRoot: join(root, '.ev2') })
	const { server } = createXplatMcpServer(bare)
	const [ct, st] = InMemoryTransport.createLinkedPair()
	const client2 = new Client({ name: 'test-client-2', version: '0.0.0' })
	await Promise.all([server.connect(st), client2.connect(ct)])
	const missing = await client2.callTool({
		name: 'xplat_code_search',
		arguments: { query: 'anything' },
	})

	assert.equal(missing.isError, true)
	assert.equal(missing.structuredContent.error.code, 'unavailable')
})
