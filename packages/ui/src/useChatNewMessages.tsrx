/** @jsxImportSource @octane-xplat/jsx */
import { useCallback, useEffect, useRef, useState } from 'octane'
import { bindChatReadingAnchor } from './chat-reading-anchor'
import { chatScrollControl } from './chat-scroll-state'
import { chatHost } from './chat-scroll-host'
import type { UseChatNewMessagesOptions, UseChatNewMessagesReturn } from './props'

/** Flags new chat messages while the scroll is unlocked. `contentRef`
 *  attaches to the message column view and listens to `layoutChanged`
 *  (native's ResizeObserver equivalent): every size change fires
 *  `onResize`, and a changed last child view sets `hasNewMessages`. */
export function useChatNewMessages({
	isLocked,
	onResize,
	scrollRef,
}: UseChatNewMessagesOptions): UseChatNewMessagesReturn {
	const [hasNewMessages, setHasNewMessages] = useState(false)
	const lastMessageRef = useRef<any>(null)
	const isLockedRef = useRef(isLocked)
	isLockedRef.current = isLocked

	const viewportRef = useRef(scrollRef)
	viewportRef.current = scrollRef
	const onResizeRef = useRef(onResize)
	onResizeRef.current = onResize

	const elementRef = useRef<any>(null)
	const cleanupRef = useRef<(() => void) | null>(null)

	const attach = useCallback((el: any) => {
		if (!el) {
			return
		}

		const viewport = viewportRef.current?.current as object | undefined
		const following = () =>
			viewport
				? (chatScrollControl(viewport)?.isFollowing() ?? isLockedRef.current)
				: isLockedRef.current

		const anchor = viewport ? bindChatReadingAnchor(el, viewport, following) : null

		const onLayout = () => {
			anchor?.update()
			onResizeRef.current?.()
			const children = chatHost.children(el)
			const last = children.at(-1) ?? null
			if (last && last !== lastMessageRef.current) {
				lastMessageRef.current = last
				if (!following()) {
					setHasNewMessages(true)
				}
			}
		}

		const off = chatHost.observeLayout(el, onLayout, true)
		const offViewport = viewport ? chatHost.observeLayout(viewport, onLayout, true) : () => {}
		cleanupRef.current = () => {
			off()
			offViewport()
			anchor?.()
		}
	}, [])

	const detach = useCallback(() => {
		cleanupRef.current?.()
		cleanupRef.current = null
	}, [])

	const contentRef = useCallback(
		(el: any) => {
			if (el === elementRef.current) {
				return
			}

			detach()
			elementRef.current = el
			if (el) {
				attach(el)
			}
		},
		[attach, detach],
	)

	useEffect(() => () => detach(), [detach])

	const dismiss = useCallback(() => setHasNewMessages(false), [])

	return { hasNewMessages, dismiss, contentRef }
}
