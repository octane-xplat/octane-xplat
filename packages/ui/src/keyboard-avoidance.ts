import {
	keyboardAvoidancePadding,
	keyboardBottomOverlap,
} from '@octane-xplat/platform/keyboard-geometry'

import { leaseNativePaddingBottom } from './native-padding'
import { observeKeyboardViewport } from '@octane-xplat/platform/keyboard-viewport'
import type { KeyboardWindowState } from '@octane-xplat/platform/keyboard-state'
import { keyboardHostOverlap, subscribeKeyboardState } from './keyboard-inset'

type AvoidanceOptions = {
	safeBottom: number
	ancestorWindow?: object
	ancestorBottom: number
	offset?: number
}

export type KeyboardAvoidanceBinding = (() => void) & { update(): void }

/** Native padding updates bypass render; only the stable ancestor budget renders. */
export function bindKeyboardAvoidance(
	host: any,
	content: any,
	options: AvoidanceOptions | (() => AvoidanceOptions),
	claim: (value: { window?: object; bottom: number }) => void,
): KeyboardAvoidanceBinding {
	const padding = leaseNativePaddingBottom(content)
	const viewport = observeKeyboardViewport(host)
	let demand = 0
	let previousWindow: object | undefined
	let previousBottom = -1
	let lastState: KeyboardWindowState | undefined
	let lastWindow: object | undefined
	const apply = (state: KeyboardWindowState, window?: object) => {
		lastState = state
		lastWindow = window
		const currentOptions = typeof options === 'function' ? options() : options
		viewport.update()
		const bindingState = state.bindingFrame ? { ...state, currentFrame: state.bindingFrame } : state
		const current = keyboardBottomOverlap(state.windowRect, state.currentFrame ?? state.targetFrame)
		const target = keyboardBottomOverlap(state.windowRect, state.targetFrame)
		if (window !== previousWindow) {
			demand = 0
		}
		const moving = state.motion && !['idle', 'end'].includes(state.motion.phase)
		demand = moving
			? Math.max(demand, current, target, state.inset)
			: Math.max(current, target, state.inset)
		const inherited = window === currentOptions.ancestorWindow ? currentOptions.ancestorBottom : 0
		padding.set(
			keyboardAvoidancePadding({
				windowInset: Math.max(current, state.inset),
				hostOverlap: keyboardHostOverlap(host, bindingState),
				consumedSafeArea: currentOptions.safeBottom,
				ancestorAvoidance: inherited,
				offset: currentOptions.offset,
			}),
		)
		const bottom = Math.max(inherited, demand - Math.max(0, currentOptions.safeBottom))
		if (previousWindow !== window || previousBottom !== bottom) {
			previousWindow = window
			previousBottom = bottom
			claim({ window, bottom })
		}
	}
	let off: () => void
	try {
		off = subscribeKeyboardState(apply, host)
	} catch (error) {
		viewport.release()
		padding.release()
		throw error
	}
	let active = true
	const release = () => {
		if (!active) {
			return
		}
		active = false
		try {
			off()
		} finally {
			try {
				padding.release()
			} finally {
				viewport.release()
			}
		}
	}
	return Object.assign(release, {
		update() {
			if (active && lastState) {
				apply(lastState, lastWindow)
			}
		},
	})
}
