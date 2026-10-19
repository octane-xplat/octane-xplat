import { sameFocusedInput } from '@octane-xplat/platform/focused-input-state'
import type { FocusedInputState } from '@octane-xplat/platform/focused-input-state'

/** @internal Stable snapshots across idle polling frames. */
export function focusPublisher(publish: (state: FocusedInputState) => void) {
	let previous: FocusedInputState | undefined
	return (next: FocusedInputState) => {
		if (previous && sameFocusedInput(previous, next)) {
			return
		}
		previous = { ...next, timestampMs: Date.now() }
		publish(previous)
	}
}
