import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
	pickAccessibilityProps,
	equalAccessibilityProps,
	pickLayoutChildProps,
	equalLayoutChildProps,
} from '../src/component-props.ts'

test('accessibility forwarding preserves false, undefined and state identity without leaking host props', () => {
	const state = { checked: false }
	const props = {
		accessible: false,
		accessibilityRole: 'button',
		accessibilityState: state,
		style: {},
		onPress() {},
	}
	const picked = pickAccessibilityProps(props)
	assert.deepEqual(picked, {
		accessible: false,
		accessibilityRole: 'button',
		accessibilityLabel: undefined,
		accessibilityHint: undefined,
		accessibilityValue: undefined,
		accessibilityState: state,
		accessibilityLiveRegion: undefined,
	})
	assert.equal(picked.accessibilityState, state)
	assert.equal(equalAccessibilityProps(props, { ...props, style: {} }), true)
	assert.equal(
		equalAccessibilityProps(props, { ...props, accessibilityState: { checked: false } }),
		false,
	)
	assert.equal(equalAccessibilityProps({}, { accessible: undefined }), true)
})

test('layout forwarding preserves metadata for the inner host conversion', () => {
	const props = { row: 0, col: 2, rowSpan: 3, dock: 'left', flexGrow: 0, style: { color: 'red' } }
	const picked = pickLayoutChildProps(props)
	assert.deepEqual(picked, {
		row: 0,
		col: 2,
		rowSpan: 3,
		colSpan: undefined,
		dock: 'left',
		left: undefined,
		top: undefined,
		flexGrow: 0,
		flexShrink: undefined,
		alignSelf: undefined,
		order: undefined,
	})
	assert.equal(equalLayoutChildProps(props, { ...props, style: {} }), true)
	assert.equal(equalLayoutChildProps(props, { ...props, row: 1 }), false)
	assert.equal(equalLayoutChildProps({}, { row: undefined }), true)
})
