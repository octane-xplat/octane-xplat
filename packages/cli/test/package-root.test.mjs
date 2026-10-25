import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, it } from 'node:test'
import { installedPackageRoot } from '../dist/package-root.js'
import { sourceOnlyDeps, xplatNative } from '../dist/vite.js'
import { inspectMacOSRuntimePackage } from '../dist/macos/runtime-package.js'

const dirs = []
const track = (p) => {
	dirs.push(p)
	return p
}
const tmp = (name) => realpathSync(track(mkdtempSync(join(tmpdir(), name))))

const makePkg = (dir, manifest, files = {}) => {
	mkdirSync(dir, { recursive: true })
	writeFileSync(join(dir, 'package.json'), JSON.stringify(manifest))
	for (const [file, contents] of Object.entries(files)) {
		mkdirSync(join(dir, file, '..'), { recursive: true })
		writeFileSync(join(dir, file), contents)
	}
	return dir
}

// A hoisted pnpm workspace: apps/<app> has no node_modules of its own; all
// deps live in <ws>/node_modules.
const makeHoistedApp = () => {
	const ws = tmp('xplat-pkgroot-ws-')
	const app = join(ws, 'apps/mobile')
	mkdirSync(app, { recursive: true })
	writeFileSync(
		join(app, 'package.json'),
		JSON.stringify({
			name: 'app',
			dependencies: {
				'rootless-dep': '1.0.0',
				'ns-plugin': '1.0.0',
				'plain-dep': '1.0.0',
				'@nativescript/macos-node-api': '1.0.0',
				'@octane-xplat/nativescript-mason-core': '1.0.0',
				octane: '1.0.0',
			},
		}),
	)
	return { ws, app }
}

afterEach(() => {
	for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('installedPackageRoot', () => {
	it('resolves a dep installed at the app root (isolated layout)', () => {
		const app = tmp('xplat-pkgroot-app-')
		writeFileSync(join(app, 'package.json'), '{}')
		const dep = makePkg(join(app, 'node_modules/dep'), { name: 'dep' })
		assert.equal(installedPackageRoot(app, 'dep'), dep)
	})

	it('resolves a dep hoisted to the workspace root', () => {
		const { ws, app } = makeHoistedApp()
		const dep = makePkg(join(ws, 'node_modules/hoisted-dep'), { name: 'hoisted-dep' })
		assert.equal(installedPackageRoot(app, 'hoisted-dep'), dep)
	})

	it('finds packages whose exports hide ./package.json', () => {
		const app = tmp('xplat-pkgroot-exp-')
		writeFileSync(join(app, 'package.json'), '{}')
		const dep = makePkg(join(app, 'node_modules/hidden'), {
			name: 'hidden',
			exports: { '.': './index.js' },
		})
		assert.equal(installedPackageRoot(app, 'hidden'), dep)
	})

	it('returns null for a missing package', () => {
		const app = tmp('xplat-pkgroot-miss-')
		writeFileSync(join(app, 'package.json'), '{}')
		assert.equal(installedPackageRoot(app, 'not-installed'), null)
	})
})

describe('hoisted workspace node_modules reads', () => {
	it('sourceOnlyDeps lists a rootless dep hoisted to the workspace root', () => {
		const { ws, app } = makeHoistedApp()
		makePkg(join(ws, 'node_modules/rootless-dep'), {
			name: 'rootless-dep',
			exports: { './sub': './sub.js' },
		})
		makePkg(join(ws, 'node_modules/plain-dep'), { name: 'plain-dep', main: 'index.js' })
		assert.deepEqual(sourceOnlyDeps(app), ['rootless-dep'])
	})

	it('xplatNative sees hoisted deps: rootless in NS_VENDOR_EXCLUDE, nativescript deps excluded', async () => {
		const { ws, app } = makeHoistedApp()
		makePkg(join(ws, 'node_modules/rootless-dep'), {
			name: 'rootless-dep',
			exports: { './sub': './sub.js' },
		})
		makePkg(join(ws, 'node_modules/plain-dep'), { name: 'plain-dep', main: 'index.js' })
		makePkg(join(ws, 'node_modules/ns-plugin'), {
			name: 'ns-plugin',
			main: 'index.js',
			nativescript: { platforms: { ios: '9.0.0' } },
			dependencies: { 'transitive-ns': '1.0.0' },
		})
		// Transitive nativescript plugin — reachable only via ns-plugin's dep.
		makePkg(join(ws, 'node_modules/transitive-ns'), {
			name: 'transitive-ns',
			main: 'index.js',
			nativescript: { platforms: { ios: '9.0.0' } },
		})
		// xplatNative's own boundary deps must resolve from the app.
		for (const name of ['@octane-xplat/nativescript-mason-core', 'octane']) {
			makePkg(join(ws, 'node_modules', name), { name, version: '0.0.0', main: 'index.js' }, {
				'index.js': 'export {}',
			})
		}
		makePkg(join(ws, 'node_modules/@nativescript-community/vite-octane'), {
			name: '@nativescript-community/vite-octane',
			main: 'index.js',
		}, { 'index.js': 'export const octaneConfig = () => ({})' })
		makePkg(join(ws, 'node_modules/@nativescript-community/octane'), {
			name: '@nativescript-community/octane',
			exports: { './config': './index.js', './driver': './driver.js' },
		}, {
			'index.js': 'export const nativeScriptRenderer = {}',
			'driver.js': 'export {}',
		})
		// vite must resolve for xplatNative's own imports — symlink the real
		// installed package into the hoisted workspace root.
		const { createRequire } = await import('node:module')
		const { dirname } = await import('node:path')
		const realVite = dirname(
			createRequire(import.meta.url).resolve('vite/package.json'),
		)
		mkdirSync(join(ws, 'node_modules'), { recursive: true })
		symlinkSync(realVite, join(ws, 'node_modules/vite'), 'dir')

		const cwd = process.cwd()
		const prevExclude = process.env.NS_VENDOR_EXCLUDE
		try {
			process.chdir(app)
			const config = await xplatNative('development')
			const excluded = process.env.NS_VENDOR_EXCLUDE ?? ''
			assert.ok(
				excluded.split(',').includes('rootless-dep'),
				`NS_VENDOR_EXCLUDE ${excluded} should contain rootless-dep`,
			)
			const optExclude = config.optimizeDeps?.exclude ?? []
			assert.ok(optExclude.includes('ns-plugin'), 'ns-plugin excluded from optimizeDeps')
			assert.ok(
				optExclude.includes('transitive-ns'),
				'transitive nativescript dep excluded from optimizeDeps',
			)
		} finally {
			process.chdir(cwd)
			if (prevExclude === undefined) delete process.env.NS_VENDOR_EXCLUDE
			else process.env.NS_VENDOR_EXCLUDE = prevExclude
		}
	})

	it('inspectMacOSRuntimePackage resolves a hoisted runtime package from a nested app', () => {
		const { ws, app } = makeHoistedApp()
		makePkg(join(ws, 'node_modules/@nativescript/macos-node-api'), {
			name: '@nativescript/macos-node-api',
			version: '0.4.4',
		}, {
			'index.d.ts': 'export {}',
			LICENSE: 'test license',
		})
		const info = inspectMacOSRuntimePackage(app)
		assert.equal(info.packageManifest?.version, '0.4.4')
		assert.deepEqual(info.missingPaths, [])
	})
})
