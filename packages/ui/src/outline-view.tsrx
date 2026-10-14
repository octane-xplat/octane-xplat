/** @jsxImportSource @nativescript-community/octane */
// Native leaf — `useOutlineFromView` walks the bound view subtree once it
// mounts (and re-walks when the container view instance changes). Views with
// accessibilityRole 'header' contribute items. DOM discovery stays web-only
// (`useOutlineFromDOM` under `@octane-xplat/ui/web`).
import { useEffect, useState } from 'octane'
import type { OutlineItem } from './props'
import { outlineItemsFromViewTree } from './outline-view-tree'

/** `useOutlineFromView` — outline items from a native view subtree. Pass a
 *  `ref`-style object (`{current}`) holding the scroll container's (or
 *  page's) root view, or the view itself. There is no mutation observation
 *  on the NS view tree, so the outline is collected once after mount and
 *  again whenever `containerRef.current` changes — use
 *  `useOutlineFromMarkdown`/`useOutlineFromDoc` (or pass `items` directly)
 *  when the heading set is dynamic. */
export function useOutlineFromView(containerRef?: unknown): OutlineItem[] {
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
