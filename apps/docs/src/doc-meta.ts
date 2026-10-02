// Shared doc metadata — imported by src/docs.ts, src/MdDoc.tsrx,
// src/App.tsrx, and scripts/build-llms.mjs (Node type-strips this file).
// Keep it erasable-TS only: no enums, namespaces, or parameter properties.

// docs/ is organized by audience: guides live in topic dirs that double as
// sidebar sections; notes/ is the design record — implementation detail and
// evidence that guides deliberately keep off the reader's first path.
export const GROUPS = [
	{
		dir: 'start',
		label: 'Start here',
		slugs: ['README', 'spec', 'toolchain', 'architecture'],
	},
	{
		dir: 'app',
		label: 'Build your app',
		slugs: [
			'primitives',
			'components',
			'text-entry',
			'interactive-actions',
			'content-display',
			'navigation',
			'navigation-ui',
			'search-selection',
			'power-search',
			'data',
			'styling',
			'localization',
			'animation-gestures',
			'virtual-list',
			'rich-text',
		],
	},
	{
		dir: 'platform',
		label: 'Device features',
		slugs: [
			'module-resolution',
			'platform-services',
			'media-services',
			'push-notifications',
			'native-picker',
			'date-picker',
			'context-menu',
			'sheet',
			'macos-webview',
			'macos-native',
			'linux-package',
			'windows-setup',
		],
	},
	{
		dir: 'verify',
		label: 'Check your app',
		slugs: ['testing', 'probing', 'navigation-checks', 'known-limits'],
	},
]

// The index doc lives at '/', not /README.
export const INDEX_SLUG = 'README'
// The notes index lives at '/notes' — its file is docs/notes/README.md.
export const NOTES_INDEX_SLUG = 'notes'

// Reading-order rank for guides — group order, then position in its list.
// Unlisted slugs (a new doc awaiting curation) sort to the end of their
// group alphabetically, so new docs never vanish.
export function rankOf(slug: string, dir: string): number {
	const gi = GROUPS.findIndex((g) => g.dir === (dir || 'start'))
	if (gi === -1) {
		return 1000
	}

	const si = GROUPS[gi].slugs.indexOf(slug)
	return gi * 100 + (si === -1 ? 99 : si)
}

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
		if (l.startsWith('>')) {
			quote.push(l.replace(/^>\s?/, ''))
		} else if (l.trim() === '') {
			if (quote.length) {
				break
			}
		} else {
			break
		}
	}

	return quote.join(' ').replace(/\s+/g, ' ').trim()
}

// Slug for a doc file at corpus-relative path dir/name.md. The root index is
// 'README'; a directory's own README/index becomes the dir name
// (docs/notes/README.md → 'notes').
export function slugFor(dir: string, base: string): string {
	if (base === 'README' || base === 'index') {
		return dir ? dir.split('/').pop()! : INDEX_SLUG
	}

	return base
}

// Resolve an intra-doc markdown link to a doc slug. Links are real relative
// paths (GitHub renders them), resolved against the linking doc's dir:
// 'x.md', './x.md', '../app/x.md', 'notes/x.md' all work. A README/index
// target resolves to its directory's slug. Returns null for non-doc hrefs.
export function docSlugFor(href: string, dir: string): string | null {
	const clean = href.split('#', 1)[0].split('?', 1)[0]
	if (!clean.endsWith('.md')) {
		return null
	}

	const segs: string[] = []
	for (const s of [...(dir ? dir.split('/') : []), ...clean.split('/')]) {
		if (!s || s === '.') {
			continue
		}

		if (s === '..') {
			if (!segs.length) {
				return null // escapes the corpus — a repo path, not a doc
			}

			segs.pop()
		} else {
			segs.push(s)
		}
	}

	const base = segs.pop()?.replace(/\.md$/, '')
	return base === undefined ? null : slugFor(segs.join('/'), base)
}

// Repo-relative path for a non-doc href — the GitHub target of source links.
// Hrefs that escape the corpus via '../' are already repo-relative; anything
// else resolves inside docs/ (dir-aware, so '../evidence/x.json' from a note
// stays under docs/).
export function repoPathFor(href: string, dir: string): string {
	const clean = href.split('#', 1)[0].split('?', 1)[0]
	const segs: string[] = []
	let escapes = 0
	for (const s of [...(dir ? dir.split('/') : []), ...clean.split('/')]) {
		if (!s || s === '.') {
			continue
		}

		if (s === '..') {
			if (segs.length) {
				segs.pop()
			} else {
				escapes++
			}
		} else {
			segs.push(s)
		}
	}

	const path = escapes ? segs.join('/') : 'docs/' + segs.join('/')
	return path + (clean.endsWith('/') ? '/' : '')
}

// Site path for a doc — mirrors MdDoc's link mapping and App's route lookup.
export function docPath(slug: string, group: 'guides' | 'notes' = 'guides'): string {
	if (slug === INDEX_SLUG) {
		return '/'
	}

	if (slug === NOTES_INDEX_SLUG) {
		return '/notes'
	}

	return group === 'notes' ? `/notes/${slug}` : `/${slug}`
}
