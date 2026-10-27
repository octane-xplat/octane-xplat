/** @jsxImportSource @nativescript-community/octane */
// Self-drawn paging track: a horizontal row of slide-sized panes driven by a
// single translateX. Machine `track` commands pull it; release snaps to the
// nearest slide with the SETTLE spring — the native counterpart of web's
// scroll-snap viewport, with the same `progress = -x / stride` semantics.
import { useLayoutEffect, useRef } from 'octane'
import { cx } from '@octane-xplat/lib'
import type { MotionValue } from '@octane-xplat/motion'
import { SETTLE } from './constants'
import { clamp } from './math'
import { viewRect } from './rect'
import type { LightboxMedia } from './props'
import type { ViewportController } from './root.tsrx'

export function Track(props: {
	items: LightboxMedia[]
	currentIndex: number
	controllerRef: { current: ViewportController | null }
	onScrollIndex: (i: number) => void
	progress: MotionValue
	zoomed: boolean
	children?: unknown
	className?: string
	style?: Record<string, unknown>
	testID?: string
}) @{
	const clipRef = useRef<any>(null)
	const rowRef = useRef<any>(null)
	const live = useRef({ x: 0, stride: 1, index: 0, anim: null as any })
	const l = live.current
	const count = () => props.items.length
	const live2 = { tracking: false }
	const tracking = live2

	const stride = () => viewRect(clipRef.current)?.w ?? clipRef.current?.getActualSize?.().width ?? 1
	const setX = (x: number) => {
		l.x = x
		if (rowRef.current) rowRef.current.translateX = x
		props.progress.set(-x / (l.stride || 1))
	}

	const layoutSlides = () => {
		const clip = clipRef.current
		const row = rowRef.current
		if (!clip || !row) return
		const s = clip.getActualSize?.()
		if (!s?.width) return
		l.stride = s.width
		row.width = s.width * count()
		row.height = s.height
		row.eachChild?.((child: any) => {
			child.width = s.width
			child.height = s.height
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
				if (l.stride !== before && !live2.tracking) setX(-l.index * l.stride)
			} finally {
				inLayout = false
			}
		}
		clipRef.current?.on?.('layoutChanged', cb)
		l.stride = stride()
		setX(-l.index * l.stride)
		return () => clipRef.current?.off?.('layoutChanged', cb)
	})

	useLayoutEffect(() => {
		const controller: ViewportController = {
			goTo(index, behavior) {
				l.index = clamp(index, 0, count() - 1)
				const target = -l.index * (l.stride = stride())
				if (behavior === 'smooth') {
					const mv = props.progress
					const from = l.x
					const to = target
					let last = -from / l.stride
					const off = mv.on('change', (v: number) => {
						const dx = (v - last) * l.stride
						last = v
						setX(l.x - dx)
					})
					mv.set(-from / l.stride)
					void mv.animate(-to / l.stride, SETTLE).finished.then(() => {
						off()
						setX(to)
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
				;(globalThis as any).__lbTrack = [phase, dx, vx, l.x]
				if (phase === 'start') {
					live2.tracking = true
					l.anim?.stop?.()
					l.stride = stride()
				} else if (phase === 'move') {
					setX(-l.index * l.stride + dx)
				} else {
					// Snap: projected resting position decides the landing slide —
					// same rule the web scroller's snap gives for a flick.
					live2.tracking = false
					const projected = l.x + 0.2 * vx
					const next = clamp(Math.round(-projected / l.stride), 0, count() - 1)
					this.goTo(next, 'smooth')
				}
			},
		}
		props.controllerRef.current = controller
		;(globalThis as any).__lbVp = 'registered'
		return () => { if (props.controllerRef.current === controller) props.controllerRef.current = null }
	})

	return (
		<masonview ref={clipRef} className={cx('vx-lightbox-viewport', props.className)} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, overflow: 'hidden', ...props.style }} id={props.id}
			testID={props.testID} clipToBounds>
			<masonview ref={rowRef} className="vx-lightbox-track" style={{ position: 'absolute', left: 0, top: 0, flexDirection: 'row' }}>
				{props.children as never}
			</masonview>
		</masonview>
	)
}
