import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, mkdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, it } from 'node:test'
import { linkedDepFsRoots } from '../src/vite.mjs'

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

	it('returns an empty list when the app package.json cannot be read', () => {
		const projectRoot = realpathSync(track(mkdtempSync(join(tmpdir(), 'xplat-fs-allow-empty-'))))

		assert.deepEqual(linkedDepFsRoots(projectRoot, searchForWorkspaceRoot), [])
	})
})
