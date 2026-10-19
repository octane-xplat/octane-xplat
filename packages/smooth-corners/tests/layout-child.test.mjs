import { test } from 'node:test'
import assert from 'node:assert/strict'
import { outerLayoutProps, innerLayoutProps, paintedStyle } from '../src/layout-child.ts'

import {
	outerLayoutProps as outerLayoutPropsWeb,
	innerLayoutProps as innerLayoutPropsWeb,
	paintedStyle as paintedStyleWeb,
} from '../src/layout-child.web.ts'

// GH#7: the leaf's two wrappers split the layout contract — parent-layout
// metadata on the outer view, flex-container props on the inner host.

test('outer style bag carries only parent-layout metadata as CSS keys', () => {
	const { style } = outerLayoutProps({
		row: 1,
		col: 2,
		rowSpan: 2,
		dock: 'left',
		left: 40,
		top: 15,
		flexGrow: 1,
		alignSelf: 'stretch',
		order: 3,
		justifyContent: 'center',
		flexDirection: 'row',
	})

	assert.equal(style.gridRow, '2 / span 2')
	assert.equal(style.gridColumn, '3 / span 1')
	// dock:'left' pins the free edges; explicit left/top props win over the
	// dock insets.
	assert.equal(style.position, 'absolute')
	assert.equal(style.bottom, 0)
	assert.equal(style.left, 40)
	assert.equal(style.top, 15)
	assert.equal(style.right, undefined)
	assert.equal(style.flexGrow, 1)
	assert.equal(style.flexShrink, undefined)
	assert.equal(style.alignSelf, 'stretch')
	assert.equal(style.order, 3)
	// Container-role keys belong to the inner bag, not the wrapper.
	assert.equal(style.justifyContent, undefined)
	assert.equal(style.flexDirection, undefined)
	assert.equal(style.dock, undefined)
})

test('inner style bag carries only flex-container props, mapped to host names', () => {
	const { style } = innerLayoutProps({
		flexDirection: 'row',
		justifyContent: 'start',
		alignItems: 'end',
		flexWrap: true,
		gap: 10,
		rowGap: 4,
		columnGap: 6,
		left: 40,
	})

	assert.deepEqual(style, {
		flexDirection: 'row',
		justifyContent: 'flex-start',
		alignItems: 'flex-end',
		flexWrap: 'wrap',
		gap: 10,
		rowGap: 4,
		columnGap: 6,
	})

	assert.equal(innerLayoutProps({ flexWrap: false }).style.flexWrap, 'nowrap')
	assert.equal(innerLayoutProps({ flexWrap: 'wrap-reverse' }).style.flexWrap, 'wrap-reverse')
})

test('unset props are omitted — the style bag replaces wholesale', () => {
	// The driver diffs the applied style keys — a key absent on the next
	// apply resets what it installed, so helpers omit rather than tombstone.
	assert.deepEqual(outerLayoutProps({}).style, {})
	assert.deepEqual(innerLayoutProps({}).style, {})
})

test('outer style bag mirrors the element box geometry from style', () => {
	// Parent layouts size the child node from its own props.style — the
	// wrapper must carry the width/height/margins, while painted keys
	// (backgroundColor, padding, …) stay on the inner clipped box.
	const bag = outerLayoutProps({
		style: { width: 50, height: 30, marginTop: 4, backgroundColor: '#fff', padding: 8 },
	})

	assert.deepEqual(bag.style, { width: 50, height: 30, marginTop: 4 })
	assert.deepEqual(outerLayoutProps({ style: { backgroundColor: '#fff' } }).style, {})
})

test('paintedStyle drops margins and keeps the rest', () => {
	assert.deepEqual(paintedStyle({ width: 10, margin: 4, marginTop: 2, backgroundColor: '#000' }), {
		width: 10,
		backgroundColor: '#000',
	})

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
