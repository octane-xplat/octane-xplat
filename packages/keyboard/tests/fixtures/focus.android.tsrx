/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { Page, StackLayout, TextField } from '@nativescript/core'
import { FocusedInputController } from '../../src/index'
import type { ProbeContext } from '../../../../scripts/probe/context'
import './focus.css'
let removeArea = () => {}
export default function FocusProbe() @{
	const [showArea, setShowArea] = useState(true)
	removeArea = () => setShowArea(false)

	<scrollview id="focus-root">
		<stacklayout>
			<label id="focus-validation" text="Validation" className="focus-validation" />
			<textfield id="focus-field" text="A😀B" className="focus-field" />
			@if (showArea) {
				<textview id="focus-area" text={'first\nsecond\nthird'} className="focus-area" />
			}
			<label text="Scrollable form" className="focus-spacer" />
		</stacklayout>
	</scrollview>
}

export async function run(ctx: ProbeContext) {
	const field = await ctx.waitFor(
		() => ctx.find('focus-field')?.isLoaded && ctx.find('focus-field'),
	)

	const root = ctx.find('focus-root'),
		area = ctx.find('focus-area')

	const nativeField = field.ios ?? field.android,
		nativeArea = area.ios ?? area.android

	const snapshots: any[] = []
	const off = FocusedInputController.subscribe(root, (value) => snapshots.push(value))
	ctx.onCleanup(off)
	if (field.android) {
		await ctx.waitFor(() => field.android.hasWindowFocus())
	}

	field.focus()
	await ctx.waitFor(() => snapshots.at(-1)?.input === nativeField)
	if (field.ios) {
		const begin = nativeField.beginningOfDocument
		nativeField.selectedTextRange = nativeField.textRangeFromPositionToPosition(
			nativeField.positionFromPositionOffset(begin, 1),
			nativeField.positionFromPositionOffset(begin, 3),
		)
	} else {
		nativeField.setSelection(1, 3)
	}

	await ctx.waitFor(() => snapshots.at(-1)?.selection?.end === 3)
	const first = snapshots.at(-1)
	ctx.assert('native focus identity is the actual editing view', first.input === nativeField, true)
	ctx.assert('selection offsets preserve UTF16 positions', first.selection.end, 3)
	ctx.assert('native caret geometry has positive height', first.caretRect?.height > 0, true)
	ctx.assert(
		'input belongs to the actual scroll host',
		first.scrollOwners.some((owner: any) => owner.id === (root.ios ?? root.android)),
		true,
	)

	if (field.ios) {
		const actual = nativeField.convertRectToView(nativeField.bounds, nativeField.window)
		ctx.assert(
			'input rectangle uses window coordinates',
			Math.abs(first.inputRect.y - actual.origin.y) < 1,
			true,
		)

		ctx.assert(
			'UIKit reports native caret precision',
			first.capabilities.caretBounds,
			'native-rect',
		)
	} else {
		const origin = (Array as any).create('int', 2),
			point = (Array as any).create('int', 2)

		nativeField.getRootView().getLocationOnScreen(origin)
		nativeField.getLocationOnScreen(point)
		const density = nativeField.getResources().getDisplayMetrics().density
		ctx.assert(
			'input rectangle uses decor coordinates',
			Math.abs(first.inputRect.y - (point[1] - origin[1]) / density) < 1,
			true,
		)

		ctx.assert(
			'Android reports insertion-line precision',
			first.capabilities.caretBounds,
			'insertion-line',
		)
	}

	const before = first.inputRect.y
	ctx.find('focus-validation').height = 40
	await ctx.waitFor(() => Math.abs(snapshots.at(-1).inputRect.y - before - 40) < 1)
	ctx.assert(
		'validation-only layout changes update geometry',
		Math.abs(snapshots.at(-1).inputRect.y - before - 40) < 1,
		true,
	)

	area.focus()
	await ctx.waitFor(() => snapshots.at(-1).input === nativeArea)
	area.height = 180
	await ctx.waitFor(() => Math.abs(snapshots.at(-1).inputRect.height - 180) < 1)
	FocusedInputController.recheck(root)
	ctx.assert(
		'multiline growth is measured while focused',
		Math.abs(snapshots.at(-1).inputRect.height - 180) < 1,
		true,
	)

	removeArea()
	await ctx.waitFor(() => snapshots.at(-1).input !== nativeArea)
	ctx.assert(
		'detachment invalidates the old input identity',
		snapshots.at(-1).input !== nativeArea,
		true,
	)

	off()
	ctx.assert(
		'final reader releases cached focus',
		FocusedInputController.getSnapshot(root).capabilities.inputBounds,
		false,
	)

	const modal = new Page(),
		layout = new StackLayout(),
		modalField = new TextField()

	modalField.text = 'Modal field'
	layout.addChild(modalField)
	modal.content = layout
	root.page.showModal(modal, { fullscreen: false, context: {}, closeCallback() {} })
	ctx.onCleanup(() => {
		if (modal.isLoaded) {
			modal.closeModal()
		}
	})

	await ctx.waitFor(() => modalField.isLoaded)
	if (modalField.android) {
		await ctx.waitFor(() => modalField.android.hasWindowFocus())
	}

	modalField.focus()
	const modalNative = modalField.ios ?? modalField.android
	await ctx.waitFor(() => (modalField.ios ? modalNative.isFirstResponder : modalNative.hasFocus()))
	const modalSamples: any[] = []
	const offModal = FocusedInputController.subscribe(modalField, (state) => modalSamples.push(state))
	ctx.onCleanup(offModal)
	await ctx.waitFor(() => modalSamples.at(-1)?.input === modalNative)
	ctx.assert(
		'cold modal subscription discovers already-focused input',
		modalSamples.at(-1).input === modalNative,
		true,
	)

	ctx.assert(
		'modal field has window-relative input bounds',
		modalSamples.at(-1).inputRect.height > 0,
		true,
	)

	modal.closeModal()
	await ctx.waitFor(() => !modalField.isLoaded)
	await ctx.waitFor(() => modalSamples.at(-1)?.input !== modalNative)
	ctx.assert(
		'dismissed modal releases focused identity',
		modalSamples.at(-1).input !== modalNative,
		true,
	)

	offModal()
	ctx.record(
		'geometry samples',
		snapshots.map((s) => ({
			input: s.input === nativeField ? 'field' : s.input === nativeArea ? 'area' : 'none',
			box: s.inputRect,
			caret: s.caretRect,
			selection: s.selection,
			owners: s.scrollOwners.length,
			capabilities: s.capabilities,
		})),
	)
}
