/** @jsxImportSource @octane-xplat/jsx/dom */
import { useState } from 'octane'
import { KeyboardStickyView, KeyboardController } from '../../src/index'
import type { ProbeContext } from '../../../../scripts/probe/context'
let change = () => {}
export default function StickyNeutral() @{
	const [offset, setOffset] = useState(8),
		[enabled, setEnabled] = useState(true)

	change = () => {
		setOffset(40)
		setEnabled(false)
	}

	<KeyboardStickyView id="neutral-sticky" enabled={enabled} openOffset={offset} closedOffset={2}>
		<input id="neutral-field" defaultValue="Message" />
	</KeyboardStickyView>
}

export async function run(ctx: ProbeContext) {
	const host: any = await ctx.waitFor(() => ctx.find('neutral-sticky'))
	const field: any = ctx.find('neutral-field')
	const before = host.getBoundingClientRect().y
	field.focus()
	change()
	await ctx.waitFor(() => field === ctx.find('neutral-field'))
	await new Promise((resolve) => requestAnimationFrame(resolve))
	ctx.assert(
		'neutral sticky offsets leave browser layout unchanged',
		host.getBoundingClientRect().y,
		before,
	)

	ctx.assert(
		'disabled neutral sticky retains editing content',
		document.activeElement === field,
		true,
	)

	ctx.assert(
		'neutral sticky reports no native frame capability',
		KeyboardController.getSnapshot(host).capabilities.nativeFrames,
		false,
	)
}
