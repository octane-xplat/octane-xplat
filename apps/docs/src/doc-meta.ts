// Shared doc metadata — imported by src/docs.ts, src/MdDoc.tsrx, and
// scripts/build-llms.mjs (Node type-strips this file). Keep it erasable-TS
// only: no enums, namespaces, or parameter properties.

// Notes contain the design record and the implementation details that guides
// deliberately keep out of the reader's first path.
export const NOTES = new Set([
	'decisions',
	'open-questions',
	'demos',
	'status',
	'framework-notes',
	'architecture-notes',
	'primitive-notes',
	'styling-notes',
	'navigation-notes',
	'module-resolution-notes',
	'platform-notes',
	'animation-notes',
	'testing-notes',
	'toolchain-notes',
	'css-support-notes',
])

// Curated reading order — funnel: orientation → contract → mechanics →
// domain guides → enforcement. Anything not listed falls to the end
// alphabetically, so new docs never vanish.
export const ORDER = [
	'README',
	'spec',
	'architecture',
	'primitives',
	'navigation',
	'styling',
	'animation-gestures',
	'module-resolution',
	'platform-services',
	'testing',
	'toolchain',
	'status',
	'decisions',
	'open-questions',
	'demos',
	'framework-notes',
	'architecture-notes',
	'primitive-notes',
	'styling-notes',
	'navigation-notes',
	'module-resolution-notes',
	'platform-notes',
	'animation-notes',
	'testing-notes',
	'toolchain-notes',
	'css-support-notes',
]

// The index doc lives at '/', not /README.
export const INDEX_SLUG = 'README'

export function titleOf(slug: string, md: string): string {
	const h = md.match(/^#\s+(.+)$/m)
	if (h) {
		return h[1].replace(/[`*_]/g, '').trim()
	}

	return slug.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

// The first blockquote after the H1 is the page's purpose — reused as the
// link description in generated indexes (llms.txt). Flatten to one line.
export function purposeOf(md: string): string {
	const lines = md.split('\n')
	const h1 = lines.findIndex((l) => /^#\s+/.test(l))
	const quote: string[] = []
	for (let i = h1 + 1; i < lines.length; i++) {
		const l = lines[i]
		if (/^>/.test(l)) {
			quote.push(l.replace(/^>\s?/, ''))
		} else if (l.trim() === '') {
			if (quote.length) break
		} else {
			break
		}
	}
	return quote.join(' ').replace(/\s+/g, ' ').trim()
}

// Site path for a doc slug — mirrors MdDoc's link mapping.
export function docPath(slug: string): string {
	if (NOTES.has(slug)) return `/notes/${slug}`
	return slug === INDEX_SLUG ? '/' : `/${slug}`
}
