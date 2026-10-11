import { test } from 'node:test'
import assert from 'node:assert/strict'
import { transformVisualRegex } from './visual-regex.mjs'

test('native visual regex transform preserves literal and constructor Unicode matching', async () => {
	for (const source of [
		String.raw`/[$_\p{ID_Continue}]+/uy`,
		String.raw`new RegExp("[$_\\p{ID_Continue}]+", "uy")`,
	]) {
		const result = await transformVisualRegex(`const regex = ${source}`)
		assert.ok(!result.code.includes('\\p{'))
		const transformed = Function(`${result.code}; return regex`)()
		const original = Function(`return ${source}`)()
		for (const sample of ['switch', 'é', '日本', '𐐀', '_$123', '☃', 'a b']) {
			original.lastIndex = transformed.lastIndex = 0
			assert.deepEqual(transformed.exec(sample), original.exec(sample))
		}
	}
})

test('preserves a locally shadowed RegExp constructor', async () => {
	const result = await transformVisualRegex(
		String.raw`function custom(RegExp) { return new RegExp("\\p{ID_Continue}", "u") }`,
	)

	assert.match(result.code, /new RegExp/)
})
