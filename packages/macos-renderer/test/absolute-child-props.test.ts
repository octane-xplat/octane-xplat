import assert from 'node:assert/strict'
import { test } from 'node:test'
import { runSlice } from './mock-globals.ts'
import { sourceWithoutImports } from './mock-globals.ts'

// GH#10: left/right/top/bottom are parent-directed layout props consumed by
// the mason child-prop bridge for every masonview child, but applyProps
// dispatches on the child's own type. Under a masonview parent the props
// should apply silently and queue a layout reconcile; under other parents
// they are genuinely dead and the warning should remain.
const source = sourceWithoutImports(new URL('../src/index.ts', import.meta.url))

const slice = source.slice(
	source.indexOf('function applyProps'),
	source.indexOf('function detach('),
)

const warnings: string[] = []
const reconciles: any[] = []

const sandbox = {
		elementBehaviors: new Map(),
		behaviorOf: (type: string) =>
			['masonview', 'liquidglass'].includes(type)
				? { layout: () => {}, containerStyles: true }
				: undefined,
		isManualLayoutParent: (t: string) =>
			['masonview','liquidglass','contentview','actionbar','rootlayout'].includes(t),
		registerElementType: () => {},
		
	configureScrollAxes: () => {},
	console: { warn: (msg: unknown) => warnings.push(String(msg)) },
	queueLayoutReconcile: (_container: any, parent: any) => reconciles.push(parent),
	setLayoutAction: () => {},
	applyAccessibility: () => {},
	setSizeConstraint: () => {},
	syncLabelOverflow: () => {},
	syncText: () => {},
	DEFAULT_TEXT_LINE_HEIGHT_RATIO: 1.3,
}

const { applyProps } = runSlice(slice + '\n({ applyProps })', sandbox)

function node(type: string, parent?: any) {
	const item = { id: Math.random(), type, view: {}, props: {}, parent, children: [] }
	parent?.children.push(item)
	return item
}

const ignoredFor = (item: any) =>
	warnings.filter((w) => w.includes('ignored ' + item.type + ' prop'))

test('masonview children consume all four position props without warnings', () => {
	const parent = node('masonview')
	for (const type of ['masonview', 'label', 'scrollview']) {
		const item = node(type, parent)
		warnings.length = 0
		applyProps(item, { left: 0, top: 0, right: 0, bottom: 0 })
		assert.deepEqual(ignoredFor(item), [], `${type} child warned: ${ignoredFor(item)}`)
	}
})

test('position prop changes under masonview queue a layout reconcile', () => {
	const parent = node('masonview')
	const item = node('masonview', parent)
	reconciles.length = 0
	applyProps(item, { right: 12 })
	// A mason child queues its own subtree AND its parent's pass — the
	// parent owns this child's frame.
	assert.deepEqual(reconciles, [item, parent])
})

test('position props under non-mason parents still warn as ignored', () => {
	const parent = node('contentview')
	const item = node('label', parent)
	warnings.length = 0
	applyProps(item, { left: 0, right: 0 })
	assert.equal(ignoredFor(item).length, 2)
})
