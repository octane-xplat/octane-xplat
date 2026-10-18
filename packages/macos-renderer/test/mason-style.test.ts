import assert from 'node:assert/strict'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'

// The mason cutover makes styleDict the contract every container intrinsic
// shares: intrinsic props (orientation, rows/columns, dock edges, grid
// placement, wrap item dims, absolute insets) translate into the engine's
// style surface here, and this is where parity lives or dies.
let source = readFileSync(new URL('../src/mason.ts', import.meta.url), 'utf8')
source = source.replace(/import\s*\{[\s\S]*?\}\s*from\s*'[^']*';?/g, '')
source = stripTypeScriptTypes(source).replaceAll('export ', '')

const { styleDict: styleDictRealm } = runInNewContext(
	source + '\n;({ styleDict })',
	{
		console,
		process: { env: {}, cwd: () => '/' },
		NativeClass: (c: any) => c,
		NSView: class {},
		NSFileManager: { defaultManager: { fileExistsAtPath: () => false } },
		NSThread: { mainThread: { threadDictionary: { objectForKey: () => null } } },
		NSScreen: { mainScreen: { backingScaleFactor: 2 } },
		NSNotificationCenter: {
			defaultCenter: { addObserverForNameObjectQueueUsingBlock: () => ({}) },
		},
		NSViewFrameDidChangeNotification: 'frame',
		dlopen: () => true,
	},
)

// Objects crossing the vm boundary carry foreign prototypes — normalize
// through JSON so strict deep-equal sees plain literals.
const styleDict = (n: any) => JSON.parse(JSON.stringify(styleDictRealm(n)))

function node(type: string, props: any = {}, parent?: any) {
	const item: any = { type, props, children: [], view: {} }
	if (parent) {
		item.parent = parent
		item.layoutParent = parent
		parent.children.push(item)
	}
	return item
}

test('stacklayout orientation maps to flexDirection', () => {
	assert.equal(styleDict(node('stacklayout')).flexDirection, 'column')
	assert.equal(
		styleDict(node('stacklayout', { orientation: 'horizontal' })).flexDirection,
		'row',
	)
	assert.equal(styleDict(node('stacklayout')).display, 'flex')
	assert.equal(styleDict(node('stacklayout')).alignItems, 'stretch')
	// containers establish containing blocks for absolute descendants
	assert.equal(styleDict(node('stacklayout')).position, 'relative')
})

test('flexboxlayout defaults to row flex with web parity', () => {
	const dict = styleDict(node('flexboxlayout'))
	assert.equal(dict.display, 'flex')
	assert.equal(dict.flexDirection, 'row')
	assert.equal(dict.alignItems, 'stretch')
})

test('flex gap prop and gap styles become length dims — never auto', () => {
	const byProp = styleDict(node('flexboxlayout', { gap: '8' }))
	assert.deepEqual(byProp.gapRow, [0, 8])
	assert.deepEqual(byProp.gapColumn, [0, 8])
	const byStyle = styleDict(node('stacklayout', { style: { rowGap: 5 } }))
	assert.deepEqual(byStyle.gapRow, [0, 5])
})

test('className-derived spacing/orientation feed the dict', () => {
	const item = node('stacklayout')
	item.classSpacing = 8
	item.classOrientation = 0 // NSUserInterfaceLayoutOrientation.Horizontal
	const dict = styleDict(item)
	assert.deepEqual(dict.gapRow, [0, 8])
	assert.equal(dict.flexDirection, 'row')
})

test('gridlayout NS tracks convert to CSS tracks', () => {
	const dict = styleDict(
		node('gridlayout', { rows: 'auto,*,40', columns: '*,2*,auto,10%' }),
	)
	assert.equal(dict.display, 'grid')
	assert.equal(dict.gridTemplateRows, 'auto 1fr 40px')
	assert.equal(dict.gridTemplateColumns, '1fr 2fr auto 10%')
})

test('grid children translate row/col/span to grid lines', () => {
	const grid = node('gridlayout', {})
	const item = node('label', { row: 1, col: 2, colSpan: 2 }, grid)
	const dict = styleDict(item)
	assert.equal(dict.gridRow, '2')
	assert.equal(dict.gridColumn, '3 / span 2')
})

test('absolutelayout children are absolute with inset dims', () => {
	const host = node('absolutelayout')
	const item = node('label', { left: 10, top: 20, right: 5, bottom: 4 }, host)
	const dict = styleDict(item)
	assert.equal(dict.position, 'absolute')
	assert.deepEqual(dict.inset, { left: [1, 10], right: [1, 5], top: [1, 20], bottom: [1, 4] })
})

test('docklayout child dock left pins the left edge', () => {
	const host = node('docklayout')
	const item = node('label', { dock: 'left' }, host)
	// Second child keeps `item` from being the stretch-last fill slot.
	node('label', {}, host)
	const dict = styleDict(item)
	assert.equal(dict.position, 'absolute')
	assert.deepEqual(dict.inset.left, [1, 0])
	assert.deepEqual(dict.inset.top, [1, 0])
	assert.deepEqual(dict.inset.bottom, [1, 0])
	assert.equal(dict.inset.right, undefined)
})

test('docklayout last child fills when stretchLastChild', () => {
	const host = node('docklayout', { stretchLastChild: true })
	const docked = node('label', { dock: 'left' }, host)
	const last = node('label', {}, host)
	const dict = styleDict(last)
	assert.deepEqual(dict.inset, {
		top: [1, 0],
		left: [1, 0],
		right: [1, 0],
		bottom: [1, 0],
	})
	assert.ok(styleDict(docked).inset.right === undefined)
})

test('wraplayout item sizes and orientation land on children', () => {
	const wrap = node('wraplayout', { orientation: 'vertical', itemWidth: 30, itemHeight: 20 })
	const item = node('label', {}, wrap)
	const dict = styleDict(item)
	assert.deepEqual(dict.width, [1, 30])
	assert.deepEqual(dict.height, [1, 20])
	const wdict = styleDict(wrap)
	assert.equal(wdict.flexWrap, 'wrap')
	assert.equal(wdict.flexDirection, 'column')
})

test('margins emit length type 1 — auto margins would swallow free space', () => {
	const host = node('stacklayout')
	const item = node('label', {}, host)
	item.marginInsets = { top: 8, right: 0, bottom: 0, left: 0 }
	const dict = styleDict(item)
	assert.deepEqual(dict.margin, {
		top: [1, 8],
		right: [1, 0],
		bottom: [1, 0],
		left: [1, 0],
	})
	// The shorthand path (style.margin) emits the same encoding.
	const other = node('label', { style: { margin: 4 } }, host)
	assert.deepEqual(styleDict(other).margin.top, [1, 4])
})

test('percent and auto dimensions stay typed', () => {
	const item = node('label', { style: { width: '50%', height: 20 } })
	const dict = styleDict(item)
	// Percent dims encode as type 2 with the fractional value.
	assert.deepEqual(dict.width, [2, 0.5])
	assert.deepEqual(dict.height, [1, 20])
})

test('scrollview content flows vertically by default', () => {
	const dict = styleDict(node('scrollview'))
	assert.equal(dict.flexDirection, 'column')
	assert.equal(dict.display, 'flex')
})

test('attached alignment becomes self-alignment on the cross axis', () => {
	const col = node('stacklayout')
	const item = node('label', { horizontalAlignment: 'right' }, col)
	assert.equal(styleDict(item).alignSelf, 'end')

	const row = node('stacklayout', { orientation: 'horizontal' })
	const rowItem = node('label', { verticalAlignment: 'bottom' }, row)
	assert.equal(styleDict(rowItem).alignSelf, 'end')

	// Grid children own both axes.
	const grid = node('gridlayout')
	const g = node('label', { horizontalAlignment: 'center', verticalAlignment: 'stretch' }, grid)
	const gdict = styleDict(g)
	assert.equal(gdict.justifySelf, 'center')
	assert.equal(gdict.alignSelf, 'stretch')
})

test('style width/height and padding reach the dict', () => {
	const dict = styleDict(node('stacklayout', { style: { width: 100, padding: 12 } }))
	assert.deepEqual(dict.width, [1, 100])
	assert.deepEqual(dict.padding, {
		top: [0, 12],
		right: [0, 12],
		bottom: [0, 12],
		left: [0, 12],
	})
})
