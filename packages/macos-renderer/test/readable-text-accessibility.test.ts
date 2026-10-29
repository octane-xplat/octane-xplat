import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sourceWithoutImports, runSlice } from './mock-globals.ts'

test('readable native hosts apply and clear help/value descriptions and element visibility without rewriting visible text', () => {
	const source = sourceWithoutImports(new URL('../src/index.ts', import.meta.url)), start = source.indexOf('function applyAccessibility('), end = source.indexOf('/** Host updates carry', start)
	assert.ok(start >= 0 && end > start)
	const apply = runSlice(source.slice(start, end) + '\n;applyAccessibility')
	for (const type of ['label', 'htmlview']) {
		let element = true, label = ''
		const view = { stringValue: '12', accessibilityHelp: null, accessibilityValueDescription: null,
			set accessibilityElement(value: boolean) { element = value }, setAccessibilityLabel: (value: string) => { label = value } }
		const node = { type, view, props: {} }
		apply(node, 'accessibilityLabel', 'Items'); apply(node, 'accessibilityHint', 'Open the collection.'); apply(node, 'accessibilityValue', '12 items'); apply(node, 'accessible', false)
		assert.equal(label, 'Items'); assert.equal(view.accessibilityHelp, 'Open the collection.'); assert.equal(view.accessibilityValueDescription, '12 items'); assert.equal(element, false); assert.equal(view.stringValue, '12')
		apply(node, 'accessibilityHint', ''); apply(node, 'accessibilityValue', ''); assert.equal(view.accessibilityHelp, ''); assert.equal(view.accessibilityValueDescription, '')
		apply(node, 'accessibilityHint', undefined); apply(node, 'accessibilityValue', undefined); apply(node, 'accessible', undefined)
		assert.equal(view.accessibilityHelp, null); assert.equal(view.accessibilityValueDescription, null); assert.equal(element, true); assert.equal(view.stringValue, '12')
	}
})
