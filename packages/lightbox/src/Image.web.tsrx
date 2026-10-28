/** @jsxImportSource @octane-xplat/jsx/dom */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'octane'
import { useMotionValue } from '@octane-xplat/motion'
import type { AnimationControls } from '@octane-xplat/motion'
import { cx } from '@octane-xplat/lib'
import { mergeStyle } from './style-merge'
import { clamp, fit, lerpVisual, toStyle } from './math'
import type { Rect, Visual } from './math'
import { createGestureMachine } from './gesture-machine'
import type { Command, Intent, MachineEnv, XY } from './gesture-machine'
import { createTapDetector } from './tap-detector'
import { INERTIA, SETTLE } from './constants'
import { useLightboxCtx, useSlideCtx } from './root.web.tsrx'
import type { ImageController } from './root.web.tsrx'
import { fadeVisual, radiusOf, shiftVisual, thumbImg, thumbVisual, toRect } from './web-dom.web'

import type { LightboxImagePartProps } from './props'
export type LightboxImageProps = LightboxImagePartProps

const center = (r: Rect) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 })
const clipPathOf = (inset: { top: number; right: number; bottom: number; left: number }, radius: number) =>
	inset.top || inset.right || inset.bottom || inset.left || radius
		? `inset(${inset.top}px ${inset.right}px ${inset.bottom}px ${inset.left}px round ${radius}px)`
		: 'none'

export function Image(props: LightboxImageProps) {
	const ctx = useLightboxCtx()
	const slide = useSlideCtx()
	const { index } = slide
	const item = ctx.items[index]
	const imgRef = useRef<HTMLImageElement | null>(null)
	const wrapRef = useRef<HTMLDivElement | null>(null)
	const slideEl = () => wrapRef.current!.closest<HTMLDivElement>('[data-lightbox-slide]')!
	const x = useMotionValue(0)
	const y = useMotionValue(0)
	const scale = useMotionValue(1)
	const prog = useMotionValue(0) // morph progress driver
	const [box, setBox] = useState<Rect | null>(null)
	const [aspect, setAspect] = useState(item?.width && item.height ? item.width / item.height : 0)
	const [placeholder, setPlaceholder] = useState<string | null>(null)
	const [loaded, setLoaded] = useState(false)
	const anims = useRef<AnimationControls[]>([])
	const pending = useRef(new Set<() => void>())
	const morph = useRef<Visual | null>(null)

	const F = box && aspect ? fit(aspect, box, 'contain') : null
	const live = useRef({ F, ctx, slide, box })
	live.current = { F, ctx, slide, box }

	const stop = () => {
		for (const a of anims.current) a.stop()
		anims.current = []
	}

	// Measure the slide's content box; borrow the thumbnail's aspect if needed.
	useLayoutEffect(() => {
		const el = slideEl()
		const measure = () => {
			const cs = getComputedStyle(el)
			const [pl, pt, pr, pb] = [cs.paddingLeft, cs.paddingTop, cs.paddingRight, cs.paddingBottom].map(parseFloat)
			const next = { x: pl, y: pt, w: el.clientWidth - pl - pr, h: el.clientHeight - pt - pb }
			setBox((b) => (b && b.x === next.x && b.y === next.y && b.w === next.w && b.h === next.h ? b : next))
		}
		measure()
		const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
		ro?.observe(el)
		el.style.touchAction = 'pan-x'
		const trigger = [...(ctx.triggers.get(index) ?? [])][0]
		const thumb = trigger && thumbImg(trigger)
		if (thumb?.currentSrc) setPlaceholder(thumb.currentSrc)
		if (!aspect && trigger) {
			const r = trigger.getBoundingClientRect()
			setAspect(thumb?.naturalWidth ? thumb.naturalWidth / thumb.naturalHeight : r.height ? r.width / r.height : 1.5)
		}
		const media = imgRef.current as (HTMLImageElement & { readyState?: number }) | null
		if (media && (media.complete ? media.naturalWidth : (media.readyState ?? 0) >= 2)) onLoad()
		return () => ro?.disconnect()
	}, [])

	const onLoad = () => {
		const img = imgRef.current
		if (!img) return
		setLoaded(true)
		if (!(item?.width && item.height) && img.naturalWidth) setAspect(img.naturalWidth / img.naturalHeight)
	}

	/** Screen rect of the fitted image at rest. */
	const base = (): Rect => {
		const el = slideEl()
		const r = el.getBoundingClientRect()
		const f = live.current.F!
		return { x: r.left + el.clientLeft + f.x, y: r.top + el.clientTop + f.y, w: f.w, h: f.h }
	}
	const radius = () =>
		imgRef.current ? radiusOf(imgRef.current, imgRef.current.getBoundingClientRect()) : 0

	// MotionValues drive the transform; the clip only exists during the morph.
	const sync = () => {
		const el = wrapRef.current
		if (!el) return
		el.style.transform = `translate(${x.get()}px, ${y.get()}px) scale(${scale.get()})`
	}
	useLayoutEffect(() => {
		const offs = [x.on('change', sync), y.on('change', sync), scale.on('change', sync)]
		return () => offs.forEach((o) => o())
	}, [])

	const apply = (v: Visual, b: Rect) => {
		const el = wrapRef.current
		if (!el) return
		const s = toStyle(v, b)
		x.set(s.x)
		y.set(s.y)
		scale.set(s.scale)
		el.style.transform = `translate(${s.x}px, ${s.y}px) scale(${s.scale})`
		el.style.clipPath = clipPathOf(s.inset, s.radius)
		el.style.opacity = String(s.opacity)
		morph.current = v
	}
	const current = (b: Rect): Visual => {
		if (morph.current) return morph.current
		const s = scale.get()
		const img = { x: b.x + x.get(), y: b.y + y.get(), w: b.w * s, h: b.h * s }
		return { img, clip: img, radius: radius(), opacity: 1 }
	}
	const run = (transition: Parameters<typeof prog.animate>[1] & object, onUpdate: (p: number) => void, velocity = 0) =>
		new Promise<void>((resolve) => {
			const done = () => {
				pending.current.delete(done)
				resolve()
			}
			pending.current.add(done)
			// 0→1 progress needs a small restDelta so springs don't idle near the end.
			prog.jump(0)
			const off = prog.on('change', onUpdate)
			anims.current.push(
				prog.animate(1, {
					restDelta: 0.002,
					restSpeed: 0.02,
					...transition,
					velocity,
				}),
			)
			void anims.current[anims.current.length - 1]!.finished.then(() => {
				off()
				done()
			})
		})

	const controller: ImageController = {
		animateIn(trigger) {
			stop()
			const { ctx } = live.current
			if (!live.current.F || !base().w) {
				// Not yet measured (mount ordering races the layout effect):
				// defer one frame before falling back to the presence fade.
				requestAnimationFrame(() => {
					if (!morph.current && (live.current.ctx.phase === 'opening' || live.current.ctx.phase === 'open')) {
						if (live.current.F && base().w) {
							this.animateIn?.(trigger)
						} else {
							ctx.presence.set(0)
							void ctx.presence.animate(1, ctx.options.open).finished.then(() => ctx.onOpened())
						}
					}
				})
				return
			}
			const r = radius()
			const rest = (b: Rect): Visual => ({ img: b, clip: b, radius: r, opacity: 1 })
			const thumb = !ctx.reducedMotion && trigger ? thumbVisual(trigger, aspect) : null
			const from = thumb ?? fadeVisual(rest(base()))
			apply(from, base())
			ctx.presence.set(0)
			if (thumb) ctx.hideTrigger(trigger)
			// Endpoints are re-read every frame, so anything still settling underneath can't knock the morph off target.
			void run(ctx.options.open, (p) => {
				const b = base()
				if (!b.w) return
				apply(lerpVisual(from, rest(b), p), b)
				ctx.presence.set(clamp(p, 0, 1))
			}).then(() => {
				morph.current = null
				const el = wrapRef.current
				if (el) el.style.clipPath = 'none'
				x.set(0)
				y.set(0)
				scale.set(1)
				ctx.onOpened()
			})
		},
		async animateOut(trigger, velocity) {
			stop()
			const { ctx } = live.current
			if (!live.current.F) {
				await ctx.presence.animate(0, ctx.options.close).finished
				return
			}
			const from = current(base())
			// The gallery may still be settling under us; don't let the slide clip the flight home.
			slideEl().style.overflow = 'visible'
			const thumb = !ctx.reducedMotion && trigger ? thumbVisual(trigger, aspect) : null
			const to = thumb ?? fadeVisual(from)
			if (thumb) ctx.hideTrigger(trigger)
			// Follow the thumbnail if the page is still moving.
			const t0 = trigger?.getBoundingClientRect()
			const target = (): Visual => {
				if (!thumb || !trigger || !t0) return to
				const r = trigger.getBoundingClientRect()
				return shiftVisual(to, r.left - t0.left, r.top - t0.top)
			}
			// Carry release velocity into the morph so a flick flows straight home.
			const c0 = center(from.img)
			const pv = velocity ? center(to.img) : c0
			void velocity // velocity projection lives in the spring's `velocity` below
			await run(ctx.options.close, (p) => {
				const b = base()
				if (!b.w) return
				apply(lerpVisual(from, target(), p), b)
				ctx.presence.set(1 - clamp(p, 0, 1))
			}, velocity && pv ? Math.hypot(velocity.x, velocity.y) * 0.001 : 0)
		},
		zoomBy(factor) {
			for (const c of machine.send({ kind: 'zoomBy', factor })) exec(c)
		},
		resetZoom() {
			for (const c of machine.send({ kind: 'resetZoom' })) exec(c)
		},
	}

	const setTransform = (t: { x: number; y: number; scale: number }) => {
		x.jump(t.x)
		y.jump(t.y)
		scale.jump(t.scale)
	}

	const exec = (c: Command) => {
		switch (c.kind) {
			case 'stop':
				stop()
				break
			case 'set':
				setTransform(c.t)
				break
			case 'settle':
				anims.current.push(
					x.animate(c.t.x, SETTLE),
					y.animate(c.t.y, SETTLE),
					scale.animate(c.t.scale, SETTLE),
				)
				break
			case 'inertia':
				anims.current.push(
					x.animate(x.get(), {
						type: 'inertia',
						velocity: c.velocity.x,
						min: c.bounds.minX,
						max: c.bounds.maxX,
						...INERTIA,
					}),
					y.animate(y.get(), {
						type: 'inertia',
						velocity: c.velocity.y,
						min: c.bounds.minY,
						max: c.bounds.maxY,
						...INERTIA,
					}),
				)
				break
			case 'presence':
				ctx.presence.set(c.value)
				break
			case 'restorePresence':
				anims.current.push(ctx.presence.animate(1, SETTLE))
				break
			case 'dragging':
				ctx.setDragging(c.value)
				break
			case 'close':
				ctx.close(c.velocity)
				break
			case 'tap': {
				const event = {
					index,
					target: c.target,
					x: c.x,
					y: c.y,
					pointerType: c.pointer,
					prevented: false,
					preventDefault() {
						this.prevented = true
					},
				}
				live.current.slide.onTap?.(event as never)
				if (event.prevented) break
				if (c.target === 'backdrop') {
					if (live.current.ctx.options.closeOnBackdropClick) live.current.ctx.close()
				} else if (c.pointer !== 'mouse') {
					live.current.ctx.toggleUi()
				}
				break
			}
			case 'track':
				ctx.viewport.current?.track(c.phase, c.dx, c.vx)
				break
		}
	}

	const env: MachineEnv = {
		fit: () => live.current.F,
		view: () => live.current.box ?? { w: 1, h: 1 },
		transform: () => ({ x: x.get(), y: y.get(), scale: scale.get() }),
		maxZoom: () => ctx.options.maxZoom,
		itemCount: () => ctx.items.length,
		interactive: () =>
			live.current.ctx.phase === 'open' && live.current.ctx.index === index && live.current.F !== null,
	}
	const machine = useMemo(() => createGestureMachine(env), [])
	const detector = useMemo(() => createTapDetector({ now: () => performance.now(), schedule: (fn, ms) => { const id = setTimeout(fn, ms); return () => clearTimeout(id) } }), [])

	// Gesture DOM adapter: pointer pan/pinch, wheel zoom/pull, taps via the detector.
	useEffect(() => {
		const el = wrapRef.current
		if (!el) return
		const pointers = new Map<number, XY>()
		const moves: { t: number; p: XY }[] = []
		let moved = false
		let down: XY | null = null
		let downPointer = ''
		let mouseOrigin: XY | null = null
		const send = (i: Intent) => {
			for (const c of machine.send(i)) {
				// Touch and trackpad paging retain the browser's native scroll-snap.
				if (c.kind !== 'track' || downPointer === 'mouse') exec(c)
			}
		}
		const velocity = (): XY => {
			const now = performance.now()
			while (moves.length && now - moves[0]!.t > 100) moves.shift()
			if (moves.length < 2) return { x: 0, y: 0 }
			const a = moves[0]!
			const b = moves[moves.length - 1]!
			const dt = Math.max(1, b.t - a.t)
			return { x: ((b.p.x - a.p.x) / dt) * 1000, y: ((b.p.y - a.p.y) / dt) * 1000 }
		}
		const firstTwo = () => [...pointers.values()].slice(0, 2) as [XY, XY]
		const pairOf = (id: number): [XY, XY] | null => {
			const other = [...pointers.entries()].find(([k]) => k !== id)
			const mine = pointers.get(id)
			return other && mine ? [mine, other[1]] : null
		}

		const ignoreTarget = (t: EventTarget | null) =>
			t instanceof HTMLElement && t.closest('button, a, input, textarea, select, video, [data-lightbox-ignore]')

		const onPointerDown = (e: PointerEvent) => {
			if (e.pointerType === 'mouse' && e.button !== 0) return
			if (ignoreTarget(e.target)) return
			pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
			// Synthesized pointer events have no active pointer to capture.
			try { el.setPointerCapture?.(e.pointerId) } catch {}
			if (pointers.size === 1) {
				down = { x: e.clientX, y: e.clientY }
				downPointer = e.pointerType || 'touch'
				mouseOrigin = downPointer === 'mouse' ? slideOrigin() : null
				moved = false
				moves.length = 0
				moves.push({ t: performance.now(), p: { x: e.clientX, y: e.clientY } })
				send({ kind: 'panStart', at: toSlide(e.clientX, e.clientY), pointer: downPointer as never })
			} else if (pointers.size === 2) {
				detector.cancel()
				const [a, b] = firstTwo()
				send({ kind: 'pinchStart', a: toSlide(a.x, a.y), b: toSlide(b.x, b.y) })
			}
		}
		const onPointerMove = (e: PointerEvent) => {
			const prev = pointers.get(e.pointerId)
			if (!prev) return
			pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
			moves.push({ t: performance.now(), p: { x: e.clientX, y: e.clientY } })
			if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) >= 6) moved = true
			if (pointers.size >= 2) {
				const pair = pairOf(e.pointerId)
				if (pair) send({ kind: 'pinchMove', a: toSlide(pair[0].x, pair[0].y), b: toSlide(pair[1].x, pair[1].y) })
			} else {
				send({ kind: 'panMove', at: toSlide(e.clientX, e.clientY) })
			}
		}
		const onPointerUp = (e: PointerEvent) => {
			const wasPinch = pointers.size >= 2
			const at = pointers.get(e.pointerId) ?? { x: e.clientX, y: e.clientY }
			pointers.delete(e.pointerId)
			const cancelled = e.type === 'pointercancel'
			if (wasPinch) {
				if (pointers.size < 2) send({ kind: 'pinchEnd', cancelled })
				return
			}
			const v = velocity()
			send({ kind: 'panEnd', at: toSlide(at.x, at.y), velocity: v, cancelled })
			if (!cancelled && down && !moved) {
				// Tap: fire through the detector — it delays for the double-tap window when zoom can apply.
				const onImage = insideImage(e.clientX, e.clientY)
				const waitForDouble = ctx.options.maxZoom > 1 && !(downPointer === 'mouse' && !onImage)
				const atSlide = toSlide(e.clientX, e.clientY)
				const pointer = (e.pointerType || 'touch') as never
				detector.up(atSlide, pointer, waitForDouble, (i) => send(i))
			}
			down = null
			mouseOrigin = null
		}
		const insideImage = (cx2: number, cy2: number) => {
			const r = el.getBoundingClientRect()
			return cx2 >= r.left && cx2 <= r.right && cy2 >= r.top && cy2 <= r.bottom
		}
		const slideOrigin = () => {
			const r = slideEl().getBoundingClientRect()
			const s = slideEl()
			return { x: r.left + s.clientLeft, y: r.top + s.clientTop }
		}
		const toSlide = (cx2: number, cy2: number): XY => {
			// The slide moves under a captured mouse pointer while paging. Keep
			// its original coordinate space so scroll displacement isn't added twice.
			const o = mouseOrigin ?? slideOrigin()
			return { x: cx2 - o.x, y: cy2 - o.y }
		}

		// Wheel: ctrl/pinch (or wheelToZoom) zooms around the cursor; a plain
		// vertical wheel pulls to dismiss around the fitted center.
		let wheel = { dy: 0, t0: 0 }
		let wheelTimer: ReturnType<typeof setTimeout> | null = null
		const wheelReset = () => {
			wheel = { dy: 0, t0: 0 }
			wheelTimer = null
		}
		const onWheel = (e: WheelEvent) => {
			const sEl = slideEl()
			const r = sEl.getBoundingClientRect()
			const f = live.current.F
			if (!f || live.current.ctx.phase !== 'open') return
			if (e.ctrlKey || e.metaKey || live.current.ctx.options.wheelToZoom) {
				e.preventDefault()
				const p = { x: e.clientX - r.left, y: e.clientY - r.top }
				const factor = Math.exp(-e.deltaY * (e.ctrlKey || e.metaKey ? 0.01 : 0.002))
				send({ kind: 'zoomNow', scale: scale.get() * factor, focal: p })
				return
			}
			// Vertical pull: accumulate and let go after 120ms of quiet.
			if (wheelTimer == null) {
				send({ kind: 'panStart', at: { x: f.x + f.w / 2, y: f.y + f.h / 2 }, pointer: 'wheel' })
				wheel.t0 = performance.now()
			}
			wheel.dy += e.deltaY
			send({ kind: 'panMove', at: { x: f.x + f.w / 2, y: f.y + f.h / 2 + wheel.dy } })
			if (wheelTimer) clearTimeout(wheelTimer)
			wheelTimer = setTimeout(() => {
				const dt = Math.max(1, performance.now() - wheel.t0)
				send({
					kind: 'panEnd',
					at: { x: f.x + f.w / 2, y: f.y + f.h / 2 + wheel.dy },
					velocity: { x: 0, y: (wheel.dy / dt) * 1000 },
					cancelled: false,
				})
				wheelReset()
			}, 120)
		}

		// Safari gesture events: fake a two-pointer pinch around the point.
		let g0: { a: XY; b: XY } | null = null
		const onGestureStart = (e: Event) => {
			e.preventDefault()
			const c = center(live.current.F ?? { x: 0, y: 0, w: 0, h: 0 })
			g0 = { a: { x: c.x - 50, y: c.y }, b: { x: c.x + 50, y: c.y } }
			send({ kind: 'pinchStart', a: g0.a, b: g0.b })
		}
		const onGestureChange = (e: Event) => {
			if (!g0) return
			const gs = (e as unknown as { scale: number }).scale ?? 1
			const c = center(live.current.F ?? { x: 0, y: 0, w: 0, h: 0 })
			send({ kind: 'pinchMove', a: { x: c.x - 50 * gs, y: c.y }, b: { x: c.x + 50 * gs, y: c.y } })
		}
		const onGestureEnd = (e: Event) => {
			if (!g0) return
			g0 = null
			send({ kind: 'pinchEnd', cancelled: e.type === 'gesturecancel' })
		}

		el.addEventListener('pointerdown', onPointerDown)
		el.addEventListener('pointermove', onPointerMove)
		el.addEventListener('pointerup', onPointerUp)
		el.addEventListener('pointercancel', onPointerUp)
		el.addEventListener('wheel', onWheel, { passive: false })
		el.addEventListener('gesturestart', onGestureStart)
		el.addEventListener('gesturechange', onGestureChange)
		el.addEventListener('gestureend', onGestureEnd)
		return () => {
			el.removeEventListener('pointerdown', onPointerDown)
			el.removeEventListener('pointermove', onPointerMove)
			el.removeEventListener('pointerup', onPointerUp)
			el.removeEventListener('pointercancel', onPointerUp)
			el.removeEventListener('wheel', onWheel)
			el.removeEventListener('gesturestart', onGestureStart)
			el.removeEventListener('gesturechange', onGestureChange)
			el.removeEventListener('gestureend', onGestureEnd)
			if (wheelTimer) clearTimeout(wheelTimer)
			detector.cancel()
			send({ kind: 'reset' })
		}
	}, [])

	// Controller registration + zoomed flag.
	useLayoutEffect(() => {
		ctx.images.set(index, controller)
		return () => void ctx.images.delete(index)
	}, [index])
	useLayoutEffect(() => {
		const off = scale.on('change', (s) => live.current.ctx.setZoomed(s > 1.01))
		return () => {
			off()
			if (live.current.ctx.index === index) live.current.ctx.setZoomed(false)
		}
	}, [index])
	// Start the open morph once the viewer is opening on this slide.
	useLayoutEffect(() => {
		if (ctx.phase === 'opening' && ctx.index === index) {
			controller.animateIn(ctx.openTrigger.current ?? ctx.pickTrigger(index, false))
		}
	}, [ctx.phase])
	// Resize → identity (upstream).
	useLayoutEffect(() => {
		if (!F) return
		machine.send({ kind: 'reset' })
		setTransform({ x: 0, y: 0, scale: 1 })
	}, [F?.x, F?.y, F?.w, F?.h])
	// Unmounting mid-animation still lets the root finish opening/closing.
	useEffect(
		() => () => {
			stop()
			for (const done of pending.current) done()
		},
		[],
	)

	const fill: Record<string, unknown> = { position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }
	return (
		<div
			ref={wrapRef}
			data-lightbox-image=""
			className={cx('vx-lightbox-image', loaded && 'vx-lightbox-image--loaded')}
			style={{
				position: 'absolute',
				left: F?.x ?? 0,
				top: F?.y ?? 0,
				width: F?.w ?? 0,
				height: F?.h ?? 0,
				visibility: F ? undefined : 'hidden',
				transformOrigin: '0 0',
				userSelect: 'none',
				WebkitUserSelect: 'none',
				WebkitTouchCallout: 'none',
			}}
		>
			{placeholder && !loaded ? <img src={placeholder} alt="" aria-hidden draggable={false} style={fill} /> : null}
			<img
				ref={imgRef as never}
				src={props.src ?? item?.src}
				alt={props.alt ?? item?.alt ?? ''}
				srcSet={props.srcSet ?? item?.srcSet}
				sizes={props.sizes ?? item?.sizes}
				draggable={false}
				decoding="async"
				onLoad={onLoad}
				className={props.className}
				style={mergeStyle(fill, props.style)}
			/>
		</div>
	)
}
