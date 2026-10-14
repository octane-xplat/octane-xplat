// Portable outline hooks — shared across web and native leaves.
// `useOutlineFromMarkdown` is identical on every target (pure parse); tree
// discovery is platform-specific: `useOutlineFromDOM` (live DOM observation)
// ships under `@octane-xplat/ui/web`, and `useOutlineFromView` (view-tree
// snapshot) lives in outline-view.tsrx / outline-view.macos.tsrx.
import { useMemo } from 'octane'
import { outlineFromDoc, parseOutlineFromMarkdown } from './outline-utils'
import type { MdDoc } from './Markdown'
import type { OutlineItem } from './props'

/** Heading outline items derived from Markdown source — one entry per ATX or
 *  Setext heading, labelled by the inline text, id'd by the deduplicated
 *  slug (same slugify/uniqueSlug contract as upstream). */
export function useOutlineFromMarkdown(markdown: string): OutlineItem[] {
	return useMemo(() => parseOutlineFromMarkdown(markdown), [markdown])
}

/** Outline items from a baked `MdDoc` (the `xplat routes`/`Markdown` AST) —
 *  the portable form of "outline the document I'm rendering". */
export function useOutlineFromDoc(doc: MdDoc): OutlineItem[] {
	return useMemo(() => outlineFromDoc(doc), [doc])
}
