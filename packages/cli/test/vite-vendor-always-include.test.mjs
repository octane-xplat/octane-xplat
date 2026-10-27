import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, it } from 'node:test'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { execFileSync } from 'node:child_process'

const dirs = []

const track = (path) => {
	dirs.push(path)
	return path
}

const makeProject = () => {
	// tmpdir() is a symlinked path on macOS (/var → /private/var); realpath the
	// root so ancestor walks and NODE_PATH reference the same location.
	const root = realpathSync(track(mkdtempSync(join(tmpdir(), 'xplat-always-include-'))))
	writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'app' }))
	return root
}

const makeHiddenHoistDep = (root, name) => {
	const dir = join(root, 'node_modules/.pnpm/node_modules', name)
	mkdirSync(dir, { recursive: true })
	writeFileSync(join(dir, 'package.json'), JSON.stringify({ name, main: './index.js' }))
	writeFileSync(join(dir, 'index.js'), '')
}

const makeAppDep = (root, name) => {
	const dir = join(root, 'node_modules', name)
	mkdirSync(dir, { recursive: true })
	writeFileSync(join(dir, 'package.json'), JSON.stringify({ name, main: './index.js' }))
	writeFileSync(join(dir, 'index.js'), '')
}

afterEach(() => {
	for (const dir of dirs.splice(0)) {
		rmSync(dir, { recursive: true, force: true })
	}
})

const nsEntry = pathToFileURL(createRequire(import.meta.url).resolve('@nativescript/vite'))
const { collectVendorModules } = await import(
	new URL('./hmr/shared/vendor/manifest-collect.js', nsEntry)
)

describe('ALWAYS_INCLUDE presence check', () => {
	it('ignores packages present only in the pnpm hidden hoist even when NODE_PATH exposes them', () => {
		const root = makeProject()
		makeHiddenHoistDep(root, 'stacktrace-js')
		// NODE_PATH is read at module-loader init, so the collection runs in a
		// child process mirroring the pnpm bin shims, which export NODE_PATH
		// containing the hidden `.pnpm/node_modules` hoist.
		const manifestCollect = new URL('./hmr/shared/vendor/manifest-collect.js', nsEntry).href
		const out = execFileSync(
			process.execPath,
			[
				'--input-type=module',
				'-e',
				`const { collectVendorModules } = await import(${JSON.stringify(manifestCollect)});` +
					`console.log(JSON.stringify(collectVendorModules(process.env.PROJECT_ROOT, 'ios').entries))`,
			],
			{
				encoding: 'utf8',
				env: {
					...process.env,
					PROJECT_ROOT: root,
					NODE_PATH: join(root, 'node_modules/.pnpm/node_modules'),
				},
			},
		)
		assert.ok(!JSON.parse(out).includes('stacktrace-js'))
	})

	it('collects a force-included package installed in an ancestor node_modules', () => {
		const root = makeProject()
		makeAppDep(root, 'stacktrace-js')
		assert.ok(collectVendorModules(root, 'ios').entries.includes('stacktrace-js'))
	})
})
