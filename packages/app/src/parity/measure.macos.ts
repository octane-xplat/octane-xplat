import { STYLE_FACETS } from './style-facets'

export function measureTree() {
	return (globalThis as any).__xplatMacOSDebug?.measureParity?.(STYLE_FACETS) ?? null
}

export function installParityDump(): void {
	;(globalThis as any).__xplatParity = measureTree
}
