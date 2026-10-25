import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, it } from 'node:test'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'

const nsViteEntry = createRequire(import.meta.url).resolve('@nativescript/vite')
const nsViteUrl = pathToFileURL(nsViteEntry)

const { resolveInternalRuntimePluginBareSpecifier } = await import(
	new URL('./hmr/server/websocket-module-specifiers.js', nsViteUrl)
)

const dirs = []
const track = (path) => {
	dirs.push(path)
	return path
}

// tmpdir() is a symlinked path on macOS — realpath so the ancestor walk sees
// the same path string we write.
const makeWorkspace = () => {
	const root = realpathSync(track(mkdtempSync(join(tmpdir(), 'xplat-hoisted-fold-'))))
	return root
}

// A runtime plugin package (@nativescript-community/* is classified by prefix,
// no nativescript metadata needed) whose root export resolves to a compiled
// dist file — the same shape as @nativescript-community/octane.
const makePlugin = (nodeModulesDir, name, pkgJson) => {
	const dir = join(nodeModulesDir, ...name.split('/'))
	mkdirSync(dir, { recursive: true })
	writeFileSync(
		join(dir, 'package.json'),
		JSON.stringify({ name, version: '1.0.0', ...pkgJson }),
	)
	mkdirSync(join(dir, 'dist'), { recursive: true })
	writeFileSync(join(dir, 'dist/index.js'), 'export const x = 1\n')
	return dir
}

const makeApp = (workspaceRoot) => {
	const app = join(workspaceRoot, 'apps/mobile')
	mkdirSync(join(app, 'node_modules'), { recursive: true })
	writeFileSync(join(app, 'package.json'), JSON.stringify({ name: 'mobile' }))
	return app
}

afterEach(() => {
	for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('resolveInternalRuntimePluginBareSpecifier', () => {
	it('folds a deep dist specifier to the bare package id in a hoisted workspace', () => {
		// nodeLinker: hoisted — the app's own node_modules is empty; packages
		// live at the workspace root. The exports reverse map must still find
		// the package.json through the ancestor node_modules chain.
		const ws = makeWorkspace()
		makePlugin(join(ws, 'node_modules'), '@nativescript-community/hoisted-fold', {
			main: './dist/index.js',
			exports: { '.': './dist/index.js', './package.json': './package.json' },
		})
		const app = makeApp(ws)
		assert.equal(
			resolveInternalRuntimePluginBareSpecifier(
				'@nativescript-community/hoisted-fold/dist/index.js',
				app,
			),
			'@nativescript-community/hoisted-fold',
		)
	})

	it('keeps folding deep specifiers when the package sits in the app-local node_modules', () => {
		const ws = makeWorkspace()
		const app = makeApp(ws)
		makePlugin(join(app, 'node_modules'), '@nativescript-community/app-local-fold', {
			main: './dist/index.js',
			exports: { '.': './dist/index.js', './package.json': './package.json' },
		})
		assert.equal(
			resolveInternalRuntimePluginBareSpecifier(
				'@nativescript-community/app-local-fold/dist/index.js',
				app,
			),
			'@nativescript-community/app-local-fold',
		)
	})

	it('folds through the main/module field when exports is absent in a hoisted workspace', () => {
		const ws = makeWorkspace()
		makePlugin(join(ws, 'node_modules'), '@nativescript-community/hoisted-main', {
			main: './dist/index.js',
		})
		const app = makeApp(ws)
		assert.equal(
			resolveInternalRuntimePluginBareSpecifier(
				'@nativescript-community/hoisted-main/dist/index.js',
				app,
			),
			'@nativescript-community/hoisted-main',
		)
	})

	it('leaves unresolvable deep specifiers deep', () => {
		// A deep specifier whose subpath is not the package entry (no exports
		// reverse-map hit, no main-field match) keeps its concrete file — the
		// device require path needs it for non-vendored runtime plugins.
		const ws = makeWorkspace()
		makePlugin(join(ws, 'node_modules'), '@nativescript-community/hoisted-subpath', {
			main: './dist/index.js',
			exports: { '.': './dist/index.js', './feature': './dist/feature.js' },
		})
		const app = makeApp(ws)
		assert.equal(
			resolveInternalRuntimePluginBareSpecifier(
				'@nativescript-community/hoisted-subpath/dist/internal/deep.js',
				app,
			),
			'@nativescript-community/hoisted-subpath/dist/internal/deep.js',
		)
	})
})
