import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import test from 'node:test'
import { createMacOSDevBundle } from '../src/macos/dev-bundle.mjs'

function project(t) {
	const root = mkdtempSync(join(tmpdir(), 'xplat-dev-identity-'))
	t.after(() => rmSync(root, { recursive: true, force: true }))
	writeFileSync(join(root, 'vite.config.mjs'), '')
	return root
}

function manifest(extra = {}) {
	return {
		name: 'brim-browser',
		xplat: {
			targets: {
				macos: {
					dev: {
						viteConfig: 'vite.config.mjs',
						bundleFile: 'dist/app.cjs',
						...extra,
					},
				},
			},
		},
	}
}

test('dev host runs from a bundle with consumer identity and cleans up its session', async (t) => {
	const root = project(t)
	const bundle = await createMacOSDevBundle(root, manifest())
	assert.match(bundle.executable, /App\.app\/Contents\/MacOS\/App$/)
	const plist = readFileSync(join(dirname(bundle.executable), '../Info.plist'), 'utf8')
	assert.match(plist, /CFBundleDisplayName<\/key><string>brim-browser<\/string>/)
	assert.doesNotMatch(plist, /CFBundleIconFile/)
	await bundle.cleanup()
	assert.equal(existsSync(bundle.executable), false)
})

test('dev overrides package name and icon, escapes XML, and copies icon bytes', async (t) => {
	const root = project(t)
	writeFileSync(join(root, 'AppIcon.icns'), 'test icon bytes')
	const input = manifest({
		productName: 'Brim & Friends',
		icon: 'AppIcon.icns',
	})

	input.xplat.targets.macos.package = {
		productName: 'Release Brim',
		executableName: 'Brim',
	}

	const bundle = await createMacOSDevBundle(root, input)
	t.after(bundle.cleanup)
	const contents = dirname(dirname(bundle.executable))
	assert.match(readFileSync(join(contents, 'Info.plist'), 'utf8'), /Brim &amp; Friends/)
	assert.match(
		readFileSync(join(contents, 'Info.plist'), 'utf8'),
		/CFBundleIconFile<\/key><string>AppIcon.icns/,
	)

	assert.equal(readFileSync(join(contents, 'Resources/AppIcon.icns'), 'utf8'), 'test icon bytes')
})

test('dev rejects escaping and missing icon paths before launching a host', async (t) => {
	const root = project(t)
	await assert.rejects(
		createMacOSDevBundle(root, manifest({ icon: '../icon.icns' })),
		/inside the app root/,
	)

	await assert.rejects(
		createMacOSDevBundle(root, manifest({ icon: 'missing.icns' })),
		/does not exist/,
	)
})
