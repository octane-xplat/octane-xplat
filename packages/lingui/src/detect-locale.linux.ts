// OS locale — Linux leaf. Linux renders in a system webview, so the DOM
// navigator is the locale source.
export function detectSystemLocale(): string | undefined {
	return navigator.language || undefined
}
