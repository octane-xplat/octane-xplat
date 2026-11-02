// Parser-level URL policy — ported from Astryx Markdown's
// `utils/safeUrl.ts` + `Markdown/url.ts` (v0.7.4, MIT). The parser accepts or
// rejects link/image/autolink destinations with this check; renderer-side
// sanitization is a separate policy (`routing/safe-url`).

function normalizeUrl(url: string): string {
	// Strip embedded controls before checking the scheme — browsers ignore
	// them, so they are the bypass.
	// oxlint-disable-next-line no-control-regex
	return url.replace(/[\x00-\x1f\x7f]/g, '').trim()
}

/** The form a URL's scheme is compared in: lowercase, and without the spaces
 *  after the scheme's colon, which a data URL's media type ignores
 *  (`data: text/html` is HTML). */
function comparableUrl(normalized: string): string {
	return normalized.toLowerCase().replace(/^([a-z][a-z\d+.-]*:) +/, '$1')
}

/** Whether the parser may turn this destination into a link/image node.
 *  Matches the reference parser's acceptance exactly. */
export function isSafeMdParserUrl(url: string): boolean {
	const lower = comparableUrl(normalizeUrl(url))
	return !(
		lower.startsWith('javascript:') ||
		lower.startsWith('vbscript:') ||
		lower.startsWith('data:text/html')
	)
}
