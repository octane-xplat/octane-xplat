import { chatHost } from './chat-scroll-host'
import { isChatRow } from './chat-scroll-state'

/** @internal Keep a retained row at the same viewport pixel after prepend or
 * growth above it. A genuine scroll replaces the anchor rather than fighting it. */
export function bindChatReadingAnchor(
	content: object,
	viewport: object,
	following: () => boolean,
): (() => void) & { update(): void } {
	const scroll = chatHost.scroll(viewport)
	if (!scroll?.on) {
		return Object.assign(() => {}, { update() {} })
	}
	let active = true,
		correcting = false
	let anchor: { row: object; y: number; offset: number } | null = null
	const capture = () => {
		if (!active || correcting) {
			return
		}
		const children = chatHost.children(content)
		const marked = children.filter(isChatRow)
		for (const row of marked.length ? marked : children) {
			const rect = chatHost.position(row, viewport)
			if (
				rect &&
				rect.height > 0 &&
				rect.y + rect.height > 0 &&
				rect.y < chatHost.height(viewport)
			) {
				anchor = { row, y: rect.y, offset: scroll.verticalOffset ?? 0 }
				return
			}
		}
		anchor = null
	}
	const changed = () => {
		if (!active || correcting) {
			return
		}
		if (!following() && anchor && chatHost.contains(content, anchor.row)) {
			const rect = chatHost.position(anchor.row, viewport)
			if (rect && Math.abs(rect.y - anchor.y) > 0.5) {
				correcting = true
				try {
					scroll.scrollToVerticalOffset(
						Math.max(
							0,
							Math.min(
								scroll.scrollableHeight ?? 0,
								(scroll.verticalOffset ?? 0) + rect.y - anchor.y,
							),
						),
						false,
					)
				} finally {
					correcting = false
				}
			}
		}
		capture()
	}
	const scrolled = () => {
		if (!anchor || Math.abs((scroll.verticalOffset ?? 0) - anchor.offset) > 0.5) {
			capture()
		}
	}
	scroll.on('scroll', scrolled)
	capture()
	return Object.assign(
		() => {
			active = false
			scroll.off('scroll', scrolled)
			anchor = null
		},
		{ update: changed },
	)
}
