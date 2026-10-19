import { unknownFocusedInputState } from '@octane-xplat/platform/focused-input-state'
import type { FocusRuntime } from './focus-runtime-types'

const inactive = unknownFocusedInputState()
/** Neutral fallback for hosts without qualified input geometry adapters. */
export const focusRuntime: FocusRuntime = {
	activate: () => () => {},
	getSnapshot: () => inactive,
	subscribe(_host, listener) {
		listener(inactive)
		return () => {}
	},
	recheck() {},
}
