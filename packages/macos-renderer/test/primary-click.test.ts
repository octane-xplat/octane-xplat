import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isPrimaryClickBoundary, shouldReceivePrimaryClick } from '../src/primary-click.ts'

function fixture() {
	let hit: any
	const points: unknown[] = [], conversions: unknown[] = []
	const frame: any = { convertPointFromView(point: unknown, from: unknown) { conversions.push([point, from]); return { x: 17, y: 23 } } }
	const window: any = {}
	const root: any = { window, superview: frame, hitTest(point: unknown) { points.push(point); return hit } }
	window.contentView = root
	const owner: any = { window, superview: root }
	const decoration: any = { window, superview: owner }
	const child: any = { window, superview: owner }
	const text: any = { window, superview: child }
	const boundaries = new Set([child])
	const event: any = { type: 1, window, locationInWindow: { x: 100, y: 200 } }
	const check = () => shouldReceivePrimaryClick(owner, event, (view) => boundaries.has(view))
	return { owner, decoration, child, text, root, window, event, boundaries, points, conversions, check, hit: (view: any) => { hit = view } }
}

test('native hit coordinates are converted for the root superview and nested boundaries reject ancestors', () => {
	const f = fixture()
	f.hit(f.text)
	assert.equal(f.check(), false)
	assert.deepEqual(f.conversions, [[f.event.locationInWindow, null]])
	assert.deepEqual(f.points, [{ x: 17, y: 23 }])
	f.hit(f.decoration); assert.equal(f.check(), true)
	f.hit(f.owner); assert.equal(f.check(), true)
	f.hit(f.child); assert.equal(f.check(), false)
	f.boundaries.clear(); assert.equal(f.check(), true)
})

test('a nested control can own its click while its ancestor cannot, including after reparenting', () => {
	const f = fixture(); f.hit(f.text)
	assert.equal(shouldReceivePrimaryClick(f.child, f.event, (view) => f.boundaries.has(view)), true)
	assert.equal(f.check(), false)
	f.child.superview = f.root
	assert.equal(f.check(), false) // The hit no longer belongs to this owner.
})

test('foreign/empty/detached hits reject primary ownership; unrelated streams keep native defaults', () => {
	const f = fixture(); f.hit(null); assert.equal(f.check(), false)
	f.hit({ window: f.window, superview: f.root }); assert.equal(f.check(), false)
	f.event.window = {}; assert.equal(f.check(), false)
	f.event.window = f.window; f.owner.window = null; assert.equal(f.check(), false)
	f.event.type = 10; assert.equal(f.check(), true)
	assert.equal(shouldReceivePrimaryClick(null, f.event, () => false), false)
})

test('a root without a superview consumes window coordinates and invalid points do not claim input', () => {
	const f = fixture(); f.root.superview = null; f.hit(f.owner)
	assert.equal(f.check(), true)
	assert.deepEqual(f.points, [f.event.locationInWindow])
	assert.equal(f.conversions.length, 0)
	f.event.locationInWindow = { x: NaN, y: 0 }
	assert.equal(f.check(), false)
})

test('boundary classification preserves disabled widgets, native editors and hosted surfaces but not display content', () => {
	for (const type of ['button', 'textfield', 'textview', 'searchbar', 'slider', 'webview', 'htmlview']) assert.equal(isPrimaryClickBoundary(type, undefined, false), true)
	for (const role of ['button', 'checkbox', 'radio', 'link', 'combobox', 'tablist']) assert.equal(isPrimaryClickBoundary('masonview', role, false), true)
	for (const type of ['masonview', 'label', 'image', 'progress']) assert.equal(isPrimaryClickBoundary(type, 'group', false), false)
	assert.equal(isPrimaryClickBoundary('masonview', undefined, true), true)
})
