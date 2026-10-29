import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readOutlineHeadings } from '../src/outline-headings.ts'

test('renderer snapshots actual heading owners in NSArray document order, including current rich text and explicit IDs', () => {
	const nodes = new Map<object, any>(), heading = (text: string, props: object) => {
		const view = { stringValue: text, subviews: [] }; nodes.set(view, { type: 'label', view, props: { accessibilityRole: 'heading', ...props } }); return view
	}
	const first = heading('  Account  ', { id: 'account', accessibilityHeadingLevel: 1 }), second = heading('Rich account', { accessibilityHeadingLevel: 3 })
	const children = [first, { subviews: [second] }], root = { subviews: { count: 2, objectAtIndex: (index: number) => children[index] } }
	assert.deepEqual(readOutlineHeadings(root, (view) => nodes.get(view)), [{ id: 'account', label: 'Account', level: 1 }, { id: '', label: 'Rich account', level: 3 }])
	second.stringValue = 'Changed contents'; assert.equal(readOutlineHeadings(root, (view) => nodes.get(view))[1].label, 'Changed contents')
})
test('unowned/stale native roles, blank headings and repeated/cyclic views do not create entries', () => {
	const blank = { stringValue: ' ' }, current = { stringValue: 'Current', subviews: [] as any[] }, stale = { stringValue: 'Stale' }
	const root = { subviews: [blank, stale, current, current, { accessibilityRole: 'AXHeading', stringValue: 'Native widget' }] }; current.subviews.push(root); const cycle: any = { subviews: [] }; cycle.subviews.push(cycle); root.subviews.push(cycle)
	const nodes = new Map<object, any>([[blank, { type: 'label', view: blank, props: { accessibilityRole: 'heading' } }], [stale, { type: 'label', view: {}, props: { accessibilityRole: 'heading' } }], [current, { type: 'label', view: current, props: { accessibilityRole: 'heading', accessibilityHeadingLevel: 99 } }]])
	assert.deepEqual(readOutlineHeadings(root, (view) => nodes.get(view)), [{ id: '', label: 'Current', level: 2 }]); assert.deepEqual(readOutlineHeadings(null, () => undefined), [])
})
