import { storage } from '@octane-xplat/platform'

const THEME_PREFERENCE_KEY = 'xplat-docs-theme'

export function readThemePreference(): boolean | null {
	try {
		const saved = storage.getString(THEME_PREFERENCE_KEY)
		return saved === 'dark' ? true : saved === 'light' ? false : null
	} catch {
		return null
	}
}

export function saveThemePreference(dark: boolean): void {
	try {
		storage.setString(THEME_PREFERENCE_KEY, dark ? 'dark' : 'light')
	} catch {
		// Keep the toggle usable when storage is unavailable.
	}
}
