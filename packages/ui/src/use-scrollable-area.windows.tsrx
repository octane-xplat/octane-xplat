/** @jsxImportSource @octane-xplat/jsx */
import { useCallback, useLayoutEffect, useRef, useState } from 'octane'
import type {
	UseScrollableAreaContentProps,
	UseScrollableAreaOptions,
	UseScrollableAreaResult,
	UseScrollableAreaViewportProps,
} from './props'

import { refList } from './ref-list'
import { INITIAL_SCROLL_STATE, sameScrollState, scrollableAreaState } from './scrollable-area-state'
// Mason's Windows view exposes these metrics in layout units, not backing pixels.
const metric = (value: unknown): number => {
	const number = Number(value)
	return Number.isFinite(number) ? number : 0
}

function range(content: unknown, viewport: unknown): number {
	const size = Number(content)
	const client = Number(viewport)
	return Number.isFinite(size) && size >= 0 && Number.isFinite(client) && client >= 0
		? Math.max(0, size - client)
		: 0
}

function scrollableAreaMetrics(view: any) {
	return {
		maxX: range(view.scrollWidth, view.clientWidth),
		maxY: range(view.scrollHeight, view.clientHeight),
		x: metric(view.scrollLeft),
		y: metric(view.scrollTop),
	}
}

/** Windows Mason viewport observer. Content layout can change the scroll range
 * without resizing the viewport. Compose driver-owned event props so callback
 * updates and teardown follow the host; there are no manual native listeners.
 * Axis filters edge state; the native viewport still owns scrolling. Web-only
 * keyboardAccess, overscroll and stickyContainment are accepted but inert. */
export function useScrollableArea<TElement extends object = object>(
	options: UseScrollableAreaOptions = {},
): UseScrollableAreaResult<TElement> {
	const axis = options.axis ?? 'block'
	const axisRef = useRef(axis)
	axisRef.current = axis
	const viewport = useRef<any>(null)
	const content = useRef<any>(null)
	const caller = useRef<Record<string, any>>({})
	const contentCaller = useRef<Record<string, any>>({})
	const [, setState] = useState(INITIAL_SCROLL_STATE)
	const stateRef = useRef(INITIAL_SCROLL_STATE)

	const measure = useCallback((deferPublication = false) => {
		let next = INITIAL_SCROLL_STATE
		const view = viewport.current
		if (view && view.isLoaded !== false) {
			try {
				const { maxX, x, maxY, y } = scrollableAreaMetrics(view)
				next = scrollableAreaState(axisRef.current, maxX, x, maxY, y)
			} catch {
				// A retired native proxy cannot contribute usable geometry.
			}
		}

		if (!sameScrollState(stateRef.current, next)) {
			stateRef.current = next
			if (deferPublication) {
				// Publishing inside the driver's loaded event can reenter a committed
				// universal transaction. Keep the caller's snapshot fresh immediately.
				queueMicrotask(() => {
					if (viewport.current === view && view?.isLoaded !== false) {
						setState(stateRef.current)
					}
				})
			} else {
				setState(next)
			}
		}
	}, [])

	const bindViewport = useCallback(
		(view: any) => {
			viewport.current = view
			measure()
		},
		[measure],
	)

	const bindContent = useCallback(
		(view: any) => {
			content.current = view
			measure()
		},
		[measure],
	)

	const onScroll = useCallback(
		(event: any) => {
			if (!viewport.current || (event?.object && event.object !== viewport.current)) {
				return
			}

			measure()
			caller.current.onScroll?.(event)
		},
		[measure],
	)

	const onLayoutChanged = useCallback(
		(event: any) => {
			if (!viewport.current || (event?.object && event.object !== viewport.current)) {
				return
			}

			measure()
			caller.current.onLayoutChanged?.(event)
		},
		[measure],
	)

	const onContentLayoutChanged = useCallback(
		(event: any) => {
			if (!content.current || (event?.object && event.object !== content.current)) {
				return
			}

			measure()
			contentCaller.current.onLayoutChanged?.(event)
		},
		[measure],
	)

	const onLoaded = useCallback(
		(event: any) => {
			if (!viewport.current || (event?.object && event.object !== viewport.current)) {
				return
			}

			measure(true)
			caller.current.onLoaded?.(event)
		},
		[measure],
	)

	const onUnloaded = useCallback((event: any) => {
		if (!viewport.current || (event?.object && event.object !== viewport.current)) {
			return
		}

		if (!sameScrollState(stateRef.current, INITIAL_SCROLL_STATE)) {
			stateRef.current = INITIAL_SCROLL_STATE
			setState(INITIAL_SCROLL_STATE)
		}

		caller.current.onUnloaded?.(event)
	}, [])

	const viewportRefs = useRef({
		caller: undefined as { current?: any } | undefined,
		refs: refList(bindViewport),
	})

	const contentRefs = useRef({
		caller: undefined as { current?: any } | undefined,
		refs: refList(bindContent),
	})

	useLayoutEffect(() => {
		measure()
	}, [axis, measure])

	useLayoutEffect(
		() => () => {
			viewport.current = null
			content.current = null
			caller.current = {}
			contentCaller.current = {}
		},
		[],
	)

	const getViewportProps = useCallback(
		function getViewportProps<P extends object = {}>(
			props?: P & Partial<UseScrollableAreaViewportProps<TElement>>,
		): Omit<P, keyof UseScrollableAreaViewportProps<TElement>> &
			UseScrollableAreaViewportProps<TElement> {
			const input = (props ?? {}) as Record<string, any>
			caller.current = input
			if (viewportRefs.current.caller !== input.ref) {
				viewportRefs.current = { caller: input.ref, refs: refList(bindViewport, input.ref) }
			}

			return {
				...input,
				ref: viewportRefs.current.refs,
				onScroll,
				onLayoutChanged,
				onLoaded,
				onUnloaded,
			} as unknown as Omit<P, keyof UseScrollableAreaViewportProps<TElement>> &
				UseScrollableAreaViewportProps<TElement>
		},
		[bindViewport, onScroll, onLayoutChanged, onLoaded, onUnloaded],
	)

	const getContentProps = useCallback(
		function getContentProps<P extends object = {}>(
			props?: P & Partial<UseScrollableAreaContentProps<TElement>>,
		): Omit<P, keyof UseScrollableAreaContentProps<TElement>> &
			UseScrollableAreaContentProps<TElement> {
			const input = (props ?? {}) as Record<string, any>
			contentCaller.current = input
			if (contentRefs.current.caller !== input.ref) {
				contentRefs.current = { caller: input.ref, refs: refList(bindContent, input.ref) }
			}

			return {
				...input,
				ref: contentRefs.current.refs,
				onLayoutChanged: onContentLayoutChanged,
			} as unknown as Omit<P, keyof UseScrollableAreaContentProps<TElement>> &
				UseScrollableAreaContentProps<TElement>
		},
		[bindContent, onContentLayoutChanged],
	)

	// The caller runs in the same event scope, before its batched render.
	// Expose the measured snapshot immediately as well as scheduling readers.
	return {
		getViewportProps,
		getContentProps,
		get state() {
			return stateRef.current
		},
	}
}
