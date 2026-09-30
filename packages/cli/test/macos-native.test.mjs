import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { buildMacOSNative, discoverMacOSNative } from '../src/macos/native.mjs'

function fixture(t) {
	const app = mkdtempSync(join(tmpdir(), 'xplat-native-test-'))
	t.after(() => rmSync(app, { recursive: true, force: true }))
	mkdirSync(join(app, 'node_modules'))
	writeFileSync(
		join(app, 'package.json'),
		JSON.stringify({ name: 'app', dependencies: { leaf: '1.0.0' } }),
	)

	const leaf = join(app, 'node_modules/leaf')
	mkdirSync(join(leaf, 'platforms/macos/src'), { recursive: true })
	mkdirSync(join(leaf, 'platforms/macos/include'))
	writeFileSync(join(leaf, 'package.json'), JSON.stringify({ name: 'leaf', version: '1.0.0' }))
	writeFileSync(join(leaf, 'platforms/macos/src/probe.c'), 'int probe(void) { return 1; }')
	writeFileSync(join(leaf, 'platforms/macos/include/probe.h'), 'int probe(void);')
	return { app, leaf }
}

test('no native leaves keep shipped metadata without requiring a toolchain', async (t) => {
	const { app } = fixture(t)
	writeFileSync(join(app, 'package.json'), '{"name":"app"}')
	const result = await buildMacOSNative(app)
	assert.deepEqual(result.libraries, [])
	assert.match(result.metadata, /prebuilt.*metadata.nsmd$/)
})

test('schema, missing globs, and paths outside the native directory fail before compilation', (t) => {
	const { app, leaf } = fixture(t)
	for (const [config, message] of [
		[{ source: [] }, /unknown xplat.macos.source/],
		[{ sources: ['platforms/macos/src/missing.c'] }, /no files match/],
		[{ sources: ['../outside.c'] }, /package-relative paths/],
		[{ sources: ['package.json'] }, /inside platforms\/macos/],
		[{ frameworks: ['Foundation;echo'] }, /invalid system/],
	]) {
		writeFileSync(
			join(leaf, 'package.json'),
			JSON.stringify({ name: 'leaf', xplat: { macos: config } }),
		)

		assert.throws(() => discoverMacOSNative(app), message)
	}
})

test('escaping symlinks cannot smuggle undeclared external cache inputs', (t) => {
	const { app, leaf } = fixture(t)
	symlinkSync(join(app, 'package.json'), join(leaf, 'platforms/macos/external.json'))
	assert.throws(() => discoverMacOSNative(app), /escapes platforms\/macos/)
})

test('private headers and package configuration participate in invalidation', (t) => {
	const { app, leaf } = fixture(t)
	const original = discoverMacOSNative(app).fingerprint
	writeFileSync(join(leaf, 'platforms/macos/src/private.h'), '#define VALUE 2')
	const header = discoverMacOSNative(app).fingerprint
	assert.notEqual(header, original)
	writeFileSync(
		join(leaf, 'package.json'),
		JSON.stringify({ name: 'leaf', xplat: { macos: { defines: ['VALUE=3'] } } }),
	)

	assert.notEqual(discoverMacOSNative(app).fingerprint, header)
})

test('native dependency cycles fail with the owning leaf', (t) => {
	const { app, leaf } = fixture(t)
	writeFileSync(join(leaf, 'package.json'), '{"name":"leaf","dependencies":{"app":"1.0.0"}}')
	mkdirSync(join(leaf, 'node_modules'))
	symlinkSync(app, join(leaf, 'node_modules/app'))
	mkdirSync(join(app, 'platforms/macos/src'), { recursive: true })
	mkdirSync(join(app, 'platforms/macos/include'))
	writeFileSync(join(app, 'platforms/macos/src/root.c'), 'int root(void) { return 2; }')
	writeFileSync(join(app, 'platforms/macos/include/root.h'), 'int root(void);')
	assert.throws(() => discoverMacOSNative(app), /native dependency cycle/)
})
