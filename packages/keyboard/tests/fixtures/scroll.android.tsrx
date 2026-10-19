/** @jsxImportSource @octane-xplat/jsx */
import {
	KeyboardAwareScrollView,
	FocusedInputController,
	KeyboardController,
} from '../../src/index'

import type { KeyboardScrollBinding } from '../../src/scroll-types'
import type { ProbeContext } from '../../../../scripts/probe/context'
import './scroll.css'
let binding: KeyboardScrollBinding | null
const capture = (next: KeyboardScrollBinding | null) => {
	binding = next
}

export default function ScrollProbe() {
	return (
		<KeyboardAwareScrollView id="scroll-form" clearance={12} extraScrollSpace={40} ref={capture}>
			<label text="Long form" className="scroll-leading" />
			<label id="scroll-validation" text="Validation" className="scroll-validation" />
			<textfield id="scroll-field" text="Long-form field" className="scroll-field" />
			<textview id="scroll-area" text={'First\nSecond\nThird'} className="scroll-area" />
			<label text="End of form" className="scroll-trailing" />
		</KeyboardAwareScrollView>
	)
}

export async function run(ctx: ProbeContext) {
	const field = await ctx.waitFor(
		() => ctx.find('scroll-field')?.isLoaded && ctx.find('scroll-field'),
	)

	const root = ctx.find('scroll-form'),
		area = ctx.find('scroll-area')

	await ctx.waitFor(() => binding)
	const values: any[] = [],
		keys: any[] = []

	const off = FocusedInputController.subscribe(root, (state) => values.push(state))
	const offKeys = KeyboardController.onMove(root, (state) => keys.push(state))
	ctx.onCleanup(off)
	ctx.onCleanup(offKeys)
	if (field.android) {
		await ctx.waitFor(() => field.android.hasWindowFocus())
	}

	field.focus()
	await ctx.waitFor(() => keys.at(-1)?.inset > 100 && values.at(-1)?.inputRect)
	const visible = () => {
		const focus = values.at(-1),
			key = keys.at(-1)

		const frame = key.currentFrame ?? key.targetFrame
		const viewport = focus.scrollOwners.find(
			(owner: any) => owner.id === (root.ios ?? root.android),
		)

		const target = focus.inputRect.height > 300 ? focus.caretRect : focus.inputRect
		return (
			!!target &&
			!!viewport &&
			target.y >= Math.max(viewport.rect.y, 0) + 10 &&
			target.y + target.height <=
				Math.min(viewport.rect.y + viewport.rect.height, frame?.y ?? 10000) - 10
		)
	}

	await ctx.waitFor(visible)
	ctx.assert('focused long-form field clears keyboard and viewport', visible(), true)
	ctx.find('scroll-validation').height = 160
	binding!.recheck()
	await ctx.waitFor(visible)
	ctx.assert('validation movement is corrected without focus transfer', visible(), true)
	area.focus()
	await ctx.waitFor(() => values.at(-1)?.input === (area.ios ?? area.android))
	area.height = 1000
	await ctx.waitFor(() => values.at(-1)?.inputRect.height > 990)
	binding!.recheck()
	await ctx.waitFor(visible)
	ctx.assert('oversized multiline caret remains exposed', visible(), true)
	ctx.assert(
		'mobile barrel selects the avoidance scroll wrapper',
		String(root.className).includes('vx-keyboard-avoiding'),
		true,
	)

	ctx.assert(
		'extra scroll space contributes native content range',
		Number(root.content.paddingBottom) >= 39,
		true,
	)

	const before = root.verticalOffset
	binding!.recheck()
	await ctx.waitFor(visible)
	ctx.assert(
		'rechecking a visible field does not add scroll',
		Math.abs(root.verticalOffset - before) < 2,
		true,
	)

	ctx.record('final focus', {
		box: values.at(-1).inputRect,
		caret: values.at(-1).caretRect,
		offset: root.verticalOffset,
		keyboard: keys.at(-1).currentFrame ?? keys.at(-1).targetFrame,
	})
}
