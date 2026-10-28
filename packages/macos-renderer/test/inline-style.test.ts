import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeHostStyleProps } from '../src/inline-style.ts'

test('host style normalization snapshots declaration/array props and preserves identity for object/unset styles', () => {
	const authored = Object.freeze({ id: 'title', style: 'font-size:24px;letter-spacing:2px' }), normalized = normalizeHostStyleProps(authored)
	assert.notEqual(normalized, authored); assert.equal(authored.style, 'font-size:24px;letter-spacing:2px'); assert.deepEqual(normalized, { id: 'title', style: { fontSize: 24, letterSpacing: 2 } })
	const object = { style: { width: 20 } }; assert.equal(normalizeHostStyleProps(object), object); assert.equal(normalizeHostStyleProps(undefined), undefined)
	assert.deepEqual(normalizeHostStyleProps({ style: [{ width: 20 }, 'width:30px'] }), { style: { width: 30 } })
	assert.deepEqual(normalizeHostStyleProps({ style: '' }), { style: {} }); assert.equal(normalizeHostStyleProps({ style: undefined }).style, undefined)
	assert.throws(() => normalizeHostStyleProps({ style: 'width' }), TypeError)
})

test('formatted-node validation receives normalized string declarations and still rejects invalid numeric attributes', async () => {
	const { sourceWithoutImports, runSlice } = await import('./mock-globals.ts')
	const { validateTextStyle } = await import('../src/formatted-text.ts')
	const source = sourceWithoutImports(new URL('../src/index.ts', import.meta.url)), start = source.indexOf('function validateNodeProps('), end = source.indexOf('function makeNode(', start)
	const validate = runSlice(source.slice(start, end) + '\n;validateNodeProps', { validateTextStyle, nativeColor: (value: unknown) => value })
	assert.doesNotThrow(() => validate('span', { style: 'font-size:20px;letter-spacing:2px;color:#123456' }))
	assert.throws(() => validate('span', { style: 'font-size:-2px' }), /positive and finite/)
	assert.throws(() => validate('formattedstring', { style: 'width' }), /inline style/)
})
