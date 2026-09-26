// Named responsive thresholds built on the platform's window-size hook.
import { useWindowSize } from './screen'

export type BreakpointMap = Record<string, number>

export type BreakpointMatches<T extends BreakpointMap> = {
	[K in keyof T]: boolean
}

/**
 * Returns whether the current window width has reached each app-defined
 * breakpoint. Widths are CSS pixels on web and device-independent pixels on
 * native. A breakpoint matches at its threshold and above.
 */
export function useBreakpoints<T extends BreakpointMap>(
	breakpoints: T,
): BreakpointMatches<T> {
	const { width } = useWindowSize()
	const matches: Record<string, boolean> = {}
	for (const name in breakpoints) {
		matches[name] = width >= breakpoints[name]
	}
	return matches as BreakpointMatches<T>
}
