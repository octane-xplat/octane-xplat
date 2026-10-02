/** @jsxImportSource @octane-xplat/macos-renderer */
// macOS leaf — same duck-typed subtree walk as the mobile leaf (the AppKit
// host exposes `children`/`subviews` on its view wrappers). No mutation
// observation: collected on mount and when the container view changes.
import { useEffect, useState } from 'octane'
import type { OutlineFromDOMOptions, OutlineItem } from './props'
import { outlineItemsFromViewTree } from './outline-view-tree'

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
