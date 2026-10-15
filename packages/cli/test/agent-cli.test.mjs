// Agent CLI contract tests (item 1: discovery and retrieval journey). Drives
// the real `xplat` bin over fixture workspaces — envelope purity, stable
// exits, selection precedence, exact-version docs/code semantics.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const BIN = fileURLToPath(new URL('../src/cli.mjs', import.meta.url))

const run = (args, { cwd = '/', env = {} } = {}) => {
	try {
		const stdout = execFileSync('node', [BIN, ...args], {
			cwd,
			env: { ...process.env, ...env },
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'pipe'],
		})

		return { code: 0, stdout, stderr: '' }
	} catch (error) {
		return {
			code: error.status,
			stdout: error.stdout ?? '',
			stderr: error.stderr ?? '',
		}
	}
}

const json = (out) => {
	const parsed = JSON.parse(out.stdout)
	assert.equal(parsed.contractVersion, 1)
	assert.match(parsed.requestId, /^req-/)
	return parsed
}

const makeWorkspace = (name) => mkdtempSync(join(tmpdir(), `xplat-agent-${name}-`))

const writeJson = (root, rel, value) => {
	const path = join(root, rel)
	mkdirSync(join(path, '..'), { recursive: true })
	writeFileSync(path, JSON.stringify(value, null, 2))
}

const writeFile = (root, rel, content) => {
	const path = join(root, rel)
	mkdirSync(join(path, '..'), { recursive: true })
	writeFileSync(path, content)
}

// A consumer app with a linked framework package — the node_modules symlink
// mirrors how pnpm materializes `link:` deps, so the docs/code bindings see
// the development checkout — deterministic, no release-repo fetch.
const makeLinkedApp = (root, rel = 'app') => {
	writeJson(root, 'vendor/ui/package.json', { name: '@octane-xplat/ui', version: '0.14.0' })
	// developmentDocsDir serves the linked workspace's repo-level docs/.
	writeFile(root, 'vendor/pnpm-workspace.yaml', 'packages:\n  - ui\n')
	writeFile(root, 'vendor/docs/start/install.md', '# Install the framework\nAdd it with pnpm.\n')
	writeFile(root, 'vendor/ui/src/index.ts', 'export const marker = 1\n')
	writeJson(root, `${rel}/package.json`, {
		name: 'fixture-app',
		version: '1.0.0',
		dependencies: { '@octane-xplat/ui': 'link:../vendor/ui', octane: '0.11.0' },
	})

	writeFile(root, `${rel}/vite.config.ts`, 'export default {}\n')
	writeFile(root, `${rel}/src/main.ts`, "import { marker } from '@octane-xplat/ui'\n")
	mkdirSync(join(root, rel, 'node_modules', '@octane-xplat'), { recursive: true })
	symlinkSync(join(root, 'vendor', 'ui'), join(root, rel, 'node_modules', '@octane-xplat', 'ui'))
	return rel
}

test('catalog emits the machine-readable contract without a project', () => {
	const out = run(['catalog', '--json'])
	assert.equal(out.code, 0)
	const { data } = json(out)
	const names = data.commands.map((c) => c.command)
	for (const expected of [
		'catalog',
		'status',
		'app select',
		'capabilities',
		'permissions',
		'targets',
		'docs search',
		'docs read',
		'guidance',
		'code search',
		'code read',
	]) {
		assert.ok(names.includes(expected), `missing ${expected}`)
	}

	assert.ok(data.planned.some((p) => p.name === 'session start'))
	assert.equal(data.exits[2], 'invalid input or ambiguous selection')
	assert.equal(data.errorExit.ambiguous_selection, 2)
	assert.match(data.selection.preference, /node_modules\/\.cache\/xplat\/agent/)
})

test('--schema describes a command without executing it', () => {
	const root = makeWorkspace('empty')
	const out = run(['docs', 'search', '--schema'], { cwd: root })
	assert.equal(out.code, 0)
	const { data } = json(out)
	assert.equal(data.command, 'docs search')
	assert.equal(data.mcpTool, 'xplat_docs_search')
	assert.equal(data.requiresBoundApp, true)
	assert.equal(data.output.kind, 'json')
})

test('help renders without a project and group help lists members', () => {
	const out = run(['docs'], { cwd: '/' })
	assert.equal(out.code, 0)
	assert.match(out.stdout, /docs search/)
	assert.match(out.stdout, /docs read/)

	const usage = run(['targets', '--help'])
	assert.equal(usage.code, 0)
	assert.match(usage.stdout, /Usage: xplat targets/)
})

test('unknown commands and flags fail with invalid_selection exit 2', () => {
	// Non-agent heads stay with cmd-ts: a nonzero usage failure, not the
	// machine envelope (the agent surface is the catalog's command list).
	assert.notEqual(run(['frobnicate']).code, 0)
	const unknown = run(['docs', 'serach', '--json'])
	assert.equal(unknown.code, 2)
	assert.equal(json(unknown).error.code, 'invalid_selection')

	const flag = run(['status', '--bogus', '--json'])
	assert.equal(flag.code, 2)
	assert.equal(json(flag).error.code, 'invalid_selection')

	const positional = run(['docs', 'search', '--json'])
	assert.equal(positional.code, 2)
	assert.equal(json(positional).error.code, 'invalid_selection')
})

test('status reports sole-app discovery and CLI server identity', () => {
	const root = makeWorkspace('solo')
	makeLinkedApp(root)
	const { data } = json(run(['status', '--project', root, '--json']))
	assert.equal(data.server.name, '@octane-xplat/cli')
	assert.equal(data.identity.selection.state, 'bound')
	assert.equal(data.identity.selection.reason, 'sole-app')
	assert.equal(data.identity.selection.app.id, 'app')
})

test('ambiguous workspaces never silently bind; explicit selection wins', () => {
	const root = makeWorkspace('multi')
	makeLinkedApp(root, 'app-one')
	makeLinkedApp(root, 'app-two')

	const status = json(run(['status', '--project', root, '--json']))
	assert.equal(status.data.identity.selection.state, 'ambiguous')
	assert.equal(status.data.identity.selection.candidates.length, 2)

	const denied = run(['docs', 'search', 'install', '--project', root, '--json'])
	assert.equal(denied.code, 2)
	assert.equal(json(denied).error.code, 'ambiguous_selection')

	// An explicit --app flag binds for that invocation only.
	const bound = json(
		run(['status', '--project', root, '--app', 'app-one', '--json']),
	)

	assert.equal(bound.data.identity.selection.state, 'bound')
	assert.equal(bound.data.identity.selection.reason, 'explicit')
})

test('app select persists a client/workspace preference; clients are isolated', () => {
	const root = makeWorkspace('pref')
	makeLinkedApp(root, 'one')
	makeLinkedApp(root, 'two')

	const selected = json(
		run(['app', 'select', 'two', '--project', root, '--client', 'agent-b', '--json']),
	)

	assert.equal(selected.data.bound.id, 'two')
	assert.match(selected.data.preference.path, /agent-b\.json$/)
	assert.ok(existsSync(selected.data.preference.path))

	// The preference binds subsequent commands for that client only.
	const bound = json(
		run(['status', '--project', root, '--client', 'agent-b', '--json']),
	)

	assert.equal(bound.data.identity.selection.app.id, 'two')
	assert.equal(bound.data.identity.selection.reason, 'preference')

	const other = json(run(['status', '--project', root, '--client', 'agent-c', '--json']))
	assert.equal(other.data.identity.selection.state, 'ambiguous')
})

test('docs search/read bind the development checkout for linked packages', () => {
	const root = makeWorkspace('docs')
	makeLinkedApp(root)
	const search = json(
		run(['docs', 'search', 'install', '--project', root, '--app', 'app', '--json']),
	)

	const hit = search.data.results.find((r) => r.path === 'docs/start/install.md')
	assert.ok(hit, JSON.stringify(search.data.results))
	assert.equal(hit.provenance.source, 'development-docs')
	assert.equal(hit.provenance.match, 'exact')
	assert.equal(hit.provenance.servedVersion, 'development')

	const read = json(
		run(['docs', 'read', '--ref', hit.ref, '--project', root, '--app', 'app', '--json']),
	)

	assert.match(read.data.content, /Install the framework/)
	assert.equal(read.data.provenance.match, 'exact')
})

test('missing release snapshots report explicit unavailable, never latest', () => {
	const root = makeWorkspace('offline')
	// A "registry" dependency (local manifest only): its release tag can
	// never resolve against an unreachable repo, and the service must say so.
	writeJson(root, 'app/package.json', {
		name: 'fixture-app',
		version: '1.0.0',
		dependencies: { '@octane-xplat/ui': '0.14.0' },
	})

	writeJson(root, 'app/node_modules/@octane-xplat/ui/package.json', {
		name: '@octane-xplat/ui',
		version: '0.14.0',
	})

	writeFile(root, 'app/vite.config.ts', 'export default {}\n')

	const out = json(
		run(['docs', 'read', '--package', '@octane-xplat/ui', '--path', 'docs/start/install.md', '--project', root, '--json'], {
			env: {
				XPLAT_DOCS_REPO: 'file:///nonexistent/xplat-release',
				XPLAT_MCP_CACHE: join(root, 'docs-cache'),
			},
		}),
	)

	assert.equal(out.data.status, 'unavailable')
	assert.match(out.data.reason, /remote-unavailable|tag-absent|git-unavailable/)
	assert.equal(out.data.fallback?.kind, 'installed-source')
})

test('code search/read return current-source refs with provenance', () => {
	const root = makeWorkspace('code')
	makeLinkedApp(root)
	const search = json(
		run(['code', 'search', 'marker', '--project', root, '--mode', 'exact', '--json']),
	)

	const hit = search.data.results.find((r) => r.corpus === 'framework')
	assert.ok(hit, JSON.stringify(search.data.results))
	assert.equal(hit.freshness.state, 'current')

	const read = json(
		run(['code', 'read', '--ref', hit.ref, '--project', root, '--json']),
	)

	assert.match(read.data.content, /marker = 1/)
})

test('permissions, capabilities and targets report through the envelope', () => {
	const root = makeWorkspace('ops')
	makeLinkedApp(root)

	const denied = json(
		run(['permissions', '--scope', 'visual-capture', '--project', root, '--json']),
	)

	assert.equal(denied.data.check.granted, false)
	assert.equal(denied.data.grant.state, 'required')

	const caps = json(
		run(['capabilities', '--platform', 'web', '--project', root, '--json']),
	)

	const rows = caps.data.capabilities[0].capabilities.map((c) => c.capability)
	for (const id of ['docs', 'code_search', 'target_discovery', 'dev_actions']) {
		assert.ok(rows.includes(id), `missing ${id}`)
	}

	const targets = json(
		run(['targets', '--platform', 'web', '--project', root, '--json']),
	)

	assert.equal(targets.data.platforms[0].targets[0].targetId, 'web')
})

test('stdout stays pure JSON in --json mode; human mode reads plainly', () => {
	const root = makeWorkspace('purity')
	makeLinkedApp(root)
	const out = run(['status', '--project', root, '--json'])
	assert.equal(out.code, 0)
	json(out) // throws if stdout is not a single JSON document
	assert.equal(out.stderr, '')

	const human = run(['status', '--project', root])
	assert.equal(human.code, 0)
	assert.match(human.stdout, /Workspace:/)
})
