/** Breakpoint name → min-width map. */
export type BreakpointMap = Record<string, number>

/** Breakpoint name → matched flag. */
export type BreakpointMatches<T extends BreakpointMap> = {
	[K in keyof T]: boolean
}
