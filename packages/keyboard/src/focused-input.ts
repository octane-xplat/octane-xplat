import { focusRuntime } from './focus-runtime'
import type { FocusedInputService } from './focus-types'

/** Observe input/caret layout without collecting text or owning editing delegates.
 * @example
 * ```ts
 * import { FocusedInputController } from '@octane-xplat/keyboard'
 * function observe(host: object) {
 *   return FocusedInputController.subscribe(host, state => console.log(state.inputRect))
 * }
 * ```
 */
export const FocusedInputController: FocusedInputService = {
	getSnapshot: (host) => focusRuntime.getSnapshot(host),
	recheck: (host) => focusRuntime.recheck(host),
	subscribe(host, listener) {
		const deactivate = focusRuntime.activate()
		let active = true
		let off: () => void
		try {
			off = focusRuntime.subscribe(host, (state) => {
				if (active) {
					listener(state)
				}
			})
		} catch (error) {
			active = false
			deactivate()
			throw error
		}
		return () => {
			if (!active) {
				return
			}
			active = false
			try {
				off()
			} finally {
				deactivate()
			}
		}
	},
}
