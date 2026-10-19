/** @jsxImportSource @octane-xplat/jsx */
import { KeyboardAvoiding } from '@octane-xplat/ui'
import { KeyboardController } from '../../src/controller'
import type { ProbeContext } from '../../../../scripts/probe/context'

import './motion.css'

export default function InteractiveProbe() {
	return (
		<KeyboardAvoiding id="avoidance-host">
			<masonview style={{ display: 'flex', flexDirection: 'column' }}>
				<textfield
					id="keyboard-field"
					hint="Keyboard feasibility"
					className="keyboard-motion-field"
				/>
				<label text="Drag down to dismiss" className="keyboard-motion-longContent" />
			</masonview>
		</KeyboardAvoiding>
	)
}

export async function run(ctx: ProbeContext) {
	const field = await ctx.waitFor(
		() => ctx.find('keyboard-field')?.ios?.window && ctx.find('keyboard-field'),
	)

	const scroll = ctx.find('avoidance-host')
	field.ios.accessibilityIdentifier = 'keyboard-feasibility-field'
	field.ios.accessibilityLabel = 'Keyboard feasibility input'
	field.ios.window.makeKeyAndVisible()
	const nativeScroll = scroll.ios
	nativeScroll.keyboardDismissMode = 2
	nativeScroll.alwaysBounceVertical = true
	const samples: any[] = []
	const off = KeyboardController.onMove(scroll, (state) =>
		samples.push({ ...state, dragging: nativeScroll.dragging }),
	)

	ctx.onCleanup(() => {
		off()
		field.ios.window.endEditing(true)
	})

	try {
		field.focus()
		await ctx.waitFor(
			() => samples.at(-1)?.phase === 'end' && samples.at(-1).currentFrame.height > 100,
			{ timeout: 30000 },
		)

		const window = field.ios.window
		const frame = samples.at(-1).currentFrame
		field.ios.accessibilityLabel =
			'Keyboard swipe ' +
			JSON.stringify({
				x: Math.round(window.bounds.size.width / 2),
				fromY: Math.round(frame.y - 80),
				toY: Math.round(window.bounds.size.height - 10),
			})

		field.ios.accessibilityIdentifier = 'keyboard-interactive-ready'
		const at = samples.length
		await ctx.waitFor(() => samples.slice(at).some((s) => s.dragging), { timeout: 30000 })
		await ctx.waitFor(() => samples.slice(at).some((s) => s.currentFrame.height < 1), {
			timeout: 30000,
		})

		const dragging = samples.slice(at).filter((s) => s.dragging)
		ctx.assert(
			'native adapter reports interactive tracking',
			samples.at(-1).capabilities.interactive,
			true,
		)

		ctx.assert(
			'real scroll drag supplies intermediate keyboard frames',
			new Set(dragging.map((s) => Math.round(s.currentFrame.y))).size > 3,
			true,
		)

		ctx.assert(
			'interactive close reaches the hidden endpoint',
			samples.at(-1).currentFrame.height < 1,
			true,
		)

		ctx.record('interactive samples while dragging', dragging)
	} finally {
		ctx.record('interactive movement samples', samples)
	}
}
