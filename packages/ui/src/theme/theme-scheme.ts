import { useSyncExternalStore } from 'octane'
import { getColorScheme, subscribeSystemScheme } from './colorScheme'
import { cx } from '../cx'

export type ThemePreference = 'light' | 'dark' | 'system'

let preference: ThemePreference = 'system'
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

/** App-level theme override. 'system' clears the override and follows the OS. */
export function setThemePreference(p: ThemePreference) {
	if (p !== preference) {
		preference = p
		emit()
	}
}

export function getThemePreference(): ThemePreference {
	return preference
}

/** The effective scheme: explicit override if set, else system appearance. */
export function getThemeScheme(): 'light' | 'dark' {
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

/** Reactive effective scheme — re-renders on override or OS change. */
export function useThemeScheme(): 'light' | 'dark' {
	return useSyncExternalStore(subscribe, getThemeScheme)
}

/** Class string to stamp on independently-mounted roots (portal hosts,
 *  overlay/sheet/modal/toast containers): 'ns-dark dark' when effective
 *  dark, '' otherwise. Both names because tokens.css publishes both
 *  selectors and hosts may render either vocabulary. */
export function themeSchemeClasses(): string {
	return getThemeScheme() === 'dark' ? 'ns-dark dark' : ''
}

/** Subscribe imperative hosts to effective-scheme changes; returns an
 *  unsubscribe. Use for hosts that live outside any render cycle. */
export function onThemeSchemeChange(cb: () => void): () => void {
	return subscribe(cb)
}

/** Stamp `base + themeSchemeClasses()` onto an imperative host (NS view or
 *  DOM element) and keep it live — returns an unsubscribe to call when the
 *  host closes. Works on both leaves since both honor `.className`. */
export function applyThemeClasses(view: any, base: string): () => void {
	const apply = () => {
		view.className = cx(base, themeSchemeClasses())
	}
	apply()
	return onThemeSchemeChange(apply)
}
