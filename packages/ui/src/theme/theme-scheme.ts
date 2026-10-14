import { useSyncExternalStore } from 'octane'
import { getColorScheme, subscribeSystemScheme } from './colorScheme'
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
const emit = () => listeners.forEach((l) => l())

/** Set the app-level theme preference. 'system' clears the override and
 *  follows the OS appearance. */
export function setThemePreference(p: ThemePreference) {
	if (p !== preference) {
		preference = p
		emit()
	}
}

export function getThemePreference(): ThemePreference {
	return preference
}

/** Resolved app scheme: the explicit preference when set, else the system
 *  appearance. */
export function getThemeScheme(): ThemeScheme {
	return preference === 'system' ? getColorScheme() : preference
}

function subscribe(cb: () => void): () => void {
	listeners.add(cb)
	const offSystem = subscribeSystemScheme(cb)
	return () => {
		listeners.delete(cb)
		offSystem()
	}
}

/** Reactive resolved scheme — re-renders when the preference or the OS
 *  appearance changes the effective scheme. Use `useThemePreference` for
 *  the raw preference including 'system'. */
export function useThemeScheme(): ThemeScheme {
	return useSyncExternalStore(subscribe, getThemeScheme)
}

/** Reactive preference — the app's 'light' | 'dark' | 'system' choice,
 *  re-rendering when the preference changes. */
export function useThemePreference(): ThemePreference {
	return useSyncExternalStore(subscribe, getThemePreference)
}

/** Subscribe imperative consumers to resolved-scheme changes; returns an
 *  unsubscribe. Fires on preference writes and OS appearance changes —
 *  use for hosts that live outside any render cycle. Independently-mounted
 *  roots should prefer `applyThemeClasses` in './theme-host', which keeps
 *  the scheme classes stamped live. */
export function onThemeSchemeChange(cb: () => void): () => void {
	return subscribe(cb)
}
