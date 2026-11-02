// Outline data helpers — the portable half of Astryx's Outline utilities.
// slugify/uniqueSlug are byte-identical to upstream (same ids). Heading
// extraction derives from the canonical parser/document, so outline labels
// always agree with what the Markdown component renders — the same contract
// upstream's headingProjection enforces (top-level headings only).
import type { OutlineItem } from '../../props'
export type { OutlineItem } from '../../props'
import type { MdDoc, MdInline } from '../../markdown/Markdown.tsrx'
import { mdInlineText } from '../../markdown/markdown-ast'
import { parseMdInline, parseMdNodes } from '../../markdown/markdown-parse'

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

/** Visible text of an inline-Markdown source fragment — parses it and
 *  projects to text, so escapes, entities, emphasis, links, and code spans
 *  resolve exactly as the renderer reads them. */
export function inlineMarkdownText(source: string): string {
	return mdInlineText(parseMdInline(source)).trim()
}

interface ParsedHeading {
	label: string
	level: number
}

/**
 * Scan markdown source for top-level headings — the same projection the
 * canonical parser produces (ATX and Setext headings inside fenced code,
 * blockquotes, and list items never surface here).
 */
export function markdownHeadings(markdown: string): ParsedHeading[] {
	const headings: ParsedHeading[] = []
	for (const node of parseMdNodes(markdown)) {
		if (node.type !== 'heading') {
			continue
		}

		headings.push({ label: mdInlineText(node.children).trim(), level: node.depth })
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

/** Outline items from a baked `MdDoc` (the AST `xplat routes` produces and
 *  the `Markdown` component renders) — the portable equivalent of deriving
 *  an outline from rendered markdown content. */
export function outlineFromDoc(doc: MdDoc): OutlineItem[] {
	const counts = new Map<string, number>()
	const items: OutlineItem[] = []
	for (const node of doc.children ?? []) {
		if (node.type !== 'heading') {
			continue
		}

		const label = mdInlineText(node.children as readonly MdInline[]).trim()
		if (!label) {
			continue
		}

		items.push({ id: uniqueSlug(slugify(label), counts), label, level: node.depth })
	}

	return items
}
