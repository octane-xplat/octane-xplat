/** @jsxImportSource @octane-xplat/jsx/dom */
import { useCallback, useEffect, useRef, useState } from 'octane'
import { chatAtEnd, registerChatScrollControl } from './chat-scroll-state'
import type {
	ChatScrollToBottomOptions,
	UseChatStreamScrollOptions,
	UseChatStreamScrollReturn,
} from '../props'

const SIXTY_FPS_MS = 1000 / 60

// While following, the hook owns the container's position — overflow-anchor
// is disabled via attribute so a reader's move and the browser's resize
// clamp stay distinguishable. Same trick as upstream (data-astryx-…).
const FOLLOWING_ATTR = 'data-vx-chat-following'
const FOLLOWING_STYLE_ATTR = 'data-vx-chat-following-style'

function ensureFollowingStyle(): void {
	if (typeof document === 'undefined' || document.head.querySelector(`[${FOLLOWING_STYLE_ATTR}]`)) {
		return
	}

	const style = document.createElement('style')
	style.setAttribute(FOLLOWING_STYLE_ATTR, '')
	style.textContent = `[${FOLLOWING_ATTR}]{overflow-anchor:none !important}`
	document.head.appendChild(style)
}

function prefersReducedMotion(): boolean {
	return (
		typeof window !== 'undefined' &&
		typeof window.matchMedia === 'function' &&
		window.matchMedia('(prefers-reduced-motion: reduce)').matches
	)
}

/** Follow-the-stream scroll behavior for a chat container: locked (default)
 *  springs to the bottom on growth; any upward scroll unlocks; settling at
 *  the bottom re-locks. `scrollToBottom({behavior:'instant'})` jumps in one
 *  frame. The first fill positions instantly; only later growth animates. */
export function useChatStreamScroll({
	scrollRef,
	enabled = true,
	followLatest = true,
	lockThreshold = 10,
	buttonThreshold = 100,
	damping = 0.7,
	stiffness = 0.05,
	mass = 1.25,
}: UseChatStreamScrollOptions): UseChatStreamScrollReturn {
	const startLocked = enabled && followLatest !== false
	const [isScrolledUp, setIsScrolledUp] = useState(false)
	const [isLocked, setIsLocked] = useState(startLocked)

	const lockedRef = useRef(startLocked)
	const initialFillPendingRef = useRef(true)
	const velocityRef = useRef(0)
	const positionRef = useRef<number | null>(null)
	const animatingRef = useRef(false)
	const lastTickRef = useRef<number | undefined>(undefined)
	const rafRef = useRef(0)
	const lastScrollTopRef = useRef(0)

	const setLocked = useCallback(
		(locked: boolean) => {
			lockedRef.current = locked
			setIsLocked(locked)

			;(scrollRef.current as HTMLElement | null)?.toggleAttribute?.(FOLLOWING_ATTR, locked)
		},
		[scrollRef],
	)

	const animate = useCallback(() => {
		const el = scrollRef.current as HTMLElement
		if (!el || !lockedRef.current) {
			animatingRef.current = false
			lastTickRef.current = undefined
			velocityRef.current = 0
			return
		}

		if (el.scrollHeight <= el.clientHeight) {
			animatingRef.current = false
			lastTickRef.current = undefined
			velocityRef.current = 0
			return
		}

		const target = el.scrollHeight - el.clientHeight
		const position = positionRef.current ?? el.scrollTop
		const diff = target - position
		if (Math.abs(diff) < 0.5 && Math.abs(velocityRef.current) < 0.1) {
			el.scrollTop = target
			animatingRef.current = false
			lastTickRef.current = undefined
			velocityRef.current = 0
			return
		}

		const now = performance.now()
		const tickDelta = lastTickRef.current ? (now - lastTickRef.current) / SIXTY_FPS_MS : 1
		lastTickRef.current = now

		velocityRef.current = (damping * velocityRef.current + stiffness * diff) / mass
		positionRef.current = Math.max(0, Math.min(target, position + velocityRef.current * tickDelta))
		el.scrollTop = positionRef.current
		lastScrollTopRef.current = el.scrollTop
		rafRef.current = requestAnimationFrame(animate)
	}, [scrollRef, damping, stiffness, mass])

	const jumpToBottom = useCallback(() => {
		const el = scrollRef.current as HTMLElement
		if (!el) {
			return
		}

		cancelAnimationFrame(rafRef.current)
		animatingRef.current = false
		velocityRef.current = 0
		lastTickRef.current = undefined
		el.scrollTop = el.scrollHeight - el.clientHeight
		positionRef.current = el.scrollTop
		lastScrollTopRef.current = el.scrollTop
	}, [scrollRef])

	const startAnimation = useCallback(() => {
		if (!lockedRef.current) {
			return
		}

		if (prefersReducedMotion()) {
			jumpToBottom()
			return
		}

		if (!animatingRef.current) {
			animatingRef.current = true
			positionRef.current = (scrollRef.current as HTMLElement | null)?.scrollTop ?? null
			lastTickRef.current = undefined
			rafRef.current = requestAnimationFrame(animate)
		}
	}, [animate, jumpToBottom])

	const scrollToBottom = useCallback(
		(options?: ChatScrollToBottomOptions) => {
			setLocked(true)
			setIsScrolledUp(false)
			initialFillPendingRef.current = false
			if (options?.behavior === 'instant') {
				jumpToBottom()
				return
			}

			startAnimation()
		},
		[setLocked, startAnimation, jumpToBottom],
	)

	const scrollToMessage = useCallback(
		(el: any) => {
			const container = scrollRef.current as HTMLElement | null | undefined
			if (!container) {
				return
			}

			const containerRect = container.getBoundingClientRect()
			const elRect = el.getBoundingClientRect()
			const offset = elRect.top - containerRect.top + container.scrollTop
			container.scrollTo({ top: offset, behavior: 'instant' as ScrollBehavior })
			lastScrollTopRef.current = container.scrollTop
		},
		[scrollRef],
	)

	const scrollToLastMessage = useCallback(() => {
		const container = scrollRef.current as HTMLElement | null | undefined
		if (!container) {
			return
		}

		const messages = container.getElementsByClassName('vx-chatmsg')
		const last = messages[messages.length - 1]
		if (last) {
			scrollToMessage(last)
		}
	}, [scrollRef, scrollToMessage])

	const lock = useCallback(() => {
		setLocked(true)
		setIsScrolledUp(false)
		startAnimation()
	}, [setLocked, startAnimation])

	const unlock = useCallback(() => {
		setLocked(false)
		animatingRef.current = false
	}, [setLocked])

	const scrollIfLocked = useCallback(() => {
		if (!enabled || followLatest === false || !lockedRef.current) {
			return
		}

		const el = scrollRef.current as HTMLElement
		// First fill jumps — later growth springs.
		if (initialFillPendingRef.current && el && el.scrollHeight > el.clientHeight) {
			initialFillPendingRef.current = false
			jumpToBottom()
			return
		}

		startAnimation()
	}, [enabled, followLatest, startAnimation, jumpToBottom, scrollRef])

	useEffect(() => {
		const el = scrollRef.current as HTMLElement
		if (!el || !enabled) {
			return
		}

		lastScrollTopRef.current = el.scrollTop
		ensureFollowingStyle()
		el.toggleAttribute(FOLLOWING_ATTR, lockedRef.current)

		const onScroll = () => {
			const { scrollTop, scrollHeight, offsetHeight } = el
			const dist = scrollHeight - scrollTop - offsetHeight
			setIsScrolledUp(dist > buttonThreshold)
			const isScrollingUp = scrollTop < lastScrollTopRef.current
			lastScrollTopRef.current = scrollTop
			const landedAtBottom = scrollHeight - scrollTop - el.clientHeight < 1
			if (isScrollingUp && !landedAtBottom && lockedRef.current) {
				setLocked(false)
				animatingRef.current = false
			}
		}

		const onScrollEnd = () => {
			const dist = el.scrollHeight - el.scrollTop - el.offsetHeight
			if (chatAtEnd(el.scrollTop, Math.max(0, el.scrollHeight - el.clientHeight), lockThreshold)) {
				setLocked(true)
			}
		}

		const unregister = registerChatScrollControl(el, {
			isFollowing: () => lockedRef.current && followLatest !== false,
			jumpToEnd: jumpToBottom,
		})

		el.addEventListener('scroll', onScroll, { passive: true })
		el.addEventListener('scrollend', onScrollEnd)

		// Content already present at mount → position at the bottom.
		const initialFrame = requestAnimationFrame(() => {
			if (lockedRef.current && el.scrollHeight > el.clientHeight) {
				el.scrollTop = el.scrollHeight - el.clientHeight
				lastScrollTopRef.current = el.scrollTop
				initialFillPendingRef.current = false
			}
		})

		return () => {
			unregister()
			cancelAnimationFrame(initialFrame)
			cancelAnimationFrame(rafRef.current)
			animatingRef.current = false
			el.removeEventListener('scroll', onScroll)
			el.removeEventListener('scrollend', onScrollEnd)
			el.removeAttribute(FOLLOWING_ATTR)
		}
	}, [
		scrollRef,
		scrollRef.current,
		enabled,
		followLatest,
		lockThreshold,
		buttonThreshold,
		setLocked,
		jumpToBottom,
	])

	return {
		isScrolledUp,
		isLocked,
		scrollToBottom,
		scrollToMessage,
		lock,
		unlock,
		scrollIfLocked,
		scrollToLastMessage,
	}
}
