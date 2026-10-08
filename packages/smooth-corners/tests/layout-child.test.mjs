import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
	outerLayoutProps,
	innerLayoutProps,
	paintedStyle,
} from '../src/layout-child.ts'

import {
	outerLayoutProps as outerLayoutPropsWeb,
	innerLayoutProps as innerLayoutPropsWeb,
	paintedStyle as paintedStyleWeb,
} from '../src/layout-child.web.ts'

// GH#7: the leaf's two wrappers split the layout contract — parent-layout
// metadata on the outer view, flex-container props on the inner host.

test('outer bag carries only parent-layout metadata', () => {
	const bag = outerLayoutProps({
		row: 1,
		col: 2,
		rowSpan: 2,
		dock: 'left',
		left: 40,
		top: 15,
		right: 5,
		bottom: 6,
		horizontalAlignment: 'center',
		verticalAlignment: 'top',
		flexGrow: 1,
		alignSelf: 'stretch',
		order: 3,
		justifyContent: 'center',
		flexDirection: 'row',
	})

	assert.equal(bag.row, 1)
	assert.equal(bag.col, 2)
	assert.equal(bag.rowSpan, 2)
	assert.equal(bag.colSpan, undefined)
	assert.equal(bag.dock, 'left')
	assert.equal(bag.left, 40)
	assert.equal(bag.top, 15)
	assert.equal(bag.right, 5)
	assert.equal(bag.bottom, 6)
	assert.equal(bag.horizontalAlignment, 'center')
	assert.equal(bag.verticalAlignment, 'top')
	assert.equal(bag.flexGrow, 1)
	assert.equal(bag.flexShrink, undefined)
	assert.equal(bag.alignSelf, 'stretch')
	assert.equal(bag.order, 3)
	assert.equal(bag.justifyContent, undefined)
	assert.equal(bag.flexDirection, undefined)
})

test('inner bag carries only flex-container props, mapped to host names', () => {
	const bag = innerLayoutProps({
		flexDirection: 'row',
		justifyContent: 'start',
		alignItems: 'end',
		flexWrap: true,
		gap: 10,
		rowGap: 4,
		columnGap: 6,
		left: 40,
	})

	assert.deepEqual(bag, {
		flexDirection: 'row',
		justifyContent: 'flex-start',
		alignItems: 'flex-end',
		flexWrap: 'wrap',
		gap: 10,
		rowGap: 4,
		columnGap: 6,
	})

	assert.equal(innerLayoutProps({ flexWrap: false }).flexWrap, 'nowrap')
	assert.equal(innerLayoutProps({ flexWrap: 'wrap-reverse' }).flexWrap, 'wrap-reverse')
})

test('unset whitelisted props emit explicit undefined so removals clear', () => {
	// The macOS host merges update bags over node.props — a key that simply
	// vanishes keeps its stale value. Unwhitelisted keys (dock/right/bottom,
	// rowGap/columnGap) stay omission-only so a bare mount does not warn.
	const outer = outerLayoutProps({})
	assert.ok('left' in outer && outer.left === undefined)
	assert.ok('order' in outer && outer.order === undefined)
	assert.ok(!('right' in outer), 'right should be omission-only')
	assert.ok(!('dock' in outer), 'dock should be omission-only')
	assert.equal(outer.style, undefined)

	const inner = innerLayoutProps({})
	assert.ok('flexDirection' in inner && inner.flexDirection === undefined)
	assert.ok('gap' in inner && inner.gap === undefined)
	assert.ok(!('rowGap' in inner), 'rowGap should be omission-only')
})

test('outer bag mirrors the element box geometry from style', () => {
	// Parent layouts size the child node from its own props.style — the
	// wrapper must carry the width/height/margins, while painted keys
	// (backgroundColor, padding, …) stay on the inner clipped box.
	const bag = outerLayoutProps({
		style: { width: 50, height: 30, marginTop: 4, backgroundColor: '#fff', padding: 8 },
	})

	assert.deepEqual(bag.style, { width: 50, height: 30, marginTop: 4 })
	assert.equal(outerLayoutProps({ style: { backgroundColor: '#fff' } }).style, undefined)
})

test('paintedStyle drops margins and keeps the rest', () => {
	assert.deepEqual(
		paintedStyle({ width: 10, margin: 4, marginTop: 2, backgroundColor: '#000' }),
		{ width: 10, backgroundColor: '#000' },
	)

	assert.equal(paintedStyle(undefined), undefined)
	assert.equal(paintedStyleWeb(0), 0)
})

test('web outer style folds metadata into CSS', () => {
	const { style } = outerLayoutPropsWeb({
		row: 0,
		rowSpan: 2,
		col: 1,
		left: 40,
		right: 10,
		top: 15,
		bottom: 5,
		flexGrow: 1,
		order: 2,
		horizontalAlignment: 'right',
		verticalAlignment: 'top',
		dock: 'left',
	})

	assert.equal(style.gridRow, '1 / span 2')
	assert.equal(style.gridColumn, '2 / span 1')
	assert.equal(style.left, 40)
	assert.equal(style.right, 10)
	assert.equal(style.top, 15)
	assert.equal(style.bottom, 5)
	assert.equal(style.flexGrow, 1)
	assert.equal(style.order, 2)
	assert.equal(style.justifySelf, 'end')
	assert.equal(style.alignSelf, 'start')
	assert.equal(style.dock, undefined)

	const withBox = outerLayoutPropsWeb({ style: { width: 50, marginTop: 4, padding: 8 } }).style
	assert.equal(withBox.width, 50)
	assert.equal(withBox.marginTop, 4)
	assert.equal(withBox.padding, undefined)
})

test('web inner style emits display:flex only when a flex prop is set', () => {
	assert.deepEqual(innerLayoutPropsWeb({}).style, {})

	const { style } = innerLayoutPropsWeb({ gap: 8 })
	assert.equal(style.display, 'flex')
	assert.equal(style.flexDirection, 'column')
	assert.equal(style.gap, 8)

	const row = innerLayoutPropsWeb({ flexDirection: 'row', justifyContent: 'start' }).style
	assert.equal(row.flexDirection, 'row')
	assert.equal(row.justifyContent, 'flex-start')
})
