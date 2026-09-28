import { useSyncExternalStore } from 'octane'
import type { ColorScheme } from './props'

let appearanceListener: (() => void) | undefined
const listeners = new Set<() => void>()
const host = () => (globalThis as any).__xplatAppKit

function getSystemScheme(): ColorScheme {
	return host()?.getColorScheme?.() === 'dark' ? 'dark' : 'light'
}

export function getColorScheme(): ColorScheme {
	return getSystemScheme()
}

export function subscribeSystemScheme(callback: () => void): () => void {
	listeners.add(callback)
	if (!appearanceListener) {
		appearanceListener = () => listeners.forEach((listener) => listener())
		host()?.onAppearanceChange?.(appearanceListener)
	}
	return () => listeners.delete(callback)
}

export function useColorScheme(): ColorScheme {
	return useSyncExternalStore(subscribeSystemScheme, getSystemScheme)
}
