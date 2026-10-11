import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { createCodeService } from '../src/mcp/code-service.mjs'

const write = (root, rel, content) => {
	const path = join(root, rel)
	mkdirSync(join(path, '..'), { recursive: true })
	writeFileSync(path, content)
}

/** Consumer app fixture: app source + installed @octane-xplat packages. */
function makeConsumer(t, { installed = { '@octane-xplat/ui': '1.0.0' } } = {}) {
	const dir = mkdtempSync(join(tmpdir(), 'xplat-mcp-code-'))
	t.after(() => rmSync(dir, { recursive: true, force: true }))
	write(
		dir,
		'package.json',
		JSON.stringify({
			name: 'consumer-app',
			dependencies: Object.fromEntries(Object.keys(installed).map((n) => [n, `^${installed[n]}`])),
		}),
	)

	for (const [name, version] of Object.entries(installed)) {
		write(dir, `node_modules/${name}/package.json`, JSON.stringify({ name, version }))
	}

	write(
		dir,
		'src/App.tsrx',
		'export function App() {\n\tconst photo = capturePhoto()\n\treturn <Button title="Snap" />\n}\n',
	)

	if (installed['@octane-xplat/ui']) {
		write(
			dir,
			'node_modules/@octane-xplat/ui/src/SmoothCorners.ts',
			'export function SmoothCorners(props) { /* corner radius engine */ }\n',
		)
	}

	return dir
}

const appRef = (root, rel = '.') => ({
	id: rel,
	name: 'consumer-app',
	root: join(root, rel === '.' ? '' : rel),
	relativeRoot: rel,
	kind: 'consumer-app',
	platforms: ['web', 'ios'],
})

const service = (root, kind = 'consumer') =>
	createCodeService({ workspaceRoot: root, workspaceKind: kind })

test('exact search finds app and framework code with labeled corpora', async (t) => {
	const dir = makeConsumer(t)
	const svc = service(dir)
	const app = appRef(dir)

	const out = await svc.search({ app, query: 'capturePhoto', mode: 'exact' })
	const appHit = out.results.find((r) => r.corpus === 'app')
	assert.ok(appHit)
	assert.equal(appHit.matchType, 'exact')
	assert.equal(appHit.ref, 'xplat-code://app/src/App.tsrx')
	assert.equal(appHit.provenance.source, 'app-source')
	assert.equal(appHit.freshness.state, 'current')
	assert.match(appHit.excerpt, /capturePhoto/)

	const fw = await svc.search({ app, query: 'SmoothCorners', mode: 'exact' })
	const fwHit = fw.results.find((r) => r.corpus === 'framework')
	assert.ok(fwHit)
	assert.equal(fwHit.package, '@octane-xplat/ui')
	assert.equal(fwHit.provenance.source, 'framework-source')
	assert.equal(fwHit.provenance.servedVersion, '1.0.0')
	assert.equal(fwHit.ref, 'xplat-code://framework/@octane-xplat/ui/SmoothCorners.ts')
})

test('secrets, generated output, and node_modules stay out of results and reads', async (t) => {
	const dir = makeConsumer(t)
	write(dir, '.env', 'API_TOKEN=hunter2\n')
	write(dir, 'secrets/keys.ts', 'export const privateKey = "..."\n')
	write(dir, 'dist/bundle.js', 'const capturePhoto = 1\n')
	write(dir, 'cert.pem', 'PEM BYTES\n')

	const svc = service(dir)
	const app = appRef(dir)

	// Nothing excluded is reachable through search.
	const out = await svc.search({ app, query: 'capturePhoto', mode: 'exact' })
	for (const hit of out.results) {
		assert.doesNotMatch(hit.ref, /\.env|secrets\/|dist\//)
	}

	// Nor through direct reads — excluded or out of scope, never content.
	assert.equal((await svc.read({ app, path: '.env' })).status, 'excluded')
	assert.equal((await svc.read({ app, path: 'secrets/keys.ts' })).status, 'excluded')
	assert.equal((await svc.read({ app, path: 'dist/bundle.js' })).status, 'excluded')
	assert.equal((await svc.read({ app, path: '../outside.ts' })).status, 'out-of-scope')
	assert.equal(
		(await svc.read({ app, ref: 'xplat-code://app/src/../package.json' })).status,
		'out-of-scope',
	)
})

test('platform filter includes shared and platform-marked files only', async (t) => {
	const dir = makeConsumer(t)
	write(dir, 'src/shared.ts', 'export const sharedToggleHelper = 1\n')
	write(dir, 'src/Toggle.ios.ts', 'export const Toggle = "ios switch"\n')
	write(dir, 'src/Toggle.android.ts', 'export const Toggle = "android switch"\n')
	write(dir, 'src/Toggle.mobile.ts', 'export const ToggleMobile = "mobile switch"\n')
	write(dir, 'src/Toggle.macos.ts', 'export const ToggleMac = "macos switch"\n')

	const svc = service(dir)
	const app = appRef(dir)

	const ios = await svc.search({
		app,
		query: 'Toggle',
		mode: 'exact',
		platform: 'ios',
		corpus: 'app',
	})

	const paths = ios.results.map((r) => r.path)
	assert.ok(paths.includes('src/Toggle.ios.ts'))
	assert.ok(paths.includes('src/Toggle.mobile.ts'))
	assert.ok(paths.includes('src/shared.ts'))
	assert.ok(!paths.includes('src/Toggle.android.ts'))
	assert.ok(!paths.includes('src/Toggle.macos.ts'))

	const mac = await svc.search({
		app,
		query: 'Toggle',
		mode: 'exact',
		platform: 'macos',
		corpus: 'app',
	})

	const macPaths = mac.results.map((r) => r.path)
	assert.ok(macPaths.includes('src/Toggle.macos.ts'))
	assert.ok(!macPaths.includes('src/Toggle.mobile.ts'))
})

test('reads are bounded with continuation refs and freshness', async (t) => {
	const dir = makeConsumer(t)
	const body = Array.from({ length: 400 }, (_, i) => `// line ${i}\n`).join('')
	write(dir, 'src/Big.ts', body)

	const svc = service(dir)
	const app = appRef(dir)

	const found = await svc.search({ app, query: 'line 399', mode: 'exact' })
	const page = await svc.read({ app, ref: found.results[0].ref, offset: 0, limit: 200 })
	assert.equal(page.corpus, 'app')
	assert.equal(page.path, 'src/Big.ts')
	assert.equal(page.content.length, 200)
	assert.ok(page.nextOffset > 0)
	assert.equal(page.freshness.state, 'current')

	const rest = await svc.read({ app, ref: page.ref, offset: page.nextOffset })
	assert.match(rest.content, /line 399/)
	assert.equal(rest.nextOffset, null)

	// Invalid refs and vanished files are reported, never invented.
	assert.equal((await svc.read({ app, ref: 'nonsense' })).status, 'invalid-ref')
	assert.equal((await svc.read({ app, path: 'src/Gone.ts' })).status, 'unavailable')
})

test('uncommitted edits are reflected immediately in exact results', async (t) => {
	const dir = makeConsumer(t)
	const svc = service(dir)
	const app = appRef(dir)

	const before = await svc.search({ app, query: 'capturePhoto', mode: 'exact' })
	assert.match(before.results[0].excerpt, /capturePhoto/)

	write(
		dir,
		'src/App.tsrx',
		'export function App() {\n\tconst clip = recordVideo()\n\treturn <Button />\n}\n',
	)

	const after = await svc.search({ app, query: 'recordVideo', mode: 'exact' })
	assert.match(after.results[0].excerpt, /recordVideo/)
	assert.equal(after.results[0].freshness.state, 'current')
})

test('framework corpus binds linked checkouts as development content', async (t) => {
	const dir = makeConsumer(t, { installed: {} })
	const linked = mkdtempSync(join(tmpdir(), 'xplat-mcp-linked-'))
	t.after(() => rmSync(linked, { recursive: true, force: true }))
	write(linked, 'packages/ui/package.json', '{"name":"@octane-xplat/ui","version":"0.0.0"}')
	write(linked, 'packages/ui/src/DevWidget.ts', 'export const devWidget = "worktree only"\n')

	mkdirSync(join(dir, 'node_modules/@octane-xplat'), { recursive: true })
	symlinkSync(join(linked, 'packages/ui'), join(dir, 'node_modules/@octane-xplat/ui'))
	write(
		dir,
		'package.json',
		'{"name":"consumer-app","dependencies":{"@octane-xplat/ui":"link:../linked/packages/ui"}}',
	)

	const svc = service(dir)
	const app = appRef(dir)
	const out = await svc.search({ app, query: 'devWidget', mode: 'exact' })
	const hit = out.results.find((r) => r.corpus === 'framework')
	assert.ok(hit)
	assert.equal(hit.provenance.source, 'framework-source')
	assert.equal(hit.provenance.servedVersion, 'development')
	assert.equal(hit.provenance.scope, 'project')
})

test('semantic index builds in background, serves intent hits, never blocks exact', async (t) => {
	const dir = makeConsumer(t)
	// >40 files makes the build yield mid-pass, so 'preparing' is observable.
	for (let i = 0; i < 45; i++) {
		write(dir, `src/filler/File${i}.ts`, `export const filler${i} = ${i}\n`)
	}

	const svc = service(dir)
	const app = appRef(dir)

	// First call: exact results arrive immediately; the index reports its state.
	const first = await svc.search({ app, query: 'capturePhoto', mode: 'auto' })
	assert.ok(first.results.length > 0)
	assert.ok(['preparing', 'ready', 'stale'].includes(first.semantic.state))

	await svc.prepareIndex(app)
	const ready = await svc.search({ app, query: 'corner radius', mode: 'semantic' })
	assert.equal(ready.semantic.state, 'ready')
	const semanticHit = ready.results.find((r) => r.matchType === 'semantic')
	assert.ok(semanticHit)
	assert.equal(semanticHit.corpus, 'framework')
	assert.ok(semanticHit.indexRevision >= 1)

	// Exact mode never touches the index state machine.
	const exactOnly = await svc.search({ app, query: 'capturePhoto', mode: 'exact' })
	assert.equal(exactOnly.semantic.state, 'not-requested')
	assert.ok(exactOnly.results.length > 0)
})

test('stale semantic hits are revalidated against current source, not served', async (t) => {
	const dir = makeConsumer(t)
	for (let i = 0; i < 45; i++) {
		write(dir, `src/filler/File${i}.ts`, `export const filler${i} = ${i}\n`)
	}

	write(dir, 'src/unique.ts', 'export function flibbertyGibbet() { return 42 }\n')

	const svc = service(dir)
	const app = appRef(dir)
	await svc.prepareIndex(app)

	// Index ready → semantic finds the unique token's chunk.
	const first = await svc.search({ app, query: 'flibbertyGibbet', mode: 'semantic' })
	assert.ok(first.results.length > 0)

	// Drift the file, then query while the rebuild is still in flight:
	// changed chunks fail revalidation and drop rather than serve stale.
	write(dir, 'src/unique.ts', 'export function completelyRenamed() { return 0 }\n')
	const drifted = await svc.search({ app, query: 'flibbertyGibbet', mode: 'semantic' })
	assert.ok(['stale', 'ready'].includes(drifted.semantic.state))
	for (const hit of drifted.results) {
		assert.equal(hit.freshness.state, 'current')
	}

	await svc.prepareIndex(app)
	const rebuilt = await svc.search({ app, query: 'flibbertyGibbet', mode: 'semantic' })
	assert.equal(
		rebuilt.results.filter((r) => r.path === 'src/unique.ts').length,
		0,
		'renamed token must not appear after reindex',
	)
})

test('status reports corpora coverage, freshness, and semantic index state', async (t) => {
	const dir = makeConsumer(t)
	const svc = service(dir)
	const app = appRef(dir)

	const status = svc.status(app)
	assert.equal(status.state, 'ready')
	assert.ok(status.files > 0)
	assert.ok(status.corpora.find((c) => c.corpus === 'app'))
	assert.ok(
		status.corpora.find((c) => c.corpus === 'framework' && c.package === '@octane-xplat/ui'),
	)

	assert.ok(typeof status.freshness === 'string')
	assert.equal(status.semantic.backend, 'local-tfidf')
})

test('no bound app in a consumer workspace asks for selection', async (t) => {
	const dir = makeConsumer(t)
	const svc = service(dir)
	const out = await svc.search({ app: null, query: 'capturePhoto' })
	assert.equal(out.status, 'selection-required')
})

test('framework-repo workspaces index packages/* without a bound app', async (t) => {
	const dir = mkdtempSync(join(tmpdir(), 'xplat-mcp-fwrepo-'))
	t.after(() => rmSync(dir, { recursive: true, force: true }))
	write(dir, 'package.json', '{"name":"octane-xplat","private":true}')
	write(dir, 'packages/widgets/package.json', '{"name":"@octane-xplat/widgets","version":"0.0.0"}')
	write(dir, 'packages/widgets/src/Gauge.ts', 'export const Gauge = () => "dial"\n')

	const svc = service(dir, 'framework-repo')
	const out = await svc.search({ app: null, query: 'Gauge', mode: 'exact' })
	const hit = out.results.find((r) => r.corpus === 'framework')
	assert.ok(hit)
	assert.equal(hit.package, '@octane-xplat/widgets')
	assert.equal(hit.provenance.servedVersion, 'development')
})
