/** @jsxImportSource @octane-xplat/jsx/dom */
import { useCallback, useEffect, useRef, useState } from 'octane'
import { bindChatReadingAnchor } from './chat-reading-anchor'
import { chatScrollControl, isChatRow } from './chat-scroll-state'
import { chatHost } from './chat-scroll-host'
import type { UseChatNewMessagesOptions, UseChatNewMessagesReturn } from './props'

/** Flags new chat messages while the scroll is unlocked. `contentRef`
 *  attaches a ResizeObserver to the message column: every size change fires
 *  `onResize` (so the scroll hook can follow streaming growth), and a
 *  changed last `.vx-chatmsg` element sets `hasNewMessages`. */
export function useChatNewMessages({
	isLocked,
	onResize,
	scrollRef,
}: UseChatNewMessagesOptions): UseChatNewMessagesReturn {
	const [hasNewMessages, setHasNewMessages] = useState(false)
	const lastMessageRef = useRef<Element | null>(null)
	const isLockedRef = useRef(isLocked)
	isLockedRef.current = isLocked

	const viewportRef = useRef(scrollRef)
	viewportRef.current = scrollRef
	const onResizeRef = useRef(onResize)
	onResizeRef.current = onResize

	const elementRef = useRef<HTMLElement | null>(null)
	const cleanupRef = useRef<(() => void) | null>(null)

	const attach = useCallback((el: HTMLElement) => {
		const viewport = viewportRef.current?.current as object | undefined
		const following = () =>
			viewport
				? (chatScrollControl(viewport)?.isFollowing() ?? isLockedRef.current)
				: isLockedRef.current

		const anchor = viewport ? bindChatReadingAnchor(el, viewport, following) : null

		const changed = () => {
			anchor?.update()
			onResizeRef.current?.()
			const messages = el.getElementsByClassName('vx-chatmsg')
			const last =
				chatHost.children(el).filter(isChatRow).at(-1) ??
				(messages.length > 0 ? messages[messages.length - 1] : null)

			if (last && last !== lastMessageRef.current) {
				lastMessageRef.current = last
				if (!following()) {
					setHasNewMessages(true)
				}
			}
		}

		const off = chatHost.observeLayout(el, changed, true)
		const offViewport = viewport ? chatHost.observeLayout(viewport, changed, true) : () => {}
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
		(el: HTMLElement | null) => {
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
