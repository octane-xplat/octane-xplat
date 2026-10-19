/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { KeyboardAwareScrollView, FocusedInputController } from '../../src/index'
import type { KeyboardScrollBinding } from '../../src/scroll-types'
import type { ProbeContext } from '../../../../scripts/probe/context'
import './scroll.css'
let binding: KeyboardScrollBinding | null
let validate = () => {}
let prepare = (_height: number) => {}
const capture = (next: KeyboardScrollBinding | null) => {
	binding = next
}

export default function ScrollProbe() @{
	const [validation, setValidation] = useState(0)
	const [leading, setLeading] = useState(0)
	const [trailing, setTrailing] = useState(0)
	prepare = (height) => {
		setLeading(height + 500)
		setTrailing(200)
	}

	validate = () => setValidation(160)

	<KeyboardAwareScrollView id="scroll-form" clearance={12} ref={capture}>
		<label text="Long form" style={{ height: leading }} />
		<label id="scroll-validation" text="Validation" style={{ height: validation }} />
		<textfield id="scroll-field" />
		<label text="End of form" style={{ height: trailing }} />
	</KeyboardAwareScrollView>
}

export async function run(ctx: ProbeContext) {
	const field: any = await ctx.waitFor(() => ctx.find('scroll-field'))
	const root: any = ctx.find('scroll-form')
	field.stringValue = 'Long form'
	ctx.record('initial viewport', { height: root.contentView.bounds.size.height })
	prepare(root.contentView.bounds.size.height)
	await ctx.waitFor(() => binding && field.window)
	const samples: any[] = []
	const off = FocusedInputController.subscribe(root, (state) => samples.push(state))
	ctx.onCleanup(off)
	field.window.makeFirstResponder(field)
	const visible = () => {
		const focus = samples.at(-1),
			owner = focus?.scrollOwners.find((owner: any) => owner.id === root)

		const box = focus?.inputRect
		return (
			!!owner &&
			!!box &&
			box.y >= owner.rect.y + 10 &&
			box.y + box.height <= owner.rect.y + owner.rect.height - 10
		)
	}

	await ctx.waitFor(visible)
	ctx.assert('AppKit field fits viewport with clearance', visible(), true)
	const first = samples.at(-1).scrollOwners.find((owner: any) => owner.id === root).offsetY
	validate()
	await ctx.waitFor(
		() => samples.at(-1).scrollOwners.find((owner: any) => owner.id === root).offsetY > first + 150,
	)

	await ctx.waitFor(visible)
	ctx.assert('AppKit validation movement updates visibility', visible(), true)
	const previous = samples.at(-1).scrollOwners.find((owner: any) => owner.id === root).offsetY
	binding!.recheck()
	ctx.assert(
		'AppKit visible recheck preserves offset',
		Math.abs(
			samples.at(-1).scrollOwners.find((owner: any) => owner.id === root).offsetY - previous,
		) < 1,
		true,
	)
}
