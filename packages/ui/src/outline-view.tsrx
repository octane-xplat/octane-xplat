/** @jsxImportSource @octane-xplat/jsx */
// Native leaf — `useOutlineFromView` walks the bound view subtree once it
// mounts (and re-walks when the container view instance changes). Views with
// accessibilityRole 'header' contribute items. DOM discovery stays web-only
// (`useOutlineFromDOM` under `@octane-xplat/ui/web`).
import { useEffect, useState } from 'octane'
import type { OutlineFromViewCapabilities, OutlineItem } from './props'
import { outlineItemsFromViewTree } from './outline-view-tree'

/** NativeScript can discover `Heading` items once from a bound view subtree.
 *  The snapshot does not observe later changes to that subtree.
 *
 * @example
 * ```ts
 * const { isSupported, mode } = getOutlineFromViewCapabilities()
 * // NativeScript: { isSupported: true, mode: 'snapshot' }
 * ```
 */
export function getOutlineFromViewCapabilities(): OutlineFromViewCapabilities {
	return { isSupported: true, mode: 'snapshot' }
}

/** `useOutlineFromView` — outline items from a native view subtree. Pass a
 *  `ref`-style object (`{current}`) holding the scroll container's (or
 *  page's) root view, or the view itself. There is no mutation observation
 *  on the NS view tree, so the outline is collected once after mount and
 *  again whenever `containerRef.current` changes — use
 *  `useOutlineFromMarkdown`/`useOutlineFromDoc` (or pass `items` directly)
 *  when the heading set is dynamic. Check `getOutlineFromViewCapabilities()`
 *  before relying on native-view discovery. */
export function useOutlineFromView(containerRef?: unknown): OutlineItem[] {
	const [items, setItems] = useState<OutlineItem[]>([])

	useEffect(() => {
		const view =
			containerRef && typeof containerRef === 'object' && 'current' in containerRef
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
