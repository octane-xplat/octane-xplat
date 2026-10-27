import assert from 'node:assert/strict'
import { test } from 'node:test'
import { runSlice, sourceWithoutImports } from './mock-globals.ts'

const source = sourceWithoutImports(new URL('../src/index.ts', import.meta.url))
const chrome = source.slice(
	source.indexOf('function syncInputChrome('),
	source.indexOf('// CSS owns the theme palette.'),
)
function load() {
	return runSlice(chrome + '\n({ syncInputChrome })', {
		effectiveStyle: (node) => node.computedStyle ?? {},
		parseEdgeInsets: () => ({ left: 0, top: 0 }),
		fitTextView() {},
	})
}

test('CSS chrome leaves the native bezel and background configuration intact', () => {
	const { syncInputChrome } = load()
	for (const enabled of [false, true]) {
		const view = { bezeled: enabled, drawsBackground: enabled, invalidateIntrinsicContentSize() {} }
		const node = {
			type: 'textfield',
			view,
			computedStyle: { backgroundColor: 'red', borderWidth: 1, borderRadius: 8 },
		}
		syncInputChrome(node)
		assert.equal(view.bezeled, enabled)
		assert.equal(view.drawsBackground, enabled)
		node.computedStyle = {}
		syncInputChrome(node)
		assert.equal(view.bezeled, enabled)
		assert.equal(view.drawsBackground, enabled)
	}
})

test('textarea CSS padding aligns text and placeholder without changing native background', () => {
	const { syncInputChrome } = load()
	const node = {
		type: 'textview',
		view: { drawsBackground: true, textContainerInset: { width: 0, height: 0 } },
		placeholderLeading: { constant: 0 },
		placeholderTop: { constant: 0 },
		computedStyle: { paddingLeft: 8, paddingTop: 4, backgroundColor: 'white' },
	}
	syncInputChrome(node)
	assert.deepEqual({ ...node.view.textContainerInset }, { width: 8, height: 4 })
	assert.equal(node.placeholderLeading.constant, 8)
	assert.equal(node.placeholderTop.constant, 4)
	assert.equal(node.view.drawsBackground, true)
	node.computedStyle = {}
	syncInputChrome(node)
	assert.deepEqual({ ...node.view.textContainerInset }, { width: 0, height: 0 })
	assert.equal(node.placeholderLeading.constant, 0)
	assert.equal(node.placeholderTop.constant, 0)
})
