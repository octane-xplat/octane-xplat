import { useSyncExternalStore } from 'octane'
import { appKitHost, hostGlobal } from './host-bridge'
import type { ColorScheme } from './props'

let unsubscribeAppearance: (() => void) | undefined
const listeners = new Set<() => void>()
const host = () => appKitHost() ?? {}

function getSystemScheme(): ColorScheme {
	return host()?.getColorScheme?.() === 'dark' ? 'dark' : 'light'
}

export function getColorScheme(): ColorScheme {
	return getSystemScheme()
}

export function subscribeSystemScheme(callback: () => void): () => void {
	listeners.add(callback)
	if (!unsubscribeAppearance) {
		unsubscribeAppearance = host()?.onAppearanceChange?.(() => {
			listeners.forEach((listener) => listener())
		})
	}

	let active = true
	return () => {
		if (!active) {
			return
		}

		active = false
		listeners.delete(callback)
		if (listeners.size === 0) {
			unsubscribeAppearance?.()
			unsubscribeAppearance = undefined
		}
	}
}

export function useColorScheme(): ColorScheme {
	return useSyncExternalStore(subscribeSystemScheme, getSystemScheme)
}
