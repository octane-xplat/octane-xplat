import { keyboardNativeScope } from './native-scope'
import { KeyboardController } from './controller'
import { FocusedInputController } from './focused-input'
import { focusScrollPlan } from './scroll-geometry'
import { scrollRuntime } from './scroll-runtime'
import type { KeyboardScrollOptions, KeyboardScrollService } from './scroll-types'

const checked = (options: KeyboardScrollOptions) => {
	if (!Number.isFinite(options.clearance ?? 8) || (options.clearance ?? 8) < 0) {
		throw new RangeError('Keyboard scroll clearance must be finite and nonnegative')
	}
	return { ...options }
}

/** Focus visibility without per-frame component rendering. */
export const KeyboardScrollController: KeyboardScrollService = {
	bind(host, initial = {}) {
		let options = checked(initial),
			active = true,
			paused = false,
			applying = false
		let focus = FocusedInputController.getSnapshot(host)
		let keyboard = KeyboardController.getSnapshot(host)
		let open = false
		const restoration = new Map<object, { before: number; expected: number }>()
		const scope = keyboardNativeScope()
		const apply = () => {
			if (!active || applying) {
				return
			}
			applying = true
			try {
				const root = scrollRuntime.owner(host)
				const frame = keyboard.currentFrame ?? keyboard.targetFrame
				const bottom = keyboard.windowRect && keyboard.windowRect.y + keyboard.windowRect.height
				const nowOpen =
					keyboard.inset > 0 || !!(frame && bottom && frame.height > 0 && frame.y < bottom)

				if (open && !nowOpen) {
					if (options.keyboardClose === 'restore') {
						for (const [owner, saved] of restoration) {
							const current = scrollRuntime.read(owner)
							if (current !== null && Math.abs(current - saved.expected) < 1) {
								scrollRuntime.write(owner, saved.before)
							}
						}
					}

					restoration.clear()
					open = false
					return
				}

				open = nowOpen
				if (!root || paused) {
					return
				}

				for (const operation of focusScrollPlan(focus, keyboard, root, options.clearance ?? 8)) {
					if (nowOpen) {
						const previous = restoration.get(operation.id)
						restoration.set(operation.id, {
							before: previous?.before ?? operation.from,
							expected: operation.to,
						})
					}

					scrollRuntime.write(operation.id, operation.to)
				}
			} finally {
				applying = false
			}
		}
		const release = () => {
			if (!active) {
				return
			}
			active = false
			try {
				scope.release()
			} finally {
				restoration.clear()
			}
		}
		try {
			scope.defer(
				scrollRuntime.watchManual(host, () => {
					paused = options.manualScroll !== 'follow'
					restoration.clear()
				}),
			)

			scope.defer(
				KeyboardController.onMove(host, (state) => {
					keyboard = state
					apply()
				}),
			)

			scope.defer(
				FocusedInputController.subscribe(host, (state) => {
					if (
						state.input !== focus.input ||
						state.selection?.start !== focus.selection?.start ||
						state.selection?.end !== focus.selection?.end
					) {
						paused = false
					}
					focus = state
					apply()
				}),
			)
		} catch (error) {
			release()
			throw error
		}
		return {
			release,
			update(next) {
				options = checked(next)
				if (active) {
					apply()
				}
			},
			recheck() {
				if (!active) {
					return
				}
				paused = false
				FocusedInputController.recheck(host)
				focus = FocusedInputController.getSnapshot(host)
				apply()
			},
		}
	},
}
