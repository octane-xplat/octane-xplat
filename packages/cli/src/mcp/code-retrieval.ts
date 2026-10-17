// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
// Exact/token code retrieval over current source files
// (plans/octane-xplat-mcp.md work item C). Every hit is a live read — exact
// search never consults the semantic index, so it stays usable while the
// index is absent, preparing, stale, or failed. Results are leads: the agent
// opens the referenced source before recommending or changing an API.

import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

const EXCERPT_RADIUS = 8 // lines of context above/below the hit
const EXCERPT_MAX = 900 // chars

const splitTokens = (text) =>
	text
		.toLowerCase()
		.split(/[^\p{L}\p{N}_$]+/u)
		.filter((t) => t.length > 0)

const contentHash = (text) => createHash('sha1').update(text).digest('hex').slice(0, 12)

const looksLikeIdentifier = (query) => /^[A-Za-z_$][\w$]*$/.test(query.trim())

/**
 * Exact/token search over already-enumerated corpus files. A single
 * identifier-looking query gets a word-boundary boost; multi-token queries
 * score phrase hits above all-token hits.
 *
 * @param {Array<{abs, rel, corpus}>} files corpus file entries tagged with
 *   their corpus descriptor
 * @returns scored hits: { corpus, file, line, endLine, excerpt, contentHash }
 */
export function searchCodeFiles(files, { query, limit = 10 }) {
	const needle = query.trim().toLowerCase()
	if (!needle) {
		return []
	}

	const tokens = splitTokens(needle)
	const identifier = looksLikeIdentifier(query)
	const boundary = identifier ? new RegExp(`\\b${escapeRe(query.trim())}\\b`) : null

	const scored = []
	for (const file of files) {
		let content
		try {
			content = readFileSync(file.abs, 'utf8')
		} catch {
			continue
		}

		const hay = `${file.rel}\n${content}`.toLowerCase()
		const hits = tokens.filter((t) => hay.includes(t)).length
		if (hits === 0) {
			continue
		}

		let score = hits
		if (hay.includes(needle)) {
			score += 100
		}

		if (boundary && boundary.test(content)) {
			score += 25
		}

		if (file.rel.toLowerCase().includes(needle)) {
			score += 10
		}

		const { line, endLine, excerpt } = excerptAt(content, needle, tokens)
		scored.push({
			corpus: file.corpus,
			file,
			score,
			line,
			endLine,
			excerpt,
			contentHash: contentHash(content),
		})
	}

	scored.sort((a, b) => b.score - a.score)
	return scored.slice(0, limit)
}

const escapeRe = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function excerptAt(content, needle, tokens) {
	const lower = content.toLowerCase()
	let at = lower.indexOf(needle)
	if (at < 0) {
		for (const token of tokens) {
			at = lower.indexOf(token)
			if (at >= 0) {
				break
			}
		}
	}

	if (at < 0) {
		at = 0
	}

	const lines = content.split('\n')
	let line = content.slice(0, at).split('\n').length - 1
	const start = Math.max(0, line - 2)
	const end = Math.min(lines.length, line + EXCERPT_RADIUS)
	let excerpt = lines.slice(start, end).join('\n')
	if (excerpt.length > EXCERPT_MAX) {
		excerpt = excerpt.slice(0, EXCERPT_MAX)
	}

	return { line: start + 1, endLine: end, excerpt: excerpt.trim() }
}

/**
 * Bounded read of a resolved corpus file — byte offset/limit slice with a
 * continuation marker, mirroring the docs page-read contract. Returns null
 * when the file vanished (the caller reports that honestly instead of serving
 * a stale snippet).
 */
export function readCodeFile(abs, { offset = 0, limit = 24_000 } = {}) {
	let content
	try {
		content = readFileSync(abs, 'utf8')
	} catch {
		return null
	}

	if (content.includes('\0')) {
		return null
	}

	const slice = content.slice(offset, offset + limit)
	const lines = content.split('\n')
	const line = content.slice(0, offset).split('\n').length
	const endLine = Math.min(lines.length, line + slice.split('\n').length - 1)
	return {
		content: slice,
		offset,
		nextOffset: offset + limit < content.length ? offset + limit : null,
		totalLength: content.length,
		line,
		endLine,
		contentHash: contentHash(content),
	}
}
