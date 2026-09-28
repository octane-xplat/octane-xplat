export function measureTree(): { target: 'macos'; cells: Record<string, unknown[]>; supported: false } {
	return { target: 'macos', cells: {}, supported: false }
}

export function installParityDump(): void {
	;(globalThis as any).__xplatParity = () => ({ target: 'macos', cells: {}, supported: false })
}
