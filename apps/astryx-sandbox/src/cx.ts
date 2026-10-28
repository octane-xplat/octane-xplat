// Tiny classnames join — conditional class assembly for ported pages.
export function cx(...parts: Array<string | false | null | undefined>): string {
	return parts.filter(Boolean).join(' ')
}
