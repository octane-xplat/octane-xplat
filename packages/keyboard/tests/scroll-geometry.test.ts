import { expect, it } from 'vitest'
import { unknownFocusedInputState } from '@octane-xplat/platform/focused-input-state'
import { focusScrollPlan } from '../src/scroll-geometry'
import type { KeyboardSnapshot } from '../src/types'

const root = {},
	nested = {}

const box = (y: number, height: number) => ({ x: 0, y, width: 300, height })
const keyboard = { currentFrame: box(400, 400), windowRect: box(0, 800) } as KeyboardSnapshot
const focus = () => ({
	...unknownFocusedInputState(),
	input: {},
	windowRect: box(0, 800),
	inputRect: box(600, 40),
	scrollOwners: [{ id: root, rect: box(0, 800), offsetY: 0, minOffsetY: 0, maxOffsetY: 1000 }],
})

it('uses the smallest offset that exposes the input with clearance', () => {
	const state = focus()
	expect(focusScrollPlan(state, keyboard, root, 8)).toEqual([{ id: root, from: 0, to: 248 }])
	state.inputRect = box(200, 40)
	expect(focusScrollPlan(state, keyboard, root, 8)).toEqual([])
})

it('prefers the insertion point when a multiline input cannot fit', () => {
	const state = { ...focus(), inputRect: box(100, 600), caretRect: box(650, 20) }
	expect(focusScrollPlan(state, keyboard, root, 8)[0].to).toBe(278)
})

it('allocates nested range nearest-first and clamps residual movement', () => {
	const state = focus()
	state.scrollOwners.unshift({
		id: nested,
		rect: box(100, 600),
		offsetY: 0,
		minOffsetY: 0,
		maxOffsetY: 100,
	})
	expect(focusScrollPlan(state, keyboard, root, 8)).toEqual([
		{ id: nested, from: 0, to: 100 },
		{ id: root, from: 0, to: 148 },
	])
	expect(focusScrollPlan(state, keyboard, {}, 8)).toEqual([])
})

it('does not subtract keyboard height twice from an already resized viewport', () => {
	const state = focus()
	state.scrollOwners[0].rect = box(0, 400)
	expect(focusScrollPlan(state, keyboard, root, 8)[0].to).toBe(248)
})

it('ignores floating occlusion and honors box-only browser focus', () => {
	const state = focus()
	expect(focusScrollPlan(state, { ...keyboard, currentFrame: box(300, 100) }, root, 8)).toEqual([])
	expect(
		focusScrollPlan(
			{
				...state,
				inputRect: box(-20, 40),
				scrollOwners: [{ ...state.scrollOwners[0], offsetY: 100 }],
			},
			keyboard,
			root,
			8,
		)[0].to,
	).toBe(72)
})
