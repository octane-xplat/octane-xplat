import type { SafeAreaInsets } from './props'

/** The AppKit root view begins below the title bar; there are no additional
 * safe-area insets in this window-hosted renderer. */
export function useSafeAreaInsets(): SafeAreaInsets {
	return { top: 0, right: 0, bottom: 0, left: 0 }
}
