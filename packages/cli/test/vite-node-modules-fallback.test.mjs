import assert from 'node:assert/strict'
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	readdirSync,
	realpathSync,
	rmSync,
	writeFileSync,
} from 'node:fs'

import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'
import { afterEach, describe, it } from 'node:test'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')

const patchedViteModule = () => {
	const store = join(repoRoot, 'node_modules/.pnpm')
	const packages = readdirSync(store).filter((entry) =>
		entry.startsWith('@nativescript+vite@8.0.17_'),
	)

	for (const entry of packages) {
		const source = join(
			store,
			entry,
			'node_modules/@nativescript/vite/hmr/server/websocket-module-specifiers.js',
		)

		if (
			existsSync(source) &&
			readFileSync(source, 'utf8').includes('function listDepFallbackDirs')
		) {
			return source
		}
	}

	throw new Error(
		'Install the patched @nativescript/vite@8.0.17 workspace dependency before running this test',
	)
}

const { resolveCandidateFilePath } = await import(pathToFileURL(patchedViteModule()))
const roots = []

const makeProject = (packageJson) => {
	const root = realpathSync(mkdtempSync(join(tmpdir(), 'xplat-vite-node-modules-')))
	roots.push(root)
	writeFileSync(join(root, 'package.json'), JSON.stringify(packageJson))
	return root
}

const writeResolvedFile = (root, relPath) => {
	const path = join(root, relPath)
	mkdirSync(dirname(path), { recursive: true })
	writeFileSync(path, 'export default true\n')
	return path
}

afterEach(() => {
	for (const root of roots.splice(0)) {
		rmSync(root, { recursive: true, force: true })
	}
})

describe('patched NativeScript Vite node_modules fallback', () => {
	it('finds a transitive dependency in a link dependency’s own node_modules', () => {
		const projectRoot = makeProject({
			name: 'app',
			dependencies: { icons: 'link:../linked-icons' },
		})

		const linkedRoot = join(projectRoot, '..', 'linked-icons')
		mkdirSync(linkedRoot, { recursive: true })
		roots.push(linkedRoot)
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
