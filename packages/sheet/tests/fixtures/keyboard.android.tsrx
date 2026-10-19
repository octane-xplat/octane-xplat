/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { View, TextInput } from '@octane-xplat/ui'
import { MaterialBottomSheet } from '@octane-xplat/sheet/android'
import { KeyboardController } from '../../../keyboard/src/index'
import type { ProbeContext } from '../../../../scripts/probe/context'
let background: any,
	field: any,
	show = (_open: boolean) => {},
	expand = () => {}

const captureBackground = (next: any) => {
	background = next?.native ?? next
}

const captureField = (next: any) => {
	field = next?.native ?? next
}

export default function NativeSheetProbe() @{
	const [open, setOpen] = useState(false),
		[full, setFull] = useState(false)

	show = (value) => {
		setOpen(value)
		if (!value) {
			background?.focus()
		}
	}

	expand = () => setFull(true)

	<View>
		<TextInput ref={captureBackground} defaultValue="Background" style={{ height: 48 }} />
		<MaterialBottomSheet
			open={open}
			onDismissed={() => show(false)}
			skipPartiallyExpanded={full}
			content={() => (
				<View style={{ height: 240 }}>
					<TextInput ref={captureField} defaultValue="Native sheet" style={{ height: 48 }} />
				</View>
			)}
		/>
	</View>
}

export async function run(ctx: ProbeContext) {
	ctx.record('phase', 'background host')
	await ctx.waitFor(() => background?.isLoaded && background.android?.hasWindowFocus())
	const keys: any[] = []
	const off = KeyboardController.onMove(background, (s) => {
		keys.push(s)
		ctx.record('background keyboard', s)
	})

	ctx.onCleanup(off)
	background.focus()
	await ctx.waitFor(() => {
		const s = keys.at(-1)
		return (
			s?.inset > 100 &&
			s.currentFrame &&
			s.targetFrame &&
			Math.abs(s.currentFrame.y - s.targetFrame.y) < 1
		)
	})

	ctx.record('phase', 'present material sheet')
	show(true)
	await ctx.waitFor(
		() =>
			field?.android?.isAttachedToWindow() &&
			field.android.hasWindowFocus() &&
			field.getActualSize().height >= 47,
	)

	ctx.assert('Material presented input has usable bounds', field.getActualSize().height >= 47, true)
	const sheetKeys: any[] = []
	const stop = KeyboardController.onMove(field, (s) => {
		sheetKeys.push(s)
		ctx.record('sheet keyboard', s)
	})

	ctx.onCleanup(stop)
	const visible = () => {
		const s = sheetKeys.at(-1)
		if (!field?.android?.isAttachedToWindow()) {
			return false
		}

		const xy = (Array as any).create('int', 2),
			origin = (Array as any).create('int', 2)

		field.android.getLocationOnScreen(xy)
		field.android.getRootView().getLocationOnScreen(origin)
		const density = field.android.getResources().getDisplayMetrics().density,
			y = (xy[1] - origin[1]) / density,
			height = field.android.getHeight() / density

		ctx.record('input bounds', { y, height })
		return (
			s?.inset > 100 &&
			height >= 47 &&
			y >= 0 &&
			y + height <= (s.currentFrame ?? s.targetFrame).y + 1
		)
	}

	field.focus()
	await ctx.waitFor(() => field.android.hasFocus() && visible())
	ctx.assert('Material dialog owns keyboard clearance', !!visible(), true)
	const firstStamp = sheetKeys.at(-1).timestampMs,
		firstWindow = field.android.getRootView(),
		presented = field

	show(false)
	await ctx.waitFor(
		() =>
			!presented.android.isAttachedToWindow() &&
			background.android.hasFocus() &&
			background.android.hasWindowFocus(),
	)

	ctx.assert(
		'app close action returns editing focus after native dismissal',
		background.android.hasFocus(),
		true,
	)

	await ctx.waitFor(() => !presented.isLoaded && sheetKeys.at(-1)?.windowRect === null)
	ctx.assert(
		'closed native host unloads and releases its window geometry',
		!presented.isLoaded && sheetKeys.at(-1)?.windowRect === null,
		true,
	)

	ctx.record('closed host', { loaded: presented.isLoaded, state: sheetKeys.at(-1) })
	expand()
	show(true)
	await ctx.waitFor(() => field.android.isAttachedToWindow() && field.android.hasWindowFocus())
	field.focus()
	await ctx.waitFor(() => field.android.hasFocus() && visible())
	ctx.assert('fully-expanded presentation rebinds geometry and editing focus', !!visible(), true)
	ctx.assert(
		'reopened dialog publishes fresh window measurements',
		sheetKeys.at(-1).timestampMs > firstStamp,
		true,
	)

	ctx.record('dialog window replaced', { changed: field.android.getRootView() !== firstWindow })
	show(false)
	await ctx.waitFor(() => !field.android.isAttachedToWindow())
	ctx.assert(
		'repeated native dismissal detaches hosted input',
		!field.android.isAttachedToWindow(),
		true,
	)

	background.dismissSoftInput()
}
