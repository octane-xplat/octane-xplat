/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { View, TextInput } from '@octane-xplat/ui'
import { SwiftUIBottomSheet } from '@octane-xplat/sheet/ios'
import { KeyboardController } from '../../../keyboard/src/index'
import type { ProbeContext } from '../../../../scripts/probe/context'
let background: any,
	field: any,
	show = (_open: boolean) => {},
	enlarge = () => {}

const captureBackground = (next: any) => {
	background = next?.native ?? next
}

const captureField = (next: any) => {
	field = next?.native ?? next
}

export default function NativeSheetProbe() @{
	const [open, setOpen] = useState(false),
		[large, setLarge] = useState(false)

	show = setOpen
	enlarge = () => setLarge(true)

	<View>
		<TextInput ref={captureBackground} defaultValue="Background" style={{ height: 48 }} />
		<SwiftUIBottomSheet
			open={open}
			onDismissed={() => {
				setOpen(false)
				background?.focus()
			}}
			detents={large ? ['fraction', 'large'] : ['large']}
			customFraction={0.8}
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
	await ctx.waitFor(() => background?.isLoaded && background.ios?.window)
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

	ctx.record('phase', 'present native sheet')
	show(true)
	await ctx.waitFor(
		() => field?.isLoaded && field.ios?.window && field.getActualSize().height >= 47,
	)

	ctx.assert('SwiftUI presented input has usable bounds', field.getActualSize().height >= 47, true)
	const sheetKeys: any[] = []
	const stop = KeyboardController.onMove(field, (s) => {
		sheetKeys.push(s)
		ctx.record('sheet keyboard', s)
	})

	ctx.onCleanup(stop)
	field.focus()
	const visible = () => {
		const s = sheetKeys.at(-1)
		if (!field?.ios?.window) {
			return false
		}

		const box = field.ios.convertRectToView(field.ios.bounds, field.ios.window)
		return (
			s?.inset > 100 &&
			box.size.height >= 47 &&
			box.origin.y >= 0 &&
			box.origin.y + box.size.height <= (s.currentFrame ?? s.targetFrame).y + 1
		)
	}

	await ctx.waitFor(visible)
	ctx.assert('native SwiftUI presentation owns keyboard clearance', !!visible(), true)
	// SwiftUI's presenter may sit outside the app root controller's children.
	// Follow only the hosted input's public responder chain to its owner.
	const controller = () => {
		let responder = field.ios
		for (let i = 0; responder && i < 64; i++, responder = responder.nextResponder) {
			if (responder.presentingViewController && responder.sheetPresentationController) {
				return responder.sheetPresentationController
			}
		}

		return null
	}

	const detentCount = () => controller()?.detents?.count ?? controller()?.detents?.length ?? 0
	await ctx.waitFor(() => detentCount() === 1)
	ctx.record('initial detents', detentCount())
	enlarge()
	await ctx.waitFor(() => detentCount() === 2 && visible())
	ctx.assert('SwiftUI applies the updated native detent set', detentCount(), 2)
	ctx.assert('native detent update retains editing clearance', !!visible(), true)
	const presented = field
	show(false)
	await ctx.waitFor(() => !presented.ios?.window)
	ctx.assert('native sheet dismisses its input host', !presented.ios?.window, true)
	await ctx.waitFor(() => background.ios.isFirstResponder)
	ctx.assert(
		'onDismissed returns focus to the app-owned editing target',
		!!background.ios.isFirstResponder,
		true,
	)

	background.dismissSoftInput()
}
