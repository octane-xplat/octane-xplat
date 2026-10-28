import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, it } from 'node:test'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'

const nsViteEntry = createRequire(import.meta.url).resolve('@nativescript/vite')
const nsViteUrl = pathToFileURL(nsViteEntry)

const { vendorManifestPlugin, VENDOR_BUNDLE_VIRTUAL_ID } = await import(
	new URL('./hmr/shared/vendor/manifest.js', nsViteUrl)
)

const { generateDepsBundle, computeDepsBundleCacheKey } = await import(
	new URL('./hmr/server/deps-bundle.js', nsViteUrl)
)

const { setUserAliasEntries, getUserAliasEntries, getUserAliasEntriesFingerprint } = await import(
	new URL('./helpers/global-defines.js', nsViteUrl)
)

const dirs = []
const track = (path) => {
	dirs.push(path)
	return path
}

// tmpdir() is a symlinked path on macOS — realpath so the app's node_modules
// walk-up inside the plugins sees the same path string we write.
const makeProject = () => {
	const root = realpathSync(track(mkdtempSync(join(tmpdir(), 'xplat-deps-alias-'))))
	writeFileSync(
		join(root, 'package.json'),
		JSON.stringify({ name: 'app', dependencies: { 'dep-main': '1.0.0' } }),
	)
	return root
}

// A vendored dep whose compiled entry imports a specifier that is NOT
// installed — exactly the masonkit situation: the package is absent from
// node_modules, so without the alias pass it becomes a throw-on-evaluate stub.
const makeVendoredDep = (root) => {
	const dir = join(root, 'node_modules/dep-main')
	mkdirSync(dir, { recursive: true })
	writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'dep-main', main: 'index.js' }))
	writeFileSync(
		join(dir, 'index.js'),
		`import 'absent-name';\nimport 'absent-name/style';\nimport './rel.js';\nexport const dep = 1\n`,
	)
	writeFileSync(join(dir, 'rel.js'), 'export const rel = 1\n')
}

// The alias target: an installed package whose main is extensionless with a
// platform entry (index.ios.js), like nativescript-mason-core.
const makeAliasTarget = (root) => {
	const dir = join(root, 'node_modules/alias-target')
	mkdirSync(dir, { recursive: true })
	writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'alias-target', main: 'index' }))
	// A bare `import 'absent-name'` only keeps the module when it has a real
	// top-level side effect (like the renderer packages this mirrors), so emit
	// one rather than a bare export that esbuild would elide.
	writeFileSync(
		join(dir, 'index.ios.js'),
		'export const marker = "TARGET_MARKER_ROOT"\nglobalThis.__aliasTargetRoot = "TARGET_MARKER_ROOT"\n',
	)
	writeFileSync(
		join(dir, 'index.android.js'),
		'export const marker = "TARGET_MARKER_ROOT"\nglobalThis.__aliasTargetRoot = "TARGET_MARKER_ROOT"\n',
	)
	writeFileSync(
		join(dir, 'style.js'),
		'export const marker = "TARGET_MARKER_STYLE"\nglobalThis.__aliasTargetStyle = "TARGET_MARKER_STYLE"\n',
	)
	return dir
}

const buildVendorCode = async (root, platform) => {
	const plugin = vendorManifestPlugin({ projectRoot: root, platform, mode: 'development' })
	await plugin.buildStart()
	const loaded = await plugin.load(VENDOR_BUNDLE_VIRTUAL_ID)
	return loaded.code
}

const STUB_MARKER = "Cannot find module 'absent-name'"

afterEach(() => {
	setUserAliasEntries([])
	for (const dir of dirs.splice(0)) {
		rmSync(dir, { recursive: true, force: true })
	}
})

describe('vite resolve.alias replayed inside esbuild passes', () => {
	it('vendor bundle resolves the aliased specifier instead of stubbing it', async () => {
		const root = makeProject()
		makeVendoredDep(root)
		const target = makeAliasTarget(root)
		setUserAliasEntries([{ find: /^absent-name(?=\/|$)/, replacement: target }])
		const code = await buildVendorCode(root, 'ios')
		assert.ok(code.includes('TARGET_MARKER_ROOT'), 'root alias target bundled')
		assert.ok(code.includes('TARGET_MARKER_STYLE'), 'subpath alias target bundled')
		assert.ok(!code.includes(STUB_MARKER), 'no optional-dep stub for the aliased specifier')
	})

	it('deps bundle resolves the aliased specifier instead of stubbing it', async () => {
		const root = makeProject()
		makeVendoredDep(root)
		const target = makeAliasTarget(root)
		setUserAliasEntries([{ find: /^absent-name(?=\/|$)/, replacement: target }])
		process.env.NS_DEPS_BUNDLE_NO_DISK_CACHE = '1'
		try {
			const state = await generateDepsBundle({
				projectRoot: root,
				platform: 'ios',
				mode: 'development',
				recordedPaths: [],
			})

			assert.ok(state?.code.includes('TARGET_MARKER_ROOT'), 'root alias target bundled')
			assert.ok(state?.code.includes('TARGET_MARKER_STYLE'), 'subpath alias target bundled')
			assert.ok(!state?.code.includes(STUB_MARKER), 'no optional-dep stub')
		} finally {
			delete process.env.NS_DEPS_BUNDLE_NO_DISK_CACHE
		}
	})

	it('does not redirect an installed package (upstream-style core alias)', async () => {
		const root = makeProject()
		// dep-main imports 'installed-dep', which IS installed — an alias must
		// not rewrite it (upstream's own resolve.alias maps @nativescript/core
		// to its package root; redirecting would bundle a second realm).
		const depDir = join(root, 'node_modules/dep-main')
		mkdirSync(depDir, { recursive: true })
		writeFileSync(
			join(depDir, 'package.json'),
			JSON.stringify({ name: 'dep-main', main: 'index.js' }),
		)
		writeFileSync(
			join(depDir, 'index.js'),
			`import { m } from 'installed-dep';\nexport const dep = m\n`,
		)
		const installed = join(root, 'node_modules/installed-dep')
		mkdirSync(installed, { recursive: true })
		writeFileSync(
			join(installed, 'package.json'),
			JSON.stringify({ name: 'installed-dep', main: 'index.js' }),
		)
		writeFileSync(
			join(installed, 'index.js'),
			'export const m = "INSTALLED_RESOLUTION"\nglobalThis.__installedDep = 1\n',
		)
		const decoy = join(root, 'node_modules/alias-target')
		mkdirSync(decoy, { recursive: true })
		writeFileSync(
			join(decoy, 'package.json'),
			JSON.stringify({ name: 'alias-target', main: 'index' }),
		)
		writeFileSync(
			join(decoy, 'index.ios.js'),
			'export const m = "DECOY_RESOLUTION"\nglobalThis.__decoy = 1\n',
		)
		writeFileSync(
			join(decoy, 'index.android.js'),
			'export const m = "DECOY_RESOLUTION"\nglobalThis.__decoy = 1\n',
		)

		setUserAliasEntries([{ find: /^installed-dep(?=\/|$)/, replacement: decoy }])
		const code = await buildVendorCode(root, 'ios')
		assert.ok(code.includes('INSTALLED_RESOLUTION'), 'installed package keeps default resolution')
		assert.ok(!code.includes('DECOY_RESOLUTION'), 'alias must not redirect installed packages')
	})

	it('pnpm hidden-hoisted decoy does not disable the alias (vendor + deps bundles)', async () => {
		const root = makeProject()
		// pnpm isolated layout: dep-main's real dir lives under .pnpm and
		// node_modules/dep-main is a symlink to it; `absent-name` exists ONLY
		// in the hidden hoist (`.pnpm/node_modules/`) as another importer's
		// dependency — the phantom presence must not count as installed.
		const depDir = join(root, 'node_modules/.pnpm/dep-main@1.0.0/node_modules/dep-main')
		mkdirSync(depDir, { recursive: true })
		writeFileSync(
			join(depDir, 'package.json'),
			JSON.stringify({ name: 'dep-main', main: 'index.js' }),
		)
		writeFileSync(
			join(depDir, 'index.js'),
			`import 'absent-name';\nimport 'absent-name/style';\nexport const dep = 1\n`,
		)
		symlinkSync('.pnpm/dep-main@1.0.0/node_modules/dep-main', join(root, 'node_modules/dep-main'))
		const decoy = join(root, 'node_modules/.pnpm/node_modules/absent-name')
		mkdirSync(decoy, { recursive: true })
		writeFileSync(
			join(decoy, 'package.json'),
			JSON.stringify({ name: 'absent-name', main: 'index.js' }),
		)
		writeFileSync(join(decoy, 'index.js'), 'globalThis.__hoistDecoy = "DECOY_HOIST"\n')
		writeFileSync(join(decoy, 'style.js'), 'globalThis.__hoistDecoyStyle = "DECOY_HOIST_STYLE"\n')
		const target = makeAliasTarget(root)
		setUserAliasEntries([{ find: /^absent-name(?=\/|$)/, replacement: target }])

		const code = await buildVendorCode(root, 'ios')
		assert.ok(code.includes('TARGET_MARKER_ROOT'), 'vendor: root alias target bundled')
		assert.ok(code.includes('TARGET_MARKER_STYLE'), 'vendor: subpath alias target bundled')
		assert.ok(!code.includes('DECOY_HOIST'), 'vendor: hidden-hoist decoy not bundled')

		process.env.NS_DEPS_BUNDLE_NO_DISK_CACHE = '1'
		try {
			const state = await generateDepsBundle({
				projectRoot: root,
				platform: 'ios',
				mode: 'development',
				recordedPaths: [],
			})

			assert.ok(state?.code.includes('TARGET_MARKER_ROOT'), 'deps: root alias target bundled')
			assert.ok(state?.code.includes('TARGET_MARKER_STYLE'), 'deps: subpath alias target bundled')
			assert.ok(!state?.code.includes('DECOY_HOIST'), 'deps: hidden-hoist decoy not bundled')
		} finally {
			delete process.env.NS_DEPS_BUNDLE_NO_DISK_CACHE
		}
	})

	it('does not redirect a pnpm sibling-installed package', async () => {
		const root = makeProject()
		// dep-main imports 'installed-dep', which pnpm installs as a sibling
		// inside `.pnpm/dep-main@1.0.0/node_modules/` — a REAL dependency of
		// the importer, so the alias must keep default resolution.
		const siblings = join(root, 'node_modules/.pnpm/dep-main@1.0.0/node_modules')
		const depDir = join(siblings, 'dep-main')
		mkdirSync(depDir, { recursive: true })
		writeFileSync(
			join(depDir, 'package.json'),
			JSON.stringify({ name: 'dep-main', main: 'index.js' }),
		)
		writeFileSync(
			join(depDir, 'index.js'),
			`import { m } from 'installed-dep';\nexport const dep = m\n`,
		)
		symlinkSync('.pnpm/dep-main@1.0.0/node_modules/dep-main', join(root, 'node_modules/dep-main'))
		const installed = join(siblings, 'installed-dep')
		mkdirSync(installed, { recursive: true })
		writeFileSync(
			join(installed, 'package.json'),
			JSON.stringify({ name: 'installed-dep', main: 'index.js' }),
		)
		writeFileSync(
			join(installed, 'index.js'),
			'export const m = "INSTALLED_RESOLUTION"\nglobalThis.__installedDep = 1\n',
		)
		const decoy = join(root, 'node_modules/alias-target')
		mkdirSync(decoy, { recursive: true })
		writeFileSync(
			join(decoy, 'package.json'),
			JSON.stringify({ name: 'alias-target', main: 'index' }),
		)
		writeFileSync(
			join(decoy, 'index.ios.js'),
			'export const m = "DECOY_RESOLUTION"\nglobalThis.__decoy = 1\n',
		)
		writeFileSync(
			join(decoy, 'index.android.js'),
			'export const m = "DECOY_RESOLUTION"\nglobalThis.__decoy = 1\n',
		)

		setUserAliasEntries([{ find: /^installed-dep(?=\/|$)/, replacement: decoy }])
		const code = await buildVendorCode(root, 'ios')
		assert.ok(code.includes('INSTALLED_RESOLUTION'), 'pnpm sibling keeps default resolution')
		assert.ok(!code.includes('DECOY_RESOLUTION'), 'alias must not redirect installed packages')
	})

	it('without aliases the absent specifier still gets the optional-dep stub', async () => {
		const root = makeProject()
		makeVendoredDep(root)
		makeAliasTarget(root)
		setUserAliasEntries([])
		const code = await buildVendorCode(root, 'ios')
		assert.ok(code.includes(STUB_MARKER), 'absent dep stubbed without the alias')
	})

	it('drops relative, absolute, non-string, and customResolver entries', () => {
		setUserAliasEntries([
			{ find: './local', replacement: '/abs/dir' },
			{ find: '/abs/find', replacement: '/abs/dir' },
			{ find: 'crlf', replacement: 42 },
			{ find: 'custom', replacement: '/abs/dir', customResolver: {} },
			{ find: 'kept', replacement: '/abs/dir' },
		])
		assert.deepEqual(
			getUserAliasEntries().map((e) => String(e.find)),
			['kept'],
		)
	})

	it('deps-bundle cache key changes with the captured aliases', () => {
		const base = {
			platform: 'ios',
			mode: 'development',
			flavor: '',
			defines: {},
			entryKeys: ['dep-main'],
			lockfile: 'none',
			vitePackageVersion: '0.0.0-test',
		}
		const key = () =>
			computeDepsBundleCacheKey({ ...base, aliases: getUserAliasEntriesFingerprint() })
		setUserAliasEntries([{ find: 'one', replacement: '/a' }])
		const first = key()
		setUserAliasEntries([{ find: 'two', replacement: '/b' }])
		const second = key()
		setUserAliasEntries([])
		const third = key()
		assert.notEqual(first, second)
		assert.notEqual(first, third)
		assert.notEqual(second, third)
		assert.equal(getUserAliasEntriesFingerprint(), '[]')
	})
})
