/** @jsxImportSource @octane-xplat/jsx/dom */
import { useCallback, useEffect, useRef, useState } from 'octane'
import type { CSSProperties } from 'octane/jsx-runtime'
import type {
	HostElement,
	ScrollAxisState,
	ScrollableAreaState,
	UseScrollableAreaOptions,
	UseScrollableAreaContentProps,
	UseScrollableAreaResult,
	UseScrollableAreaViewportProps,
} from './props'

const EPS = 1
const AT_EDGES: ScrollAxisState = { isScrollable: false, atStart: true, atEnd: true }
const INITIAL: ScrollableAreaState = { inline: AT_EDGES, block: AT_EDGES }

/**
 * Headless scroll-viewport behavior (Astryx `useScrollableArea`), web leaf.
 * Observes the bound viewport + content with ResizeObserver and `scroll`
 * and reports per-axis overflow/edge state; the getters merge the owned
 * semantics (overflow, overscroll, tab stop, role/label, data attributes)
 * into caller props. The getters compose their internal ref with the caller's `ref`, for either
 * a host element or a shared primitive.
 */
export function useScrollableArea<TElement = HostElement>(
	options: UseScrollableAreaOptions = {},
): UseScrollableAreaResult<TElement> {
	const axis = options.axis ?? 'block'
	const keyboardAccess = options.keyboardAccess
	const overscroll = options.overscroll ?? 'allow'
	const stickyContainment = options.stickyContainment ?? 'whenScrollable'
	const viewportRef = useRef<HTMLElement | null>(null)
	const contentRef = useRef<HTMLElement | null>(null)
	const [state, setState] = useState<ScrollableAreaState>(INITIAL)

	const measure = useCallback(() => {
		const el = viewportRef.current
		if (!el) {
			return
		}

		const inlineOk = axis === 'inline' || axis === 'both'
		const blockOk = axis === 'block' || axis === 'both'
		const maxX = Math.max(0, el.scrollWidth - el.clientWidth)
		const maxY = Math.max(0, el.scrollHeight - el.clientHeight)
		// RTL scrollLeft is negative in every current engine: the inline-start
		// edge sits at -maxX, the inline-end edge at 0.
		const rtl = getComputedStyle(el).direction === 'rtl'
		const x = rtl ? -el.scrollLeft : el.scrollLeft
		const inline: ScrollAxisState = {
			isScrollable: inlineOk && maxX > EPS,
			atStart: !inlineOk || x <= EPS,
			atEnd: !inlineOk || x >= maxX - EPS,
		}

		const block: ScrollAxisState = {
			isScrollable: blockOk && maxY > EPS,
			atStart: !blockOk || el.scrollTop <= EPS,
			atEnd: !blockOk || el.scrollTop >= maxY - EPS,
		}

		setState((prev) =>
			prev.inline.isScrollable === inline.isScrollable &&
			prev.inline.atStart === inline.atStart &&
			prev.inline.atEnd === inline.atEnd &&
			prev.block.isScrollable === block.isScrollable &&
			prev.block.atStart === block.atStart &&
			prev.block.atEnd === block.atEnd
				? prev
				: { inline, block },
		)
	}, [axis])

	const bindViewport = useCallback(
		(el: HTMLElement | null) => {
			viewportRef.current = el
			measure()
		},
		[measure],
	)

	const bindContent = useCallback((el: HTMLElement | null) => {
		contentRef.current = el
	}, [])

	useEffect(() => {
		const el = viewportRef.current
		if (!el) {
			return
		}

		measure()
		el.addEventListener('scroll', measure, { passive: true })
		const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)

		observer?.observe(el)
		if (contentRef.current) {
			observer?.observe(contentRef.current)
		}

		return () => {
			el.removeEventListener('scroll', measure)
			observer?.disconnect()
		}
	}, [measure])

	const getViewportProps = useCallback(
		function getViewportProps<P extends object = {}>(
			props?: P & Partial<UseScrollableAreaViewportProps<TElement>>,
		): Omit<P, keyof UseScrollableAreaViewportProps<TElement>> &
			UseScrollableAreaViewportProps<TElement> {
			const input = (props ?? {}) as Record<string, any>
			const owner = keyboardAccess?.owner ?? 'content'
			const scrollable = state.inline.isScrollable || state.block.isScrollable
			const viewportTabbed = owner === 'viewport' || (owner === 'contentOrViewport' && scrollable)

			const label =
				owner === 'viewport' || owner === 'contentOrViewport'
					? keyboardAccess && 'label' in keyboardAccess && keyboardAccess.label
						? keyboardAccess.label
						: undefined
					: undefined

			const role =
				(owner === 'viewport' || owner === 'contentOrViewport') &&
				keyboardAccess &&
				'role' in keyboardAccess
					? keyboardAccess.role
					: undefined

			return {
				...input,
				ref: [bindViewport, input.ref],
				role: input.role ?? (viewportTabbed ? (role ?? 'group') : role),
				'aria-label': input['aria-label'] ?? (viewportTabbed ? label : undefined),
				tabIndex: input.tabIndex ?? (viewportTabbed ? 0 : undefined),
				style: {
					overflowX: axis === 'inline' || axis === 'both' ? 'auto' : 'clip',
					overflowY: axis === 'block' || axis === 'both' ? 'auto' : 'clip',
					overscrollBehaviorX: overscroll === 'contain' ? 'contain' : undefined,
					overscrollBehaviorY: overscroll === 'contain' ? 'contain' : undefined,
					...(input.style as CSSProperties),
				},
				'data-scrollable-x': state.inline.isScrollable || undefined,
				'data-scrollable-y': state.block.isScrollable || undefined,
				'data-at-start-x': state.inline.atStart || undefined,
				'data-at-end-x': state.inline.atEnd || undefined,
				'data-at-start-y': state.block.atStart || undefined,
				'data-at-end-y': state.block.atEnd || undefined,
				'data-sticky-containment':
					stickyContainment === 'always' || scrollable ? 'true' : undefined,
			} as unknown as Omit<P, keyof UseScrollableAreaViewportProps<TElement>> &
				UseScrollableAreaViewportProps<TElement>
		},
		[axis, keyboardAccess, overscroll, stickyContainment, state, bindViewport],
	)

	const getContentProps = useCallback(
		function getContentProps<P extends object = {}>(
			props?: P & Partial<UseScrollableAreaContentProps<TElement>>,
		): Omit<P, keyof UseScrollableAreaContentProps<TElement>> &
			UseScrollableAreaContentProps<TElement> {
			const input = (props ?? {}) as Record<string, any>
			const owner = keyboardAccess?.owner ?? 'content'
			const scrollable = state.inline.isScrollable || state.block.isScrollable
			const contentTabbed = owner === 'content' || (owner === 'contentOrViewport' && !scrollable)

			return {
				...input,
				ref: [bindContent, input.ref],
				role: input.role ?? (contentTabbed ? 'group' : undefined),
				'aria-label':
					input['aria-label'] ??
					(contentTabbed && keyboardAccess && 'label' in keyboardAccess
						? keyboardAccess.label
						: undefined),
				tabIndex: input.tabIndex ?? (contentTabbed ? 0 : undefined),
			} as unknown as Omit<P, keyof UseScrollableAreaContentProps<TElement>> &
				UseScrollableAreaContentProps<TElement>
		},
		[keyboardAccess, state, bindContent],
	)

	return { getViewportProps, getContentProps, state }
}
