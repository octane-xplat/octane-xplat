import assert from 'node:assert/strict'
import {
	existsSync,
	mkdtempSync,
	mkdirSync,
	realpathSync,
	rmSync,
	symlinkSync,
	writeFileSync,
} from 'node:fs'

import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, it } from 'node:test'
import { linkedDepFsRoots, pxToDip } from '../dist/vite.js'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { createServer } from 'vite'

// The stub mirrors the contract vite's searchForWorkspaceRoot export has:
// walk up from the dep dir to the nearest dir carrying a workspace marker
// (pnpm-workspace.yaml here), else the package dir itself.
const searchForWorkspaceRoot = (dir) => {
	let current = dir
	while (true) {
		if (existsSync(join(current, 'pnpm-workspace.yaml'))) {
			return current
		}

		const parent = dirname(current)
		if (parent === current) {
			return dir
		}

		current = parent
	}
}

const dirs = []

const track = (path) => {
	dirs.push(path)
	return path
}

// tmpdir() is a symlinked path on macOS (/var → /private/var) — the helper
// realpaths link targets, so expectations must be realpath'd the same way.
const makeProject = (deps) => {
	const root = realpathSync(track(mkdtempSync(join(tmpdir(), 'xplat-fs-allow-'))))
	writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'app', dependencies: deps }))
	return root
}

const makeLinkedPackage = (projectRoot, rel, { workspaceRoot = false } = {}) => {
	const dir = join(projectRoot, '..', rel)
	mkdirSync(dir, { recursive: true })
	track(dir)
	writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: rel }))
	if (workspaceRoot) {
		writeFileSync(join(dir, 'pnpm-workspace.yaml'), 'packages:\n  - packages/*\n')
	}

	return dir
}

afterEach(() => {
	for (const dir of dirs.splice(0)) {
		rmSync(dir, { recursive: true, force: true })
	}
})

describe('linkedDepFsRoots', () => {
	it('returns the workspace root of a link: dependency outside the app root', () => {
		const projectRoot = makeProject({ '@octane-xplat/ui': 'link:../checkout/packages/ui' })
		const linkedRoot = makeLinkedPackage(projectRoot, 'checkout', { workspaceRoot: true })
		mkdirSync(join(linkedRoot, 'packages', 'ui'), { recursive: true })

		assert.deepEqual(linkedDepFsRoots(projectRoot, searchForWorkspaceRoot), [linkedRoot])
	})

	it('covers file: and portal: directory specs the same way', () => {
		const projectRoot = makeProject({ a: 'file:../linked-a', b: 'portal:../linked-b' })
		const rootA = makeLinkedPackage(projectRoot, 'linked-a')
		const rootB = makeLinkedPackage(projectRoot, 'linked-b')

		assert.deepEqual(
			linkedDepFsRoots(projectRoot, searchForWorkspaceRoot).sort(),
			[rootA, rootB].sort(),
		)
	})

	it('ignores registry/workspace specs and unresolvable or file-targeted links', () => {
		const projectRoot = makeProject({
			ok: 'link:../linked-ok',
			registry: '^1.0.0',
			workspace: 'workspace:*',
			missing: 'link:../does-not-exist',
			tarball: 'file:../pkg.tgz',
		})

		const linkedRoot = makeLinkedPackage(projectRoot, 'linked-ok')
		writeFileSync(track(join(projectRoot, '..', 'pkg.tgz')), 'not a dir')

		assert.deepEqual(linkedDepFsRoots(projectRoot, searchForWorkspaceRoot), [linkedRoot])
	})

	it('discovers hook-linked scoped packages with registry specs and deduplicates their workspace', () => {
		const projectRoot = makeProject({ '@fixture/ui': '0.16.0', '@fixture/cli': '^0.16.0' })
		const linkedRoot = makeLinkedPackage(projectRoot, 'hook-checkout', { workspaceRoot: true })
		mkdirSync(join(projectRoot, 'node_modules/@fixture'), { recursive: true })
		for (const name of ['ui', 'cli']) {
			const dir = join(linkedRoot, 'packages', name)
			mkdirSync(dir, { recursive: true })
			symlinkSync(dir, join(projectRoot, 'node_modules/@fixture', name), 'dir')
		}
		assert.deepEqual(linkedDepFsRoots(projectRoot, searchForWorkspaceRoot), [linkedRoot])
	})

	it('does not allow registry stores, internal packages, or undeclared external links', () => {
		const projectRoot = makeProject({ registry: '^1.0.0', internal: 'workspace:*' })
		const store = makeLinkedPackage(projectRoot, 'registry-store')
		const installed = join(store, 'node_modules/registry')
		mkdirSync(installed, { recursive: true })
		mkdirSync(join(projectRoot, 'node_modules/internal'), { recursive: true })
		symlinkSync(installed, join(projectRoot, 'node_modules/registry'), 'dir')
		const unrelated = makeLinkedPackage(projectRoot, 'unrelated-checkout')
		symlinkSync(unrelated, join(projectRoot, 'node_modules/undeclared'), 'dir')
		assert.deepEqual(linkedDepFsRoots(projectRoot, searchForWorkspaceRoot), [])
	})

	it('serves hook-linked CSS through the native route while denying unrelated files', async () => {
		const projectRoot = makeProject({ '@fixture/ui': '0.16.0' })
		const linkedRoot = makeLinkedPackage(projectRoot, 'http-checkout', { workspaceRoot: true })
		mkdirSync(join(projectRoot, 'node_modules/@fixture'), { recursive: true })
		symlinkSync(linkedRoot, join(projectRoot, 'node_modules/@fixture/ui'), 'dir')
		const cssPath = join(linkedRoot, 'tokens.css')
		writeFileSync(cssPath, '.token { width: 31px; }')
		const unrelated = makeLinkedPackage(projectRoot, 'http-unrelated')
		writeFileSync(join(unrelated, 'private.css'), '.private { width: 99px; }')
		const ns = pathToFileURL(createRequire(import.meta.url).resolve('@nativescript/vite'))
		const { registerNsModuleServerRoute } = await import(
			new URL('./hmr/server/websocket-ns-m.js', ns)
		)
		const { createSharedTransformRequestRunner } = await import(
			new URL('./hmr/server/shared-transform-request.js', ns)
		)
		const server = await createServer({
			root: projectRoot,
			configFile: false,
			logLevel: 'silent',
			optimizeDeps: { noDiscovery: true },
			server: {
				host: '127.0.0.1',
				port: 0,
				watch: null,
				fs: { allow: [projectRoot, ...linkedDepFsRoots(projectRoot, searchForWorkspaceRoot)] },
			},
			plugins: [
				pxToDip(),
				{
					name: 'fixture-native-css',
					configureServer(server) {
						registerNsModuleServerRoute(server, {
							verbose: false,
							appVirtualWithSlash: '/src/',
							sfcFileMap: new Map(),
							depFileMap: new Map(),
							getGraphVersion: () => 0,
							getStrategy: () => ({}),
							depsBundle: null,
							sharedTransformRequest: createSharedTransformRequestRunner((url) =>
								server.transformRequest(url),
							),
							ensureInitialGraphPopulationStarted() {},
							upsertGraphModule() {},
						})
					},
				},
			],
		})
		try {
			await server.listen()
			const origin = `http://127.0.0.1:${server.httpServer.address().port}`
			const response = await fetch(origin + '/ns/m/@fs' + cssPath)
			assert.equal(response.status, 200)
			const code = await response.text()
			assert.match(code, /31dip/)
			assert.match(code, /export default __ns_css_text__/)
			assert.doesNotMatch(code, /__vite__updateStyle/)
			await assert.rejects(
				server.transformRequest('/@fs' + join(unrelated, 'private.css') + '?inline'),
				{ code: 'ERR_DENIED_ID' },
			)
		} finally {
			await server.close()
		}
	})

	it('returns an empty list when the app package.json cannot be read', () => {
		const projectRoot = realpathSync(track(mkdtempSync(join(tmpdir(), 'xplat-fs-allow-empty-'))))

		assert.deepEqual(linkedDepFsRoots(projectRoot, searchForWorkspaceRoot), [])
	})
})
