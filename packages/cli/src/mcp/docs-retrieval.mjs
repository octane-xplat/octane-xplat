// Documentation retrieval over a pinned release snapshot
// (plans/octane-xplat-mcp.md). Exact search and page reads walk the snapshot
// directly — no index or embedding pass may block them. Maintained guides are
// canonical; design notes and LLM exports are labeled views, never silently
// mixed into supported-API guidance.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, join, relative, sep } from 'node:path'

// Repo-relative doc corpus → corpus label. guides are canonical; the rest are
// labeled alternates.
const CORPORA = [
	{ root: 'docs/notes', corpus: 'design-note' },
	{ root: 'docs', corpus: 'guide' },
	{ root: 'recipes', corpus: 'recipe' },
]

const PLATFORMS = ['web', 'ios', 'android', 'macos', 'linux', 'windows']

function* walk(dir) {
	let entries
	try {
		entries = readdirSync(dir)
	} catch {
		return
	}

	for (const name of entries) {
		if (name.startsWith('.') || name === 'node_modules') {
			continue
		}

		const path = join(dir, name)
		const stat = statSync(path, { throwIfNoEntry: false })
		if (!stat) {
			continue
		}

		if (stat.isDirectory()) {
			yield* walk(path)
		} else if (name.endsWith('.md')) {
			yield path
		}
	}
}

function titleOf(content, path) {
	const heading = content.match(/^#\s+(.+)$/m)
	return heading ? heading[1].trim() : basename(path, '.md')
}

/** First `# heading`-level doc inventory of a snapshot root. */
export function listDocs(rootDir) {
	const docs = []
	for (const { root, corpus } of CORPORA) {
		const dir = join(rootDir, root)
		if (!existsSync(dir)) {
			continue
		}

		for (const file of walk(dir)) {
			const rel = relative(rootDir, file).split(sep).join('/')
			if (corpus === 'guide' && rel.startsWith('docs/notes/')) {
				continue
			}

			docs.push({ path: rel, corpus, root: dir, file })
		}
	}

	return docs
}

function platformsOf(path, content) {
	const hay = `${path}\n${content.slice(0, 2000)}`.toLowerCase()
	return PLATFORMS.filter((p) => new RegExp(`\\b${p}\\b`).test(hay))
}

function excerpt(content, needle) {
	const idx = needle ? content.toLowerCase().indexOf(needle.toLowerCase()) : 0
	const at = idx < 0 ? 0 : idx
	const start = Math.max(0, content.lastIndexOf('\n\n', at))
	const end = Math.min(content.length, at + 480)
	const line = content.slice(0, at).split('\n').length
	return { excerpt: content.slice(start, end).trim(), line }
}

/**
 * Exact/token search over a snapshot's doc corpus. Phrase hits rank above
 * all-token hits; design notes and recipes keep their corpus label.
 */
export function searchDocs(rootDir, { query, corpus, platform, limit = 10 }) {
	const needle = query.trim().toLowerCase()
	const tokens = needle.split(/\s+/).filter(Boolean)
	const scored = []
	for (const doc of listDocs(rootDir)) {
		if (corpus && doc.corpus !== corpus) {
			continue
		}

		const content = readFileSync(doc.file, 'utf8')
		const hay = `${doc.path}\n${titleOf(content, doc.path)}\n${content}`.toLowerCase()
		if (platform && !platformsOf(doc.path, content).includes(platform)) {
			continue
		}

		let score = 0
		if (hay.includes(needle)) {
			score += 100
		}

		const hits = tokens.filter((t) => hay.includes(t)).length
		if (hits === 0) {
			continue
		}

		score += hits
		if (doc.path.toLowerCase().includes(needle)) {
			score += 10
		}

		scored.push({ doc, content, score })
	}

	scored.sort((a, b) => b.score - a.score)
	return scored.slice(0, limit).map(({ doc, content }) => ({
		path: doc.path,
		corpus: doc.corpus,
		title: titleOf(content, doc.path),
		platforms: platformsOf(doc.path, content),
		...excerpt(content, needle),
	}))
}

/**
 * Bounded page read — offset/limit slice with a continuation marker, same
 * binding rules as search (a page read can never drift to another version).
 */
export function readPage(rootDir, relPath, { offset = 0, limit = 24_000 } = {}) {
	if (!relPath.endsWith('.md') || relPath.startsWith('/') || relPath.split('/').includes('..')) {
		return null
	}

	const file = join(rootDir, relPath)
	if (!existsSync(file)) {
		return null
	}

	const content = readFileSync(file, 'utf8')
	const doc = listDocs(rootDir).find((d) => d.path === relPath)
	const slice = content.slice(offset, offset + limit)
	return {
		path: relPath,
		corpus: doc?.corpus ?? 'guide',
		title: titleOf(content, relPath),
		platforms: platformsOf(relPath, content),
		content: slice,
		offset,
		nextOffset: offset + limit < content.length ? offset + limit : null,
		totalLength: content.length,
	}
}

/** `xplat-doc://<pkg>@<version>/<repo-path>` reference for a doc hit. */
export function docRef(packageName, version, path) {
	return `xplat-doc://${packageName}@${version}/${path}`
}

export function parseDocRef(ref) {
	const m = /^xplat-doc:\/\/(.+)@([^/]+)\/(.+)$/.exec(ref)
	return m ? { package: m[1], version: m[2], path: m[3] } : null
}
