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

/** Embed mode stamps a root class so CSS can enforce the full-height chain
 *  upstream sets inline (html → body → #root → theme scope). */
export function markEmbedRoot(): void {
	document.documentElement.classList.add('sb-embed')
}

/** Upstream PreviewShell broadcasts `{type:'astryx-theme-sync'}` to its
 *  embed iframe on theme/mode change — the listener applies the same
 *  message in embed documents so the preview restyles without reloading.
 *  Same-origin only, matching upstream's origin check. */
export function listenEmbedThemeSync(
	apply: (theme?: string, mode?: 'light' | 'dark') => void,
): void {
	window.addEventListener('message', (event) => {
		if (event.origin !== window.location.origin) {return}
		const data = event.data as { type?: string; theme?: unknown; mode?: unknown } | undefined
		if (data?.type !== 'astryx-theme-sync') {return}
		apply(
			typeof data.theme === 'string' ? data.theme : undefined,
			data.mode === 'light' || data.mode === 'dark' ? data.mode : undefined,
		)
	})
}
