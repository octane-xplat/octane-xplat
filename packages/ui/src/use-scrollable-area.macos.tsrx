/** @jsxImportSource @octane-xplat/jsx */
import { useCallback, useLayoutEffect, useRef, useState } from 'octane'
import type {
	HostElement,
	UseScrollableAreaContentProps,
	UseScrollableAreaOptions,
	UseScrollableAreaResult,
	UseScrollableAreaViewportProps,
} from './props'

import { refList } from './ref-list'
import { INITIAL_SCROLL_STATE, sameScrollState, scrollableAreaState } from './scrollable-area-state'
import { useDirection } from './internationalization'
import { convertAppKitInlineOffset } from './scrollable-area-logical.macos'
import { scrollableAreaMetrics } from './scrollable-area-metrics.macos'

/** Measures the live AppKit viewport on scroll and layout. Layout measurements
 * update state without directly invoking the caller scroll handler. */
export function useScrollableArea<TElement extends object = object>(
	options: UseScrollableAreaOptions = {},
): UseScrollableAreaResult<TElement> {
	const axis = options.axis ?? 'block'
	const direction = useDirection(), directionRef = useRef(direction)
	directionRef.current = direction
	const axisRef = useRef(axis)
	axisRef.current = axis
	const viewport = useRef<NSScrollView | null>(null)
	const caller = useRef<Record<string, any>>({})
	const contentCaller = useRef<Record<string, any>>({})
	const [, setState] = useState(INITIAL_SCROLL_STATE)
	const stateRef = useRef(INITIAL_SCROLL_STATE)

	const measure = useCallback((event?: any) => {
		if (!viewport.current && !event) {
			return
		}

		const { maxX, x, maxY, y } = scrollableAreaMetrics(viewport.current, event)
		const next = scrollableAreaState(axisRef.current, maxX, convertAppKitInlineOffset(x, maxX, directionRef.current), maxY, y)
		if (!sameScrollState(stateRef.current, next)) {
			stateRef.current = next
			setState(next)
		}
	}, [])

	const bindViewport = useCallback(
		(view: NSScrollView | null) => {
			viewport.current = view
			if (view) {
				measure()
			}
		},
		[measure],
	)

	const bindContent = useCallback(() => measure(), [measure])
	const onScroll = useCallback(
		(event: any) => {
			measure(event)
			caller.current.onScroll?.(event)
		},
		[measure],
	)

	const onLayoutChanged = useCallback(
		(event: any) => {
			measure()
			caller.current.onLayoutChanged?.(event)
		},
		[measure],
	)

	const onContentLayoutChanged = useCallback(
		(event: any) => {
			measure()
			contentCaller.current.onLayoutChanged?.(event)
		},
		[measure],
	)

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
	}, [axis, direction, measure])

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
				orientation:
					axisRef.current === 'inline'
						? 'horizontal'
						: axisRef.current === 'both'
							? 'both'
							: 'vertical',
				onScroll,
				onLayoutChanged,
			} as unknown as Omit<P, keyof UseScrollableAreaViewportProps<TElement>> &
				UseScrollableAreaViewportProps<TElement>
		},
		[bindViewport, onScroll, onLayoutChanged],
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
