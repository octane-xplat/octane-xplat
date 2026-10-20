import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, it } from 'node:test'
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

describe('sourceOnlyDeps', () => {
	it('lists a dep whose exports conditions map resolves only to .ts/.tsrx', () => {
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

		assert.deepEqual(sourceOnlyDeps(projectRoot), ['@octane-xplat/ui'])
	})

	it('omits a dep whose exports has a compiled .js leaf', () => {
		const projectRoot = makeProject({ dependencies: { compiled: '1.0.0' } })
		makeDep(projectRoot, 'compiled', {
			exports: { '.': { types: './dist/index.d.ts', default: './dist/index.js' } },
		})

		assert.deepEqual(sourceOnlyDeps(projectRoot), [])
	})

	it('falls back to module/main when exports is absent', () => {
		const projectRoot = makeProject({
			dependencies: { 'compiled-main': '1.0.0', 'source-main': '1.0.0' },
		})
		makeDep(projectRoot, 'compiled-main', { main: 'index.js' })
		makeDep(projectRoot, 'source-main', { main: 'src/index.ts' })

		assert.deepEqual(sourceOnlyDeps(projectRoot), ['source-main'])
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

	it('lists an extensionless main with only TypeScript source on disk', () => {
		const projectRoot = makeProject({ dependencies: { 'source-only': '1.0.0' } })
		makeDep(projectRoot, 'source-only', { main: 'src/index' }, ['src/index.ts'])

		assert.deepEqual(sourceOnlyDeps(projectRoot), ['source-only'])
	})

	it('ignores deps missing from node_modules without throwing', () => {
		const projectRoot = makeProject({
			dependencies: { missing: '1.0.0', present: '1.0.0' },
		})
		makeDep(projectRoot, 'present', { main: 'src/index.ts' })

		assert.deepEqual(sourceOnlyDeps(projectRoot), ['present'])
	})

	it('covers optionalDependencies and ignores devDependencies', () => {
		const projectRoot = makeProject({
			optionalDependencies: { 'optional-source': '1.0.0' },
			devDependencies: { 'dev-source': '1.0.0' },
		})
		makeDep(projectRoot, 'optional-source', { main: 'src/index.ts' })
		makeDep(projectRoot, 'dev-source', { main: 'src/index.ts' })

		assert.deepEqual(sourceOnlyDeps(projectRoot), ['optional-source'])
	})

	it('returns an empty list when the app package.json cannot be read', () => {
		const projectRoot = realpathSync(track(mkdtempSync(join(tmpdir(), 'xplat-vendor-empty-'))))

		assert.deepEqual(sourceOnlyDeps(projectRoot), [])
	})
})
