import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readGridCells } from '../src/grid-cells.ts'

// Metadata/tree model only; no AppKit, layout, focus, pointer or keyboard input.
function fixture() {
	const nodes = new Map<object, any>()
	const view = (props: any = {}, children: any[] = []): any => {
		const result = { subviews: { get count() { return children.length }, objectAtIndex: (i: number) => children[i] } }
		nodes.set(result, { view: result, props }); return result
	}
	return { nodes, view, read: (root: object, excluded?: object[]) => readGridCells(root, (view) => nodes.get(view), excluded) }
}
test('reads marked descendants in current native order across unmanaged/NSArray wrappers', () => {
	const f = fixture(), a = f.view({ 'data-grid-cell': true }), b = f.view({ 'data-grid-cell': false }), ignored = f.view({ 'data-grid-cell': null })
	const children = [a, { subviews: [b, ignored] }], root = f.view({ 'data-grid-cell': true }, children)
	assert.deepEqual(f.read(root), [a, b]); children.reverse(); assert.deepEqual(f.read(root), [b, a])
	f.nodes.get(a).props['data-grid-cell'] = undefined; assert.deepEqual(f.read(root), [b])
})
test('nested hook/GridList boundaries and retired node identities cannot leak cells', () => {
	const f = fixture(), a = f.view({ 'data-grid-cell': true }), b = f.view({ 'data-grid-cell': '' }), c = f.view({ 'data-grid-cell': true })
	const nested = f.view({}, [b]), list = f.view({}, [c]), root = f.view({}, [a, nested, list])
	f.nodes.get(list).cssClasses = new Set(['vx-gridlist'])
	assert.deepEqual(f.read(root, [nested]), [a]); f.nodes.get(a).view = {}; assert.deepEqual(f.read(root, [nested]), [])
	assert.deepEqual(f.read(nested), [b])
})
test('tolerates cycles, duplicate views and invalid native collection counts without invoking child access', () => {
	const f = fixture(), a = f.view({ 'data-grid-cell': true }), root: any = { subviews: [a, a] }
	root.subviews.push(root); assert.deepEqual(f.read(root), [a])
	root.subviews = { count: Infinity, objectAtIndex() { throw Error('must not access') } }; assert.deepEqual(f.read(root), [])
})
