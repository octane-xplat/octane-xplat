import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import test from 'node:test'
import { inspectMacOSDevConfig, inspectMacOSPackageConfig } from '../src/macos/config.mjs'

function project(t) {
	const root = mkdtempSync(join(tmpdir(), 'xplat-macos-config-'))
	t.after(() => rmSync(root, { recursive: true, force: true }))
	return root
}

function write(root, path) {
	const file = join(root, path)
	mkdirSync(dirname(file), { recursive: true })
	writeFileSync(file, '')
}

test('macOS AppKit configuration keeps its existing Vite bundle contract', (t) => {
	const root = project(t)
	write(root, 'vite.config.mjs')
	const config = inspectMacOSDevConfig(root, {
		viteConfig: 'vite.config.mjs',
		bundleFile: 'dist/app.cjs',
	})

	assert.deepEqual(config.issues, [])
	assert.equal(config.viteConfig, join(root, 'vite.config.mjs'))
	assert.equal(config.bundleFile, join(root, 'dist/app.cjs'))
})

test('macOS webview dev configuration requires a frontend and CommonJS host bundle', (t) => {
	const root = project(t)
	write(root, 'vite.web.config.mjs')
	write(root, 'vite.host.config.mjs')
	const config = inspectMacOSDevConfig(
		root,
		{
			webViteConfig: 'vite.web.config.mjs',
			hostViteConfig: 'vite.host.config.mjs',
			hostBundleFile: 'dist/host.cjs',
		},
		'webview',
	)

	assert.deepEqual(config.issues, [])
	assert.equal(config.webViteConfig, join(root, 'vite.web.config.mjs'))
	assert.equal(config.hostBundleFile, join(root, 'dist/host.cjs'))

	const invalid = inspectMacOSDevConfig(
		root,
		{
			webViteConfig: 'vite.web.config.mjs',
			hostViteConfig: 'vite.host.config.mjs',
			hostBundleFile: 'dist/host.js',
		},
		'webview',
	)

	assert.ok(
		invalid.issues.some((issue) =>
			issue.includes('hostBundleFile must point to a CommonJS .cjs bundle'),
		),
	)
})

test('macOS webview package configuration validates the static frontend output', (t) => {
	const root = project(t)
	write(root, 'vite.web.config.mjs')
	write(root, 'vite.host.config.mjs')
	const settings = {
		productName: 'Octane Test',
		bundleIdentifier: 'org.octane.test',
		executableName: 'OctaneTest',
		version: '1.0.0',
		minimumSystemVersion: '13.5',
		webViteConfig: 'vite.web.config.mjs',
		hostViteConfig: 'vite.host.config.mjs',
		hostBundleFile: 'dist/host.cjs',
		webOutDir: 'dist/web',
	}

	const config = inspectMacOSPackageConfig(root, settings, 'webview')

	assert.deepEqual(config.issues, [])
	assert.equal(config.renderer, 'webview')
	assert.equal(config.webOutDir, join(root, 'dist/web'))

	const missingOutput = inspectMacOSPackageConfig(
		root,
		{ ...settings, webOutDir: undefined },
		'webview',
	)

	assert.ok(missingOutput.issues.includes('missing xplat.targets.macos.package.webOutDir'))
})

test('macOS renderer selection rejects unknown names', (t) => {
	const root = project(t)
	const config = inspectMacOSDevConfig(root, {}, 'cef')
	assert.ok(config.issues.includes('xplat.targets.macos.renderer must be "appkit" or "webview"'))
})
