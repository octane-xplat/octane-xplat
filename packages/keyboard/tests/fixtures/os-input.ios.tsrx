/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import './os-input.css'
import { Screen, BottomSheet } from '@octane-xplat/ui'
import {
	KeyboardAwareScrollView,
	KeyboardStickyView,
	KeyboardController,
	FocusedInputController,
} from '../../src/index'

import { measureKeyboardHost } from '../../../ui/src/keyboard-host-bounds'
import type { ProbeContext } from '../../../../scripts/probe/context'
let show = (_open: boolean) => {}
export default function OsInputJourney() @{
	const [open, setOpen] = useState(false)
	show = setOpen

	<Screen>
		<masonview id="os-input-root" style={{ display: 'grid', gridTemplateRows: '1fr auto' }}>
			<KeyboardAwareScrollView id="os-input-scroll" clearance={12} extraScrollSpace={32}>
				<masonview style={{ display: 'flex', flexDirection: 'column' }}>
					<label text="Keyboard input qualification" className="os-input-leading" />
					<textfield id="os-form-field" hint="Type form verification" className="os-input-field" />
					<label text="Form history" className="os-input-history" />
				</masonview>
			</KeyboardAwareScrollView>
			<KeyboardStickyView id="os-sticky" className="os-input-field" style={{ gridRowStart: 2 }}>
				<label text="Sticky action" />
			</KeyboardStickyView>
		</masonview>
		<BottomSheet isOpen={open} onOpenChange={setOpen} label="Input qualification" height="hug">
			<textfield id="os-sheet-field" hint="Type sheet verification" className="os-input-field" />
		</BottomSheet>
	</Screen>
}

const identify = (field: any, id: string) => {
	if (field.ios) {
		field.ios.accessibilityIdentifier = id
		field.ios.accessibilityLabel = id
	} else {
		field.android.setContentDescription(id)
	}
}

export async function run(ctx: ProbeContext) {
	const field: any = await ctx.waitFor(
		() => ctx.find('os-form-field')?.isLoaded && ctx.find('os-form-field'),
	)

	const scroll: any = ctx.find('os-input-scroll'),
		sticky: any = ctx.find('os-sticky')

	const keys: any[] = [],
		focus: any[] = []

	ctx.onCleanup(KeyboardController.onMove(scroll, (s) => keys.push(s)))
	ctx.onCleanup(FocusedInputController.subscribe(scroll, (s) => focus.push(s)))
	identify(field, 'keyboard-os-form-ready')
	await ctx.waitFor(() => field.text === 'FormVerified', { timeout: 90000 })
	await ctx.waitFor(() => keys.at(-1)?.inset > 100 && focus.at(-1)?.inputRect)
	const frame = () => keys.at(-1).currentFrame ?? keys.at(-1).targetFrame
	await ctx.waitFor(
		() => focus.at(-1).inputRect.y + focus.at(-1).inputRect.height <= frame().y - 10,
	)

	ctx.assert('OS touch and typing reach the form field', field.text, 'FormVerified')
	await ctx.waitFor(() => focus.at(-1)?.selection?.end === 12)
	ctx.assert('OS typing updates the observed UTF16 selection', focus.at(-1).selection.end, 12)
	ctx.assert(
		'typed form field remains above the keyboard',
		focus.at(-1).inputRect.y + focus.at(-1).inputRect.height <= frame().y - 10,
		true,
	)

	await ctx.waitFor(() => {
		const box = measureKeyboardHost(sticky)
		return box && Math.abs(box.y + box.height - frame().y) < 3
	})

	ctx.assert(
		'sticky control meets the open keyboard',
		Math.abs(measureKeyboardHost(sticky)!.y + measureKeyboardHost(sticky)!.height - frame().y) < 3,
		true,
	)

	show(true)
	const sheet: any = await ctx.waitFor(
		() => ctx.find('os-sheet-field')?.isLoaded && ctx.find('os-sheet-field'),
	)

	identify(sheet, 'keyboard-os-sheet-ready')
	await ctx.waitFor(() => sheet.text === 'SheetVerified', { timeout: 90000 })
	ctx.assert('OS touch and typing reach the presented input', sheet.text, 'SheetVerified')
	show(false)
	await ctx.waitFor(() => !sheet.isLoaded)
	await ctx.waitFor(() => (field.ios ? field.ios.isFirstResponder : field.android.hasFocus()))
	ctx.assert(
		'dismissal returns editing focus to the form',
		field.ios ? !!field.ios.isFirstResponder : field.android.hasFocus(),
		true,
	)
}
