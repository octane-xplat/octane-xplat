/** @jsxImportSource @nativescript-community/octane */
// Native slide image: owns the morph channel, the gesture surface, and the
// zoom/pan transform — same shape as Image.web.tsrx but the frame writes go to
// NativeScript view properties and gestures come from gesturehandler.
import { useEffect, useLayoutEffect, useRef, useState } from 'octane'
import { cx } from '@octane-xplat/lib'
import { useMotionValue } from '@octane-xplat/motion'
import { attachInput } from './input'
import { createClipWriter } from './clip.ios'
import { viewRect } from './rect'
import { SETTLE, INERTIA } from './constants'
import { fit, lerpVisual, toStyle } from './math'
import type { Rect, Visual } from './math'
import { createGestureMachine } from './gesture-machine'
import type { Command, MachineEnv } from './gesture-machine'
import { createTapDetector } from './tap-detector'
import { useLightboxCtx, useSlideCtx } from './root.tsrx'
import type { LightboxImagePartProps } from './props'

export interface ImageController {
	animateIn(trigger: any): void
	animateOut(trigger: any, velocity?: { x: number; y: number }): Promise<void>
	zoomBy(factor: number): void
	resetZoom(): void
}

const center = (r: Rect) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 })

export function Image(props: LightboxImagePartProps) {
	const ctx = useLightboxCtx()
	const { index, onTap } = useSlideCtx()
	const item = ctx.items[index]
	const wrapRef = useRef<any>(null)
	const imgRef = useRef<any>(null)
	const [box, setBox] = useState<Rect | null>(null)
	const [loaded, setLoaded] = useState(false)

	const aspect = (item?.width && item?.height ? item.width / item.height : undefined) ?? 1
	const F = box && aspect ? fit({ w: box.w, h: box.h }, aspect) : null
	const x = useMotionValue(0)
	const y = useMotionValue(0)
	const scale = useMotionValue(1)

	const live = useRef({ F, ctx, box, index })
	live.current = { F, ctx, box, index }

	// Measure: re-read on layout changes via NativeScript's layoutChanged.
	useLayoutEffect(() => {
		const v = wrapRef.current
		if (!v) return
		const update = () => {
			const r = v.getActualSize?.()
			if (r && r.width && r.height) setBox({ x: 0, y: 0, w: r.width, h: r.height })
		}
		update()
		const cb = () => update()
		v.on?.('layoutChanged', cb)
		return () => v.off?.('layoutChanged', cb)
	}, [])

	const slideEl = () => (wrapRef.current?.parent as any) ?? null

	// Write the transform MVs to the native view.
	const sync = () => {
		const v = wrapRef.current
		if (!v) return
		v.translateX = x.get()
		v.translateY = y.get()
		v.scaleX = v.scaleY = scale.get()
	}
	useLayoutEffect(() => {
		const offs = [x.on('change', sync), y.on('change', sync), scale.on('change', sync)]
		sync()
		return () => offs.forEach((f) => f())
	}, [])

	const clip = useRef<ReturnType<typeof createClipWriter> | null>(null)
	useLayoutEffect(() => {
		const v = wrapRef.current
		if (!v) return
		clip.current = createClipWriter(v)
	}, [])

	const apply = (v: Visual, b: Rect) => {
		const s = toStyle(v, b)
		x.jump(s.x)
		y.jump(s.y)
		scale.jump(s.scale)
		clip.current?.setClip(s.inset, s.radius)
		const el = wrapRef.current
		if (el) el.opacity = s.opacity
	}

	const anims = useRef<{ stop: () => void }[]>([])
	const stop = () => {
		for (const a of anims.current) a.stop()
		anims.current = []
	}
	const morph = useRef<Visual | null>(null)
	const morphProgress = useMotionValue(0)
	const morphTarget = useRef<Visual | null>(null)
	const wrapRect = () => viewRect(wrapRef.current) ?? { x: 0, y: 0, w: 0, h: 0 }
	useLayoutEffect(() => morphProgress.on('change', (p: number) => {
		const from = morph.current
		const to = morphTarget.current
		const b = live.current.F
		if (!from || !to || !b) return
		const bb = base()
		apply(lerpVisual(from, to, p), bb)
	}), [])

	const setTransform = (t: { x: number; y: number; scale: number }) => {
		x.jump(t.x)
		y.jump(t.y)
		scale.jump(t.scale)
	}

	const exec = (c: Command) => {
		switch (c.kind) {
			case 'stop': stop(); break
			case 'set': setTransform(c.t); break
			case 'settle': {
				anims.current.push(x.animate(c.t.x, SETTLE), y.animate(c.t.y, SETTLE), scale.animate(c.t.scale, SETTLE))
				if (c.t.scale <= 1.01) ctx.setZoomed(false)
				break
			}
			case 'inertia': {
				const b = c.bounds
				for (const [mv, v0, min, max] of [[x, c.velocity.x, b.minX, b.maxX], [y, c.velocity.y, b.minY, b.maxY]] as const) {
					anims.current.push(mv.animate(mv.get(), { type: 'inertia', velocity: v0, min, max, power: INERTIA.power, timeConstant: INERTIA.timeConstant, bounceStiffness: INERTIA.bounceStiffness, bounceDamping: INERTIA.bounceDamping }))
				}
				break
			}
			case 'presence': ctx.presence.set(c.value); break
			case 'restorePresence': anims.current.push(ctx.presence.animate(1, ctx.options.close)); break
			case 'dragging': ctx.setDragging(c.value); break
			case 'close': ctx.close(c.velocity); break
			case 'toggleUi': ctx.toggleUi(); break
			case 'track': {
				// Native paging rides the track — route the command to the Viewport.
				const v = ctx.viewport.current
				if (c.phase === 'end') v?.track('end', c.dx, c.vx)
				else v?.track(c.phase, c.dx, c.vx)
				break
			}
			case 'zoomed': ctx.setZoomed(true); break
			case 'noop': break
			default: break
		}
	}

	const env: MachineEnv = {
		fit: () => live.current.F,
		view: () => live.current.box ?? { w: 1, h: 1 },
		transform: () => ({ x: x.get(), y: y.get(), scale: scale.get() }),
		maxZoom: () => live.current.ctx.options.maxZoom,
		itemCount: () => live.current.ctx.items.length,
		interactive: () => live.current.ctx.phase === 'open' && live.current.ctx.index === live.current.index && live.current.F !== null,
	}
	const machineRef = useRef<ReturnType<typeof createGestureMachine> | null>(null)
	machineRef.current ??= createGestureMachine(env)
	const detectorRef = useRef<ReturnType<typeof createTapDetector> | null>(null)
	detectorRef.current ??= createTapDetector({ now: () => Date.now(), schedule: (fn, ms) => { const id = setTimeout(fn, ms); return () => clearTimeout(id) } })

	const send = (i: Parameters<ReturnType<typeof createGestureMachine>['send']>[0]) => {
		for (const c of machineRef.current!.send(i)) exec(c)
	}

	useEffect(() => {
		const v = wrapRef.current
		if (!v) return
		const off = attachInput(v, { maxZoom: ctx.options.maxZoom }, (i) => {
			if (i.kind === 'tap') {
				const e = { index: live.current.index, pointer: 'touch' as const, defaultPrevented: false, preventDefault() { e.defaultPrevented = true } }
				onTap?.(e)
				if (e.defaultPrevented) return
				send(i)
				return
			}
			send(i)
		})
		return () => { off() }
	}, [])

	// Register the controller once mounted.
	useLayoutEffect(() => {
		const controller: ImageController = {
			animateIn(trigger) {
				stop()
				const { ctx } = live.current
				if (!live.current.F || !box?.w) {
					ctx.presence.set(0)
					void ctx.presence.animate(1, ctx.options.open).finished.then(() => ctx.onOpened())
					return
				}
				const b = base()
				const rest = (bb: Rect): Visual => ({ img: bb, clip: bb, radius: 0, opacity: 1 })
				const thumb = !ctx.reducedMotion && trigger ? thumbVisual(trigger) : null
				const from = thumb ?? { ...rest(b), opacity: 0 }
				morph.current = from
				morphTarget.current = rest(b)
				apply(from, b)
				ctx.presence.set(0)
				if (thumb) ctx.hideTrigger(trigger)
				morphProgress.jump(0)
				void morphProgress.animate(1, ctx.options.open).finished.then(() => {
					morph.current = null
					morphTarget.current = null
					clip.current?.clear()
					x.set(0); y.set(0); scale.set(1)
					ctx.presence.set(1)
					ctx.onOpened()
				})
			},
			async animateOut(trigger, velocity) {
				stop()
				const { ctx } = live.current
				if (!live.current.F || !box?.w) {
					await ctx.presence.animate(0, ctx.options.close).finished
					return
				}
				const from = current(base())
				const thumb = !ctx.reducedMotion && trigger ? thumbVisual(trigger) : null
				const to = thumb ?? { ...from, opacity: 0 }
				const t0 = trigger ? viewRect(trigger) : null
				const target = (): Visual => {
					if (!thumb || !t0) return to
					const r = viewRect(trigger)
					return r ? { ...to, img: { x: r.x - wrapRect().x, y: r.y - wrapRect().y, w: r.w, h: r.h } } : to
				}
				morph.current = from
				morphTarget.current = target()
				morphProgress.jump(0)
				await morphProgress.animate(1, ctx.options.close).finished
				morph.current = null
				morphTarget.current = null
			},
			zoomBy(factor) { send({ kind: 'zoomBy', factor }) },
			resetZoom() { send({ kind: 'resetZoom' }) },
		}
		ctx.images.set(index, controller)
		return () => { if (ctx.images.get(index) === controller) ctx.images.delete(index) }
	})

	const thumbVisual = (trigger: any): Visual | null => {
		const tr = viewRect(trigger)
		const wr = slideEl() ? viewRect(wrapRef.current) : null
		if (!tr || !wr) return null
		const img = { x: tr.x - wr.x, y: tr.y - wr.y, w: tr.w, h: tr.h }
		return { img, clip: img, radius: 0, opacity: 1 }
	}
	const base = (): Rect => live.current.F!
	const current = (b: Rect): Visual => ({ img: { x: b.x + x.get(), y: b.y + y.get(), w: b.w * scale.get(), h: b.h * scale.get() }, clip: b, radius: 0, opacity: 1 })

	const src = props.src ?? item?.src
	const alt = props.alt ?? item?.alt ?? ''
	if (!item) return null
	return (
		<masonview ref={wrapRef} className={cx('vx-lightbox-image', loaded && 'vx-lightbox-image--loaded', props.className)} style={{ position: 'absolute', ...props.style }} testID={props.testID}>
			{src ? (
				<image
					ref={imgRef}
					src={src}
					alt={alt}
					srcSet={props.srcSet}
					sizes={props.sizes}
					style={{ width: '100%', height: '100%' }}
					onLoaded={() => setLoaded(true)}
				/>
			) : null}
		</masonview>
	)
}
