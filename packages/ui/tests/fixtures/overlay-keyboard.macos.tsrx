/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { Screen, BottomSheet, BottomSheetSwitcher, TextInput } from '@octane-xplat/ui'
import { AppKitSheet } from '@octane-xplat/sheet/macos'
import type { ProbeContext } from '../../../../scripts/probe/context'
let background: any,
	first: any,
	second: any,
	leaf: any,
	select = (_id: string | null) => {},
	show = (_open: boolean) => {},
	edit = (_text: string) => {}

const base = (handle: any) => {
	background = handle?.native ?? handle
}

const captureFirst = (handle: any) => {
	first = handle?.native ?? handle
}

const captureSecond = (handle: any) => {
	second = handle?.native ?? handle
}

const captureLeaf = (handle: any) => {
	leaf = handle?.native ?? handle
}

function Editor(props: { id: string; initial: string; capture: (handle: any) => void }) @{
	const [value, setValue] = useState(props.initial)
	edit = setValue

	<TextInput
		id={props.id}
		ref={props.capture}
		value={value}
		onChange={setValue}
		style={{ height: 48 }}
	/>
}

export default function DesktopSheetProbe() @{
	const [active, setActive] = useState<string | null>(null),
		[open, setOpen] = useState(false)

	select = setActive
	show = setOpen

	<Screen>
		<TextInput ref={base} defaultValue="Background" style={{ height: 48 }} />
		<BottomSheetSwitcher activeSheet={active} onActiveSheetChange={setActive}>
			<BottomSheet sheetId="first" label="First">
				<Editor id="first-editor" initial="First" capture={captureFirst} />
			</BottomSheet>
			<BottomSheet sheetId="second" label="Second">
				<Editor id="second-editor" initial="Second" capture={captureSecond} />
			</BottomSheet>
		</BottomSheetSwitcher>
		<AppKitSheet
			open={open}
			onDismissed={() => setOpen(false)}
			content={() => (
				<TextInput ref={captureLeaf} defaultValue="Native sheet" style={{ height: 48 }} />
			)}
		/>
	</Screen>
}

export async function run(ctx: ProbeContext) {
	ctx.record('phase', 'background')
	await ctx.waitFor(() => background?.window)
	const originalWindow = background.window
	originalWindow.makeFirstResponder(background)
	ctx.record('phase', 'first panel')
	select('first')
	await ctx.waitFor(() => first?.window && first.frame.size.height >= 47)
	const original = first,
		window = first.window

	window.makeFirstResponder(first)
	edit('Edited first')
	await ctx.waitFor(() => first.stringValue === 'Edited first')
	ctx.assert('AppKit editing panel has usable input', first.frame.size.height >= 47, true)
	ctx.record('phase', 'second panel')
	select('second')
	await ctx.waitFor(() => second?.window && second.stringValue === 'Second')
	ctx.assert('AppKit panel replacement has its own editing state', second.stringValue, 'Second')
	ctx.assert('AppKit replacement retires the previous input', original.window == null, true)
	ctx.assert('AppKit replacement retains its presentation window', second.window === window, true)
	const replaced = second
	select(null)
	await ctx.waitFor(() => replaced.window == null)
	ctx.assert('AppKit shared presentation detaches its panel', replaced.window == null, true)
	ctx.assert(
		'AppKit shared presentation preserves its owner window',
		background.window === originalWindow,
		true,
	)

	ctx.record('phase', 'native AppKit sheet')
	show(true)
	await ctx.waitFor(() => leaf?.window && leaf.frame.size.height >= 47)
	const native = leaf,
		nativeWindow = leaf.window

	nativeWindow.makeFirstResponder(leaf)
	ctx.assert('native AppKit sheet keeps usable input', leaf.frame.size.height >= 47, true)
	show(false)
	await ctx.waitFor(() => native.window == null)
	ctx.assert('native AppKit sheet detaches its input', native.window == null, true)
	ctx.assert(
		'native sheet belongs to the original parent window',
		nativeWindow !== originalWindow,
		true,
	)
}
