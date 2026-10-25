// Web leaf for sandbox persistence and embed-query behavior — localStorage
// plus the ?embed=1&theme=&mode= URL contract carried over from upstream
// providers.tsx. No shared file may read DOM storage directly.

const THEME_STORAGE_KEY = 'astryx-sandbox-theme'
const MODE_STORAGE_KEY = 'astryx-sandbox-mode'

export interface EmbedParams {
	isEmbed: boolean
	theme?: string
	mode?: 'light' | 'dark'
}

export function readEmbedParams(): EmbedParams {
	const params = new URLSearchParams(window.location.search)
	const mode = params.get('mode')
	return {
		isEmbed: params.get('embed') === '1',
		theme: params.get('theme') ?? undefined,
		mode: mode === 'light' || mode === 'dark' ? mode : undefined,
	}
}

export function readStoredTheme(): string | null {
	return window.localStorage.getItem(THEME_STORAGE_KEY)
}

export function readStoredMode(): 'light' | 'dark' | null {
	const value = window.localStorage.getItem(MODE_STORAGE_KEY)
	return value === 'light' || value === 'dark' ? value : null
}

export function persistThemeMode(theme: string, mode: 'light' | 'dark' | 'system'): void {
	try {
		window.localStorage.setItem(THEME_STORAGE_KEY, theme)
		window.localStorage.setItem(MODE_STORAGE_KEY, mode)
	} catch {
		// localStorage can throw in private mode / sandboxed iframes
	}
}
