/** @jsxImportSource @octane-xplat/jsx */
import { UIView, NSLayoutConstraint } from '@octane-xplat/platform/ios'
import { KeyboardAvoiding } from '@octane-xplat/ui'
import { KeyboardController, bindKeyboardHost } from '../../src/controller'
import {
	keyboardHostDisplacement,
	keyboardSnapshotForHost,
} from '@octane-xplat/ui/nativescript/keyboard'

import type { ProbeContext } from '../../../../scripts/probe/context'

import './motion.css'

export default function MotionProbe() {
	return (
		<masonview id="keyboard-probe-root" style={{ display: 'grid', gridTemplateRows: '1fr auto' }}>
			<KeyboardAvoiding id="avoidance-host" keyboardVerticalOffset={8}>
				<masonview style={{ display: 'flex', flexDirection: 'column' }}>
					<textfield
						id="keyboard-field"
						hint="Keyboard feasibility"
						className="keyboard-motion-field"
					/>
					<textview
						id="keyboard-area"
						text={'first\nsecond\nthird'}
						className="keyboard-motion-area"
					/>
				</masonview>
			</KeyboardAvoiding>
			<masonview
				id="movement-host"
				className="keyboard-motion-follower"
				style={{ display: 'flex', flexDirection: 'column', gridRowStart: 2 }}
			>
				<label text="Keyboard follower" />
			</masonview>
		</masonview>
	)
}

export async function run(ctx: ProbeContext) {
	const field = await ctx.waitFor(
		() => ctx.find('keyboard-field')?.isLoaded && ctx.find('keyboard-field'),
	)

	const host = ctx.find('movement-host'),
		area = ctx.find('keyboard-area')

	if (field.android) {
		await ctx.waitFor(() => field.android.hasWindowFocus(), { timeout: 15000 })
	}

	if (field.ios) {
		field.ios.accessibilityIdentifier = 'keyboard-feasibility-field'
		field.ios.accessibilityLabel = 'Keyboard feasibility input'
		field.ios.window.makeKeyAndVisible()
	}

	const ownWindow = field.ios.window,
		root = ownWindow.rootViewController.view

	const reference = UIView.new()
	reference.translatesAutoresizingMaskIntoConstraints = false
	reference.userInteractionEnabled = false
	const carrier = UIView.new()
	carrier.translatesAutoresizingMaskIntoConstraints = false
	carrier.userInteractionEnabled = false
	root.addSubview(carrier)
	carrier.keyboardLayoutGuide.usesBottomSafeArea = false
	carrier.addSubview(reference)
	const referenceConstraints = [
		carrier.leadingAnchor.constraintEqualToAnchor(root.leadingAnchor),
		carrier.trailingAnchor.constraintEqualToAnchor(root.trailingAnchor),
		carrier.topAnchor.constraintEqualToAnchor(root.topAnchor),
		carrier.bottomAnchor.constraintEqualToAnchor(root.bottomAnchor),
		reference.leadingAnchor.constraintEqualToAnchor(carrier.leadingAnchor),
		reference.trailingAnchor.constraintEqualToAnchor(carrier.trailingAnchor),
		reference.bottomAnchor.constraintEqualToAnchor(carrier.keyboardLayoutGuide.topAnchor),
		reference.heightAnchor.constraintEqualToConstant(0),
	]

	NSLayoutConstraint.activateConstraints(referenceConstraints)
	root.layoutIfNeeded()
	const referenceY = () => (reference.layer.presentationLayer()?.frame ?? reference.frame).origin.y
	ctx.onCleanup(() => {
		NSLayoutConstraint.deactivateConstraints(referenceConstraints)
		carrier.removeFromSuperview()
	})

	const samples: any[] = [],
		phases: string[] = []

	const base = host.ios
		? host.ios.superview.convertRectToView(host.ios.frame, host.ios.window)
		: null

	const baseBottom = base ? base.origin.y + base.size.height : 0
	const release = bindKeyboardHost(host)
	const off = KeyboardController.onMove(host, (state) => {
		const raw = keyboardSnapshotForHost(host)
		const bindingState = raw.bindingFrame ? { ...raw, currentFrame: raw.bindingFrame } : raw
		const overlap = keyboardHostDisplacement(host, bindingState, Number(host.translateY))
		const layer = host.ios?.layer.presentationLayer()
		const presentation = layer
			? host.ios.superview.convertRectToView(layer.frame, host.ios.window)
			: null

		samples.push({
			t: Date.now(),
			...state,
			translationY: Number(host.translateY),
			overlap,
			presentationBottom: presentation ? presentation.origin.y + presentation.size.height : null,
			expectedBottom: baseBottom ? Math.min(baseBottom, state.currentFrame?.y ?? baseBottom) : null,
		})
	})

	const offState = KeyboardController.subscribe(host, (state) => phases.push(state.phase))
	const hide = () => {
		if (field.ios) {
			field.ios.window.endEditing(true)
		} else {
			const android = (globalThis as any).android
			field.android
				.getContext()
				.getSystemService(android.content.Context.INPUT_METHOD_SERVICE)
				.hideSoftInputFromWindow(field.android.getWindowToken(), 0)
		}
	}

	ctx.onCleanup(() => {
		offState()
		off()
		release()
		hide()
	})

	try {
		ctx.assert(
			'fresh iOS source keeps unavailable current geometry null',
			samples[0].currentFrame,
			null,
		)

		field.focus()
		await ctx.waitFor(
			() => samples.at(-1)?.capabilities.nativeFrames && samples.at(-1).currentFrame.height > 100,
			{ timeout: 30000 },
		)

		hide()
		await ctx.waitFor(
			() => samples.at(-1)?.phase === 'end' && samples.at(-1).currentFrame.height < 1,
		)

		samples.length = 0
		phases.length = 0
		field.focus()
		if (field.android) {
			const android = (globalThis as any).android
			ctx.record(
				'show soft input result',
				field.android
					.getContext()
					.getSystemService(android.content.Context.INPUT_METHOD_SERVICE)
					.showSoftInput(field.android, 0),
			)
		}

		await ctx.waitFor(
			() => samples.some((s) => s.phase === 'end' && s.currentFrame?.height > 100),
			{ timeout: 30000 },
		)

		ctx.assert('source supplies measured native frames', samples.at(-1).source, 'native-frames')
		if (field.ios) {
			const open = samples.at(-1)
			ctx.assert(
				'native presentation reaches the open keyboard edge',
				Math.abs(open.presentationBottom - open.expectedBottom) < 2,
				true,
			)
		}

		ctx.assert(
			'opening includes intermediate measured frames',
			new Set(samples.filter((s) => s.phase === 'move').map((s) => Math.round(s.currentFrame.y)))
				.size > 2,
			true,
		)

		ctx.assert(
			'native binding follows the next-refresh position',
			samples
				.filter((s) => s.phase === 'move')
				.every((s) => Math.abs(s.translationY + s.overlap) < 1.5),
			true,
		)

		ctx.assert(
			'state subscription excludes repeated movement',
			phases.filter((p) => p === 'move').length,
			0,
		)

		area.focus()
		await ctx.waitFor(() => (area.ios ? area.ios.isFirstResponder : area.android.hasFocus()))
		const closingAt = samples.length
		hide()
		await ctx.waitFor(
			() => samples.slice(closingAt).some((s) => s.phase === 'end' && s.currentFrame?.height < 1),
			{ timeout: 15000 },
		)

		const closing = samples.slice(closingAt)
		ctx.assert(
			'closing includes intermediate measured frames',
			new Set(closing.filter((s) => s.phase === 'move').map((s) => Math.round(s.currentFrame.y)))
				.size > 2,
			true,
		)

		ctx.assert('binding restores hidden offset', Number(host.translateY), 0)
		if (field.ios) {
			const closed = samples.at(-1)
			ctx.assert(
				'native presentation reaches the hidden endpoint',
				Math.abs(closed.presentationBottom - closed.expectedBottom) < 2,
				true,
			)
		}

		// Exercise reversal while the replacement has not reached its destination.
		const reversalAt = samples.length
		field.focus()
		if (field.android) {
			const android = (globalThis as any).android
			field.android
				.getContext()
				.getSystemService(android.content.Context.INPUT_METHOD_SERVICE)
				.showSoftInput(field.android, 0)
		}

		await ctx.waitFor(() =>
			samples
				.slice(reversalAt)
				.some(
					(s) => s.phase === 'move' && s.currentFrame.height > 10 && s.currentFrame.height < 160,
				),
		)

		hide()
		await ctx.waitFor(
			() => samples.slice(reversalAt).some((s) => s.phase === 'end' && s.currentFrame.height < 1),
			{ timeout: 15000 },
		)

		ctx.assert(
			'reversal preserves measured property tracking',
			samples.slice(reversalAt).every((s) => Math.abs(s.translationY + s.overlap) < 1.5),
			true,
		)

		// Rapid focus changes stay in the same observation/window ownership.
		field.focus()
		area.focus()
		field.focus()
		area.focus()
		if (field.android) {
			const android = (globalThis as any).android
			area.android
				.getContext()
				.getSystemService(android.content.Context.INPUT_METHOD_SERVICE)
				.showSoftInput(area.android, 0)
		}

		await ctx.waitFor(() => samples.at(-1).currentFrame.height > 100)
		area.keyboardType = 'number'
		await ctx.waitFor(() => (area.ios ? area.ios.isFirstResponder : area.android.hasFocus()))
		hide()
		await ctx.waitFor(() => samples.at(-1).currentFrame.height < 1, { timeout: 15000 })
		ctx.assert(
			'rapid focus and keyboard-type changes retain the source',
			samples.at(-1).source,
			'native-frames',
		)

		if (baseBottom) {
			const moving = samples.filter((s) => s.phase === 'move' && s.presentationBottom !== null)
			const errors = moving
				.map((s) => Math.abs(s.presentationBottom - s.expectedBottom))
				.sort((a, b) => a - b)

			ctx.record('native layer tracking error in points', {
				median: errors[Math.floor(errors.length / 2)],
				p95: errors[Math.floor(errors.length * 0.95)],
				max: errors.at(-1),
			})

			ctx.record(
				'native layer presentation samples',
				moving.map((s) => ({
					t: s.t,
					measuredY: s.currentFrame.y,
					bottom: s.presentationBottom,
					expected: s.expectedBottom,
				})),
			)
		}

		offState()
		off()
		release()
		ctx.assert('binding cleanup restores original property', Number(host.translateY), 0)
		field.focus()
		if (field.android) {
			const android = (globalThis as any).android
			field.android
				.getContext()
				.getSystemService(android.content.Context.INPUT_METHOD_SERVICE)
				.showSoftInput(field.android, 0)
		}

		// No controller source is retained; UI consumers may still use their discrete fallback.
		const late: any[] = []
		const lateOff = KeyboardController.onMove(host, (value) => late.push(value))
		try {
			await ctx.waitFor(() => late.at(-1)?.currentFrame?.height > 100, { timeout: 15000 })
			ctx.assert('fresh source attaches to visible keyboard', late.at(-1).source, 'native-frames')
			ctx.assert(
				'fresh source keeps current geometry available',
				late.at(-1).currentFrame.height > 100,
				true,
			)
		} finally {
			lateOff()
			hide()
		}

		// Keep a reference guide alive while the controller is absent. Start a
		// fresh source halfway through the next physical keyboard transition.
		hide()
		await ctx.waitFor(() => Math.abs(referenceY() - ownWindow.bounds.size.height) < 1)
		field.focus()
		await ctx.waitFor(
			() =>
				referenceY() < ownWindow.bounds.size.height - 30 &&
				referenceY() > ownWindow.bounds.size.height - 280,
		)

		const joining: any[] = []
		const joinOff = KeyboardController.onMove(host, (state) =>
			joining.push({
				...state,
				referenceY: referenceY(),
				guideModelY: carrier.keyboardLayoutGuide.layoutFrame.origin.y,
				referenceModelY: reference.frame.origin.y,
			}),
		)

		try {
			await ctx.waitFor(() => joining.length > 0)
			const initial = joining[0]
			ctx.record('mid-transition attachment', joining)
			ctx.assert(
				'fresh mid-transition source reports destination-only geometry',
				initial.currentFrame === null &&
					initial.capabilities.nativeFrames === false &&
					initial.source === 'destination',
				true,
			)

			await ctx.waitFor(
				() =>
					joining.at(-1).phase === 'end' &&
					joining.at(-1).currentFrame !== null &&
					Math.abs(joining.at(-1).currentFrame.y - referenceY()) < 1,
			)

			ctx.assert(
				'late source destination agrees with its measured endpoint',
				Math.abs(joining.at(-1).targetFrame.y - joining.at(-1).currentFrame.y) < 1,
				true,
			)
		} finally {
			joinOff()
			hide()
		}

		ctx.record('lifecycle subscriber phases', phases)
	} finally {
		ctx.record('native controller samples', samples)
	}
}
