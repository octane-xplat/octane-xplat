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

/** Inspect React Router-style paths, URL objects, and structured router
 *  destinations without serializing or replacing the value handed to the
 *  sink. Search/query/hash are route-relative data, not schemes. Absent
 *  destinations remain absent. Ported from Astryx `utils/safeUrl.ts`. */
export function isSafeDestination(destination: unknown): boolean {
	if (destination == null) {
		return true
	}
	if (typeof destination === 'string') {
		return isSafeUrl(destination)
	}
	if (typeof destination !== 'object') {
		return false
	}

	const { pathname, href, protocol, host, hostname } = destination as {
		pathname?: unknown
		href?: unknown
		protocol?: unknown
		host?: unknown
		hostname?: unknown
	}
	for (const field of [pathname, href, protocol, host, hostname]) {
		if (field != null && typeof field !== 'string') {
			return false
		}
	}
	if (typeof pathname === 'string' && !isSafeUrl(pathname)) {
		return false
	}
	if (typeof href === 'string' && !isSafeUrl(href)) {
		return false
	}
	if (typeof protocol === 'string' && protocol !== '') {
		// URL-object formatters accept a protocol with or without its colon and
		// can assemble a data media type from the host and pathname fields.
		const normalizedProtocol = normalizeUrl(protocol)
		const prefix = normalizedProtocol.endsWith(':') ? normalizedProtocol : `${normalizedProtocol}:`
		if (!isSafeUrl(prefix)) {
			return false
		}

		const body = (host || hostname || '') as string
		const path = typeof pathname === 'string' ? pathname : ''
		if (!isSafeUrl(`${prefix}${body}${path}`)) {
			return false
		}
	}
	return true
}
