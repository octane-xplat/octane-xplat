import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { xplatNative } from '../dist/vite.js'

test('native preset loads without alien-signals in the app or Octane dependency graph', async (t) => {
	const root = realpathSync(mkdtempSync(join(tmpdir(), 'xplat-native-runtime-')))
	const cwd = process.cwd()
	const vendorExclude = process.env.NS_VENDOR_EXCLUDE
	const bundlerEnv = process.env.NATIVESCRIPT_BUNDLER_ENV
	const makePackage = (name, manifest, source) => {
		const dir = join(root, 'node_modules', name)
		mkdirSync(dir, { recursive: true })
		writeFileSync(join(dir, 'package.json'), JSON.stringify({ name, type: 'module', ...manifest }))
		writeFileSync(join(dir, 'index.js'), source)
	}
	try {
		writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'app' }))
		// Octane 0.14 no longer depends on alien-signals. Keep this fixture
		// isolated from workspace dependencies so a stale lookup must fail.
		makePackage('octane', { version: '0.14.0', main: 'index.js' }, 'export {}')
		// Stub the upstream config boundary; exercise the built Xplat preset
		// and Vite's real merging without starting a native build or server.
		makePackage(
			'@nativescript-community/vite-octane',
			{ main: 'index.js' },
			'export const octaneConfig = () => ({})',
		)

		makePackage(
			'@nativescript-community/octane',
			{ exports: { './config': './index.js', './driver': './driver.js' } },
			'export const nativeScriptRenderer = {}',
		)

		const require = createRequire(import.meta.url)
		symlinkSync(
			dirname(require.resolve('vite/package.json')),
			join(root, 'node_modules/vite'),
			'dir',
		)

		const appRequire = createRequire(join(root, 'package.json'))
		const octaneRequire = createRequire(appRequire.resolve('octane'))
		for (const specifier of ['alien-signals', 'alien-signals/esm', 'alien-signals/system']) {
			assert.throws(() => appRequire.resolve(specifier), { code: 'MODULE_NOT_FOUND' })
			assert.throws(() => octaneRequire.resolve(specifier), { code: 'MODULE_NOT_FOUND' })
		}

		process.chdir(root)
		delete process.env.NATIVESCRIPT_BUNDLER_ENV
		for (const env of ['development', { mode: 'production' }]) {
			process.env.NS_VENDOR_EXCLUDE = 'app-owned'
			const config = await xplatNative(env, { deps: ['app-extra'] })
			assert.equal(process.env.NS_VENDOR_EXCLUDE, 'app-owned')
			assert.deepEqual(config.optimizeDeps.exclude, ['app-extra'])
			const alias = config.resolve.alias.find(({ find }) => find.test('octane'))
			assert.equal(alias.replacement, 'octane/universal/native')
			assert.ok(!alias.find.test('octane/universal/native'))
			for (const specifier of ['alien-signals', 'alien-signals/system']) {
				assert.ok(!config.resolve.alias.some(({ find }) => find.test(specifier)))
			}
		}

		await t.test(
			'an explicit core dependency resolves the unchanged renderer imports on both mobile platforms',
			async () => {
				const core = '@octane-xplat/nativescript-mason-core'
				makePackage(
					core,
					{
						version: '0.0.0',
						main: 'index',
						nativescript: { platforms: { ios: '9.1.0', android: '9.1.1' } },
					},
					'',
				)
				const directory = join(root, 'node_modules', core)
				for (const platform of ['ios', 'android']) {
					writeFileSync(
						join(directory, `index.${platform}.js`),
						`export const View = 'core-${platform}'`,
					)
				}
				writeFileSync(join(directory, 'style.js'), "export const Style = 'core-style'")
				writeFileSync(
					join(root, 'node_modules/@nativescript-community/octane/driver.js'),
					`
import { View } from '@octane-xplat/nativescript-masonkit'
import { Style } from '@octane-xplat/nativescript-masonkit/style'
export { View, Style }
`,
				)
				writeFileSync(
					join(root, 'entry.js'),
					"export { View, Style } from '@nativescript-community/octane/driver'",
				)
				writeFileSync(
					join(root, 'package.json'),
					JSON.stringify({ name: 'app', dependencies: { [core]: 'file:./core.tgz' } }),
				)
				assert.throws(
					() => appRequire.resolve('@octane-xplat/nativescript-masonkit/package.json'),
					{ code: 'MODULE_NOT_FOUND' },
				)
				const { build } = await import('vite')
				for (const platform of ['ios', 'android']) {
					process.env.NATIVESCRIPT_BUNDLER_ENV = JSON.stringify({ platform })
					const config = await xplatNative('production')
					const result = await build({
						...config,
						configFile: false,
						logLevel: 'silent',
						build: {
							...config.build,
							write: false,
							minify: false,
							lib: { entry: join(root, 'entry.js'), formats: ['es'] },
						},
					})

					const code = [result]
						.flat()
						.flatMap((bundle) => bundle.output)
						.filter((chunk) => chunk.type === 'chunk')
						.map((chunk) => chunk.code)
						.join('\n')

					assert.ok(code.includes(`core-${platform}`))
					assert.ok(code.includes('core-style'))
					assert.ok(!code.includes('nativescript-masonkit'))
				}
				writeFileSync(
					join(root, 'package.json'),
					JSON.stringify({
						dependencies: {
							[core]: 'file:./core.tgz',
							'@octane-xplat/nativescript-masonkit': '1.0.0',
						},
					}),
				)
				await assert.rejects(xplatNative('production'), /native classes and libraries overlap/)
				writeFileSync(
					join(root, 'package.json'),
					JSON.stringify({ dependencies: { [core]: 'file:./core.tgz' } }),
				)
				process.env.NATIVESCRIPT_BUNDLER_ENV = JSON.stringify({ platform: 'windows' })
				await assert.rejects(xplatNative('production'), /Windows is unqualified/)
			},
		)
	} finally {
		process.chdir(cwd)
		if (vendorExclude === undefined) {
			delete process.env.NS_VENDOR_EXCLUDE
		} else {
			process.env.NS_VENDOR_EXCLUDE = vendorExclude
		}

		if (bundlerEnv === undefined) {
			delete process.env.NATIVESCRIPT_BUNDLER_ENV
		} else {
			process.env.NATIVESCRIPT_BUNDLER_ENV = bundlerEnv
		}

		rmSync(root, { recursive: true, force: true })
	}
})
