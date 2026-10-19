import assert from 'node:assert/strict'
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	symlinkSync,
	writeFileSync,
} from 'node:fs'

import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { parse, stringify } from 'yaml'
import {
	applyUpgrade,
	compatibility,
	managedSpecifier,
	planUpgrade,
} from '../dist/compatibility.js'

import { inspectCompatibility } from '../dist/compatibility-check.js'

const cli = fileURLToPath(new URL('../dist/cli.js', import.meta.url))
const tools = { node: 'v22.18.0', pnpm: compatibility.tools.pnpm }
const patchPrefix = 'node_modules/.pnpm-config/@octane-xplat/patches/patches/'
const json = (file) => JSON.parse(readFileSync(file, 'utf8'))
const yaml = (root) => parse(readFileSync(join(root, 'pnpm-workspace.yaml'), 'utf8'))
const writeJson = (file, value) => {
	mkdirSync(dirname(file), { recursive: true })
	writeFileSync(file, JSON.stringify(value, null, '\t') + '\n')
}

const run = (root, args) =>
	spawnSync(process.execPath, [cli, ...args], { cwd: root, encoding: 'utf8', timeout: 30000 })

function project(t, pkg = {}, workspace) {
	const root = mkdtempSync(join(tmpdir(), 'xplat-compatibility-'))
	t.after(() => rmSync(root, { recursive: true, force: true }))
	writeJson(join(root, 'package.json'), {
		private: true,
		packageManager: `pnpm@${compatibility.tools.pnpm}`,
		...pkg,
	})
	if (workspace) {
		writeFileSync(join(root, 'pnpm-workspace.yaml'), stringify(workspace))
	}
	return root
}

function install(root, name, version, extra = {}) {
	const dir = join(root, 'node_modules', name)
	writeJson(join(dir, 'package.json'), { name, version, ...extra })
	return dir
}

test('upgrade adopts managed pins and compiler peer, preserving app dependencies, stricter engines, and library peers', (t) => {
	const peers = { octane: '>=0.6.3 <1', '@octane-xplat/ui': '^0.14.0' }
	const root = project(
		t,
		{
			dependencies: { octane: '^0.10.0', '@octane-xplat/ui': '^0.14.0', 'my-store': '^2.0.0' },
			devDependencies: { vitest: '^4.0.0' },
			peerDependencies: peers,
			engines: { node: '>=24' },
			scripts: { test: 'vitest run' },
		},
		{
			catalog: { octane: '0.10.0', 'my-store': '^2.0.0' },
			catalogs: { custom: { vite: '^7.0.0' } },
		},
	)
	const before = readFileSync(join(root, 'package.json'), 'utf8')
	const plan = planUpgrade(root)
	assert.equal(readFileSync(join(root, 'package.json'), 'utf8'), before, 'preflight must not write')
	applyUpgrade(plan)
	const pkg = json(join(root, 'package.json'))
	assert.equal(pkg.dependencies.octane, 'catalog:xplat')
	assert.equal(pkg.devDependencies['@tsrx/oxc'], 'catalog:xplat')
	assert.equal(pkg.dependencies['my-store'], '^2.0.0')
	assert.equal(pkg.engines.node, '>=24')
	assert.deepEqual(pkg.peerDependencies, peers)
	assert.deepEqual(pkg.scripts, { test: 'vitest run' })
	const ws = yaml(root)
	assert.equal(ws.catalogs.xplat.octane, managedSpecifier('octane'))
	assert.equal(ws.catalogs.xplat['@octane-xplat/ui'], compatibility.frameworkVersion)
	assert.equal(ws.catalogs.xplat.vitest, managedSpecifier('vitest'))
	assert.deepEqual(ws.catalogs.custom, { vite: '^7.0.0' })
	assert.equal(ws.catalog.octane, '0.10.0', 'a shared user catalog is not rewritten')
	assert.equal(ws.configDependencies['@octane-xplat/patches'], compatibility.frameworkVersion)
	assert.ok(ws.patchedDependencies[`octane@${managedSpecifier('octane')}`].startsWith(patchPrefix))
	assert.equal(planUpgrade(root).files.length, 0, 'upgrade must be idempotent')
})

test('a workspace upgrade visits nested packages and honors exclusions, local links, and Windows pins', (t) => {
	const root = project(
		t,
		{},
		{
			packages: ['apps/**', 'packages/*', '!packages/ignored'],
			configDependencies: { 'my-config': '1.0.0' },
		},
	)
	writeJson(join(root, 'apps/web/package.json'), {
		dependencies: { octane: '0.10.0', '@octane-xplat/ui': 'workspace:*' },
	})
	writeJson(join(root, 'apps/desktop/windows/package.json'), {
		devDependencies: {
			'@nativescript/windows': '0.1.0-alpha.144',
			'@nativescript/vite': managedSpecifier('@nativescript/vite', 'windows'),
		},
		dependencies: {
			'@nativescript/core': managedSpecifier('@nativescript/core', 'windows'),
			octane: '0.10.0',
		},
	})
	writeJson(join(root, 'packages/local/package.json'), {
		dependencies: { '@octane-xplat/platform': 'file:../platform' },
	})
	writeJson(join(root, 'packages/ignored/package.json'), { dependencies: { octane: 'custom' } })
	const ignored = readFileSync(join(root, 'packages/ignored/package.json'), 'utf8')
	const plan = planUpgrade(join(root, 'apps/web'))
	assert.equal(plan.root, root)
	assert.ok(plan.skipped.some((line) => line.includes('workspace:*')))
	applyUpgrade(plan)
	assert.equal(
		json(join(root, 'apps/web/package.json')).dependencies['@octane-xplat/ui'],
		'workspace:*',
	)
	assert.equal(
		json(join(root, 'packages/local/package.json')).dependencies['@octane-xplat/platform'],
		'file:../platform',
	)
	assert.equal(
		json(join(root, 'apps/desktop/windows/package.json')).dependencies['@nativescript/core'],
		'catalog:xplat-windows',
	)
	assert.equal(
		yaml(root).catalogs['xplat-windows']['@nativescript/core'],
		managedSpecifier('@nativescript/core', 'windows'),
	)
	assert.equal(yaml(root).configDependencies['my-config'], '1.0.0')
	assert.equal(readFileSync(join(root, 'packages/ignored/package.json'), 'utf8'), ignored)
	assert.ok(yaml(root).patchedDependencies['@nativescript/core@9.1.3-next.2'])
	assert.ok(!yaml(root).patchedDependencies['@nativescript/core@9.1.3'])
})

test('upgrade selects new patch pins instead of stale lockfile versions and retains custom patches', (t) => {
	const root = project(
		t,
		{ dependencies: { octane: '0.10.0' } },
		{
			patchedDependencies: {
				'octane@0.10.0': `${patchPrefix}old.patch`,
				'my-store@1.0.0': 'patches/my-store.patch',
			},
		},
	)
	writeFileSync(join(root, 'pnpm-lock.yaml'), stringify({ packages: { 'octane@0.10.0': {} } }))
	applyUpgrade(planUpgrade(root))
	const patches = yaml(root).patchedDependencies
	assert.ok(!patches['octane@0.10.0'])
	assert.ok(patches[`octane@${managedSpecifier('octane')}`])
	assert.equal(patches['my-store@1.0.0'], 'patches/my-store.patch')
	assert.match(
		readFileSync(join(root, 'pnpm-lock.yaml'), 'utf8'),
		/0\.10\.0/,
		'--no-install must not fabricate a lockfile',
	)
})

test('a custom patch collision aborts before any metadata changes', (t) => {
	const root = project(
		t,
		{ dependencies: { octane: '0.10.0' } },
		{ patchedDependencies: { [`octane@${managedSpecifier('octane')}`]: 'custom.patch' } },
	)
	writeFileSync(join(root, 'custom.patch'), 'user patch\n')
	const before = readFileSync(join(root, 'package.json'), 'utf8')
	const workspace = readFileSync(join(root, 'pnpm-workspace.yaml'), 'utf8')
	assert.throws(() => planUpgrade(root), /Custom patch.*reconcile/)
	assert.equal(readFileSync(join(root, 'package.json'), 'utf8'), before)
	assert.equal(readFileSync(join(root, 'pnpm-workspace.yaml'), 'utf8'), workspace)
})

test('conflicting overrides, custom sources, and mixed Windows/mobile packages fail preflight', (t) => {
	const root = project(
		t,
		{ dependencies: { octane: '0.10.0' } },
		{ overrides: { octane: '0.10.0' } },
	)
	assert.throws(() => planUpgrade(root), /Override octane.*remove/)
	writeFileSync(join(root, 'pnpm-workspace.yaml'), '{}\n')
	writeJson(join(root, 'package.json'), {
		dependencies: { octane: 'https://example.com/custom.tgz' },
	})
	assert.throws(() => planUpgrade(root), /custom source/)
	writeJson(join(root, 'package.json'), {
		devDependencies: { '@nativescript/windows': '1', '@nativescript/ios': '1' },
	})
	assert.throws(() => planUpgrade(root), /separate workspace packages/)
})

test('applying a stale plan preserves edits made after preflight', (t) => {
	const root = project(t, { dependencies: { octane: '0.10.0' } })
	const plan = planUpgrade(root)
	writeJson(join(root, 'package.json'), { name: 'changed' })
	assert.throws(() => applyUpgrade(plan), /changed during upgrade/)
	assert.equal(json(join(root, 'package.json')).name, 'changed')
	assert.ok(!existsSync(join(root, 'pnpm-workspace.yaml')))
})

test('upgrade CLI check is read-only and no-install is explicit and idempotent', (t) => {
	const root = project(t, { dependencies: { octane: '0.10.0' } })
	const preview = run(root, ['upgrade', '--check'])
	assert.equal(preview.status, 1, preview.stderr)
	assert.match(preview.stdout, /no files changed/)
	assert.equal(json(join(root, 'package.json')).dependencies.octane, '0.10.0')
	assert.ok(!existsSync(join(root, 'pnpm-workspace.yaml')))
	const result = run(root, ['upgrade', '--no-install'])
	assert.equal(result.status, 0, result.stderr)
	assert.match(result.stdout, /Run pnpm install/)
	assert.equal(run(root, ['upgrade', '--check']).status, 0)
	assert.ok(!existsSync(join(root, 'node_modules')))
})

test('doctor checks installed versions even when declarations match', (t) => {
	const root = project(t, {
		dependencies: {
			octane: managedSpecifier('octane'),
			'@tsrx/oxc': managedSpecifier('@tsrx/oxc'),
		},
	})
	install(root, 'octane', '0.1.0', { exports: { '.': './index.js' } })
	install(root, '@tsrx/oxc', managedSpecifier('@tsrx/oxc'))
	const rows = inspectCompatibility(root, tools)
	assert.ok(rows.find((row) => row.name === 'compatibility pin octane').ok)
	assert.ok(!rows.find((row) => row.name === 'compatibility installed octane').ok)
	assert.match(
		rows.find((row) => row.name === 'compatibility installed octane').detail,
		/0\.1\.0.*expected/,
	)
})

for (const version of [managedSpecifier('octane'), '0.1.0']) {
	test(`doctor detects two physical runtime copies (${version}) through an app dependency`, (t) => {
		const root = project(t, {
			dependencies: {
				octane: managedSpecifier('octane'),
				'@tsrx/oxc': managedSpecifier('@tsrx/oxc'),
				vendor: '1.0.0',
			},
		})
		install(root, 'octane', managedSpecifier('octane'))
		install(root, '@tsrx/oxc', managedSpecifier('@tsrx/oxc'))
		const vendor = install(root, 'vendor', '1.0.0', { dependencies: { octane: '*' } })
		install(vendor, 'octane', version)
		const row = inspectCompatibility(root, tools).find(
			(row) => row.name === 'compatibility singleton octane',
		)
		assert.equal(row.ok, false)
		assert.match(row.detail, /2 runtime copies/)
	})
}

test('symlinked references to the same runtime count once and other workspace apps are not traversed', (t) => {
	const root = project(t, {
		dependencies: {
			octane: managedSpecifier('octane'),
			'@tsrx/oxc': managedSpecifier('@tsrx/oxc'),
			vendor: '1.0.0',
		},
	})
	const runtime = install(root, 'octane', managedSpecifier('octane'))
	install(root, '@tsrx/oxc', managedSpecifier('@tsrx/oxc'))
	const vendor = install(root, 'vendor', '1.0.0', { dependencies: { octane: '*' } })
	mkdirSync(join(vendor, 'node_modules'), { recursive: true })
	symlinkSync(runtime, join(vendor, 'node_modules/octane'), 'dir')
	install(join(root, 'another-app'), 'octane', '0.1.0')
	assert.ok(inspectCompatibility(root, tools).every((row) => row.ok))
})

test('doctor rejects old host tools and missing compiler peer without writing files', (t) => {
	const root = project(t, { dependencies: { octane: managedSpecifier('octane') } })
	const before = readFileSync(join(root, 'package.json'), 'utf8')
	const failed = inspectCompatibility(root, { node: 'v22.17.0', pnpm: '10.0.0' }).filter(
		(row) => !row.ok,
	)
	assert.ok(failed.some((row) => row.name === 'compatibility Node'))
	assert.ok(failed.some((row) => row.name === 'compatibility pnpm'))
	assert.ok(failed.some((row) => row.name.includes('compiler peer')))
	assert.ok(failed.some((row) => row.detail.startsWith('package is not installed')))
	assert.equal(readFileSync(join(root, 'package.json'), 'utf8'), before)
	assert.ok(!existsSync(join(root, 'pnpm-workspace.yaml')))
})

test('doctor permits omitted optional tools but reports missing required managed transitive packages', (t) => {
	const root = project(t, {
		dependencies: { vendor: '1.0.0' },
		optionalDependencies: { '@nativescript/ios': managedSpecifier('@nativescript/ios') },
	})
	const vendor = install(root, 'vendor', '1.0.0', {
		dependencies: { octane: managedSpecifier('octane') },
		peerDependencies: { '@nativescript/core': '*' },
		peerDependenciesMeta: { '@nativescript/core': { optional: true } },
	})
	const failures = inspectCompatibility(root, tools).filter((row) => !row.ok)
	assert.equal(failures.length, 1)
	assert.equal(failures[0].name, 'compatibility installed octane')
	assert.ok(failures[0].detail.includes(`required by ${join('node_modules', 'vendor')}`))
	install(vendor, 'octane', managedSpecifier('octane'))
	assert.ok(inspectCompatibility(root, tools).every((row) => row.ok))
})

test('a private nested copy of a managed package is not the app contract', (t) => {
	const root = project(t, {
		dependencies: {
			octane: managedSpecifier('octane'),
			'@tsrx/oxc': managedSpecifier('@tsrx/oxc'),
			typescript: managedSpecifier('typescript'),
			nativescript: managedSpecifier('nativescript'),
		},
	})
	install(root, 'octane', managedSpecifier('octane'))
	install(root, '@tsrx/oxc', managedSpecifier('@tsrx/oxc'))
	install(root, 'typescript', managedSpecifier('typescript'))
	// nativescript pins its own typescript — installed nested because it
	// conflicts with the app's copy; the version contract covers only the
	// copy the app itself resolves.
	const nativescript = install(root, 'nativescript', managedSpecifier('nativescript'), {
		dependencies: { typescript: '5.7.3' },
	})
	install(nativescript, 'typescript', '5.7.3')
	assert.ok(inspectCompatibility(root, tools).every((row) => row.ok))
})
