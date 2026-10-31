export interface SafeAreaInsets {
	top: number
	right: number
	bottom: number
	left: number
}

/** The GTK renderer has no notch/system-bar safe area — desktop windows use
 * their full content bounds, so the honest inset is zero on every edge. */
export function useSafeAreaInsets(): SafeAreaInsets {
	return { top: 0, right: 0, bottom: 0, left: 0 }
}
