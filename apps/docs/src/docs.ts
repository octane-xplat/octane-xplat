import { rankOf, slugFor, titleOf } from './doc-meta'

// Doc corpus — the framework's own docs/**/*.md, imported raw at build time.
// Subdirectories organize by audience; slugs stay flat basenames so site
// paths don't encode the folder layout.
const files = import.meta.glob(['../../../docs/**/*.md', '!../../../docs/evidence/**'], {
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
	/** Corpus-relative dir ('', 'start', 'app', 'platform', 'verify', 'notes'). */
	dir: string
	/** Sidebar section — the index doc joins 'start'. */
	section: string
	/** guides = reader-facing framework docs; notes = design record. */
	group: 'guides' | 'notes'
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
			group: (dir === 'notes' ? 'notes' : 'guides') as DocPage['group'],
		}
	})
	.sort((a, b) => {
		if (a.group !== b.group) {
			return a.group === 'guides' ? -1 : 1
		}

		const d = rankOf(a.slug, a.dir) - rankOf(b.slug, b.dir)
		return d || a.slug.localeCompare(b.slug)
	})

// Route for a doc — the two indexes pin short paths ('/' and '/notes'),
// other notes ride the 'notes' stack so URLs read /notes/<slug>.
export function routeForDoc(doc: DocPage | undefined) {
	if (!doc || doc.slug === 'README') {
		return { stack: 'root', name: '', params: {} }
	}

	if (doc.slug === 'notes') {
		return { stack: 'root', name: 'notes', params: {} }
	}

	return { stack: doc.group === 'notes' ? 'notes' : 'root', name: doc.slug, params: {} }
}
