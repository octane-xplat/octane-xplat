import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { xplatNative } from '../dist/vite.js'
import { xplatMacOS } from '../dist/macos/vite.js'
import { xplatLinuxGtk } from '../dist/linux-gtk/vite.js'

// The .server boundary must hold inside every app-facing preset, not only in
// custom pipelines that add serverBoundary() by hand. These builds run the
// real presets over a stubbed app so a leak fails the way an app's build would.
test('native presets reject .server imports and erase named re-exports', async (t) => {
	const root = realpathSync(mkdtempSync(join(tmpdir(), 'xplat-server-boundary-')))
	const cwd = process.cwd()
	const bundlerEnv = process.env.NATIVESCRIPT_BUNDLER_ENV
	const vendorExclude = process.env.NS_VENDOR_EXCLUDE
	const makePackage = (name, manifest, files = {}) => {
		const dir = join(root, 'node_modules', name)
		mkdirSync(dir, { recursive: true })
		writeFileSync(
			join(dir, 'package.json'),
			JSON.stringify({ name, type: 'module', ...manifest }),
		)
		for (const [file, source] of Object.entries(files)) {
			mkdirSync(dirname(join(dir, file)), { recursive: true })
			writeFileSync(join(dir, file), source)
		}
	}
	try {
		writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'app', type: 'module' }))
		writeFileSync(
			join(root, 'private.server.ts'),
			'export const secret = "SERVER_SECRET_SENTINEL"; export const context = () => ({ secret });',
		)
		writeFileSync(
			join(root, 'entry-leak.ts'),
			'import { secret } from "./private.server"; export const value = secret',
		)
		writeFileSync(
			join(root, 'entry-erased.ts'),
			'export { /* AUTHORED_PRIVATE_SENTINEL */ context } from "./private.server"; export const screen = "public";',
		)

		makePackage(
			'octane',
			{ exports: { '.': './index.js', './universal/native': './universal/native.js' } },
			{ 'index.js': 'export {}', 'universal/native.js': 'export {}' },
		)
		makePackage(
			'@octanejs/vite-plugin',
			{ main: 'index.js' },
			{ 'index.js': 'export const octane = () => []' },
		)
		makePackage(
			'@nativescript-community/vite-octane',
			{ main: 'index.js' },
			{ 'index.js': 'export const octaneConfig = () => ({})' },
		)
		makePackage(
			'@nativescript-community/octane',
			{ exports: { './config': './index.js', './driver': './driver.js' } },
			{ 'index.js': 'export const nativeScriptRenderer = {}', 'driver.js': 'export {}' },
		)
		makePackage(
			'@octane-xplat/macos-renderer',
			{
				exports: {
					'.': './index.js',
					'./compat/escape-props': './compat/escape-props.js',
					'./compat/native-core': './compat/native-core.js',
					'./intrinsics': './intrinsics.js',
				},
			},
			{
				'index.js': 'export {}',
				'compat/escape-props.js': 'export {}',
				'compat/native-core.js': 'export {}',
				'intrinsics.js': 'export {}',
			},
		)
		makePackage(
			'@octane-xplat/linux-gtk',
			{
				exports: {
					'.': './index.js',
					'./compat/escape-props': './compat/escape-props.js',
					'./compat/native-core': './compat/native-core.js',
				},
			},
			{
				'index.js': 'export {}',
				'compat/escape-props.js': 'export {}',
				'compat/native-core.js': 'export {}',
			},
		)
		const require = createRequire(import.meta.url)
		symlinkSync(
			dirname(require.resolve('vite/package.json')),
			join(root, 'node_modules/vite'),
			'dir',
		)

		const { build } = await import('vite')
		process.chdir(root)
		process.env.NATIVESCRIPT_BUNDLER_ENV = JSON.stringify({ platform: 'ios' })
		delete process.env.NS_VENDOR_EXCLUDE

		const native = await xplatNative('production')
		const nativeBuild = (entry) =>
			build({
				...native,
				configFile: false,
				logLevel: 'silent',
				build: {
					...native.build,
					write: false,
					minify: false,
					sourcemap: true,
					lib: { entry: join(root, entry), formats: ['es'] },
				},
			})

		await assert.rejects(nativeBuild('entry-leak.ts'), /server boundary|server-only/i)
		const erased = await nativeBuild('entry-erased.ts')
		const chunks = [erased]
			.flat()
			.flatMap((result) => result.output)
			.filter((entry) => entry.type === 'chunk')
		assert.doesNotMatch(
			JSON.stringify(chunks),
			/SERVER_SECRET_SENTINEL|AUTHORED_PRIVATE_SENTINEL/,
		)
		assert.ok(chunks.some((entry) => entry.exports.includes('screen')))
		assert.ok(chunks.every((entry) => !entry.exports.includes('context')))

		for (const preset of [
			() => xplatMacOS('production', { root, packaged: false, entry: join(root, 'entry-leak.ts') }),
			() => xplatLinuxGtk('production', { root, entry: join(root, 'entry-leak.ts') }),
		]) {
			const config = await preset()
			await assert.rejects(
				build({
					...config,
					configFile: false,
					logLevel: 'silent',
					build: { ...config.build, write: false, minify: false },
				}),
				/server boundary|server-only/i,
			)
		}
	} finally {
		process.chdir(cwd)
		if (bundlerEnv === undefined) {
			delete process.env.NATIVESCRIPT_BUNDLER_ENV
		} else {
			process.env.NATIVESCRIPT_BUNDLER_ENV = bundlerEnv
		}
		if (vendorExclude === undefined) {
			delete process.env.NS_VENDOR_EXCLUDE
		} else {
			process.env.NS_VENDOR_EXCLUDE = vendorExclude
		}
		rmSync(root, { recursive: true, force: true })
	}
})
