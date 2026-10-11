// Optional local semantic index (plans/octane-xplat-mcp.md work item C).
// Embeddings are local-only TF-IDF vectors over identifier-aware tokens — no
// code leaves the machine, and no remote backend exists without an explicit
// opt-in this service does not implement. The index is acceleration only:
// it builds in the background, reports preparing/ready/stale/unavailable, and
// exact retrieval never waits on it. Similarity rank means relevance, not
// correctness or platform support.

import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

const CHUNK_LINES = 48
const CHUNK_STRIDE = 40
const MAX_INDEX_FILES = 4000
const MAX_INDEX_BYTES = 8 * 1024 * 1024
const MAX_CHUNKS = 15000
const YIELD_EVERY_FILES = 40

const hashText = (text) => createHash('sha1').update(text).digest('hex')

const pause = () => new Promise((resolve) => setImmediate(resolve))

/**
 * Identifier-aware tokens: `useCameraCapture` yields `usecameracapture`,
 * `use`, `camera`, `capture`; snake_case splits likewise. Intent queries match
 * on the subtokens; identifier queries hit the full form too.
 */
export function codeTokens(text) {
	const out = []
	for (const word of text.split(/[^\p{L}\p{N}_$]+/u)) {
		if (!word) {
			continue
		}

		const parts = word
			.split(/_+/)
			.flatMap((piece) => piece.split(/(?<=[a-z\d])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])/))

		for (const part of parts) {
			const lower = part.toLowerCase()
			if (lower.length >= 2) {
				out.push(lower)
			}
		}

		if (word.length >= 2 && /^[\w$]+$/.test(word)) {
			out.push(word.toLowerCase())
		}
	}

	return out
}

function chunkFile(rel, abs, corpus, content) {
	const lines = content.split('\n')
	const chunks = []
	for (let start = 0; start < lines.length; start += CHUNK_STRIDE) {
		const end = Math.min(lines.length, start + CHUNK_LINES)
		const text = lines.slice(start, end).join('\n')
		if (text.trim().length < 40 && chunks.length) {
			continue
		}

		chunks.push({
			file: { abs, rel, corpus },
			startLine: start + 1,
			endLine: end,
			text,
			hash: hashText(text),
			tokens: codeTokens(`${rel}\n${text}`),
		})

		if (end === lines.length) {
			break
		}
	}

	return chunks
}

/**
 * The semantic index over a file set the caller enumerates. `ensure(collect)`
 * kicks a background build whenever the manifest disagrees with the current
 * file set; it never blocks. `search` serves whatever the last completed
 * build produced and revalidates served chunks against current content.
 */
export function createCodeIndex() {
	let manifest = new Map() // key -> { mtimeMs, size }
	let chunks = [] // { file, startLine, endLine, hash, vector: Map }
	let idf = new Map()
	let state = 'not-built'
	let detail
	let building = null
	let revision = 0
	let builtFiles = 0
	let truncated = false

	const fileKey = (file) => `${file.corpus.corpus}:${file.corpus.package ?? ''}:${file.rel}`

	/** Stat-level drift check — cheap enough to run per query. */
	function manifestDrift(files) {
		if (files.length !== manifest.size) {
			return true
		}

		for (const file of files) {
			const prev = manifest.get(fileKey(file))
			if (!prev || prev.mtimeMs !== file.mtimeMs || prev.size !== file.size) {
				return true
			}
		}

		return false
	}

	async function build(files) {
		const nextManifest = new Map(
			files.map((f) => [fileKey(f), { mtimeMs: f.mtimeMs, size: f.size }]),
		)

		const nextChunks = []
		const df = new Map()
		let bytes = 0
		let counted = 0
		let capped = false

		for (let i = 0; i < files.length; i++) {
			const file = files[i]
			if (
				counted >= MAX_INDEX_FILES ||
				bytes > MAX_INDEX_BYTES ||
				nextChunks.length >= MAX_CHUNKS
			) {
				capped = true
				break
			}

			let content
			try {
				content = readFileSync(file.abs, 'utf8')
			} catch {
				continue
			}

			bytes += content.length
			counted++
			for (const chunk of chunkFile(file.rel, file.abs, file.corpus, content)) {
				if (nextChunks.length >= MAX_CHUNKS) {
					capped = true
					break
				}

				nextChunks.push(chunk)
				for (const token of new Set(chunk.tokens)) {
					df.set(token, (df.get(token) ?? 0) + 1)
				}
			}

			if (i % YIELD_EVERY_FILES === YIELD_EVERY_FILES - 1) {
				await pause()
			}
		}

		const nextIdf = new Map()
		for (const [token, n] of df) {
			nextIdf.set(token, Math.log(1 + nextChunks.length / n))
		}

		for (const chunk of nextChunks) {
			const tf = new Map()
			for (const token of chunk.tokens) {
				tf.set(token, (tf.get(token) ?? 0) + 1)
			}

			let norm = 0
			const vector = new Map()
			for (const [token, n] of tf) {
				const w = n * (nextIdf.get(token) ?? 0)
				vector.set(token, w)
				norm += w * w
			}

			chunk.vector = vector
			chunk.norm = Math.sqrt(norm) || 1
		}

		manifest = nextManifest
		chunks = nextChunks
		idf = nextIdf
		builtFiles = counted
		truncated = capped
		revision += 1
		state = 'ready'
		detail = capped
			? `index coverage capped at ${counted} files / ${nextChunks.length} chunks`
			: undefined
	}

	/** chunk still matches the file's current bytes at the same lines. */
	function revalidate(chunk) {
		let content
		try {
			content = readFileSync(chunk.file.abs, 'utf8')
		} catch {
			return 'gone'
		}

		const lines = content.split('\n')
		const region = lines.slice(chunk.startLine - 1, chunk.endLine).join('\n')
		return hashText(region) === chunk.hash ? 'current' : 'stale'
	}

	return {
		/**
		 * Kick a build when needed; returns the current status snapshot. Never
		 * blocks: the build runs interleaved on the event loop.
		 */
		ensure(collectFiles) {
			let files
			try {
				files = collectFiles()
			} catch (error) {
				state = 'unavailable'
				detail = `corpus enumeration failed: ${error?.message ?? error}`
				return this.status()
			}

			const drift = state === 'not-built' || manifestDrift(files)
			if (drift && !building) {
				state = state === 'not-built' ? 'preparing' : 'stale'
				building = build(files)
					.catch((error) => {
						state = 'unavailable'
						detail = `index build failed: ${error?.message ?? error}`
					})
					.finally(() => {
						// Drift detected during the build is picked up by the next
						// ensure — the manifest check runs per query.
						building = null
					})
			} else if (drift) {
				state = 'stale'
			}

			return this.status()
		},

		/** Resolve when the in-flight (or first) build completes. */
		async whenReady(collectFiles) {
			this.ensure(collectFiles)
			await building
			return this.status()
		},

		status() {
			return {
				state: state === 'not-built' ? 'unavailable' : state,
				detail:
					detail ??
					(state === 'not-built'
						? 'semantic index builds on first search; exact search needs no index'
						: undefined),
				backend: 'local-tfidf',
				files: builtFiles,
				chunks: chunks.length,
				truncated: truncated || undefined,
				revision,
			}
		},

		/**
		 * Ranked semantic hits over the last completed build. When the index
		 * is stale, each candidate is revalidated against the file's current
		 * content before serving — changed or deleted content is never
		 * presented as current.
		 */
		search(query, { accept, limit = 10 } = {}) {
			if (state !== 'ready' && state !== 'stale') {
				return { hits: [], droppedStale: 0 }
			}

			const qtf = new Map()
			for (const token of codeTokens(query)) {
				qtf.set(token, (qtf.get(token) ?? 0) + 1)
			}

			const qvec = new Map()
			let qnorm = 0
			for (const [token, n] of qtf) {
				const w = n * (idf.get(token) ?? Math.log(1 + Math.max(1, chunks.length)))
				qvec.set(token, w)
				qnorm += w * w
			}

			qnorm = Math.sqrt(qnorm) || 1

			const scored = []
			for (const chunk of chunks) {
				if (accept && !accept(chunk.file)) {
					continue
				}

				let dot = 0
				for (const [token, w] of qvec) {
					const cw = chunk.vector.get(token)
					if (cw) {
						dot += w * cw
					}
				}

				if (dot > 0) {
					scored.push({ chunk, score: dot / (qnorm * chunk.norm) })
				}
			}

			scored.sort((a, b) => b.score - a.score)

			const hits = []
			let droppedStale = 0
			for (const { chunk, score } of scored) {
				if (hits.length >= limit) {
					break
				}

				// Stale index → revalidate before serving; drifted chunks drop
				// out rather than masquerade as current source.
				const validity = state === 'stale' ? revalidate(chunk) : 'current'
				if (validity !== 'current') {
					droppedStale++
					continue
				}

				hits.push({ chunk, score })
			}

			return { hits, droppedStale }
		},

		/** True while a build is in flight (tests and status use this). */
		get preparing() {
			return building !== null
		},
	}
}
