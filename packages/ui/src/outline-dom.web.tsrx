// Web leaf — collects headings from a live DOM container and keeps them
// current through MutationObserver. Only heading elements h1–h6 contribute;
// `id` falls back to a slug derived from the heading text.
import { useEffect, useMemo, useRef, useState } from 'octane'
import type { OutlineFromDOMOptions, OutlineItem } from './props'
import { slugify, uniqueSlug } from './outline-utils'

/** Read the heading tree from a container (or the document) — each entry
 *  carries the element's id (or a slug of its text) and its tag level. */
export function outlineItemsFromDOM(
	container?: ParentNode | null,
	selector = 'h1, h2, h3, h4, h5, h6',
): OutlineItem[] {
	const root: ParentNode | undefined = container ?? (typeof document !== 'undefined' ? document : undefined)
	if (!root) return []
	const nodes = root.querySelectorAll(selector)
	const counts = new Map<string, number>()
	const items: OutlineItem[] = []
	for (const node of nodes) {
		const el = node as HTMLElement
		const level = Number(el.tagName?.slice(1)) || 2
		const label = (el.innerText ?? el.textContent ?? '').trim()
		if (!label) continue
		const id = el.id || uniqueSlug(slugify(label), counts)
		items.push({ id, label, level })
	}

	return items
}

/** `useOutlineFromDOM` — keeps the item list in sync with the container's
 *  heading nodes via MutationObserver. The container may be a ref object
 *  (`{current}`) or a DOM node. */
export function useOutlineFromDOM(
	containerRef?: unknown,
	options?: OutlineFromDOMOptions,
): OutlineItem[] {
	const [items, setItems] = useState<OutlineItem[]>([])
	const resolve = () => {
		const source = containerRef && typeof containerRef === 'object' && 'current' in containerRef
			? (containerRef as { current?: unknown }).current
			: containerRef

		return (source ?? options?.root ?? (typeof document !== 'undefined' ? document : null)) as ParentNode | null
	}

	useEffect(() => {
		const refresh = () => setItems(outlineItemsFromDOM(resolve(), options?.selector))
		refresh()
		const root = resolve()
		const observer = new MutationObserver(refresh)
		if (root) {
			observer.observe(root as Node, { childList: true, subtree: true, characterData: true })
		} else if (typeof document !== 'undefined') {
			observer.observe(document.body, { childList: true, subtree: true, characterData: true })
		}

		return () => observer.disconnect()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [options?.selector])

	return items
}
