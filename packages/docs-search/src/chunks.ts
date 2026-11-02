import { createHash } from 'node:crypto'

/** One Markdown file from a caller-validated, version-bound snapshot. */
export interface Document {
	path: string
	corpus: string
	content: string
}

/** A section excerpt whose line range refers to the original Markdown file. */
export interface Chunk {
	key: string
	path: string
	corpus: string
	title: string
	heading: string
	line: number
	endLine: number
	content: string
	releaseVersion?: string
	releaseDate?: string
}

/** Compute a stable SHA-256 fingerprint for a chunk or inventory. */
export const hash = (text: string) => createHash('sha256').update(text).digest('hex')

/** Split at headings/paragraphs, preserving fenced examples and release ownership. */
export function chunkMarkdown(doc: Document): Chunk[] {
	const lines = doc.content.split('\n')
	const chunks: Chunk[] = []
	let title = doc.path
	let heading = ''
	let releaseVersion: string | undefined
	let releaseDate: string | undefined
	let start = 0
	let fence = ''
	let size = 0
	const emit = (end: number) => {
		const content = lines.slice(start, end).join('\n').trim()
		if (content) {
			chunks.push({
				key: hash(`${doc.path}:${start}:${content}`),
				path: doc.path,
				corpus: doc.corpus,
				title,
				heading,
				line: start + 1,
				endLine: end,
				content,
				...(releaseVersion ? { releaseVersion } : {}),
				...(releaseDate ? { releaseDate } : {}),
			})
		}
		start = end
		size = 0
	}
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i]
		const marker = /^\s{0,3}(`{3,}|~{3,})/.exec(line)?.[1]
		if (marker) {
			if (!fence) {
				fence = marker
			} else if (marker[0] === fence[0] && marker.length >= fence.length) {
				fence = ''
			}
		} else if (!fence) {
			const h = /^(#{1,6})\s+(.+)$/.exec(line)
			if (h) {
				emit(i)
				heading = h[2]
				if (h[1].length === 1) {
					title = heading
				}

				if (doc.corpus === 'changelog' && h[1].length <= 2) {
					const release = /(?:Octane Xplat\s+|\[v?|^v?)(\d+\.\d+\.\d+(?:-[\w.-]+)?)/.exec(heading)
					releaseVersion = release?.[1]
					releaseDate = /\b\d{4}-\d{2}-\d{2}\b/.exec(heading)?.[0]
				}
			} else if (size >= 900 && line.trim() === '') {
				emit(i + 1)
			}
		}

		size += line.length + 1
	}
	emit(lines.length)
	return chunks
}
