/** @jsxImportSource @octane-xplat/jsx/dom */
import { KeyboardAwareScrollView, FocusedInputController } from '../../src/index'
import type { KeyboardScrollBinding } from '../../src/scroll-types'
import type { ProbeContext } from '../../../../scripts/probe/context'
import './scroll.css'
let binding: KeyboardScrollBinding | null
const capture = (next: KeyboardScrollBinding | null) => {
	binding = next
}

export default function ScrollProbe() {
	return (
		<KeyboardAwareScrollView
			id="scroll-form"
			className="scroll-browser-form"
			clearance={12}
			ref={capture}
		>
			<div className="scroll-leading" />
			<div id="scroll-validation" />
			<input id="scroll-field" defaultValue="Long form" />
			<div className="scroll-trailing" />
		</KeyboardAwareScrollView>
	)
}

export async function run(ctx: ProbeContext) {
	const field: any = await ctx.waitFor(() => ctx.find('scroll-field'))
	const root: any = ctx.find('scroll-form')
	await ctx.waitFor(() => binding)
	const samples: any[] = []
	const off = FocusedInputController.subscribe(root, (state) => samples.push(state))
	ctx.onCleanup(off)
	field.focus()
	const visible = () => {
		const box = field.getBoundingClientRect(),
			viewport = root.getBoundingClientRect()

		return box.y >= viewport.y + 10 && box.bottom <= viewport.bottom - 10
	}

	await ctx.waitFor(visible)
	ctx.assert('browser field fits viewport with clearance', visible(), true)
	ctx.find('scroll-validation').style.height = '120px'
	binding!.recheck()
	await ctx.waitFor(visible)
	ctx.assert('validation recheck exposes the same field', visible(), true)
	const previous = root.scrollTop
	binding!.recheck()
	ctx.assert(
		'visible-field recheck preserves position',
		Math.abs(root.scrollTop - previous) < 1,
		true,
	)

	root.dispatchEvent(new WheelEvent('wheel', { deltaY: -100 }))
	root.scrollTop = 0
	await ctx.waitFor(() => samples.at(-1)?.inputRect.y > 500)
	const paused = root.scrollTop
	await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
	ctx.assert('manual-scroll signal pauses enforcement', root.scrollTop, paused)
	binding!.recheck()
	await ctx.waitFor(visible)
	ctx.assert('explicit recheck resumes visibility', visible(), true)
	ctx.record('offset', root.scrollTop)
}
