import { useSyncExternalStore } from 'octane'
import { getColorScheme, subscribeSystemScheme } from '../colorScheme.macos'
import type { ColorScheme } from '../props'

/** The app's theme preference — an explicit 'light'/'dark' override or
 *  'system' to follow the OS appearance. Distinct from the resolved
 *  scheme: the preference may be 'system' while `ThemeScheme` is always a
 *  concrete scheme. */
export type ThemePreference = 'light' | 'dark' | 'system'

/** The resolved app scheme — the effective appearance the UI renders
 *  with: the explicit preference when set, otherwise the current system
 *  appearance. Same value space as the system `ColorScheme`. */
export type ThemeScheme = ColorScheme

let preference: ThemePreference = 'system'
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((listener) => listener())

export function setThemePreference(value: ThemePreference): void {
	if (preference === value) {
		return
	}

	preference = value
	// An explicit preference pins NSApp.appearance; 'system' clears the
	// override. The effectiveAppearance change notifies appearance listeners,
	// so CSS root classes, media queries and native controls all follow.
	;(globalThis as Record<string, any>).__xplatAppKit?.setAppearanceOverride?.(
		value === 'system' ? null : value,
	)
	emit()
}

export function getThemePreference(): ThemePreference {
	return preference
}

export function getThemeScheme(): ThemeScheme {
	return preference === 'system' ? getColorScheme() : preference
}

function subscribe(callback: () => void): () => void {
	listeners.add(callback)
	const unsubscribeSystem = subscribeSystemScheme(callback)
	return () => {
		listeners.delete(callback)
		unsubscribeSystem()
	}
}

export function useThemeScheme(): ThemeScheme {
	return useSyncExternalStore(subscribe, getThemeScheme)
}

export function useThemePreference(): ThemePreference {
	return useSyncExternalStore(subscribe, getThemePreference)
}

export function onThemeSchemeChange(callback: () => void): () => void {
	return subscribe(callback)
}
