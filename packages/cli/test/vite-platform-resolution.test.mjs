import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, it } from 'node:test'
import { nativeRelativeResolution } from '../src/vite.mjs'

// An unsuffixed relative import must prefer the platform leaf over the shared
// default — the ns platform resolver only knows .ios/.android, so `./svg`
// used to resolve `svg.ts` in dev and skip registerElement side effects.
const dirs = []

const track = (path) => {
	dirs.push(path)

	return path
}

const makeDir = (files) => {
	const dir = track(mkdtempSync(join(tmpdir(), 'xplat-resolve-')))

	for (const name of files) {
		writeFileSync(join(dir, name), '')
	}

	return dir
}

const handler = nativeRelativeResolution().resolveId.handler

afterEach(() => {
	for (const dir of dirs.splice(0)) {
		rmSync(dir, { recursive: true, force: true })
	}
})

describe('nativeRelativeResolution', () => {
	it('prefers .mobile.ts over the unsuffixed default for relative imports', () => {
		const dir = makeDir(['svg.ts', 'svg.mobile.ts'])
		const resolved = handler('./svg', join(dir, 'Image.tsrx'), {})

		assert.equal(resolved, join(dir, 'svg.mobile.ts'))
	})

	it('resolves the shared default directly when no platform leaf exists', () => {
		const dir = makeDir(['svg.ts'])

		assert.equal(handler('./svg', join(dir, 'Image.tsrx'), {}), join(dir, 'svg.ts'))
	})

	it('ignores bare and absolute specifiers', () => {
		const dir = makeDir(['dep.ts', 'dep.mobile.ts'])

		assert.equal(handler('@scope/dep', join(dir, 'main.ts'), {}), null)
		assert.equal(handler('/dep', join(dir, 'main.ts'), {}), null)
	})
})
