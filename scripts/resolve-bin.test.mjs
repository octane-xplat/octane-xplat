import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { resolveBin } from '../packages/lint/src/resolve-bin.mjs'

const fixture = (t) => {
	// module resolution realpaths the anchor — macOS /var -> /private/var
	const dir = realpathSync(mkdtempSync(join(tmpdir(), 'xplat-resolve-bin-')))
	t.after(() => rmSync(dir, { recursive: true, force: true }))
	return dir
}

const installBin = (dir, name, bin) => {
	const pkgDir = join(dir, 'node_modules', ...name.split('/'))
	mkdirSync(pkgDir, { recursive: true })
	writeFileSync(join(pkgDir, 'package.json'), JSON.stringify({ name, bin }))
	return pkgDir
}

test('resolveBin resolves a mapped bin entry from the anchor tree', (t) => {
	const dir = fixture(t)
	const pkgDir = installBin(dir, 'oxlint', { oxlint: 'bin/oxlint' })

	assert.equal(
		resolveBin('oxlint', [join(dir, 'consumer.js')]),
		join(pkgDir, 'bin/oxlint'),
	)
})

test('resolveBin resolves a string bin field', (t) => {
	const dir = fixture(t)
	const pkgDir = installBin(dir, 'oxlint', 'bin/oxlint')

	assert.equal(resolveBin('oxlint', [join(dir, 'consumer.js')]), join(pkgDir, 'bin/oxlint'))
})

test('resolveBin returns undefined when the package is unresolvable', (t) => {
	const dir = fixture(t)

	assert.equal(resolveBin('definitely-not-installed-pkg', [join(dir, 'consumer.js')]), undefined)
})

test('resolveBin walks up from nested anchors', (t) => {
	const dir = fixture(t)
	const pkgDir = installBin(dir, 'oxlint', { oxlint: 'bin/oxlint' })
	const nested = join(dir, 'packages/app/src')
	mkdirSync(nested, { recursive: true })

	assert.equal(resolveBin('oxlint', [join(nested, 'file.js')]), join(pkgDir, 'bin/oxlint'))
})
