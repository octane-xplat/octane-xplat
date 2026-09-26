export type BreakpointMap = Record<string, number>

export type BreakpointMatches<T extends BreakpointMap> = {
	[K in keyof T]: boolean
}
