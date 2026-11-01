import { useSyncExternalStore } from 'octane'
import Gtk from 'gi://Gtk?version=4.0'
import { getColorScheme, subscribeSystemScheme } from './colorScheme.gtk'
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
	// gtk-application-prefer-dark-theme is the app-owned appearance flag on
	// GTK < 4.20 — the app, not the OS, writes it — so an explicit
	// preference pins real GTK widgets and the renderer's ambient scheme
	// classes; 'light' and 'system' clear the opt-in, mirroring the macOS
	// leaf's NSApp.appearance override (where 'system' clears the pin and
	// the system appearance shows through). On GTK 4.20+ the OS-fed
	// gtk-interface-color-scheme still wins inside scheme detection.
	try {
		const settings = Gtk.Settings.get_default?.()
		if (settings) {
			settings.gtk_application_prefer_dark_theme = value === 'dark'
		}
	} catch {
		// Settings exist only after Gtk.init — before it the in-memory
		// preference still resolves getThemeScheme.
	}
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
