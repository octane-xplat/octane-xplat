import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, it } from 'node:test'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { sourceOnlyDeps } from '../dist/vite.js'

const dirs = []

const track = (path) => {
	dirs.push(path)
	return path
}

// tmpdir() is a symlinked path on macOS (/var → /private/var) — the helper
// realpaths dep dirs, so mirror the fs-allow test and realpath the root.
const makeProject = (sections) => {
	const root = realpathSync(track(mkdtempSync(join(tmpdir(), 'xplat-vendor-exclude-'))))
	writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'app', ...sections }))
	return root
}

const makeDep = (projectRoot, name, manifest, files = []) => {
	const dir = join(projectRoot, 'node_modules', name)
	mkdirSync(dir, { recursive: true })
	writeFileSync(join(dir, 'package.json'), JSON.stringify({ name, ...manifest }))
	for (const file of files) {
		const path = join(dir, file)
		mkdirSync(join(path, '..'), { recursive: true })
		writeFileSync(path, '')
	}
}

afterEach(() => {
	for (const dir of dirs.splice(0)) {
		rmSync(dir, { recursive: true, force: true })
	}
})

for (const packageName of ['@nativescript/vite', 'nativescript-vite-8-0-21']) {
	const nsEntry = pathToFileURL(createRequire(import.meta.url).resolve(packageName))
	const { collectVendorModules } = await import(
		new URL('./hmr/shared/vendor/manifest-collect.js', nsEntry)
	)

	const { vendorManifestPlugin, VENDOR_MANIFEST_VIRTUAL_ID, VENDOR_BUNDLE_VIRTUAL_ID } =
		await import(new URL('./hmr/shared/vendor/manifest.js', nsEntry))

	describe(`upstream source-only vendor exclusion (${packageName})`, () => {
		it('excludes semver TypeScript entries while retaining compiled packages', () => {
			const projectRoot = makeProject({ dependencies: { source: '1.0.0', compiled: '1.0.0' } })
			makeDep(projectRoot, 'source', { exports: { '.': './src/index.ts' } }, ['src/index.ts'])
			makeDep(projectRoot, 'compiled', { exports: { '.': './index.js' } }, ['index.js'])
			const { entries } = collectVendorModules(projectRoot, 'android')
			assert.ok(!entries.includes('source'))
			assert.ok(entries.includes('compiled'))
			assert.deepEqual(sourceOnlyDeps(projectRoot), [])
		})
		it('excludes a semver dependency linked to a source checkout', () => {
			const projectRoot = makeProject({ dependencies: { linked: '1.0.0' } })
			const checkout = makeProject({ exports: { '.': './entry.tsrx' } })
			writeFileSync(join(checkout, 'entry.tsrx'), 'export const view = 1')
			mkdirSync(join(projectRoot, 'node_modules'))
			symlinkSync(checkout, join(projectRoot, 'node_modules/linked'), 'dir')
			assert.ok(!collectVendorModules(projectRoot, 'ios').entries.includes('linked'))
			assert.deepEqual(sourceOnlyDeps(projectRoot), [])
		})
		for (const platform of ['android', 'ios']) {
			for (const [label, manifest, expected] of [
				[
					'mixed source root and compiled subpath',
					{ exports: { '.': './index.ts', './parity': './parity.js' } },
					false,
				],
				[
					'exports overrides compiled legacy entries',
					{ main: './parity.js', module: './parity.js', exports: './index.ts' },
					false,
				],
				[
					'inactive platform and server conditions',
					{
						exports: {
							android: './parity.js',
							ios: './parity.js',
							native: './parity.js',
							node: './parity.js',
							require: './parity.js',
							development: './parity.js',
							default: './index.ts',
						},
					},
					false,
				],
				[
					'nested active react-native condition',
					{
						exports: {
							'react-native': {
								types: './parity.js',
								import: './index.ts',
								default: './parity.js',
							},
							default: './parity.js',
						},
					},
					false,
				],
				[
					'first active condition wins',
					{ exports: { default: './index.ts', import: './parity.js' } },
					false,
				],
				[
					'import wins over inactive require',
					{ exports: { require: './parity.js', import: './index.ts' } },
					false,
				],
				[
					'browser source entry',
					{ exports: { browser: './index.ts', default: './parity.js' } },
					false,
				],
				[
					'compiled active entry with source subpath',
					{
						exports: {
							'.': { 'react-native': './parity.js', default: './index.ts' },
							'./source': './index.ts',
						},
					},
					true,
				],
				['array selects first target', { exports: { '.': ['./index.ts', './parity.js'] } }, false],
				[
					'nested inactive branch falls through',
					{ exports: { import: { types: './parity.js' }, default: './index.ts' } },
					false,
				],
				[
					'module source before compiled main',
					{ module: './index.ts', main: './parity.js' },
					false,
				],
				[
					'legacy browser source before main',
					{ browser: './index.ts', main: './parity.js' },
					false,
				],
			]) {
				it(`${platform}: ${label}`, () => {
					const root = makeProject({ dependencies: { mixed: '1.0.0' } })
					makeDep(root, 'mixed', manifest, ['index.ts', 'parity.js'])
					assert.equal(collectVendorModules(root, platform).entries.includes('mixed'), expected)
					assert.deepEqual(sourceOnlyDeps(root), [])
				})
			}

			it(`${platform}: retains compiled platform-only plugins`, () => {
				const root = makeProject({
					dependencies: { plugin: '1.0.0', directory: 'file:../directory' },
				})
				makeDep(root, 'plugin', { main: 'index.js' }, [`index.${platform}.js`])
				makeDep(root, 'directory', { main: 'lib' }, [`lib/index.${platform}.js`])
				const { entries } = collectVendorModules(root, platform)
				assert.ok(entries.includes('plugin'))
				assert.ok(entries.includes('directory'))
			})
		}

		it('uses the active platform and source-first extension order for legacy entries', () => {
			const root = makeProject({ dependencies: { platform: '1.0.0', priority: '1.0.0' } })
			makeDep(root, 'platform', { main: 'index' }, ['index.android.ts', 'index.ios.js'])
			makeDep(root, 'priority', { main: 'index' }, ['index.ts', 'index.js'])
			assert.ok(!collectVendorModules(root, 'android').entries.includes('platform'))
			assert.ok(collectVendorModules(root, 'ios').entries.includes('platform'))
			assert.ok(!collectVendorModules(root, 'android').entries.includes('priority'))
		})

		it('classifies imported workspace subpaths independently of the package root', () => {
			const workspace = makeProject({
				dependencies: { '@fixture/mixed': '1.0.0', rootless: '1.0.0' },
			})
			writeFileSync(join(workspace, 'nx.json'), '{}')
			makeDep(
				workspace,
				'@fixture/mixed',
				{ exports: { '.': './index.ts', './compiled': './parity.js', './source': './index.ts' } },
				['index.ts', 'parity.js'],
			)
			makeDep(
				workspace,
				'rootless',
				{ exports: { './source': './index.ts', './*': './dist/*.js' } },
				['index.ts', 'dist/compiled.js'],
			)
			const app = join(workspace, 'apps/mobile')
			mkdirSync(join(app, 'src'), { recursive: true })
			writeFileSync(join(app, 'package.json'), '{"name":"app"}')
			writeFileSync(
				join(app, 'src/main.ts'),
				"import '@fixture/mixed/compiled'; import '@fixture/mixed/source'; import 'rootless/compiled'; import 'rootless/source';",
			)
			const { entries } = collectVendorModules(app, 'android')
			assert.ok(entries.includes('@fixture/mixed/compiled'))
			assert.ok(entries.includes('rootless/compiled'))
			assert.ok(!entries.includes('@fixture/mixed/source'))
			assert.ok(!entries.includes('rootless/source'))
			assert.ok(!entries.includes('@fixture/mixed'))
			assert.ok(!entries.includes('rootless'))
		})

		it('builds the Android dev vendor payload with semver dependencies linked to mixed-export source', async () => {
			const root = makeProject({ dependencies: { source: '1.0.0', plugin: '1.0.0' } })
			const checkout = makeProject({})
			makeDep(checkout, 'source', { exports: { '.': './index.ts', './parity': './parity.js' } }, [
				'index.ts',
				'parity.js',
				'View.tsrx',
				'host.mobile.ts',
			])
			writeFileSync(
				join(checkout, 'node_modules/source/index.ts'),
				"export { View } from './View'; export { host } from './host';",
			)
			writeFileSync(
				join(checkout, 'node_modules/source/View.tsrx'),
				'export const View = <label />;',
			)
			writeFileSync(join(checkout, 'node_modules/source/host.mobile.ts'), 'export const host = 1;')
			mkdirSync(join(root, 'node_modules'))
			symlinkSync(join(checkout, 'node_modules/source'), join(root, 'node_modules/source'), 'dir')
			// A pnpm readPackage hook leaves semver in the app manifest while linking
			// source outside it. No manual NS_VENDOR_EXCLUDE list should be needed.
			const previousExcludes = process.env.NS_VENDOR_EXCLUDE
			delete process.env.NS_VENDOR_EXCLUDE
			try {
				makeDep(root, 'plugin', { main: 'index.js' }, ['index.android.js'])
				writeFileSync(
					join(root, 'node_modules/plugin/index.android.js'),
					'export const nativePlugin = 42;',
				)

				// The collector deliberately force-includes Android's Activity proxy.
				makeDep(root, '@nativescript/core', {}, ['ui/frame/activity.android.js'])
				const plugin = vendorManifestPlugin({
					projectRoot: root,
					platform: 'android',
					mode: 'development',
					flavor: 'octane',
					emitAssets: false,
				})

				await plugin.buildStart()
				const { code: manifestCode } = await plugin.load(VENDOR_MANIFEST_VIRTUAL_ID)
				const manifest = JSON.parse(manifestCode.slice('export default '.length, -1))
				assert.ok(manifest.modules.plugin)
				assert.ok(manifest.modules['@nativescript/core/ui/frame/activity.android'])
				assert.ok(!manifest.modules.source)
				const { code } = await plugin.load(VENDOR_BUNDLE_VIRTUAL_ID)
				assert.ok(code.includes('nativePlugin'))
				assert.ok(!code.includes('View.tsrx'))
			} finally {
				if (previousExcludes === undefined) {
					delete process.env.NS_VENDOR_EXCLUDE
				} else {
					process.env.NS_VENDOR_EXCLUDE = previousExcludes
				}
			}
		})

		it('does not reintroduce source entries through dev-only peer traversal', () => {
			const root = makeProject({
				dependencies: { plugin: '1.0.0' },
				devDependencies: { source: '1.0.0' },
			})
			makeDep(root, 'plugin', { main: 'index.js', peerDependencies: { source: '*' } }, ['index.js'])
			makeDep(
				root,
				'source',
				{
					exports: {
						'.': './index.ts',
						'./parity': './parity.js',
						'./package.json': './package.json',
					},
				},
				['index.ts', 'parity.js'],
			)
			assert.ok(!collectVendorModules(root, 'android').entries.includes('source'))
		})
	})
}

describe('sourceOnlyDeps', () => {
	it('leaves source entries to the upstream collector', () => {
		const projectRoot = makeProject({ dependencies: { '@octane-xplat/ui': '0.16.0' } })
		// Mirrors @octane-xplat/ui's platform-conditioned source exports.
		makeDep(projectRoot, '@octane-xplat/ui', {
			exports: {
				'.': {
					macos: {
						types: './dist/index.macos.d.ts',
						default: './src/index.macos.ts',
					},
					native: {
						types: './dist/index.native.d.ts',
						default: './src/index.native.tsrx',
					},
					default: './src/index.ts',
				},
			},
		})

		assert.deepEqual(sourceOnlyDeps(projectRoot), [])
	})

	it('omits a dep whose exports has a compiled .js leaf', () => {
		const projectRoot = makeProject({ dependencies: { compiled: '1.0.0' } })
		makeDep(projectRoot, 'compiled', {
			exports: { '.': { types: './dist/index.d.ts', default: './dist/index.js' } },
		})

		assert.deepEqual(sourceOnlyDeps(projectRoot), [])
	})

	it('leaves module/main entries to upstream when exports is absent', () => {
		const projectRoot = makeProject({
			dependencies: { 'compiled-main': '1.0.0', 'source-main': '1.0.0' },
		})
		makeDep(projectRoot, 'compiled-main', { main: 'index.js' })
		makeDep(projectRoot, 'source-main', { main: 'src/index.ts' })

		assert.deepEqual(sourceOnlyDeps(projectRoot), [])
	})

	it('omits a types-only dep (no runtime entry candidates)', () => {
		const projectRoot = makeProject({ dependencies: { '@octane-xplat/jsx': '0.16.0' } })
		makeDep(projectRoot, '@octane-xplat/jsx', {
			exports: { '.': { types: './dist/index.d.ts' } },
		})

		assert.deepEqual(sourceOnlyDeps(projectRoot), [])
	})

	it('lists a dep whose exports has no root entry (subpath-only)', () => {
		const projectRoot = makeProject({ dependencies: { '@octane-xplat/jsx': '0.16.0' } })
		// Mirrors @octane-xplat/jsx: types-only subpaths plus ./package.json.
		// There is no '.' root for the vendor bundle's generated bare import
		// to resolve, so it must be excluded too.
		makeDep(projectRoot, '@octane-xplat/jsx', {
			exports: {
				'./jsx-runtime': { types: { default: './src/jsx-runtime.d.ts' } },
				'./package.json': './package.json',
			},
		})

		assert.deepEqual(sourceOnlyDeps(projectRoot), ['@octane-xplat/jsx'])
	})

	it('omits an extensionless main that resolves to compiled JS on disk', () => {
		// Classic NativeScript plugin shape: `main: "index"` with platform
		// variants or a plain index.js next to it.
		const projectRoot = makeProject({
			dependencies: { 'platform-variant': '1.0.0', 'plain-js': '1.0.0' },
		})
		makeDep(projectRoot, 'platform-variant', { main: 'index' }, ['index.ios.js'])
		makeDep(projectRoot, 'plain-js', { main: 'index' }, ['index.js'])

		assert.deepEqual(sourceOnlyDeps(projectRoot), [])
	})

	it('leaves extensionless source entries to upstream', () => {
		const projectRoot = makeProject({ dependencies: { 'source-only': '1.0.0' } })
		makeDep(projectRoot, 'source-only', { main: 'src/index' }, ['src/index.ts'])

		assert.deepEqual(sourceOnlyDeps(projectRoot), [])
	})

	it('ignores deps missing from node_modules without throwing', () => {
		const projectRoot = makeProject({
			dependencies: { missing: '1.0.0', present: '1.0.0' },
		})
		makeDep(projectRoot, 'present', { main: 'src/index.ts' })

		assert.deepEqual(sourceOnlyDeps(projectRoot), [])
	})

	it('covers optionalDependencies and ignores devDependencies', () => {
		const projectRoot = makeProject({
			optionalDependencies: { 'optional-source': '1.0.0' },
			devDependencies: { 'dev-source': '1.0.0' },
		})
		makeDep(projectRoot, 'optional-source', { exports: { './feature': './feature.js' } })
		makeDep(projectRoot, 'dev-source', { exports: { './feature': './feature.js' } })

		assert.deepEqual(sourceOnlyDeps(projectRoot), ['optional-source'])
	})

	it('returns an empty list when the app package.json cannot be read', () => {
		const projectRoot = realpathSync(track(mkdtempSync(join(tmpdir(), 'xplat-vendor-empty-'))))

		assert.deepEqual(sourceOnlyDeps(projectRoot), [])
	})
})
