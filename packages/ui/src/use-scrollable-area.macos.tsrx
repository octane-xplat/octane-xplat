/** @jsxImportSource @octane-xplat/macos-renderer */
import { useCallback, useLayoutEffect, useRef, useState } from 'octane'
import type { UseScrollableAreaOptions, UseScrollableAreaResult } from './props'
import { refList } from './ref-list'
import { INITIAL_SCROLL_STATE, sameScrollState, scrollableAreaState } from './scrollable-area-state'
import { scrollableAreaMetrics } from './scrollable-area-metrics.macos'

/** Measures the live AppKit viewport on scroll and layout. Layout measurements
 * update state without directly invoking the caller scroll handler. */
export function useScrollableArea(options: UseScrollableAreaOptions = {}): UseScrollableAreaResult {
	const axis = options.axis ?? 'block'
	const axisRef = useRef(axis)
	axisRef.current = axis
	const viewport = useRef<any>(null)
	const caller = useRef<Record<string, any>>({})
	const contentCaller = useRef<Record<string, any>>({})
	const [, setState] = useState(INITIAL_SCROLL_STATE)
	const stateRef = useRef(INITIAL_SCROLL_STATE)

	const measure = useCallback((event?: any) => {
		if (!viewport.current && !event) return
		const { maxX, x, maxY, y } = scrollableAreaMetrics(viewport.current, event)
		const next = scrollableAreaState(axisRef.current, maxX, x, maxY, y)
		if (!sameScrollState(stateRef.current, next)) {
			stateRef.current = next
			setState(next)
		}
	}, [])

	const bindViewport = useCallback((view: any) => {
		viewport.current = view
		if (view) measure()
	}, [measure])

	const bindContent = useCallback(() => measure(), [measure])
	const onScroll = useCallback((event: any) => {
		measure(event)
		caller.current.onScroll?.(event)
	}, [measure])

	const onLayoutChanged = useCallback((event: any) => {
		measure()
		caller.current.onLayoutChanged?.(event)
	}, [measure])

	const onContentLayoutChanged = useCallback((event: any) => {
		measure()
		contentCaller.current.onLayoutChanged?.(event)
	}, [measure])

	const viewportRefs = useRef({ caller: undefined as any, refs: refList(bindViewport) })
	const contentRefs = useRef({ caller: undefined as any, refs: refList(bindContent) })

	useLayoutEffect(() => { measure() }, [axis, measure])

	const getViewportProps = useCallback((props: Record<string, any> = {}) => {
		caller.current = props
		if (viewportRefs.current.caller !== props.ref) {
			viewportRefs.current = { caller: props.ref, refs: refList(bindViewport, props.ref) }
		}

		return { ...props, ref: viewportRefs.current.refs, orientation: axisRef.current === 'inline' ? 'horizontal' : axisRef.current === 'both' ? 'both' : 'vertical', onScroll, onLayoutChanged }
	}, [bindViewport, onScroll, onLayoutChanged])

	const getContentProps = useCallback((props: Record<string, any> = {}) => {
		contentCaller.current = props
		if (contentRefs.current.caller !== props.ref) {
			contentRefs.current = { caller: props.ref, refs: refList(bindContent, props.ref) }
		}

		return { ...props, ref: contentRefs.current.refs, onLayoutChanged: onContentLayoutChanged }
	}, [bindContent, onContentLayoutChanged])

	// The caller runs in the same event scope, before its batched render.
	// Expose the measured snapshot immediately as well as scheduling readers.
	return { getViewportProps, getContentProps, get state() { return stateRef.current } }
}
