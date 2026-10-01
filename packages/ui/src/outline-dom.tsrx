/** @jsxImportSource @nativescript-community/octane */
// Native leaf — no DOM or MutationObserver, so `useOutlineFromDOM` walks the
// bound view subtree once it mounts (and re-walks when the container view
// instance changes). Views with accessibilityRole 'header' contribute items.
import { useEffect, useState } from 'octane'
import type { OutlineFromDOMOptions, OutlineItem } from './props'
import { outlineItemsFromViewTree } from './outline-view-tree'

/** `useOutlineFromDOM` — native form. The DOM API name is kept for API
 *  parity; the argument is a `bind`/`ref`-style object holding the scroll
 *  container's (or page's) root view. There is no mutation observation on
 *  the NS view tree, so the outline is collected once after mount and again
 *  whenever `containerRef.current` changes — use `useOutlineFromMarkdown`
 *  (or pass `items` directly) when the heading set is dynamic. */
export function useOutlineFromDOM(containerRef?: unknown, _options?: OutlineFromDOMOptions): OutlineItem[] {
	const [items, setItems] = useState<OutlineItem[]>([])

	useEffect(() => {
		const view = containerRef && typeof containerRef === 'object' && 'current' in containerRef
			? (containerRef as { current?: any }).current
			: containerRef

		if (!view) {
			setItems([])
			return
		}

		setItems(outlineItemsFromViewTree(view))
	})

	return items
}
