/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { FocusedInputController } from '../../src/index'
import type { ProbeContext } from '../../../../scripts/probe/context'
import './focus.css'
let validate = (_height: number) => {},
	grow = (_height: number) => {},
	removeArea = () => {}

export default function FocusProbe() @{
	const [validation, setValidation] = useState(0)
	const [height, setHeight] = useState(100)
	const [show, setShow] = useState(true)
	validate = setValidation
	grow = setHeight
	removeArea = () => setShow(false)

	<scrollview id="focus-root">
		<masonview style={{ display: 'flex', flexDirection: 'column' }}>
			<label text="Validation" style={{ height: validation }} />
			<textfield id="focus-field" className="focus-field" />
			@if (show) {
				<textview id="focus-area" style={{ height }} />
			}
			<label text="Scrollable form" className="focus-spacer" />
		</masonview>
	</scrollview>
}

export async function run(ctx: ProbeContext) {
	const field = await ctx.waitFor(() => ctx.find('focus-field'))
	const root = ctx.find('focus-root'),
		area = ctx.find('focus-area'),
		window = field.window

	const snapshots: any[] = []
	field.stringValue = 'A😀B'

	;(area.documentView ?? area).string = 'first\nsecond\nthird'
	const off = FocusedInputController.subscribe(root, (value) => snapshots.push(value))
	ctx.onCleanup(off)
	let editor: any, nativeArea: any
	try {
		ctx.assert('field can become native first responder', window.makeFirstResponder(field), true)
		editor = field.currentEditor()
		editor.selectedRange = { location: 1, length: 2 }
		await ctx.waitFor(() => snapshots.at(-1)?.selection?.end === 3)
		const first = snapshots.at(-1)
		ctx.record('initial focus geometry', {
			inputIsField: first.input === field,
			inputIsEditor: first.input === editor,
			inputRect: first.inputRect,
			caretRect: first.caretRect,
			selection: first.selection,
			fieldFrame: field.frame,
			editorBounds: editor.bounds,
			capabilities: first.capabilities,
		})

		ctx.assert(
			'AppKit editing identity matches its control or field editor',
			first.input === field || first.input === editor,
			true,
		)

		ctx.assert('native caret geometry has positive height', first.caretRect?.height > 0, true)
		ctx.assert('AppKit preserves UTF16 selection offsets', first.selection.end, 3)
		ctx.assert(
			'AppKit reports native caret precision',
			first.capabilities.caretBounds,
			'native-rect',
		)

		ctx.assert(
			'scroll ownership includes the actual native viewport',
			first.scrollOwners.some((owner: any) => owner.id === root),
			true,
		)

		ctx.assert(
			'caret uses top-left window coordinates',
			first.caretRect.y >= first.inputRect.y &&
				first.caretRect.y < first.inputRect.y + first.inputRect.height,
			true,
		)

		const before = first.inputRect.y
		validate(40)
		await ctx.waitFor(() => Math.abs(snapshots.at(-1).inputRect.y - before - 40) < 1)
		ctx.assert(
			'validation moves input down in window coordinates',
			Math.abs(snapshots.at(-1).inputRect.y - before - 40) < 1,
			true,
		)

		nativeArea = area.documentView ?? area
		ctx.assert(
			'multiline editor can become first responder',
			window.makeFirstResponder(nativeArea),
			true,
		)

		nativeArea.selectedRange = { location: 0, length: 4 }
		await ctx.waitFor(
			() => snapshots.at(-1).input === nativeArea || snapshots.at(-1).input === area,
		)

		grow(180)
		await ctx.waitFor(() => Math.abs(snapshots.at(-1).inputRect.height - 180) < 1)
		FocusedInputController.recheck(root)
		ctx.assert(
			'AppKit measures multiline growth',
			Math.abs(snapshots.at(-1).inputRect.height - 180) < 1,
			true,
		)

		removeArea()
		await ctx.waitFor(
			() => snapshots.at(-1).input !== nativeArea && snapshots.at(-1).input !== area,
		)

		ctx.assert(
			'removed native editor identity is invalidated',
			snapshots.at(-1).input !== nativeArea,
			true,
		)

		off()
		ctx.assert(
			'final reader releases cached focus',
			FocusedInputController.getSnapshot(root).capabilities.inputBounds,
			false,
		)
	} finally {
		ctx.record(
			'geometry samples',
			snapshots.map((s) => ({
				input:
					s.input === field
						? 'field'
						: s.input === editor
							? 'field-editor'
							: s.input === nativeArea
								? 'area'
								: 'none',
				box: s.inputRect,
				caret: s.caretRect,
				selection: s.selection,
				owners: s.scrollOwners.length,
				capabilities: s.capabilities,
			})),
		)
	}
}
