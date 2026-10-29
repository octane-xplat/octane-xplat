// Shared doc metadata — imported by src/docs.ts, src/MdDoc.tsrx,
// src/App.tsrx, and scripts/build-llms.ts (Node type-strips this file).
// Keep it erasable-TS only: no enums, namespaces, or parameter properties.

// docs/ contains reader-facing app guides. Internal implementation and design
// records live under .agents/ and are linked as repository sources when useful.
export const GROUPS = [
	{
		dir: 'start',
		label: 'Start here',
		slugs: ['README', 'spec', 'toolchain', 'native-release', 'architecture'],
	},
	{ dir: 'demos', label: 'Demos', slugs: ['browser-demos', 'goal-counter', 'packing-list'] },
	{
		dir: 'app',
		label: 'Build your app',
		slugs: [
			'primitives',
			'components',
			'component-libraries',
			'text-entry',
			'accessibility',
			'local-storage',
			'interactive-actions',
			'menus',
			'tables',
			'content-display',
			'navigation',
			'navigation-ui',
			'authentication',
			'search-selection',
			'command-palette',
			'power-search',
			'data',
			'styling',
			'liquid-glass',
			'localization',
			'animation-gestures',
			'keyboard-clipboard',
			'software-keyboard',
			'movie-capture',
			'virtual-list',
			'rich-text',
			'updates',
			'ui-api-migrations',
		],
	},
	{
		dir: 'platform',
		label: 'Device features',
		slugs: [
			'module-resolution',
			'platform-services',
			'in-app-purchases',
			'background-work',
			'media-services',
			'keep-awake',
			'local-notifications',
			'push-notifications',
			'native-picker',
			'date-picker',
			'context-menu',
			'sheet',
			'macos-webview',
			'macos-native',
			'linux-package',
			'linux-gtk',
			'web-rendering',
			'windows-setup',
		],
	},
	{
		dir: 'testing',
		label: 'Check your app',
		slugs: [
			'testing',
			'component-workshop',
			'test-identifiers',
			'maestro',
			'argent',
			'development-actions',
			'diagnostics',
			'production-errors',
			'image-performance',
			'known-limits',
		],
	},
]

// The index doc lives at '/', not /README.
export const INDEX_SLUG = 'README'

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
// 'README'; a directory's own README/index becomes the directory name.
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
export function docPath(slug: string): string {
	return slug === INDEX_SLUG ? '/' : `/${slug}`
}
