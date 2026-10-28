/** @jsxImportSource @octane-xplat/jsx/dom */
import { useState } from 'octane'
import { BottomSheet, BottomSheetSwitcher, TextInput } from '@octane-xplat/ui'
import type { ProbeContext } from '../../../../scripts/probe/context'
let select = (_value: string | null) => {},
	activeValue: string | null = null

function Editor(props: { id: string; initial: string }) @{
	const [value, setValue] = useState(props.initial)

	<TextInput id={props.id} value={value} onChange={setValue} />
}

export default function OverlayWeb() @{
	const [active, setActive] = useState<string | null>(null)
	select = setActive
	activeValue = active

	<div>
		<button id="open-panel" onClick={() => setActive('first')}>
			Open editor
		</button>
		<BottomSheetSwitcher activeSheet={active} onActiveSheetChange={setActive}>
			<BottomSheet sheetId="first" label="First editor">
				<Editor id="web-first" initial="First" />
			</BottomSheet>
			<BottomSheet sheetId="second" label="Second editor">
				<Editor id="web-second" initial="Second" />
			</BottomSheet>
		</BottomSheetSwitcher>
	</div>
}

export async function run(ctx: ProbeContext) {
	const opener: any = await ctx.waitFor(() => ctx.find('open-panel'))
	opener.focus()
	opener.click()
	ctx.record('phase', 'first field')
	const input = (id: string): HTMLInputElement | null => {
		const host: any = document.getElementById(id)
		return host?.matches('input') ? host : host?.querySelector('input')
	}

	const first: any = await ctx.waitFor(() => input('web-first'))
	ctx.record('phase', 'first focus')
	await ctx.waitFor(() => document.activeElement === first)
	const host =
		first.closest('.vx-bottom-sheet-layer') ?? first.closest('[role="dialog"]')?.parentElement

	first.value = 'Edited first'
	first.dispatchEvent(new Event('input', { bubbles: true }))
	await ctx.waitFor(() => first.value === 'Edited first')
	select('second')
	ctx.record('phase', 'second field')
	const second: any = await ctx.waitFor(() => input('web-second'))
	await ctx.waitFor(() => !first.isConnected)
	ctx.assert('web panel swap retires previous editing element', !first.isConnected, true)
	ctx.assert('web panel editing state belongs to its sheet id', second.value, 'Second')
	ctx.assert(
		'web swap retains its presentation host',
		second.closest('.vx-bottom-sheet-layer') === host ||
			second.closest('[role="dialog"]')?.parentElement === host,
		true,
	)

	second.focus()
	select(null)
	await ctx.waitFor(() => !second.isConnected && document.activeElement === opener)
	ctx.assert(
		'shared web presentation returns focus to opener',
		document.activeElement === opener,
		true,
	)

	select('first')
	ctx.record('phase', 'reopen')
	const reopened: any = await ctx.waitFor(() => input('web-first'))
	ctx.assert('reopened panel starts a fresh local editing lifetime', reopened.value, 'First')
	select(null)
	await ctx.waitFor(() => !reopened.isConnected)
	ctx.assert(
		'closing removes all modal isolation',
		!document.querySelector('[aria-modal="true"]'),
		true,
	)
}
