import { useSyncExternalStore } from 'octane'
import { getColorScheme, subscribeSystemScheme } from '../colorScheme.macos'
import { cx } from '../cx'

export type ThemePreference = 'light' | 'dark' | 'system'

let preference: ThemePreference = 'system'
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((listener) => listener())

export function setThemePreference(value: ThemePreference): void {
	if (preference === value) {
		return
	}
	preference = value
	emit()
}

export function getThemePreference(): ThemePreference {
	return preference
}

export function getThemeScheme(): 'light' | 'dark' {
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

export function useThemeScheme(): 'light' | 'dark' {
	return useSyncExternalStore(subscribe, getThemeScheme)
}

export function themeSchemeClasses(): string {
	return getThemeScheme() === 'dark' ? 'ns-dark dark' : ''
}

export function onThemeSchemeChange(callback: () => void): () => void {
	return subscribe(callback)
}

export function applyThemeClasses(view: any, base = ''): () => void {
	const apply = () => {
		view.className = cx(base, themeSchemeClasses())
	}
	apply()
	return onThemeSchemeChange(apply)
}
