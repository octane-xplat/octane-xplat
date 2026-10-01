// Navigation URL safety — ported from Astryx's utils/safeUrl.ts. Blocks the
// schemes that execute script in a link href; every other value passes
// through normalized (control chars stripped) rather than rewritten.

function normalizeUrl(url: string): string {
	// oxlint-disable-next-line no-control-regex -- Strip controls before URL-scheme checks.
	return url.replace(/[\x00-\x1f\x7f]/g, '').trim()
}

/** Return the normalized URL, or null for a blocked scheme. */
export function sanitizeUrl(url: string): string | null {
	const normalized = normalizeUrl(url)
	const lower = normalized.toLowerCase()
	if (
		lower.startsWith('javascript:') ||
		lower.startsWith('vbscript:') ||
		lower.startsWith('data:text/html')
	) {
		return null
	}

	return normalized
}

/** Inspect a navigation string without changing the value used by its sink. */
export function isSafeUrl(url: string): boolean {
	return sanitizeUrl(url) !== null
}
