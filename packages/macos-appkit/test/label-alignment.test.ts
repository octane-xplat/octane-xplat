import assert from 'node:assert/strict'
import { test } from 'node:test'
import { runSlice, sourceWithoutImports } from './mock-globals.ts'

const source = sourceWithoutImports(new URL('../src/index.ts', import.meta.url))
const start = source.indexOf('function syncLabelAlignment(')
const end = source.indexOf('// A style key present', start)
assert.ok(start >= 0 && end > start)
const modes = { Left: 0, Center: 1, Right: 2, Justified: 3 }
function fixture() {
	const warnings: string[] = []
	const { syncLabelAlignment } = runSlice(source.slice(start, end) + '\n({ syncLabelAlignment })', {
		NSTextAlignment: modes,
		nodeClasses: node => node.classes ?? [],
		warnUnsupportedCssProp: (_node, key) => warnings.push(key),
	})
	const node: any = { view: { alignment: 0 } }
	return { node, warnings, sync: (style: any) => syncLabelAlignment(node, style) }
}

test('logical alignment follows CSS direction while physical and justified alignment stay explicit', () => {
	const h = fixture()
	for (const direction of ['ltr', 'rtl']) {
		for (const [textAlign, expected] of [
			['left', 0], ['center', 1], ['right', 2], ['justify', 3],
			['start', direction === 'rtl' ? 2 : 0], ['end', direction === 'rtl' ? 0 : 2],
		] as const) {
			h.sync({ textAlign, direction })
			assert.equal(h.node.view.alignment, expected)
		}
	}
	h.sync({ textAlign: 'end' }); assert.equal(h.node.view.alignment, 2)
	h.sync({ direction: 'rtl' }); assert.equal(h.node.view.alignment, 2)
	h.sync({}); assert.equal(h.node.view.alignment, 0)
	assert.deepEqual(h.warnings, [])
})

test('unsupported modes default without coercing values or inheriting dictionary names', () => {
	const h = fixture(), opaque = { toString() { throw Error('private style payload') } }
	h.sync({ textAlign: 'center' })
	h.sync({ textAlign: opaque }); assert.equal(h.node.view.alignment, 0)
	h.sync({ textAlign: 'constructor', direction: 'rtl' }); assert.equal(h.node.view.alignment, 2)
	h.sync({ textAlign: 'end', direction: opaque }); assert.equal(h.node.view.alignment, 2)
	assert.deepEqual(h.warnings, ['textAlign', 'textAlign', 'direction'])
})

test('unchanged alignment avoids native writes and removal retains the grabber baseline', () => {
	const h = fixture()
	let alignment = 0, writes = 0
	Object.defineProperty(h.node.view, 'alignment', { get: () => alignment, set: value => { writes++; alignment = value } })
	h.sync({ textAlign: 'left' }); assert.equal(writes, 0)
	h.sync({ textAlign: 'end' }); h.sync({ textAlign: 'end' }); assert.equal(writes, 1)
	h.node.classes = ['vx-sheet-grabber']
	h.sync({}); assert.equal(alignment, 1)
	h.sync({}); assert.equal(writes, 2)
	h.sync({ textAlign: 'start', direction: 'rtl' }); assert.equal(alignment, 2)
	h.node.classes = []
	h.sync({}); assert.equal(alignment, 0)
	h.node.view = null
	h.sync({ textAlign: 'center' }); assert.equal(writes, 4)
})
