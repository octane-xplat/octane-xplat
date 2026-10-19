/** @jsxImportSource @octane-xplat/jsx/dom */
import { FocusedInputController } from '../../src/index'
import './focus.css'
import type { ProbeContext } from '../../../../scripts/probe/context'

export default function FocusProbe() {
	return (
		<div id="focus-root" className="focus-web-root">
			<div id="focus-validation" />
			<input id="focus-field" defaultValue="A😀B" />
			<textarea id="focus-area" defaultValue={'first\nsecond\nthird'} />
			<button id="focus-done">Done</button>
			<div className="focus-web-spacer" />
		</div>
	)
}

export async function run(ctx: ProbeContext) {
	const root: any = await ctx.waitFor(() => ctx.find('focus-root'))
	const field: any = ctx.find('focus-field'),
		area: any = ctx.find('focus-area')

	const snapshots: any[] = []
	const off = FocusedInputController.subscribe(root, (state) => snapshots.push(state))
	ctx.onCleanup(off)
	field.focus()
	field.setSelectionRange(1, 3)
	await ctx.waitFor(
		() => snapshots.at(-1)?.input === field && snapshots.at(-1).selection?.end === 3,
	)

	const first = snapshots.at(-1),
		y = first.inputRect.y

	ctx.assert('browser focus identity is the actual input', first.input === field, true)
	ctx.assert(
		'browser input rectangle matches client geometry',
		first.inputRect.y,
		field.getBoundingClientRect().y,
	)

	ctx.assert('native browser offsets retain UTF16 selection', first.selection.end, 3)
	ctx.assert(
		'ordinary browser input has explicit box-only caret capability',
		first.capabilities.caretBounds,
		'none',
	)

	ctx.assert(
		'browser scroll ownership includes the containing viewport',
		first.scrollOwners.some((owner: any) => owner.id === root),
		true,
	)

	const validation: any = ctx.find('focus-validation')
	validation.style.height = '50px'
	await ctx.waitFor(() => snapshots.at(-1).inputRect.y === y + 50)
	ctx.assert(
		'layout-only validation movement updates focus geometry',
		snapshots.at(-1).inputRect.y,
		y + 50,
	)

	area.focus()
	area.setSelectionRange(0, 4)
	await ctx.waitFor(() => snapshots.at(-1).input === area && snapshots.at(-1).selection?.end === 4)
	area.style.height = '150px'
	FocusedInputController.recheck(root)
	ctx.assert(
		'explicit recheck measures textarea growth',
		snapshots.at(-1).inputRect.height,
		area.getBoundingClientRect().height,
	)

	const done: any = ctx.find('focus-done')
	done.focus()
	await ctx.waitFor(() => snapshots.at(-1).input === null)
	ctx.assert('non-editing focus clears input identity', snapshots.at(-1).input, null)
	off()
	ctx.assert(
		'last reader releases cached focus',
		FocusedInputController.getSnapshot(root).capabilities.inputBounds,
		false,
	)

	ctx.record(
		'geometry samples',
		snapshots.map((s) => ({
			input: s.input === field ? 'field' : s.input === area ? 'area' : 'none',
			box: s.inputRect,
			selection: s.selection,
			caret: s.caretRect,
			owners: s.scrollOwners.length,
			capabilities: s.capabilities,
		})),
	)
}
