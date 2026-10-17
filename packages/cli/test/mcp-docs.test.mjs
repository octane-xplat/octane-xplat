import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { createDocsService } from '../dist/mcp/docs-service.js'
import { resolveInstallations } from '../dist/mcp/docs-binding.js'
import { releaseMapping } from '../dist/mcp/release-map.js'

const GIT_ENV = {
	...process.env,
	GIT_AUTHOR_NAME: 't',
	GIT_AUTHOR_EMAIL: 't@t',
	GIT_COMMITTER_NAME: 't',
	GIT_COMMITTER_EMAIL: 't@t',
}

const git = (args, cwd) => execFileSync('git', args, { cwd, env: GIT_ENV, encoding: 'utf8' }).trim()
const commitAll = (dir, msg) => {
	git(['add', '-A'], dir)
	return git(['commit', '-qm', msg], dir) || git(['rev-parse', 'HEAD'], dir)
}

const head = (dir) => git(['rev-parse', 'HEAD'], dir)

/** Fixture release repo: c1 tagged v1.0.0 (ui@1.0.0), c2 tagged v2.0.0. */
function makeRemote(t) {
	const dir = mkdtempSync(join(tmpdir(), 'xplat-mcp-remote-'))
	t.after(() => rmSync(dir, { recursive: true, force: true }))
	git(['init', '-q'], dir)

	mkdirSync(join(dir, 'packages/ui'), { recursive: true })
	mkdirSync(join(dir, 'packages/media'), { recursive: true })
	mkdirSync(join(dir, 'docs/app'), { recursive: true })
	writeFileSync(
		join(dir, 'packages/ui/package.json'),
		'{"name":"@octane-xplat/ui","version":"1.0.0"}',
	)

	writeFileSync(
		join(dir, 'packages/media/package.json'),
		'{"name":"@octane-xplat/media","version":"1.0.0"}',
	)

	writeFileSync(
		join(dir, 'docs/app/camera.md'),
		'# Camera capture\n\nX docs: use capture() for web ios.\n',
	)

	commitAll(dir, 'c1')
	const c1 = head(dir)
	git(['tag', 'v1.0.0'], dir)

	writeFileSync(
		join(dir, 'packages/ui/package.json'),
		'{"name":"@octane-xplat/ui","version":"2.0.0"}',
	)

	writeFileSync(
		join(dir, 'packages/media/package.json'),
		'{"name":"@octane-xplat/media","version":"2.0.0"}',
	)

	writeFileSync(
		join(dir, 'docs/app/camera.md'),
		'# Camera capture\n\nY docs: use captureV2() for web ios.\n',
	)

	commitAll(dir, 'c2')
	const c2 = head(dir)
	git(['tag', 'v2.0.0'], dir)

	// v3.0.0 exists but its package metadata does not match (says 2.0.0).
	git(['tag', 'v3.0.0'], dir)
	return { dir, c1, c2 }
}

/** Consumer project with installed @octane-xplat packages. */
function makeConsumer(t, versions, { lockfile } = {}) {
	const dir = mkdtempSync(join(tmpdir(), 'xplat-mcp-consumer-'))
	t.after(() => rmSync(dir, { recursive: true, force: true }))
	const deps = Object.fromEntries(Object.entries(versions).map(([n, v]) => [n, `^${v}`]))
	writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'consumer', dependencies: deps }))
	for (const [name, version] of Object.entries(versions)) {
		const pkgDir = join(dir, 'node_modules', name)
		mkdirSync(pkgDir, { recursive: true })
		writeFileSync(join(pkgDir, 'package.json'), JSON.stringify({ name, version }))
	}

	if (lockfile) {
		writeFileSync(join(dir, 'pnpm-lock.yaml'), lockfile)
	}

	return dir
}

function service(t, workspace, remote, extra = {}) {
	return createDocsService({
		workspaceRoot: workspace,
		cacheDir: mkdtempSync(join(tmpdir(), 'xplat-mcp-cache-')),
		repo: remote,
		...extra,
	})
}

test('release mapping: lockstep v-tags, tsrx-typegen track, unknown unmapped', () => {
	assert.deepEqual(releaseMapping('@octane-xplat/ui', '1.2.3'), {
		repo: 'https://github.com/octane-xplat/octane-xplat',
		dir: 'packages/ui',
		tag: 'v1.2.3',
	})

	assert.equal(releaseMapping('tsrx-typegen', '0.2.2').tag, 'tsrx-typegen-v0.2.2')
	assert.equal(releaseMapping('some-other-pkg', '1.0.0'), null)
})

test('search binds the installed version to its exact tag and pins the commit', async (t) => {
	const { dir: remote, c1, c2 } = makeRemote(t)
	const consumer = makeConsumer(t, { '@octane-xplat/ui': '1.0.0' })
	const svc = service(t, consumer, remote)

	const out = await svc.search({ query: 'capture' })
	assert.equal(out.unavailable.length, 0)
	assert.equal(out.results.length, 1)
	const hit = out.results[0]
	assert.equal(hit.provenance.match, 'exact')
	assert.equal(hit.provenance.tag, 'v1.0.0')
	assert.equal(hit.provenance.commit, c1)
	assert.equal(hit.provenance.servedVersion, '1.0.0')
	assert.match(hit.excerpt, /X docs/)
	assert.doesNotMatch(hit.excerpt, /captureV2/)

	// Re-resolution is stable — still the same pinned commit, cache reused.
	const again = await svc.search({ query: 'capture' })
	assert.equal(again.results[0].provenance.commit, c1)
	assert.notEqual(c1, c2)
})

test('verified cached snapshot serves offline after remote disappears', async (t) => {
	const { dir: remote, c1 } = makeRemote(t)
	const consumer = makeConsumer(t, { '@octane-xplat/ui': '1.0.0' })
	const cache = mkdtempSync(join(tmpdir(), 'xplat-mcp-cache-'))
	const svc = createDocsService({ workspaceRoot: consumer, cacheDir: cache, repo: remote })
	const first = await svc.search({ query: 'capture' })
	assert.equal(first.results[0].provenance.commit, c1)
	assert.equal(first.results[0].provenance.offline, false)

	// Remote gone — the verified snapshot still serves, labeled offline.
	const moved = `${remote}-gone`
	git(['--version']) // sanity: git still present
	execFileSync('mv', [remote, moved])
	t.after(() => execFileSync('mv', [moved, remote]))
	const out = await svc.search({ query: 'capture' })
	assert.equal(out.results[0].provenance.commit, c1)
	assert.equal(out.results[0].provenance.offline, true)
})

test('a moved remote tag cannot silently replace a cached binding', async (t) => {
	const { dir: remote, c1 } = makeRemote(t)
	const consumer = makeConsumer(t, { '@octane-xplat/ui': '1.0.0' })
	const svc = service(t, consumer, remote)
	await svc.search({ query: 'capture' })

	// Retag v1.0.0 at a different commit that still carries 1.0.0 metadata.
	git(['checkout', '-qb', 'rewrite', c1], remote)
	writeFileSync(join(remote, 'docs/app/camera.md'), '# Camera capture\n\nRewritten docs.\n')
	commitAll(remote, 'rewrite')
	const moved = head(remote)
	git(['tag', '-d', 'v1.0.0'], remote)
	git(['tag', 'v1.0.0'], remote)
	assert.notEqual(moved, c1)

	const out = await svc.search({ query: 'capture' })
	assert.equal(out.results.length, 0)
	assert.equal(out.conflicts.length, 1)
	const conflict = out.conflicts[0]
	assert.equal(conflict.status, 'tag-conflict')
	assert.equal(conflict.cached.commit, c1)
	assert.equal(conflict.remote.commit, moved)

	// 'cached' keeps the old binding; 'remote' explicitly rebinds.
	assert.equal(
		(await svc.resolveTagConflict('@octane-xplat/ui', '1.0.0', 'cached')).status,
		'kept-cached',
	)

	const again = await svc.search({ query: 'capture' })
	assert.equal(again.conflicts.length, 1)
	assert.equal(
		(await svc.resolveTagConflict('@octane-xplat/ui', '1.0.0', 'remote')).status,
		'rebound',
	)

	const after = await svc.search({ query: 'capture' })
	assert.equal(after.results[0].provenance.commit, moved)
	assert.match(after.results[0].excerpt, /Rewritten docs/)
})

test('absent tag produces an explicit unavailable result plus installed-source fallback', async (t) => {
	const { dir: remote } = makeRemote(t)
	const consumer = makeConsumer(t, { '@octane-xplat/ui': '9.9.9' })
	const svc = service(t, consumer, remote)
	const out = await svc.search({ query: 'capture' })
	assert.equal(out.results.length, 0)
	assert.equal(out.unavailable.length, 1)
	assert.equal(out.unavailable[0].reason, 'tag-absent')
	assert.equal(out.unavailable[0].fallback.kind, 'installed-source')
	assert.match(out.unavailable[0].fallback.path, /node_modules\/@octane-xplat\/ui$/)
})

test('mismatched checkout metadata produces an unavailable result', async (t) => {
	const { dir: remote } = makeRemote(t)
	const consumer = makeConsumer(t, { '@octane-xplat/ui': '3.0.0' })
	const svc = service(t, consumer, remote)
	const out = await svc.search({ query: 'capture' })
	assert.equal(out.unavailable[0].reason, 'metadata-mismatch')
	assert.match(out.unavailable[0].provenance ? 'ok' : '', /ok/)
})

test('missing git produces an explicit unavailable result', async (t) => {
	const { dir: remote } = makeRemote(t)
	const consumer = makeConsumer(t, { '@octane-xplat/ui': '1.0.0' })
	const svc = service(t, consumer, remote, { gitPath: '/nonexistent/git' })
	const out = await svc.search({ query: 'capture' })
	assert.equal(out.unavailable[0].reason, 'git-unavailable')
})

test('mixed package versions bind separately', async (t) => {
	const { dir: remote, c1, c2 } = makeRemote(t)
	const consumer = makeConsumer(t, { '@octane-xplat/ui': '1.0.0', '@octane-xplat/media': '2.0.0' })
	const svc = service(t, consumer, remote)
	const out = await svc.search({ query: 'capture' })
	const byPackage = Object.fromEntries(out.results.map((r) => [r.provenance.package, r]))
	assert.equal(byPackage['@octane-xplat/ui'].provenance.commit, c1)
	assert.equal(byPackage['@octane-xplat/ui'].provenance.servedVersion, '1.0.0')
	assert.equal(byPackage['@octane-xplat/media'].provenance.commit, c2)
	assert.equal(byPackage['@octane-xplat/media'].provenance.servedVersion, '2.0.0')
	assert.equal(byPackage['@octane-xplat/ui'].provenance.match, 'exact')
})

test('explicit version requests are labeled outside the installed binding', async (t) => {
	const { dir: remote, c2 } = makeRemote(t)
	const consumer = makeConsumer(t, { '@octane-xplat/ui': '1.0.0' })
	const svc = service(t, consumer, remote)

	// Ordinary search never serves Y for an X install.
	const ordinary = await svc.search({ query: 'capture' })
	assert.match(ordinary.results[0].excerpt, /X docs/)
	assert.equal(ordinary.results[0].provenance.servedVersion, '1.0.0')

	// Explicit migration/comparison request binds Y, visibly outside the binding.
	const comparison = await svc.search({
		query: 'capture',
		package: '@octane-xplat/ui',
		version: '2.0.0',
	})

	assert.equal(comparison.results[0].provenance.match, 'outside-installed-binding')
	assert.equal(comparison.results[0].provenance.servedVersion, '2.0.0')
	assert.equal(comparison.results[0].provenance.commit, c2)
	assert.match(comparison.results[0].excerpt, /captureV2/)

	const page = await svc.read({
		package: '@octane-xplat/ui',
		path: 'docs/app/camera.md',
		version: '2.0.0',
	})

	assert.equal(page.provenance.match, 'outside-installed-binding')
	assert.match(page.content, /captureV2/)
})

test('page reads follow the same binding rules as search', async (t) => {
	const { dir: remote, c1 } = makeRemote(t)
	const consumer = makeConsumer(t, { '@octane-xplat/ui': '1.0.0' })
	const svc = service(t, consumer, remote)
	const out = await svc.search({ query: 'capture' })
	const page = await svc.read({ ref: out.results[0].ref })
	assert.equal(page.provenance.commit, c1)
	assert.match(page.content, /X docs/)
	assert.equal(page.title, 'Camera capture')
	assert.equal(page.nextOffset, null)
	assert.deepEqual(await svc.read({ ref: 'bogus' }), { status: 'invalid-ref', ref: 'bogus' })
})

test('dependency changes refresh the binding before the next lookup', async (t) => {
	const { dir: remote, c1, c2 } = makeRemote(t)
	const consumer = makeConsumer(t, { '@octane-xplat/ui': '1.0.0' })
	const svc = service(t, consumer, remote)
	const first = await svc.search({ query: 'capture' })
	assert.equal(first.results[0].provenance.commit, c1)

	writeFileSync(
		join(consumer, 'node_modules/@octane-xplat/ui/package.json'),
		'{"name":"@octane-xplat/ui","version":"2.0.0"}',
	)

	const refresh = await svc.refresh()
	assert.equal(refresh.changed, true)
	const out = await svc.search({ query: 'capture' })
	assert.equal(out.results[0].provenance.commit, c2)
	assert.equal(out.results[0].provenance.servedVersion, '2.0.0')
	assert.ok(out.bindingRevision > first.bindingRevision)
})

test('lockfile-only installations are labeled provisional', async (t) => {
	const { dir: remote } = makeRemote(t)
	const consumer = mkdtempSync(join(tmpdir(), 'xplat-mcp-consumer-'))
	t.after(() => rmSync(consumer, { recursive: true, force: true }))
	writeFileSync(join(consumer, 'package.json'), '{"dependencies":{"@octane-xplat/ui":"^1.0.0"}}')
	writeFileSync(
		join(consumer, 'pnpm-lock.yaml'),
		'lockfileVersion: 9.0\nimporters:\n  .:\n    dependencies:\n      "@octane-xplat/ui":\n        specifier: ^1.0.0\n        version: 1.0.0\n',
	)

	const svc = service(t, consumer, remote)
	const status = await svc.status()
	assert.equal(status.identity.packages[0].source, 'lockfile-provisional')
	const out = await svc.search({ query: 'capture' })
	assert.equal(out.results[0].provisional, true)
})

test('lockfile/install disagreement is reported; the installation wins', async (t) => {
	const { dir: remote, c1 } = makeRemote(t)
	const consumer = makeConsumer(
		t,
		{ '@octane-xplat/ui': '1.0.0' },
		{
			lockfile:
				'lockfileVersion: 9.0\nimporters:\n  .:\n    dependencies:\n      "@octane-xplat/ui":\n        specifier: ^2.0.0\n        version: 2.0.0\n',
		},
	)

	const svc = service(t, consumer, remote)
	const status = await svc.status()
	assert.equal(status.identity.discrepancies.length, 1)
	assert.match(
		status.identity.discrepancies[0],
		/lockfile records 2\.0\.0 but 1\.0\.0 is installed/,
	)

	const out = await svc.search({ query: 'capture' })
	assert.equal(out.results[0].provenance.commit, c1)
})

test('local project guidance is scoped, never blended into release docs', async (t) => {
	const { dir: remote } = makeRemote(t)
	const consumer = makeConsumer(t, { '@octane-xplat/ui': '1.0.0' })
	writeFileSync(
		join(consumer, 'AGENTS.md'),
		'# Consumer rules\n\nAlways use camera fixtures for capture tests.\n',
	)

	const svc = service(t, consumer, remote)
	const out = await svc.search({ query: 'capture' })
	assert.equal(out.results[0].provenance.scope, 'release')
	const scoped = out.projectGuidance
	assert.equal(scoped.length, 1)
	assert.equal(scoped[0].path, 'AGENTS.md')
	assert.equal(scoped[0].provenance.scope, 'project')
	assert.equal(scoped[0].provenance.source, 'project-guidance')
})

test('linked packages bind the development checkout, labeled development', async (t) => {
	const { dir: remote } = makeRemote(t)
	const linked = mkdtempSync(join(tmpdir(), 'xplat-mcp-linked-'))
	t.after(() => rmSync(linked, { recursive: true, force: true }))
	writeFileSync(join(linked, 'pnpm-workspace.yaml'), 'packages:\n  - packages/*\n')
	mkdirSync(join(linked, 'packages/ui'), { recursive: true })
	mkdirSync(join(linked, 'docs'), { recursive: true })
	writeFileSync(
		join(linked, 'packages/ui/package.json'),
		'{"name":"@octane-xplat/ui","version":"0.0.0"}',
	)

	writeFileSync(join(linked, 'docs/dev.md'), '# Dev docs\n\nWorktree-only guidance.\n')

	const consumer = makeConsumer(t, {})
	mkdirSync(join(consumer, 'node_modules/@octane-xplat'), { recursive: true })
	symlinkSync(join(linked, 'packages/ui'), join(consumer, 'node_modules/@octane-xplat/ui'))
	writeFileSync(
		join(consumer, 'package.json'),
		'{"dependencies":{"@octane-xplat/ui":"link:../linked/packages/ui"}}',
	)

	const svc = service(t, consumer, remote)
	const out = await svc.search({ query: 'worktree' })
	assert.equal(out.results[0].provenance.source, 'development-docs')
	assert.equal(out.results[0].provenance.servedVersion, 'development')
	assert.match(out.results[0].excerpt, /Worktree-only/)

	// A development ref reads back through the same linked binding.
	const page = await svc.read({ ref: out.results[0].ref })
	assert.equal(page.provenance.servedVersion, 'development')
	assert.match(page.content, /Worktree-only/)
})

test('file tarball installs bind exact installed release docs even after the archive is removed', async (t) => {
	const { dir: remote, c1 } = makeRemote(t)
	const consumer = makeConsumer(t, { '@octane-xplat/ui': '1.0.0' })
	const archive = join(consumer, 'ui.tgz')
	writeFileSync(archive, 'archive fixture: binding reads the installed manifest, not archive bytes')
	writeFileSync(
		join(consumer, 'package.json'),
		JSON.stringify({
			dependencies: { '@octane-xplat/ui': 'file:./ui.tgz' },
		}),
	)

	const svc = service(t, consumer, remote)
	for (const removed of [false, true]) {
		if (removed) {
			rmSync(archive)
		}

		const status = await svc.status()
		assert.equal(status.identity.packages[0].kind, 'registry')
		const out = await svc.search({ query: 'capture', platform: 'ios' })
		assert.equal(out.results[0].provenance.servedVersion, '1.0.0')
		assert.equal(out.results[0].provenance.commit, c1)
		assert.equal(out.results[0].provenance.match, 'exact')
		const page = await svc.read({ ref: out.results[0].ref })
		assert.match(page.content, /X docs/)
	}
})

test('file directory installs keep their development documentation binding', async (t) => {
	const { dir: remote } = makeRemote(t)
	const consumer = makeConsumer(t, { '@octane-xplat/ui': '1.0.0' })
	const checkout = join(consumer, 'checkout')
	mkdirSync(join(checkout, 'docs'), { recursive: true })
	writeFileSync(join(checkout, 'pnpm-workspace.yaml'), 'packages: []\n')
	writeFileSync(join(checkout, 'docs/dev.md'), '# Development\n\nLocal directory guidance.\n')
	writeFileSync(
		join(consumer, 'package.json'),
		JSON.stringify({ dependencies: { '@octane-xplat/ui': 'file:./checkout' } }),
	)

	// A copied directory install is development content too, even without a
	// symlink pointing out of node_modules.
	assert.equal(resolveInstallations(consumer).packages[0].kind, 'linked')
	rmSync(join(consumer, 'node_modules/@octane-xplat/ui'), { recursive: true })
	writeFileSync(join(checkout, 'package.json'), '{"name":"@octane-xplat/ui","version":"1.0.0"}')
	symlinkSync(checkout, join(consumer, 'node_modules/@octane-xplat/ui'))

	const svc = service(t, consumer, remote)
	const out = await svc.search({ query: 'directory' })
	assert.equal(out.results[0].provenance.source, 'development-docs')
	assert.equal(out.results[0].provenance.servedVersion, 'development')
})

test('status reports identity, revision, git and cache', async (t) => {
	const { dir: remote } = makeRemote(t)
	const consumer = makeConsumer(t, { '@octane-xplat/ui': '1.0.0' })
	const svc = service(t, consumer, remote)
	const status = await svc.status()
	assert.equal(status.identity.workspaceRoot, consumer)
	assert.deepEqual(
		status.identity.packages.map((p) => `${p.name}@${p.version}`),
		['@octane-xplat/ui@1.0.0'],
	)

	assert.equal(status.git, 'available')
	assert.ok(status.bindingRevision >= 1)
})

test('guidance entries are scoped project guidance with provenance', async (t) => {
	const { dir: remote } = makeRemote(t)
	const consumer = makeConsumer(t, { '@octane-xplat/ui': '1.0.0' })
	const svc = service(t, consumer, remote)
	const { entries } = await svc.guidance()
	assert.ok(entries.length >= 5)
	for (const e of entries) {
		assert.equal(e.provenance.scope, 'project')
		assert.equal(e.provenance.source, 'project-guidance')
	}

	assert.match(entries.find((e) => e.id === 'claims').body, /OS input/)
})
