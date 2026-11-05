import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync, rmSync, symlinkSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { createWorkspaceContext } from '../dist/status.js'
import { createXplatMcpServer } from '../dist/server.js'
import { makeWorkspace, makeConsumerApp, writeFile, writeJson } from './helpers.mjs'

test('MCP docs bind each selected pnpm consumer to its installed release and refresh dependency changes', async (t) => {
	const root = makeWorkspace()
	t.after(() => rmSync(root, { recursive: true, force: true }))
	const remote = join(root, 'remote')
	mkdirSync(remote)
	const git = (args) => execFileSync('git', args, { cwd: remote, encoding: 'utf8' }).trim()
	git(['init', '-q'])
	for (const version of ['1.0.0', '2.0.0']) {
		writeJson(remote, 'packages/ui/package.json', { name: '@octane-xplat/ui', version })
		writeFile(remote, 'docs/control.md', `# Control\n\nUse control version ${version} on web.\n`)
		writeFile(
			remote,
			'FIXLOG.md',
			`# Fixlog\n\n## [Octane Xplat ${version}](tag) - 2026-10-31\n\n### Control fix\n\nControl state is restored on web.\n`,
		)

		writeFile(
			remote,
			'.agents/design/control.md',
			'# Internal control design\n\ncontrol speculation\n',
		)

		git(['add', '.'])
		git([
			'-c',
			'user.name=fixture',
			'-c',
			'user.email=fixture@example.invalid',
			'commit',
			'-qm',
			version,
		])

		git(['tag', `v${version}`])
	}

	for (const [app, version] of [
		['a', '1.0.0'],
		['b', '2.0.0'],
	]) {
		makeConsumerApp(root, app, { name: app })
		const store = `node_modules/.pnpm/ui@${version}/node_modules/@octane-xplat/ui`
		writeJson(join(root, app), `${store}/package.json`, { name: '@octane-xplat/ui', version })
		mkdirSync(join(root, app, 'node_modules/@octane-xplat'), { recursive: true })
		symlinkSync(join(root, app, store), join(root, app, 'node_modules/@octane-xplat/ui'))
	}

	const context = createWorkspaceContext({
		workspaceRoot: root,
		evidenceRoot: join(root, '.ev'),
		docs: {
			repo: remote,
			cacheDir: join(root, '.cache'),
			searchEmbedder: {
				id: 'mcp-fixture',
				async embed(texts) {
					return texts.map(() => [1, 0])
				},
			},
		},
	})

	const { server, shutdown } = createXplatMcpServer(context)
	const [ct, st] = InMemoryTransport.createLinkedPair()
	const client = new Client({ name: 'docs-test', version: '1' })
	await Promise.all([server.connect(st), client.connect(ct)])
	t.after(async () => {
		await shutdown()
		await client.close()
		await server.close()
	})

	const call = async (name, args = {}) =>
		(await client.callTool({ name, arguments: args })).structuredContent

	assert.equal(
		(await call('xplat_docs_search', { query: 'control' })).error.code,
		'ambiguous_selection',
	)

	await call('xplat_select_app', { app: 'a' })
	const release = (await call('xplat_docs_search', { query: 'restored', corpus: 'changelog' })).data
	assert.equal(release.retrieval[0].used, 'lexical')
	assert.equal(release.results[0].releaseVersion, '1.0.0')
	assert.equal(release.results[0].provenance.servedVersion, '1.0.0')
	assert.equal(
		(await client.listTools()).tools.some((tool) => tool.name === 'xplat_docs_index'),
		true,
	)
	const first = (await call('xplat_docs_search', { query: 'control' })).data
	assert.equal(first.results.length, 1, JSON.stringify(first))
	assert.equal(first.results[0].provenance.servedVersion, '1.0.0')
	assert.equal(first.results[0].provenance.match, 'exact')
	const ref = first.results[0].ref
	const prepared = (await call('xplat_docs_index')).data
	assert.equal(prepared.results[0].status, 'ready')
	const semantic = (await call('xplat_docs_search', { query: 'remember a screen' })).data
	assert.equal(semantic.retrieval[0].used, 'hybrid')
	assert.equal(semantic.results[0].provenance.servedVersion, '1.0.0')
	assert.match(JSON.stringify((await call('xplat_docs_read', { ref })).data), /1.0.0/)
	await call('xplat_select_app', { app: 'b' })
	assert.equal(
		(await call('xplat_docs_search', { query: 'control' })).data.results[0].provenance
			.servedVersion,
		'2.0.0',
	)

	await call('xplat_select_app', { app: 'a' })
	writeJson(join(root, 'a'), 'node_modules/@octane-xplat/ui/package.json', {
		name: '@octane-xplat/ui',
		version: '2.0.0',
	})

	const changed = (await call('xplat_docs_search', { query: 'control' })).data
	assert.ok(changed.bindingRevision > first.bindingRevision)
	assert.equal(changed.results[0].provenance.servedVersion, '2.0.0')
	assert.equal(
		(await call('xplat_docs_read', { ref })).data.provenance.match,
		'outside-installed-binding',
	)

	context.policy.grant('workspace')
	context.policy.revoke('workspace')
	assert.equal(
		(await call('xplat_docs_search', { query: 'control' })).error.code,
		'permission_denied',
	)
})
