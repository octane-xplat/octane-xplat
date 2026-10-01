// Outline data helpers — the portable half of Astryx's Outline utilities.
// slugify/uniqueSlug are byte-identical to upstream (same ids). The markdown
// scanner is a focused replacement for upstream's full parser pipeline: it
// understands ATX and Setext headings, fenced/indented code, and strips the
// inline constructs the local Markdown renderer supports. It has no plugin
// surface (the local Markdown AST has no extension nodes — see
// docs/components.md).
import type { OutlineItem } from './props'
export type { OutlineItem } from './props'
import type { MdDoc, MdInline } from './Markdown'

/** Slug a heading label the same way upstream's parser does: lowercase,
 *  quotes dropped, non-alphanumerics collapse to '-', edges trimmed. */
export function slugify(value: string): string {
	return value
		.trim()
		.toLowerCase()
		.replace(/['"]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
}

/** Disambiguate repeated slugs with a numeric suffix (`setup`, `setup-1`, …).
 *  Empty slugs fall back to `section`. The caller owns the counts map. */
export function uniqueSlug(baseSlug: string, counts: Map<string, number>): string {
	const fallbackSlug = baseSlug || 'section'
	const count = counts.get(fallbackSlug) ?? 0
	counts.set(fallbackSlug, count + 1)
	return count === 0 ? fallbackSlug : `${fallbackSlug}-${count}`
}

// ---------------------------------------------------------------------------
// Markdown heading extraction
// ---------------------------------------------------------------------------

const FENCE = /^(?:`{3,}|~{3,})/
const ATX = /^ {0,3}(#{1,6})[ \t]+(.+?)[ \t]*#*[ \t]*$/
const SETEXT_H1 = /^ {0,3}=+[ \t]*$/
const SETEXT_H2 = /^ {0,3}-+[ \t]*$/
const BLANK = /^\s*$/

/** Strip the inline constructs the local Markdown AST supports (code spans,
 *  emphasis, links, images, escapes), leaving the visible text — matching
 *  what `markdownAstText` produces upstream. */
export function inlineMarkdownText(source: string): string {
	let text = source
	// Images first: ![alt](src) → alt (upstream keeps alt text only)
	text = text.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
	// Links: [text](href) → text
	text = text.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
	// Inline code: `code` → code
	text = text.replace(/`([^`]*)`/g, '$1')
	// Bold/italic markers
	text = text.replace(/\*\*([^*]+)\*\*/g, '$1')
	text = text.replace(/__([^_]+)__/g, '$1')
	text = text.replace(/\*([^*]+)\*/g, '$1')
	text = text.replace(/\b_([^_]+)_\b/g, '$1')
	// Strikethrough
	text = text.replace(/~~([^~]+)~~/g, '$1')
	// Backslash escapes
	text = text.replace(/\\([\\`*{}[\]()#+\-.!_>~])/g, '$1')
	// HTML tags are not rendered by the local Markdown AST — drop them.
	text = text.replace(/<[^>]+>/g, '')
	return text.trim()
}

interface ParsedHeading {
	label: string
	level: number
}

/**
 * Scan markdown source for headings. Not a general parser — it exists to
 * produce outline labels that agree with what the Markdown component renders
 * for the same source. Fenced code blocks (```/~~~) and 4-space-indented
 * lines are never headings; Setext underlines promote the previous
 * non-blank line.
 */
export function markdownHeadings(markdown: string): ParsedHeading[] {
	const headings: ParsedHeading[] = []
	const lines = markdown.split('\n')
	let fenced = false
	let fenceMarker = ''
	let previousTextLine = ''

	for (const line of lines) {
		const fenceMatch = line.match(FENCE)
		if (fenceMatch) {
			if (!fenced) {
				fenced = true
				fenceMarker = fenceMatch[0][0]
			} else if (fenceMatch[0][0] === fenceMarker) {
				fenced = false
			}

			previousTextLine = ''
			continue
		}

		if (fenced) {
			continue
		}

		const atx = line.match(ATX)
		if (atx) {
			headings.push({ label: inlineMarkdownText(atx[2]), level: atx[1].length })
			previousTextLine = ''
			continue
		}

		if (SETEXT_H1.test(line) || SETEXT_H2.test(line)) {
			if (!BLANK.test(previousTextLine)) {
				headings.push({
					label: inlineMarkdownText(previousTextLine.trim()),
					level: line.includes('=') ? 1 : 2,
				})

				previousTextLine = ''
				continue
			}
		}

		// 4-space indented lines are code blocks, never text.
		previousTextLine = /^ {4}/.test(line) ? '' : line
	}

	return headings
}

/**
 * Extract outline items from a Markdown string: heading text becomes the
 * label, its slug (with per-document dedup) becomes the id. For
 * `useOutlineFromMarkdown` parity on MdDoc-shaped data see
 * {@link outlineFromDoc}.
 */
export function parseOutlineFromMarkdown(markdown: string): OutlineItem[] {
	const counts = new Map<string, number>()
	return markdownHeadings(markdown)
		.filter((heading) => heading.label !== '')
		.map((heading) => ({
			id: uniqueSlug(slugify(heading.label), counts),
			label: heading.label,
			level: heading.level,
		}))
}

function inlineNodesText(nodes: readonly MdInline[] | undefined): string {
	let out = ''
	for (const node of nodes ?? []) {
		out +=
			node.t === 'text' || node.t === 'code'
				? node.text
				: node.t === 'link'
					? node.text
					: inlineNodesText(node.children)
	}

	return out
}

/** Outline items from a baked `MdDoc` (the AST `xplat routes` produces and
 *  the `Markdown` component renders) — the portable equivalent of deriving
 *  an outline from rendered markdown content. */
export function outlineFromDoc(doc: MdDoc): OutlineItem[] {
	const counts = new Map<string, number>()
	const items: OutlineItem[] = []
	for (const node of doc.children ?? []) {
		if (node.t !== 'h') {
			continue
		}

		const label = inlineNodesText(node.children).trim()
		if (!label) {
			continue
		}

		items.push({ id: uniqueSlug(slugify(label), counts), label, level: node.depth })
	}

	return items
}
