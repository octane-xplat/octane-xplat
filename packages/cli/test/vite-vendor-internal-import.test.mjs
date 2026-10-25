import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, it } from 'node:test'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'

const nsEntry = pathToFileURL(createRequire(import.meta.url).resolve('@nativescript/vite'))
const { ensureNativeScriptModuleBindings } = await import(
	new URL('./hmr/server/websocket-module-bindings.js', nsEntry)
)
const { rewriteFsAbsoluteToNsM } = await import(
	new URL('./hmr/server/websocket-module-specifiers.js', nsEntry)
)
const { registerVendorManifest, clearVendorManifest } = await import(
	new URL('./hmr/shared/vendor/registry.js', nsEntry)
)

// getProjectRootPath() is process.cwd(), and the package-boundary helpers read
// package.json from <root>/node_modules — chdir into a fixture root per test.
const FIXTURE_PKG = 'xplat-vendor-fixture'
const OTHER_PKG = 'xplat-other-plugin'

let dir
let previousCwd

const makeProject = () => {
	const root = realpathSync(mkdtempSync(join(tmpdir(), 'xplat-vendor-internal-')))
	writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'app' }))
	// Extensionless main plus platform files, mirroring
	// @nativescript-community/gesturehandler (main "gesturehandler",
	// files gesturehandler.android.js importing ./gesturehandler.common).
	const makePkg = (name, files) => {
		const pkgDir = join(root, 'node_modules', name)
		mkdirSync(pkgDir, { recursive: true })
		writeFileSync(
			join(pkgDir, 'package.json'),
			JSON.stringify({ name, main: 'pkg', nativescript: { platforms: { android: '9.0.0' } } }),
		)
		for (const file of files) writeFileSync(join(pkgDir, file), '')
	}
	makePkg(FIXTURE_PKG, ['pkg.android.js', 'pkg.common.js', 'other.js'])
	makePkg(OTHER_PKG, ['pkg.android.js'])
	return root
}

beforeEach(() => {
	previousCwd = process.cwd()
	dir = makeProject()
	process.chdir(dir)
	registerVendorManifest({
		hash: 'test',
		modules: { [FIXTURE_PKG]: {}, [OTHER_PKG]: {} },
		aliases: {},
	})
})

afterEach(() => {
	clearVendorManifest()
	process.chdir(previousCwd)
	rmSync(dir, { recursive: true, force: true })
})

const libraryImporter = { importerIsLibrary: true, importerId: `/node_modules/${FIXTURE_PKG}/pkg.android.js` }

describe('vendored package internal file imports', () => {
	it('keeps a non-entry sibling file on /ns/m instead of folding to the vendor root', () => {
		const code = `import { Base } from '/node_modules/${FIXTURE_PKG}/pkg.common.js'\n`
		const out = ensureNativeScriptModuleBindings(code, libraryImporter)
		assert.match(out, new RegExp(`/ns/m/node_modules/${FIXTURE_PKG}/pkg\\.common\\.js`))
		assert.doesNotMatch(out, /__nsVendorRegistry\.has/)
	})

	it('library importer: root entry file becomes a static /ns/m import of the package root', () => {
		const code = `import { install } from '/node_modules/${FIXTURE_PKG}/pkg.android.js'\n`
		const out = ensureNativeScriptModuleBindings(code, libraryImporter)
		assert.match(out, new RegExp(`/ns/m/node_modules/${FIXTURE_PKG}['"]`))
		assert.doesNotMatch(out, /__nsPick|__nsVendorRequire/)
	})

	it('library importer: a vendor root import keeps its clause as a static /ns/m import', () => {
		const code = `import Observable from '${OTHER_PKG}'\n`
		const out = ensureNativeScriptModuleBindings(code, libraryImporter)
		assert.match(out, new RegExp(`import Observable from [\\\\'"]/ns/m/node_modules/${OTHER_PKG}[\\\\'"]`))
		assert.doesNotMatch(out, /__nsPick|__nsVendorRequire|__nsVendorRegistry\.has/)
	})

	it('app-source importer: plugin imports keep the registry binding', () => {
		const code = `import { Base } from '/node_modules/${FIXTURE_PKG}/pkg.common.js'\n`
		const out = ensureNativeScriptModuleBindings(code, { importerId: '/src/app.ts' })
		assert.match(out, new RegExp(`__nsVendorRegistry\\.has\\("${FIXTURE_PKG}"\\)`))
		assert.doesNotMatch(out, /\/ns\/m\/node_modules\//)
	})
})

describe('rewriteFsAbsoluteToNsM pnpm-store canonicalization', () => {
	const makeStorePkg = (name, storeName, packageJson) => {
		const storeDir = join(dir, 'node_modules', '.pnpm', storeName, 'node_modules', name)
		mkdirSync(storeDir, { recursive: true })
		writeFileSync(join(storeDir, 'package.json'), JSON.stringify(packageJson ?? { name, main: 'index.js' }))
		return storeDir
	}

	it('canonicalizes a store path whose package resolves to the same realpath', () => {
		const storeDir = makeStorePkg(FIXTURE_PKG, `${FIXTURE_PKG}@1.0.0`)
		rmSync(join(dir, 'node_modules', FIXTURE_PKG), { recursive: true, force: true })
		symlinkSync(join('.pnpm', `${FIXTURE_PKG}@1.0.0`, 'node_modules', FIXTURE_PKG), join(dir, 'node_modules', FIXTURE_PKG), 'dir')
		const spec = `/@fs${storeDir}/index.js?v=123`
		assert.equal(rewriteFsAbsoluteToNsM(spec, dir, dir), `/ns/m/node_modules/${FIXTURE_PKG}/index.js?v=123`)
	})

	it('keeps the store spelling when the root resolution is a different realpath', () => {
		const storeDir = makeStorePkg(OTHER_PKG, `${OTHER_PKG}@2.0.0`)
		// node_modules/<pkg> already exists as a real directory from makeProject —
		// a different install than the store copy.
		const spec = `/@fs${storeDir}/index.js`
		assert.equal(rewriteFsAbsoluteToNsM(spec, dir, dir), `/ns/m/node_modules/.pnpm/${OTHER_PKG}@2.0.0/node_modules/${OTHER_PKG}/index.js`)
	})

	it('canonicalizes when exports hide ./package.json', () => {
		const storeDir = makeStorePkg('xplat-exports-hidden', 'xplat-exports-hidden@1.0.0', {
			name: 'xplat-exports-hidden',
			exports: { '.': './index.js' },
		})
		symlinkSync(join('.pnpm', 'xplat-exports-hidden@1.0.0', 'node_modules', 'xplat-exports-hidden'), join(dir, 'node_modules', 'xplat-exports-hidden'), 'dir')
		const spec = `/@fs${storeDir}/sub.js`
		assert.equal(rewriteFsAbsoluteToNsM(spec, dir, dir), '/ns/m/node_modules/xplat-exports-hidden/sub.js')
	})

	it('leaves non-node_modules workspace paths unchanged', () => {
		mkdirSync(join(dir, 'src'), { recursive: true })
		const spec = `/@fs${dir}/src/entry.ts`
		assert.equal(rewriteFsAbsoluteToNsM(spec, dir, dir), '/ns/m/src/entry.ts')
	})
})
