import assert from 'node:assert/strict'
import { test } from 'node:test'
import { runSlice, sourceWithoutImports } from './mock-globals.ts'

const source = sourceWithoutImports(new URL('../src/index.ts', import.meta.url))
const { parityStyle } = runSlice(
	source.slice(source.indexOf('function parityStyle('), source.indexOf('function measureTextLineAdvances(')) + '\n({ parityStyle })',
	{ labelPaddings: new WeakMap() },
)
const facets = ['flexDirection', 'alignItems', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft']
const style = (node: any) => JSON.parse(JSON.stringify(parityStyle({ view: {}, props: {}, ...node }, facets)))

test('parity reports computed Mason flex values and parsed padding, rather than stale layout props', () => {
	assert.deepEqual(style({
		type: 'masonview', masonNode: {}, props: { flexDirection: 'row', alignItems: 'start' },
		computedStyle: { flexDirection: 'column', alignItems: 'center' },
		dockInsets: { top: 3, right: 7, bottom: 5, left: 11 },
	}), { flexDirection: 'column', alignItems: 'center', paddingTop: '3', paddingRight: '7', paddingBottom: '5', paddingLeft: '11' })
})

test('parity includes Mason defaults and scroll axis without inventing them on other hosts', () => {
	assert.deepEqual(style({ type: 'masonview', masonNode: {} }), {
		flexDirection: 'row', alignItems: 'stretch', paddingTop: '0', paddingRight: '0', paddingBottom: '0', paddingLeft: '0',
	})
	assert.equal(style({ type: 'scrollview', masonNode: {} }).flexDirection, 'column')
	assert.equal(style({ type: 'scrollview', masonNode: {}, props: { horizontal: true } }).flexDirection, 'row')
	assert.deepEqual(style({ type: 'label' }), {})
})
