import { keyboardBottomOverlap } from '@octane-xplat/platform/keyboard-geometry'
import type { KeyboardRect } from '@octane-xplat/platform/keyboard-geometry'
import type { KeyboardWindowState } from '@octane-xplat/platform/keyboard-state'

/** Native adapters supply measurements; this layer never interpolates geometry. */
export function createKeyboardMotion(
	publish: (state: KeyboardWindowState) => void,
	capabilities: { interactive: boolean; floating: boolean },
): {
	begin(target: KeyboardRect | null, duration?: number | null): void
	measure(
		windowRect: KeyboardRect,
		currentFrame: KeyboardRect,
		targetFrame?: KeyboardRect | null,
		bindingFrame?: KeyboardRect,
	): void
	end(confirmed?: boolean): void
	cancel(): void
} {
	let state: KeyboardWindowState | undefined
	let transitionId = 0
	let moving = false
	let durationMs: number | null = null
	const emit = (phase: NonNullable<KeyboardWindowState['motion']>['phase']) => {
		if (!state) {
			return
		}
		state = {
			...state,
			motion: {
				phase,
				transitionId,
				timestampMs: Date.now(),
				durationMs,
				nativeFrames: true,
				...capabilities,
			},
		}
		publish(state)
	}
	return {
		begin(target: KeyboardRect | null, duration: number | null = null): void {
			if (moving) {
				emit('cancel')
			}
			transitionId++
			moving = true
			durationMs = duration !== null && Number.isFinite(duration) ? Math.max(0, duration) : null
			if (state) {
				state = {
					...state,
					targetFrame: target,
					inset: keyboardBottomOverlap(state.windowRect, target),
				}
			}
			emit('start')
		},
		measure(
			windowRect: KeyboardRect,
			currentFrame: KeyboardRect,
			targetFrame?: KeyboardRect | null,
			bindingFrame?: KeyboardRect,
		) {
			state = {
				windowRect,
				currentFrame,
				bindingFrame,
				targetFrame: targetFrame === undefined ? (state?.targetFrame ?? currentFrame) : targetFrame,
				inset: keyboardBottomOverlap(
					windowRect,
					targetFrame === undefined ? (state?.targetFrame ?? currentFrame) : targetFrame,
				),
				source: 'native-frames',
			}
			emit(moving ? 'move' : 'idle')
		},
		end(confirmed = false): void {
			if (!moving && !confirmed) {
				return
			}
			moving = false
			emit('end')
		},
		cancel(): void {
			if (!moving) {
				return
			}
			moving = false
			emit('cancel')
		},
	}
}
