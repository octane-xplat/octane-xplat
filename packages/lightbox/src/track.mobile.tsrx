/** @jsxImportSource @octane-xplat/jsx */
// Self-drawn paging track: a horizontal row of slide-sized panes driven by a
// single translateX. Machine `track` commands pull it; release snaps to the
// nearest slide with the SETTLE spring — the native counterpart of web's
// scroll-snap viewport, with the same `progress = -x / stride` semantics.
import { useLayoutEffect, useRef } from 'octane'
import { cx } from '@octane-xplat/lib'
import { mergeStyle } from './style-merge'
import type { MotionValue } from '@octane-xplat/motion'
import { SETTLE } from './constants'
import { clamp } from './math'
import { viewRect } from './rect'
import type { LightboxMedia, LightboxPartProps } from './props'
import type { ViewportController } from './root.tsrx'
import { attachInput } from './input.mobile'
import type { Intent } from './gesture-machine'

/** Route each gesture sequence to exactly one slide's send: the slide that is
 *  current when the sequence starts (latched until panEnd/pinchEnd). */
export function createInputDispatch(currentIndex: () => number) {
	const inputs = new Map<number, (i: Intent) => void>()
	let latched: number | null = null
	const dispatch = (i: Intent) => {
		if (i.kind === 'panStart' || i.kind === 'pinchStart' || i.kind === 'tap' || i.kind === 'doubleTap') {
			latched = currentIndex()
		}
		const target = latched ?? currentIndex()
		inputs.get(target)?.(i)
		if (i.kind === 'panEnd' || i.kind === 'pinchEnd') latched = null
	}
	dispatch.inputs = inputs
	return dispatch
}

export function Track(props: LightboxPartProps & {
	items: LightboxMedia[]
	maxZoom?: number
	currentIndex: number
	controllerRef: { current: ViewportController | null }
	onScrollIndex: (i: number) => void
	progress: MotionValue
	zoomed: boolean
}) @{
	const clipRef = useRef<any>(null)
	const rowRef = useRef<any>(null)
	const live = useRef({ x: 0, stride: 1, index: props.currentIndex, tracking: false, anim: null as { stop(): void } | null })
	const l = live.current
	const count = () => props.items.length
	// live.current.tracking flags an in-flight drag — it must live in the ref,
	// not a per-render object, so re-renders can't clear it mid-gesture.

	const stride = () => (clipRef.current?.parent as any)?.getActualSize?.()?.width ?? viewRect(clipRef.current)?.w ?? clipRef.current?.getActualSize?.().width ?? 1
	const setX = (x: number, publish = true) => {
		l.x = x
		if (rowRef.current) rowRef.current.translateX = x
		if (publish) props.progress.set(-x / (l.stride || 1))
	}

	// Size everything in explicit DIPs from the popup's measured size —
	// percentage heights don't stretch inside the popup's Mason column.
	const layoutSlides = () => {
		const clip = clipRef.current
		const row = rowRef.current
		if (!clip || !row) return
		const parent = clip.parent as any
		const s = parent?.getActualSize?.() ?? clip.getActualSize?.()
		if (!s?.width || !s?.height) return
		if (s.width !== clip.getActualSize?.().width || s.height !== clip.getActualSize?.().height) {
			clip.width = s.width
			clip.height = s.height
		}
		l.stride = s.width
		row.width = s.width * count()
		row.height = s.height
		row.eachChild?.((child: any) => {
			if (child.width !== s.width || child.height !== s.height) {
				child.width = s.width
				child.height = s.height
			}
			return true
		})
	}

	useLayoutEffect(() => {
		layoutSlides()
		let inLayout = false
		const cb = () => {
			if (inLayout) return
			inLayout = true
			try {
				const before = l.stride
				layoutSlides()
				// Only re-snap when the viewport actually resized — re-layouts
				// from translate/row writes must not clobber an in-flight drag.
				if (l.stride !== before && !live.current.tracking && !l.anim) setX(-l.index * l.stride)
			} finally {
				inLayout = false
			}
		}
		;(clipRef.current?.parent as any)?.on?.('layoutChanged', cb)
		clipRef.current?.on?.('layoutChanged', cb)
		l.stride = stride()
		// This layout effect re-runs every render — never re-snap mid-drag.
		if (!live.current.tracking && !l.anim) setX(-l.index * l.stride)
		return () => {
			;(clipRef.current?.parent as any)?.off?.('layoutChanged', cb)
			clipRef.current?.off?.('layoutChanged', cb)
		}
	})

	// One gesture graph for the whole viewport — the clip never transforms, so
	// touches always hit it. Each gesture sequence latches to the slide that is
	// current at its start (l.index, not ctx.index — that lags mid-snap).
	const dispatch = useRef(createInputDispatch(() => l.index))
	const inputs = dispatch.current.inputs
	useLayoutEffect(() => {
		const clip = clipRef.current
		if (!clip) return
		const off = attachInput(clip, { maxZoom: props.maxZoom ?? 1 }, dispatch.current)
		return () => { off(); l.anim?.stop() }
	}, [])

	useLayoutEffect(() => {
		const controller: ViewportController = {
			registerInput(index, send) {
				inputs.set(index, send)
				return () => { if (inputs.get(index) === send) inputs.delete(index) }
			},
			goTo(index, behavior) {
				l.index = clamp(index, 0, count() - 1)
				const target = -l.index * (l.stride = stride())
				l.anim?.stop()
				if (behavior === 'smooth') {
					const mv = props.progress
					mv.set(-l.x / l.stride)
					// Progress drives this update. Publishing it again from setX
					// would cancel the animation and can recurse on rounding error.
					const off = mv.on('change', (v: number) => setX(-v * l.stride, false))
					const animation = mv.animate(-target / l.stride, SETTLE)
					const playback = { stop() { off(); animation.stop(); if (l.anim === playback) l.anim = null } }
					l.anim = playback
					void animation.finished.then((result) => {
						off()
						if (l.anim !== playback) return
						l.anim = null
						if (result !== 'finished') return
						setX(target)
						props.onScrollIndex(l.index)
					})
				} else {
					l.anim?.stop?.()
					setX(target)
					props.onScrollIndex(l.index)
				}
			},
			freeze(index) {
				l.index = index
				l.anim?.stop?.()
				l.stride = stride()
				setX(-index * l.stride)
			},
			async fade(from, to) {
				const row = rowRef.current
				if (!row) { this.freeze(to); return }
				row.opacity = 0
				this.freeze(to)
				props.progress.set(-l.x / l.stride)
				row.opacity = 1
			},
			track(phase, dx, vx) {
				if (phase === 'start') {
					live.current.tracking = true
					l.anim?.stop?.()
					l.stride = stride()
				} else if (phase === 'move') {
					setX(-l.index * l.stride + dx)
				} else {
					// Snap: projected resting position decides the landing slide —
					// same rule the web scroller's snap gives for a flick. Use the
					// command's total dx, not l.x, in case a re-render reset it.
					live.current.tracking = false
					setX(-l.index * l.stride + dx)
					const projected = l.x + 0.2 * vx
					const next = clamp(Math.round(-projected / l.stride), 0, count() - 1)
					this.goTo(next, 'smooth')
				}
			},
		}
		props.controllerRef.current = controller
		return () => { if (props.controllerRef.current === controller) props.controllerRef.current = null }
	})

	return (
		<masonview ref={clipRef} className={cx('vx-lightbox-viewport', props.className)} style={mergeStyle({ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, overflow: 'hidden' }, props.style)} id={props.id}
			testID={props.testID}>
			<masonview ref={rowRef} className="vx-lightbox-track" style={{ position: 'absolute', left: 0, top: 0, flexDirection: 'row' }}>
				{props.children as never}
			</masonview>
		</masonview>
	)
}
