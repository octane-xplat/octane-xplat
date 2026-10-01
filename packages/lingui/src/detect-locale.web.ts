// OS locale — web leaf. navigator.language reflects the browser's preferred
// UI language.
export function detectSystemLocale(): string | undefined {
	return navigator.language || undefined
}
