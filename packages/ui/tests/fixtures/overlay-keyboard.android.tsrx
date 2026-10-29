/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { Screen, BottomSheet, BottomSheetSwitcher, Dialog, TextInput, View } from '@octane-xplat/ui'
import { KeyboardController } from '../../../keyboard/src/index'
import { measureKeyboardHost } from '../../src/internal/keyboard/keyboard-host-bounds'
import type { ProbeContext } from '../../../../scripts/probe/context'
let show = (_value: boolean) => {},
	showDialog = (_value: boolean) => {},
	select = (_value: string | null) => {}

export default function OverlayProbe() @{
	const [open, setOpen] = useState(false),
		[dialog, setDialog] = useState(false),
		[active, setActive] = useState<string | null>(null)

	show = setOpen
	showDialog = setDialog
	select = setActive

	<Screen id="overlay-screen">
		<TextInput id="background-field" defaultValue="Background" />
		<BottomSheet
			isOpen={open}
			onOpenChange={show}
			label="Keyboard sheet"
			snapPoints={['50%', '80%']}
		>
			<View style={{ height: 160 }} justifyContent="flex-end">
				<TextInput id="sheet-field" defaultValue="Sheet" style={{ height: 48 }} />
			</View>
		</BottomSheet>
		<Dialog
			isOpen={dialog}
			onOpenChange={showDialog}
			position={{ bottom: 0 }}
			accessibilityLabel="Keyboard dialog"
		>
			<TextInput id="dialog-field" defaultValue="Dialog" style={{ height: 48 }} />
		</Dialog>
		<BottomSheetSwitcher activeSheet={active} onActiveSheetChange={select}>
			<BottomSheet sheetId="first" label="First" snapPoints={[0.5, 0.8]}>
				<View style={{ height: 160 }}>
					<TextInput id="switch-first" defaultValue="First" style={{ height: 48 }} />
				</View>
			</BottomSheet>
			<BottomSheet sheetId="second" label="Second" snapPoints={[0.4, 0.9]}>
				<View style={{ height: 160 }}>
					<TextInput id="switch-second" defaultValue="Second" style={{ height: 48 }} />
				</View>
			</BottomSheet>
		</BottomSheetSwitcher>
	</Screen>
}

export async function run(ctx: ProbeContext) {
	const background: any = await ctx.waitFor(
		() => ctx.find('background-field')?.isLoaded && ctx.find('background-field'),
	)

	const root: any = ctx.find('overlay-screen'),
		baseline = root.getChildrenCount()

	ctx.record('initial root children', baseline)
	const samples: any[] = []
	const off = KeyboardController.onMove(background, (s) => {
		samples.push(s)
		ctx.record('keyboard', s)
	})

	ctx.onCleanup(off)
	if (background.android) {
		await ctx.waitFor(() => background.android.hasWindowFocus())
	}

	background.focus()
	await ctx.waitFor(() => {
		const state = samples.at(-1)
		return (
			state?.inset > 100 &&
			state?.capabilities.nativeFrames &&
			state.currentFrame &&
			state.targetFrame &&
			Math.abs(state.currentFrame.y - state.targetFrame.y) < 1
		)
	})

	show(true)
	const field: any = await ctx.waitFor(
		() => ctx.find('sheet-field')?.isLoaded && ctx.find('sheet-field'),
	)

	let host = field.parent
	while (host && !String(host.className).includes('vx-sheet-host')) {
		host = host.parent
	}

	ctx.record('host', {
		height: host?.getActualSize?.().height,
		heightProp: host?.height,
		parentHeight: host?.parent?.getActualSize?.().height,
		rootHeight: ctx.find('overlay-screen')?.getActualSize?.().height,
		translateY: host?.translateY,
	})

	await ctx.waitFor(
		() =>
			host.isLayoutValid &&
			Math.abs(host.translateY - 0.3 * host.parent.getActualSize().height) < 1,
	)

	await ctx.waitFor(() => measureKeyboardHost(field)?.height! >= 47)
	const frame = samples.at(-1).currentFrame ?? samples.at(-1).targetFrame
	ctx.record('geometry', {
		field: measureKeyboardHost(field),
		host: measureKeyboardHost(host),
		translateY: host.translateY,
		keyboardTop: frame.y,
	})

	ctx.assert('sheet field retains a usable height', measureKeyboardHost(field)!.height >= 47, true)
	ctx.assert(
		'already-open keyboard does not cover sheet input after detent entrance',
		measureKeyboardHost(field)!.y + measureKeyboardHost(field)!.height <= frame.y + 1,
		true,
	)

	field.focus()
	await ctx.waitFor(() => field.ios?.isFirstResponder || field.android?.hasFocus())
	ctx.assert(
		'focus transfers into sheet',
		!!(field.ios?.isFirstResponder || field.android?.hasFocus()),
		true,
	)

	show(false)
	await ctx.waitFor(() => !ctx.find('sheet-field')?.isLoaded)
	ctx.assert('closing sheet releases presented input', !field.isLoaded, true)
	await ctx.waitFor(() => background.ios?.isFirstResponder || background.android?.hasFocus())
	ctx.assert(
		'dismissal restores the original input focus',
		!!(background.ios?.isFirstResponder || background.android?.hasFocus()),
		true,
	)

	const visible = (input: any) => {
		const box = measureKeyboardHost(input),
			state = samples.at(-1),
			frame = state.currentFrame ?? state.targetFrame

		return !!box && box.height >= 47 && box.y >= 0 && box.y + box.height <= frame.y + 1
	}

	const focused = (input: any) => !!(input.ios?.isFirstResponder || input.android?.hasFocus())
	const panelOf = (input: any, name: string) => {
		let panel = input.parent
		while (panel && !String(panel.className).includes(name)) {
			panel = panel.parent
		}

		return panel
	}

	ctx.record('phase', 'dialog')
	showDialog(true)
	const dialog: any = await ctx.waitFor(
		() => ctx.find('dialog-field')?.isLoaded && ctx.find('dialog-field'),
	)

	await ctx.waitFor(() => visible(dialog))
	ctx.assert(
		'bottom dialog clears an already-open keyboard with usable input',
		visible(dialog),
		true,
	)

	const dialogKeyboard = panelOf(dialog, 'vx-dialog-overlay').parent
	dialog.focus()
	await ctx.waitFor(() => focused(dialog))
	showDialog(false)
	await ctx.waitFor(() => !dialog.isLoaded && focused(background))
	ctx.assert('dialog dismissal restores window-owned input focus', focused(background), true)
	ctx.record('phase', 'switcher first')
	select('first')
	const first: any = await ctx.waitFor(
		() => ctx.find('switch-first')?.isLoaded && ctx.find('switch-first'),
	)

	const shared = panelOf(first, 'vx-sheet-host'),
		keyboardHost = shared.parent

	await ctx.waitFor(() => visible(first))
	first.focus()
	await ctx.waitFor(() => focused(first))
	ctx.assert('switcher first panel clears keyboard', visible(first), true)
	ctx.record('phase', 'switcher second')
	select('second')
	const sample = setInterval(() => {
		const next = ctx.find('switch-second')
		ctx.record('swap state', {
			firstLoaded: first.isLoaded,
			firstId: first.id,
			secondLoaded: next?.isLoaded,
			sameView: next === first,
			secondBox: next ? measureKeyboardHost(next) : null,
			focused: next ? focused(next) : false,
			panelTranslate: shared.translateY,
			keyboardTranslate: keyboardHost.translateY,
		})
	}, 50)

	ctx.onCleanup(() => clearInterval(sample))
	const second: any = await ctx.waitFor(
		() => ctx.find('switch-second')?.isLoaded && ctx.find('switch-second'),
	)

	await ctx.waitFor(() => !first.isLoaded)
	second.focus()
	await ctx.waitFor(() => focused(second) && visible(second))
	ctx.assert(
		'switcher retains the presentation host across content replacement',
		panelOf(second, 'vx-sheet-host') === shared,
		true,
	)

	ctx.assert(
		'replacement panel retains usable focus and keyboard clearance',
		focused(second) && visible(second),
		true,
	)

	ctx.record('phase', 'dismiss during keyboard motion')
	let dismissedPhase: string | null = null
	const during = KeyboardController.subscribe(background, (state) => {
		if (
			dismissedPhase === null &&
			state.inset === 0 &&
			(state.phase === 'start' || state.phase === 'move')
		) {
			dismissedPhase = state.phase
			ctx.record('dismissed phase', dismissedPhase)
			select(null)
		}
	})

	ctx.onCleanup(during)
	second.dismissSoftInput()
	second.ios?.resignFirstResponder()
	second.android?.clearFocus()
	await ctx.waitFor(() => dismissedPhase !== null)
	ctx.assert(
		'presentation closes from a native keyboard transition event',
		dismissedPhase === 'start' || dismissedPhase === 'move',
		true,
	)

	await ctx.waitFor(() => !second.isLoaded && focused(background))
	await ctx.waitFor(() => {
		const state = samples.at(-1)
		return (
			state.currentFrame &&
			state.targetFrame &&
			Math.abs(state.currentFrame.y - state.targetFrame.y) < 1
		)
	})

	ctx.assert('dismissal during movement restores original focus', focused(background), true)
	ctx.assert(
		'retired sheet and dialog bindings release owned translation',
		keyboardHost.translateY === 0 && dialogKeyboard.translateY === 0,
		true,
	)

	ctx.record('phase', 'close during entrance')
	show(true)
	await ctx.waitFor(() => ctx.find('sheet-field')?.isLoaded)
	show(false)
	const count = setInterval(
		() =>
			ctx.record('entrance cleanup', {
				baseline,
				current: root.getChildrenCount(),
				fieldLoaded: !!ctx.find('sheet-field')?.isLoaded,
			}),
		50,
	)

	ctx.onCleanup(() => clearInterval(count))
	await ctx.waitFor(
		() => !ctx.find('sheet-field')?.isLoaded && root.getChildrenCount() === baseline,
	)

	ctx.assert(
		'closing during entrance leaves no popup or shade children',
		root.getChildrenCount() === baseline,
		true,
	)

	background.dismissSoftInput()
}
