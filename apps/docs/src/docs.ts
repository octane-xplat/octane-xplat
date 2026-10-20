import { rankOf, slugFor, titleOf } from './doc-meta'

// Reader-facing doc corpus — docs/**/*.md, imported raw at build time.
// Subdirectories organize by topic; slugs stay flat basenames so site paths
// don't encode the folder layout.
const files = import.meta.glob('../../../docs/**/*.md', {
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
	/** Corpus-relative directory, such as 'start', 'app', 'platform', or 'testing'. */
	dir: string
	/** Sidebar section — the index doc joins 'start'. */
	section: string
}

const seen = new Set<string>()
export const DOCS: DocPage[] = Object.entries(files)
	.map(([path, md]) => {
		const rel = path.split('/docs/')[1].replace(/\.md$/, '')
		const segs = rel.split('/')
		const dir = segs.slice(0, -1).join('/')
		const slug = slugFor(dir, segs[segs.length - 1])
		if (seen.has(slug)) {
			throw new Error(`docs: duplicate slug '${slug}' (${path})`)
		}

		seen.add(slug)

		return {
			slug,
			id: slug,
			title: titleOf(slug, md as string),
			md: md as string,
			dir,
			section: dir || 'start',
		}
	})
	.sort((a, b) => {
		const d = rankOf(a.slug, a.dir) - rankOf(b.slug, b.dir)
		return d || a.slug.localeCompare(b.slug)
	})

// The introduction uses '/'; all other guides use their flat slug path.
export function routeForDoc(doc: DocPage | undefined) {
	if (!doc || doc.slug === 'README') {
		return { stack: 'root', name: '', params: {} }
	}

	return { stack: 'root', name: doc.slug, params: {} }
}
