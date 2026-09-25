// Doc corpus — the framework's own docs/*.md, imported raw at build time.
const files = import.meta.glob('../../../docs/*.md', {
	query: '?raw',
	import: 'default',
	eager: true,
})

export interface DocPage {
	slug: string
	/** List keys on item.id — same value as slug. */
	id: string
	title: string
	md: string
	/** guides = reader-facing framework docs; notes = design record. */
	group: 'guides' | 'notes'
}

// Notes contain the design record and the implementation details that guides
// deliberately keep out of the reader's first path.
const NOTES = new Set([
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
const ORDER = [
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

function titleOf(slug: string, md: string): string {
	const h = md.match(/^#\s+(.+)$/m)
	if (h) {
		return h[1].replace(/[`*_]/g, '').trim()
	}

	return slug.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export const DOCS: DocPage[] = Object.entries(files)
	.map(([path, md]) => {
		const slug = path.split('/').pop()!.replace(/\.md$/, '')
		return {
			slug,
			id: slug,
			title: titleOf(slug, md as string),
			md: md as string,
			group: (NOTES.has(slug) ? 'notes' : 'guides') as DocPage['group'],
		}
	})
	.sort((a, b) => {
		const ai = ORDER.indexOf(a.slug)
		const bi = ORDER.indexOf(b.slug)
		if (ai !== -1 || bi !== -1) {
			return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
		}

		return a.slug.localeCompare(b.slug)
	})
