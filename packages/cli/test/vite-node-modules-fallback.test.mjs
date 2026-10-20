import assert from 'node:assert/strict'
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	realpathSync,
	symlinkSync,
	rmSync,
	writeFileSync,
} from 'node:fs'

import { createServer as createHttpServer } from 'node:http'
import { createServer, searchForWorkspaceRoot } from 'vite'
import { linkedDepFsRoots } from '../dist/vite.js'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterEach, describe, it } from 'node:test'

const moduleUrl = new URL(
	'./hmr/server/websocket-module-specifiers.js',
	pathToFileURL(createRequire(import.meta.url).resolve('@nativescript/vite')),
)

const { resolveCandidateFilePath, filterExistingNodeModulesTransformCandidates } = await import(
	moduleUrl
)

const { createNsMRequestContext, resolveNsMTransformedModule } = await import(
	new URL('./websocket-ns-m-request.js', moduleUrl)
)

const roots = []

const makeProject = (packageJson) => {
	const sandbox = realpathSync(mkdtempSync(join(tmpdir(), 'xplat-vite-node-modules-')))
	roots.push(sandbox)
	const root = join(sandbox, 'app')
	mkdirSync(root)
	writeFileSync(join(root, 'package.json'), JSON.stringify(packageJson))
	return root
}

const writeResolvedFile = (root, relPath) => {
	const path = join(root, relPath)
	mkdirSync(dirname(path), { recursive: true })
	writeFileSync(path, 'export default true\n')
	return path
}

const withNativeHttpServer = async (projectRoot, run) => {
	const vite = await createServer({
		root: projectRoot,
		configFile: false,
		logLevel: 'silent',
		server: {
			middlewareMode: true,
			watch: null,
			hmr: false,
			fs: { allow: [projectRoot, ...linkedDepFsRoots(projectRoot, searchForWorkspaceRoot)] },
		},
		optimizeDeps: { noDiscovery: true },
	})
	// Exercise NativeScript's request/transform helpers over HTTP with real
	// Vite loading, without starting NativeScript's device/session services.
	const http = createHttpServer(async (req, res) => {
		const parsed = createNsMRequestContext(req.url, projectRoot, '/src/', projectRoot)
		assert.equal(parsed.kind, 'context')
		const result = await resolveNsMTransformedModule({
			context: parsed.value,
			transformRequest: (url) => vite.transformRequest(url),
			resolveId: async () => null,
			loadVirtualId: async () => null,
		})
		res.writeHead(result.transformed ? 200 : 404, { 'Content-Type': 'text/javascript' })
		res.end(result.transformed?.code ?? 'missing')
	})
	try {
		await new Promise((resolve) => http.listen(0, '127.0.0.1', resolve))
		await run(vite, `http://127.0.0.1:${http.address().port}`)
	} finally {
		await new Promise((resolve) => http.close(resolve))
		await vite.close()
	}
}

afterEach(() => {
	for (const root of roots.splice(0)) {
		rmSync(root, { recursive: true, force: true })
	}
})

describe('patched NativeScript Vite node_modules fallback', () => {
	it('anchors nested linked dependency candidates and serves an extensionless native HTTP request', async () => {
		const projectRoot = makeProject({
			name: 'app',
			dependencies: { auth: 'link:./framework/packages/auth' },
		})
		const expected = writeResolvedFile(
			projectRoot,
			'framework/packages/auth/node_modules/@fixture/sign-in/common.js',
		)
		const candidate = '/node_modules/@fixture/sign-in/common.js'
		const anchored = `/@fs${expected}`
		assert.equal(resolveCandidateFilePath(candidate, projectRoot, projectRoot), expected)
		for (const suffix of ['', '?v=123', '?v=123&import#fragment']) {
			assert.deepEqual(
				filterExistingNodeModulesTransformCandidates(
					candidate,
					[candidate + suffix, candidate + suffix],
					projectRoot,
					projectRoot,
				),
				[anchored + suffix],
			)
		}
		const request = '/ns/m/node_modules/@fixture/sign-in/common?v=123'
		const context = createNsMRequestContext(request, projectRoot, '/src/', projectRoot)
		assert.equal(context.kind, 'context')
		assert.equal(context.value.forcedVer, '123')
		assert.deepEqual(context.value.transformCandidates, [anchored])

		await withNativeHttpServer(projectRoot, async (vite, origin) => {
			await assert.rejects(vite.transformRequest(candidate + '?v=123'))
			assert.match((await vite.transformRequest(anchored + '?v=123')).code, /export default true/)
			for (const suffix of ['', '?v=123']) {
				const response = await fetch(`${origin}/ns/m/node_modules/@fixture/sign-in/common${suffix}`)
				assert.equal(response.status, 200)
				assert.match(await response.text(), /export default true/)
			}
		})
	})

	for (const workspaceKind of ['pnpm', 'package-json', 'hook-linked']) {
		it(`serves a transitive plugin from a linked ${workspaceKind} workspace package`, async () => {
			const projectRoot = makeProject({
				name: 'app',
				dependencies: {
					auth: workspaceKind === 'hook-linked' ? '0.16.0' : 'link:./octane-xplat/packages/auth',
				},
			})
			const workspaceRoot = join(
				workspaceKind === 'hook-linked' ? dirname(projectRoot) : projectRoot,
				'octane-xplat',
			)
			const authRoot = join(workspaceRoot, 'packages/auth')
			const storageRoot = join(workspaceRoot, 'packages/secure-storage')
			mkdirSync(authRoot, { recursive: true })
			mkdirSync(storageRoot, { recursive: true })
			if (workspaceKind === 'hook-linked') {
				mkdirSync(join(projectRoot, 'node_modules'), { recursive: true })
				symlinkSync(authRoot, join(projectRoot, 'node_modules/auth'), 'dir')
			}
			writeFileSync(
				join(workspaceRoot, 'package.json'),
				JSON.stringify({
					name: 'framework',
					...(workspaceKind === 'package-json' ? { workspaces: ['packages/*'] } : {}),
				}),
			)
			if (workspaceKind !== 'package-json') {
				writeFileSync(join(workspaceRoot, 'pnpm-workspace.yaml'), 'packages:\n  - packages/*\n')
			}
			writeFileSync(
				join(authRoot, 'package.json'),
				JSON.stringify({
					name: '@octane-xplat/auth',
					dependencies: { '@octane-xplat/secure-storage': 'workspace:*' },
				}),
			)
			writeFileSync(
				join(storageRoot, 'package.json'),
				JSON.stringify({
					name: '@octane-xplat/secure-storage',
					dependencies: { '@nativescript/secure-storage': '4.0.2' },
				}),
			)
			const expected = writeResolvedFile(
				storageRoot,
				'node_modules/@nativescript/secure-storage/index.android.js',
			)
			const candidate = '/node_modules/@nativescript/secure-storage/index.android.js'
			assert.equal(resolveCandidateFilePath(candidate, projectRoot, projectRoot), expected)
			assert.deepEqual(
				filterExistingNodeModulesTransformCandidates(
					candidate,
					[candidate + '?v=456'],
					projectRoot,
					projectRoot,
				),
				[`/@fs${expected}?v=456`],
			)
			const request = '/ns/m/node_modules/@nativescript/secure-storage/index.android.js?v=456'
			const context = createNsMRequestContext(request, projectRoot, '/src/', projectRoot)
			assert.equal(context.kind, 'context')
			assert.deepEqual(context.value.transformCandidates, [`/@fs${expected}`])
			await withNativeHttpServer(projectRoot, async (_vite, origin) => {
				const response = await fetch(origin + request)
				assert.equal(response.status, 200)
				assert.match(await response.text(), /export default true/)
			})
		})
	}

	it('retains app-root URLs and anchors hoisted, platform and symlink candidates', () => {
		const projectRoot = makeProject({ name: 'app' })
		const candidate = '/node_modules/@fixture/sign-in/common.android.js?v=123'
		const relativeFile = candidate.split('?')[0].slice(1)
		writeResolvedFile(projectRoot, relativeFile)
		assert.deepEqual(
			filterExistingNodeModulesTransformCandidates(
				candidate,
				[candidate],
				projectRoot,
				projectRoot,
			),
			[candidate],
		)
		const hoisted = writeResolvedFile(
			dirname(projectRoot),
			'node_modules/@fixture/sign-in/hoisted.js',
		)
		const hoistedCandidate = '/node_modules/@fixture/sign-in/hoisted.js?v=123'
		assert.deepEqual(
			filterExistingNodeModulesTransformCandidates(
				hoistedCandidate,
				[hoistedCandidate],
				projectRoot,
				dirname(projectRoot),
			),
			[`/@fs${hoisted}?v=123`],
		)
		const source = writeResolvedFile(projectRoot, 'framework/source.ts')
		symlinkSync(source, join(projectRoot, 'node_modules/@fixture/sign-in/source.ts'))
		const linked = '/node_modules/@fixture/sign-in/source.ts?v=123'
		assert.deepEqual(
			filterExistingNodeModulesTransformCandidates(linked, [linked], projectRoot, projectRoot),
			[`/@fs${source}?v=123`],
		)
	})

	it('finds a transitive dependency in a link dependency’s own node_modules', () => {
		const projectRoot = makeProject({
			name: 'app',
			dependencies: { icons: 'link:../linked-icons' },
		})

		const linkedRoot = join(dirname(projectRoot), 'linked-icons')
		mkdirSync(linkedRoot, { recursive: true })
		writeFileSync(join(linkedRoot, 'package.json'), JSON.stringify({ name: 'icons' }))
		const expected = writeResolvedFile(linkedRoot, 'node_modules/@iconify/utils/lib/index.mjs')

		assert.equal(
			resolveCandidateFilePath(
				'/node_modules/@iconify/utils/lib/index.mjs',
				projectRoot,
				projectRoot,
			),
			expected,
		)
	})

	it('finds a package in pnpm’s isolated virtual store', () => {
		const projectRoot = makeProject({ name: 'app' })
		const expected = writeResolvedFile(
			projectRoot,
			'node_modules/.pnpm/@fixture+pkg@1.0.0/node_modules/@fixture/pkg/lib/index.mjs',
		)

		assert.equal(
			resolveCandidateFilePath(
				'/node_modules/@fixture/pkg/lib/index.mjs',
				projectRoot,
				projectRoot,
			),
			expected,
		)
	})

	it('anchors pnpm store files inside the project root', () => {
		const projectRoot = makeProject({ name: 'app' })
		const expected = writeResolvedFile(
			projectRoot,
			'node_modules/.pnpm/@fixture+pkg@1.0.0/node_modules/@fixture/pkg/index.js',
		)
		const candidate = '/node_modules/@fixture/pkg/index.js?v=123'
		assert.deepEqual(
			filterExistingNodeModulesTransformCandidates(
				candidate,
				[candidate],
				projectRoot,
				projectRoot,
			),
			[`/@fs${expected}?v=123`],
		)
	})

	it('does not let a node_modules tail escape its candidate directory', () => {
		const projectRoot = makeProject({ name: 'app' })
		const outside = writeResolvedFile(projectRoot, 'outside.mjs')

		assert.equal(
			resolveCandidateFilePath('/node_modules/../../outside.mjs', projectRoot, projectRoot),
			null,
		)

		assert.ok(existsSync(outside))
	})
})
