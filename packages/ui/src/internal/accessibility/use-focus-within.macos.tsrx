import { useFocusWithinState } from './focus-within-state'
import type { UseFocusWithinOptions, UseFocusWithinResult } from './focus-within-state'
import { appKitHost } from '../platform/host-bridge'

export type { UseFocusWithinOptions, UseFocusWithinResult } from './focus-within-state'

/** Attach to a raw native container. The renderer observes its window's
 * first responder; shared View does not forward onFocus/onBlur. */
export function useFocusWithin(options: UseFocusWithinOptions = {}): UseFocusWithinResult {
	return {
		...useFocusWithinState(options),
		isSubtreeTrackingSupported: Boolean(appKitHost()?.focusWithinSupported),
	}
}
