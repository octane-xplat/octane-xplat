import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, test } from 'node:test'
import { resolveTsrxLeaf } from '../src/tsrx-leaf.ts'

const dir = mkdtempSync(join(tmpdir(), 'xplat-explicit-tsrx-'))
after(() => rmSync(dir, { recursive: true, force: true }))
for (const suffix of [
	'',
	'.web',
	'.ios',
	'.android',
	'.mobile',
	'.macos',
	'.windows',
	'.gtk',
	'.linux',
]) {
	writeFileSync(join(dir, `Card${suffix}.tsrx`), 'export const card = true\n')
}

const importer = join(dir, 'main.ts')
const vitePath = (file: string) => file.replaceAll('\\', '/')
for (const platform of ['web', 'ios', 'android', 'macos', 'windows', 'gtk', 'linux']) {
	test(`${platform} selects a leaf before the explicit-extension default`, () => {
		assert.equal(
			resolveTsrxLeaf('./Card.tsrx', importer, platform),
			vitePath(join(dir, `Card.${platform}.tsrx`)),
		)
	})
}

test('visionOS follows the iOS chain and mobile is a fallback', () => {
	assert.equal(
		resolveTsrxLeaf('./Card.tsrx', importer, 'visionos'),
		vitePath(join(dir, 'Card.ios.tsrx')),
	)
	writeFileSync(join(dir, 'Fallback.mobile.tsrx'), 'export {}\n')
	for (const target of ['ios', 'android', 'visionos']) {
		assert.equal(
			resolveTsrxLeaf('./Fallback.tsrx', importer, target),
			vitePath(join(dir, 'Fallback.mobile.tsrx')),
		)
	}
	assert.equal(resolveTsrxLeaf('./Fallback.tsrx', importer, 'windows'), null)
})

test('preserves query strings and explicit platform imports', () => {
	assert.equal(
		resolveTsrxLeaf('./Card.tsrx?raw', importer + '?v=1', 'web'),
		vitePath(join(dir, 'Card.web.tsrx')) + '?raw',
	)
	assert.equal(resolveTsrxLeaf('./Card.ios.tsrx', importer, 'web'), null)
	assert.equal(resolveTsrxLeaf('package/Card.tsrx', importer, 'web'), null)
})

test('rejects a declaration-only fallback on an unsupported target', () => {
	writeFileSync(
		vitePath(join(dir, 'OnlyWeb.tsrx')),
		'// Type contract only.\nexport declare const value: number\n',
	)
	writeFileSync(join(dir, 'OnlyWeb.web.tsrx'), 'export const value = 1\n')
	assert.equal(
		resolveTsrxLeaf('./OnlyWeb.tsrx', importer, 'web'),
		vitePath(join(dir, 'OnlyWeb.web.tsrx')),
	)
	assert.throws(() => resolveTsrxLeaf('./OnlyWeb.tsrx', importer, 'ios'), /No ios implementation/)
})

test('leaves real defaults to the bundler', () => {
	writeFileSync(join(dir, 'Shared.tsrx'), 'export const value = 1\n')
	assert.equal(resolveTsrxLeaf('./Shared.tsrx', importer, 'web'), null)
})

test('unmarked declaration-only defaults also fail before bundling', () => {
	writeFileSync(
		vitePath(join(dir, 'Contract.tsrx')),
		'declare const Component: () => unknown\nexport default Component\n',
	)
	assert.throws(() => resolveTsrxLeaf('./Contract.tsrx', importer, 'web'), /declaration-only/)
	writeFileSync(
		vitePath(join(dir, 'Runtime.tsrx')),
		'declare const host: unknown\nexport function Component() { return host }\n',
	)
	assert.equal(resolveTsrxLeaf('./Runtime.tsrx', importer, 'web'), null)
})

test('a platform leaf can delegate to its own default without importing itself', () => {
	assert.equal(resolveTsrxLeaf('./Card.tsrx', join(dir, 'Card.web.tsrx'), 'web'), null)
})

test('side-effect entry families also reject empty declaration contracts', () => {
	writeFileSync(join(dir, 'Entry.tsrx'), '// Type contract only.\nexport {}\n')
	assert.throws(() => resolveTsrxLeaf('./Entry.tsrx', importer, 'ios'), /declaration-only/)
})
