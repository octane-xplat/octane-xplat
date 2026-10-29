import type { BreakpointMap, BreakpointMatches } from './breakpoints.types'
import { useWindowSize } from './screen.macos'

export function useBreakpoints$<T extends BreakpointMap>(thresholds: T): BreakpointMatches<T> {
	const width = useWindowSize().width
	return Object.fromEntries(
		Object.entries(thresholds).map(([name, threshold]) => [name, width >= threshold]),
	) as BreakpointMatches<T>
}
