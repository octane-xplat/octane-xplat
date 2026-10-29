import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { runSlice, sourceWithoutImports } from './mock-globals.ts'

const source = sourceWithoutImports(new URL('../src/index.ts', import.meta.url))

// ---- PaddedLabelCell ------------------------------------------------------

const { PaddedLabelCell, labelPaddings } = runSlice(
	source.slice(
		source.indexOf('/** Label cell carrying CSS padding'),
		source.indexOf('const inputTransparentViews'),
	) + '\n({ PaddedLabelCell, labelPaddings })',
	{
		NSTextFieldCell: class {
			cellSizeForBounds(bounds: any) {
				return { width: Math.max(0, bounds.size.width), height: 12 }
			}
		},
		NativeClass: () => {},
	},
)

// Objects crossing the vm boundary carry foreign prototypes — normalize
// through JSON so strict deep-equal sees plain literals.
const plain = (value: any) => JSON.parse(JSON.stringify(value))

test('padded label cell insets drawing and grows the measured size', () => {
	const cell = new PaddedLabelCell()
	const view = {}
	cell.controlView = view
	labelPaddings.set(view, { top: 4, left: 8, bottom: 4, right: 8 })

	assert.deepEqual(
		plain(cell.drawingRectForBounds({ origin: { x: 0, y: 0 }, size: { width: 100, height: 40 } })),
		{ origin: { x: 8, y: 4 }, size: { width: 84, height: 32 } },
	)
	// The wrap width shrinks by horizontal padding; the result grows by both
	// axes so the reported box matches CSS border-box semantics.
	assert.deepEqual(
		plain(cell.cellSizeForBounds({ origin: { x: 0, y: 0 }, size: { width: 100, height: 40 } })),
		{ width: 84 + 16, height: 12 + 8 },
	)
	// A cell without registered insets measures like a stock one.
	const plainCell = new PaddedLabelCell()
	assert.deepEqual(
		plain(
			plainCell.cellSizeForBounds({ origin: { x: 0, y: 0 }, size: { width: 100, height: 40 } }),
		),
		{ width: 100, height: 12 },
	)
})

// ---- label padding / visibility / font style writers -----------------------

const cellPaddings = new WeakMap()
const writers = runSlice(
	source.slice(
		source.indexOf('function syncNodeFont'),
		source.indexOf('// CSS angles run clockwise'),
	) + '\n({ syncNodeFont, syncLabelPadding, syncVisibility, isCollapsed })',
	{
		labelPaddings: cellPaddings,
		effectiveStyle: (node: any) => node.style ?? {},
		fontForFamilyStyle: (size: number, weight: any, family?: string) => ({
			name: 'font',
			size,
			weight,
			family,
		}),
		NSFontManager: {
			sharedFontManager: {
				convertFontToHaveTrait: (font: any, trait: number) => ({ ...font, italicTrait: trait }),
			},
		},
		NSFontTraitMask: { Italic: 1 },
		queueLayoutReconcile: (container: any, parent: any) =>
			(container.reconciles ??= []).push(parent),
	},
)

const labelNode = (style: Record<string, any> = {}) => ({
	type: 'label',
	style,
	view: {
		cell: {
			cellSizeForBounds: () => ({ width: 0, height: 0 }),
		},
		hidden: false,
		font: null,
		invalidateIntrinsicContentSize() {
			this.invalidated = true
		},
	},
	container: {},
	parent: { type: 'masonview' },
})

test('label padding resolves the shorthand box and longhand edges onto the cell', () => {
	const node = labelNode()
	node.stylePaddingBox = { top: 4, right: 6, bottom: 4, left: 6 }
	node.stylePaddingEdges = { top: 2, left: 10 }
	writers.syncLabelPadding(node)
	assert.deepEqual(plain(cellPaddings.get(node.view)), { top: 2, right: 6, bottom: 4, left: 10 })
	assert.deepEqual(plain(cellPaddings.get(node.view.cell)), {
		top: 2,
		right: 6,
		bottom: 4,
		left: 10,
	})
	assert.equal(node.view.invalidated, true)
	assert.equal(node.container.reconciles.at(-1), node.parent)

	node.stylePaddingBox = undefined
	node.stylePaddingEdges = undefined
	writers.syncLabelPadding(node)
	assert.deepEqual(plain(cellPaddings.get(node.view)), { top: 0, right: 0, bottom: 0, left: 0 })
})

test('visibility hides without dropping the slot; collapse drops it', () => {
	const node = labelNode()
	node.styleVisibility = 'hidden'
	writers.syncVisibility(node)
	assert.equal(node.view.hidden, true)
	assert.equal(writers.isCollapsed(node), false)

	node.styleVisibility = 'collapse'
	writers.syncVisibility(node)
	assert.equal(node.view.hidden, true)
	assert.equal(writers.isCollapsed(node), true)

	node.styleVisibility = undefined
	writers.syncVisibility(node)
	assert.equal(node.view.hidden, false)
	assert.equal(writers.isCollapsed(node), false)
})

test('fontStyle italic converts the resolved font once', () => {
	const node = labelNode({ fontStyle: 'italic' })
	writers.syncNodeFont(node)
	assert.equal(node.view.font.italicTrait, 1)

	node.style = { fontStyle: 'oblique' }
	writers.syncNodeFont(node)
	assert.equal(node.view.font.italicTrait, 1)

	node.style = { fontStyle: 'normal' }
	writers.syncNodeFont(node)
	assert.equal(node.view.font.italicTrait, undefined)
})

// ---- letter-spacing --------------------------------------------------------

const { setLabelText } = runSlice(
	source.slice(source.indexOf('function setLabelText'), source.indexOf('function syncText')) +
		'\n({ setLabelText })',
	{
		effectiveStyle: (node: any) => node.style ?? {},
		NSMutableParagraphStyle: { alloc: () => ({ init: () => ({}) }) },
		NSAttributedString: {
			alloc: () => ({
				initWithStringAttributes: (text: string, attrs: any) => ({ text, attrs }),
			}),
		},
		NSFontAttributeName: 'NSFont',
		NSForegroundColorAttributeName: 'NSColor',
		NSParagraphStyleAttributeName: 'NSParagraph',
		NSKernAttributeName: 'NSKern',
	},
)

test('letterSpacing bakes NSKern into the attributed string', () => {
	const node = labelNode()
	node.view.font = { name: 'font' }
	node.view.textColor = { name: 'color' }
	node.view.cell = { lineBreakMode: 0 }
	node.view.alignment = 2
	node.style = { letterSpacing: 0.5 }
	setLabelText(node, 'Tracked')
	assert.equal(node.view.attributedStringValue.attrs.NSKern, 0.5)
	assert.equal(node.view.attributedStringValue.attrs.NSParagraph.alignment, 2)
	assert.equal(node.view.stringValue, undefined)

	node.style = {}
	setLabelText(node, 'Plain')
	assert.equal(node.view.stringValue, 'Plain')
})

// ---- cursor / user-select --------------------------------------------------

const cursorRecords = new WeakMap()
const cursorLog: string[] = []
const cursorWarnings: string[] = []
const cursorSlice = runSlice(
	source.slice(
		source.indexOf('// CSS cursor keywords'),
		source.indexOf('// CSS angles run clockwise'),
	) + '\n({ syncCursor, syncUserSelect, CSS_CURSORS })',
	{
		console: { warn: (m: string) => cursorWarnings.push(m) },
		NSCursor: {
			pointingHandCursor: { name: 'hand', push: () => cursorLog.push('push') },
			pop: () => cursorLog.push('pop'),
			hide: () => cursorLog.push('hide'),
			unhide: () => cursorLog.push('unhide'),
		},
		hoverRecordByView: cursorRecords,
		observeHover: (view: any) => {
			cursorRecords.set(view, { view })
		},
		unobserveHover: (view: any) => {
			cursorRecords.delete(view)
		},
	},
)

test('cursor installs a hover record, retakes inside, and releases on clear', () => {
	const node: any = { type: 'masonview', view: {}, styleCursor: 'pointer' }
	cursorSlice.syncCursor(node)
	const record: any = cursorRecords.get(node.view)
	assert.equal(record.cursor.name, 'hand')

	record.inside = true
	node.styleCursor = 'none'
	cursorSlice.syncCursor(node)
	assert.deepEqual(cursorLog.slice(-1), ['hide'])
	assert.equal(record.cursorHidden, true)

	node.styleCursor = undefined
	cursorSlice.syncCursor(node)
	assert.deepEqual(cursorLog.slice(-1), ['unhide'])
	assert.equal(cursorRecords.get(node.view), undefined)
})

test('unknown cursor values warn and keep the inherited cursor', () => {
	cursorWarnings.length = 0
	const node: any = { type: 'label', view: {}, styleCursor: 'zoom-in' }
	cursorSlice.syncCursor(node)
	assert.equal(cursorWarnings.length, 1)
	assert.match(cursorWarnings[0], /unsupported cursor/)
	assert.equal(cursorRecords.get(node.view), undefined)
})

test('user-select toggles selectable on labels and restores htmlview default', () => {
	const label: any = { type: 'label', view: { selectable: false }, styleUserSelect: 'text' }
	cursorSlice.syncUserSelect(label)
	assert.equal(label.view.selectable, true)
	label.styleUserSelect = 'none'
	cursorSlice.syncUserSelect(label)
	assert.equal(label.view.selectable, false)
	const html: any = { type: 'htmlview', view: { selectable: false }, styleUserSelect: 'auto' }
	cursorSlice.syncUserSelect(html)
	assert.equal(html.view.selectable, true)
})

// ---- outline ---------------------------------------------------------------

const { outlineSpec } = runSlice(
	source.slice(
		source.indexOf('// `outline`/`outline-*` draws'),
		source.indexOf('// CSS angles run clockwise'),
	) + '\n({ outlineSpec })',
	{
		nativeColor: (color: any) => ({ CGColor: 'cg:' + color }),
		NSColor: { keyboardFocusIndicatorColor: { CGColor: 'cg:focus' } },
	},
)

test('outline shorthand and longhands resolve to a ring spec', () => {
	assert.deepEqual(plain(outlineSpec({ outline: '1.5px solid #ff0000' })), {
		width: 1.5,
		color: 'cg:#ff0000',
		offset: 0,
	})
	assert.deepEqual(plain(outlineSpec({ outlineWidth: 2, outlineOffset: -1 })), {
		width: 2,
		color: 'cg:focus',
		offset: -1,
	})
	assert.equal(outlineSpec({ outline: 'none' }), null)
	assert.equal(outlineSpec({}), null)
})

// ---- mason dict ------------------------------------------------------------

let masonSource = readFileSync(new URL('../src/mason.ts', import.meta.url), 'utf8')
masonSource = masonSource.replace(/import\s*\{[\s\S]*?\}\s*from\s*'[^']*';?/g, '')
masonSource = stripTypeScriptTypes(masonSource).replaceAll('export ', '')

const { styleDict: styleDictRealm } = runSlice(masonSource + '\n;({ styleDict })', {
	console,
	process: { env: {}, cwd: () => '/' },
	NativeClass: (c: any) => c,
	NSView: class {},
	NSThread: { mainThread: { threadDictionary: { objectForKey: () => null } } },
	NSScreen: { mainScreen: { backingScaleFactor: 2 } },
	NSNotificationCenter: {
		defaultCenter: { addObserverForNameObjectQueueUsingBlock: () => ({}) },
	},
	NSViewFrameDidChangeNotification: 'frame',
})

const styleDict = (n: any) => JSON.parse(JSON.stringify(styleDictRealm(n)))

const leaf = (type: string, style: Record<string, any>) => ({
	type,
	props: {},
	computedStyle: style,
	children: [],
	view: {},
})

test('label padding stays out of the mason dict; collapse reads as display none', () => {
	assert.equal(styleDict(leaf('label', { padding: '8px 4px' })).padding, undefined)
	assert.deepEqual(styleDict(leaf('image', { padding: '8px 4px' })).padding, {
		left: [0, 4],
		right: [0, 4],
		top: [0, 8],
		bottom: [0, 8],
	})
	assert.equal(styleDict(leaf('label', { visibility: 'collapse' })).display, 'none')
	assert.equal(styleDict(leaf('label', { visibility: 'hidden' })).display, undefined)
})
