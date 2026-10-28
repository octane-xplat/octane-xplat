import assert from 'node:assert/strict'
import { test } from 'node:test'
import { transformNativeRegex, nativeUnicodeRegex } from '../dist/native-regex.js'

const evalSource = (code) => Function(`${code}; return regex`)()

test('lowers /\\p{…}/u and /\\P{…}/u literals with identical matching', async () => {
	for (const source of [String.raw`/\p{L}+/u`, String.raw`/\P{L}/u`]) {
		const result = await transformNativeRegex(`const regex = ${source}`)
		assert.ok(!result.code.includes('\\p{'), result.code)
		assert.ok(!result.code.includes('\\P{'), result.code)
		const transformed = evalSource(result.code)
		const original = evalSource(`const regex = ${source}`)
		for (const sample of ['abc XYZ', 'éèê Ångström', '日本語テスト', '🙂🎉', '12345', 'a b-c']) {
			original.lastIndex = transformed.lastIndex = 0
			assert.deepEqual(transformed.exec(sample), original.exec(sample), source + ' on ' + sample)
		}
	}
})

test('rewrites constant new RegExp with property escapes and u flag', async () => {
	const result = await transformNativeRegex(
		String.raw`const regex = new RegExp("\\p{L}+", "u")`,
	)
	assert.ok(!result.code.includes('new RegExp'), result.code)
	assert.ok(!result.code.includes('\\p{'), result.code)
	assert.deepEqual(evalSource(result.code).exec('héllo')[0], 'héllo')
})

test('expands property escapes inside template-literal RegExp patterns', async () => {
	const input =
		'const inner = /\\p{L}+/u; const regex = new RegExp(`' +
		String.raw`(?<![\\p{XID_Continue}\\$.])${'${inner.source}'}(?![\\p{XID_Continue}\\$])` +
		'`, "ug")'
	const result = await transformNativeRegex(input)
	assert.ok(!result.code.includes('\\p{'), result.code)
	const fn = Function(`${result.code}; return regex`)()
	// Compare against the original computed pattern (Node has ICU).
	const original = Function(`${input}; return regex`)()
	for (const sample of ['a.b', 'xb', 'ba.b', 'x a.b y', '日本.x', 'foo.bar.baz']) {
		original.lastIndex = fn.lastIndex = 0
		assert.deepEqual(fn.exec(sample), original.exec(sample), sample)
	}
})

test('keeps regex escapes and escaped brackets intact when expanding templates', async () => {
	const cases = [
		[String.raw`^\\p{P}+${'${x}'}$`, ['-', ']', '\\', '^', '[', 'a', '!?']],
		[String.raw`\\[\\p{L}+${'${x}'}`, ['[abc', 'abc', '[é']],
	]
	for (const [pattern, samples] of cases) {
		const input = `const x = ''; const regex = new RegExp(\`${pattern}\`, 'u')`
		const result = await transformNativeRegex(input)
		assert.ok(!result.code.includes('\\p{'), result.code)
		const transformed = Function(`${result.code}; return regex`)()
		const original = Function(`${input}; return regex`)()
		for (const sample of samples) {
			assert.deepEqual(transformed.exec(sample), original.exec(sample), pattern + ' on ' + sample)
		}
	}
})

test('leaves a locally shadowed RegExp constructor untouched', async () => {
	const result = await transformNativeRegex(
		String.raw`function custom(RegExp) { return new RegExp("\\p{L}", "u") }`,
	)
	assert.match(result.code, /new RegExp/)
	assert.match(result.code, /\\p\{L\}/)
})

test('lowers v-flag sets containing property escapes', async () => {
	const result = await transformNativeRegex(String.raw`const regex = /[\p{L}_]+/v`)
	assert.ok(!result.code.includes('\\p{'), result.code)
	const transformed = evalSource(result.code)
	const original = evalSource(String.raw`const regex = /[\p{L}_]+/v`)
	for (const sample of ['héllo_', '日本', '123']) {
		original.lastIndex = transformed.lastIndex = 0
		assert.deepEqual(transformed.exec(sample), original.exec(sample), sample)
	}
})

test('transform hook returns null for code without property escapes', async () => {
	const plugin = nativeUnicodeRegex()
	const out = await plugin.transform.call({}, 'const a = /\\w+/u', 'dep.js')
	assert.equal(out, null)
	assert.equal(await plugin.transform.call({}, String.raw`/\p{L}/u`, 'dep.css'), null)
	assert.equal(await plugin.transform.call({}, String.raw`/\p{L}/u`, 'dep.json'), null)
})

test('transform hook compiles escapes in a dependency module', async () => {
	const plugin = nativeUnicodeRegex()
	const out = await plugin.transform.call(
		{ warn() {} },
		String.raw`export const urlish = /\p{L}\p{N}/u`,
		'/app/node_modules/linkifyjs/dist/linkify.mjs',
	)
	assert.ok(out && !out.code.includes('\\p{'), out && out.code)
	assert.ok(out.map)
})
