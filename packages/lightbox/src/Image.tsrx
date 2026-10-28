/** @jsxImportSource @octane-xplat/jsx */
// Native slide image: owns the morph channel, the gesture surface, and the
// zoom/pan transform — same shape as Image.web.tsrx but the frame writes go to
// NativeScript view properties and gestures come from gesturehandler.
import { useEffect, useLayoutEffect, useRef, useState } from 'octane'
import type { Image as NativeImage } from '@nativescript/core'
import { observeNativeImage } from './native-image-source'
import { cx } from '@octane-xplat/lib'
import { mergeStyle } from './style-merge'
import { useMotionValue } from '@octane-xplat/motion'
import { createClipWriter } from './clip'
import { viewRect } from './rect'
import { SETTLE, INERTIA } from './constants'
import { clamp, fit, lerp, lerpVisual, thumbVisualFrom, toStyle } from './math'
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

export function Image(props: LightboxImagePartProps) @{
	const ctx = useLightboxCtx()
	const { index, onTap } = useSlideCtx()
	const item = ctx.items[index]
	const wrapRef = useRef<any>(null)
	const imgRef = useRef<NativeImage | null>(null)
	const [box, setBox] = useState<Rect | null>(null)
	const src = props.src ?? item?.src
	const [decoded, setDecoded] = useState<{ source: string; width: number; height: number; failed: boolean } | null>(null)
	const currentDecode = decoded?.source === src ? decoded : null
	const failed = currentDecode?.failed ?? false
	const loaded = !!currentDecode && !failed
	useLayoutEffect(() => {
		const host = imgRef.current
		if (!host || !src) return
		return observeNativeImage(host, src, result => setDecoded({ source: src, ...result }))
	}, [src])

	const explicit = item?.width && item?.height && Number.isFinite(item.width) && Number.isFinite(item.height) && item.width > 0 && item.height > 0 ? item.width / item.height : null
	const aspect = explicit ?? (currentDecode && !failed ? currentDecode.width / currentDecode.height : failed ? 1 : null)
	const F = box && aspect ? fit(aspect, box) : null
	const x = useMotionValue(0)
	const y = useMotionValue(0)
	const scale = useMotionValue(1)

	const live = useRef({ F, ctx, box, index, failed, aspect })
	live.current = { F, ctx, box, index, failed, aspect }

	// Measure: re-read on layout changes via NativeScript's layoutChanged.
	// Measure the untransformed slide — never listen on the wrap itself, as
	// the transform writes below can re-enter layout on iOS.
	useLayoutEffect(() => {
		const v = wrapRef.current
		const target = (v?.parent as any) ?? v
		if (!target) return
		const update = () => {
			const r = target.getActualSize?.()
			if (!r || !r.width || !r.height) return
			setBox((prev) => (prev && prev.w === r.width && prev.h === r.height ? prev : { x: 0, y: 0, w: r.width, h: r.height }))
		}
		update()
		const cb = () => update()
		target.on?.('layoutChanged', cb)
		return () => target.off?.('layoutChanged', cb)
	}, [])

	const slideEl = () => (wrapRef.current?.parent as any) ?? null
	// The wrap lives at the fitted rect inside its slide; the slide is the
	// page-sized pane to measure, not the wrap itself.

	// Write the transform MVs to the native view.
	let syncing = false
	const sync = () => {
		if (syncing) return
		const v = wrapRef.current
		if (!v) return
		syncing = true
		try {
			v.translateX = x.get()
			v.translateY = y.get()
			v.scaleX = v.scaleY = scale.get()
		} finally {
			syncing = false
		}
	}
	useLayoutEffect(() => {
		if (wrapRef.current) {
			wrapRef.current.originX = 0
			wrapRef.current.originY = 0
		}
		const offs = [x.on('change', sync), y.on('change', sync), scale.on('change', sync)]
		sync()
		return () => offs.forEach((f) => f())
	}, [])

	const clip = useRef<ReturnType<typeof createClipWriter> | null>(null)
	useLayoutEffect(() => {
		const v = wrapRef.current
		if (!v) return
		clip.current = createClipWriter(v)
		return () => clip.current?.clear()
	}, [])

	const apply = (v: Visual, b: Rect) => {
		if (!b.w || !b.h || !Number.isFinite(b.w) || !Number.isFinite(b.h)) return
		const s = toStyle(v, b)
		x.jump(s.x)
		y.jump(s.y)
		scale.jump(s.scale)
		clip.current?.setClip(s.inset, s.radius)
		const el = wrapRef.current
		if (el) el.opacity = s.opacity
	}

	const anims = useRef<{ stop: () => void }[]>([])
	const openRetry = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
	const stop = () => {
		clearTimeout(openRetry.current)
		openRetry.current = undefined
		for (const a of anims.current) a.stop()
		anims.current = []
	}
	const morph = useRef<Visual | null>(null)
	const morphProgress = useMotionValue(0)
	const morphTarget = useRef<Visual | null>(null)
	const morphPresence = useRef({ from: 0, to: 1 })
	const wrapRect = () => viewRect(wrapRef.current) ?? { x: 0, y: 0, w: 0, h: 0 }
	useLayoutEffect(() => morphProgress.on('change', (p: number) => {
		const from = morph.current
		const to = morphTarget.current
		const b = live.current.F
		if (!from || !to || !b) return
		const bb = base()
		apply(lerpVisual(from, to, p), bb)
		live.current.ctx.presence.set(lerp(morphPresence.current.from, morphPresence.current.to, clamp(p, 0, 1)))
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
			case 'restorePresence': anims.current.push(ctx.presence.animate(1, SETTLE)); break
			case 'dragging': ctx.setDragging(c.value); break
			case 'close': ctx.close(c.velocity); break
			case 'tap': {
				const e = {
					index: live.current.index,
					target: c.target,
					x: c.x,
					y: c.y,
					pointerType: c.pointer,
					prevented: false,
					preventDefault() { this.prevented = true },
				}
				onTap?.(e as never)
				if (e.prevented) break
				if (c.target === 'backdrop') {
					if (live.current.ctx.options.closeOnBackdropClick) live.current.ctx.close()
				} else if (c.pointer !== 'mouse') {
					live.current.ctx.toggleUi()
				}
				break
			}
			case 'track': {
				// Native paging rides the track — route the command to the Viewport.
				const v = ctx.viewport.current
				if (c.phase === 'end') v?.track('end', c.dx, c.vx)
				else v?.track(c.phase, c.dx, c.vx)
				break
			}
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

	// The viewport owns the gesture surface (the clip never transforms, so
	// touches always hit it); each gesture sequence latches to the slide that
	// is current at its start and routes intents here.
	useEffect(() => {
		return ctx.viewport.current?.registerInput(index, send)
	}, [])

	// Register the controller once mounted.
	useLayoutEffect(() => {
		const controller: ImageController = {
			animateIn(trigger) {
				stop()
				const { ctx } = live.current
				const size = wrapRef.current?.getActualSize?.()
				const fitted = live.current.F
				if (!fitted || !size?.width || !size?.height) {
					// Native layout may take more than one frame. Start only after
					// the fitted wrapper has bounds, so the clip uses its real size.
					openRetry.current = setTimeout(() => {
						if (live.current.ctx.phase === 'opening') this.animateIn(trigger)
					}, 16)
					return
				}
				const b = base()
				const rest = (bb: Rect): Visual => ({ img: bb, clip: bb, radius: 0, opacity: 1 })
				const thumb = !live.current.failed && !ctx.reducedMotion && trigger ? thumbVisual(trigger) : null
				const from = thumb ?? { ...rest(b), opacity: 0 }
				morph.current = from
				morphTarget.current = rest(b)
				morphPresence.current = { from: 0, to: 1 }
				apply(from, b)
				ctx.presence.set(0)
				if (thumb) ctx.hideTrigger(trigger)
				morphProgress.jump(0)
				void morphProgress.animate(1, ctx.options.open).finished.then((result) => {
					if (result !== 'finished' || live.current.ctx.phase !== 'opening') return
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
				if (!live.current.F) {
					await ctx.presence.animate(0, ctx.options.close).finished
					return
				}
				const from = current(base())
				const thumb = !live.current.failed && !ctx.reducedMotion && trigger ? thumbVisual(trigger) : null
				const to = thumb ?? { ...from, opacity: 0 }
				const t0 = trigger ? viewRect(trigger) : null
				const target = (): Visual => {
					if (!thumb || !t0) return to
					return thumbVisual(trigger) ?? to
				}
				morph.current = from
				morphTarget.current = target()
				morphPresence.current = { from: ctx.presence.get(), to: 0 }
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
	useLayoutEffect(() => {
		const off = scale.on('change', (s: number) => live.current.ctx.setZoomed(s > 1.01))
		return () => {
			off()
			if (live.current.ctx.index === index) live.current.ctx.setZoomed(false)
		}
	}, [index])
	useLayoutEffect(() => () => stop(), [])
	// Start the open morph once the viewer is opening on this slide.
	useLayoutEffect(() => {
		if (ctx.phase === 'opening' && ctx.index === index) {
			ctx.images.get(index)?.animateIn(ctx.openTrigger.current ?? ctx.pickTrigger(index, false))
		}
	}, [ctx.phase])

	const thumbVisual = (trigger: any): Visual | null => {
		const tr = viewRect(trigger)
		const sr = slideEl() ? viewRect(slideEl()) : null
		if (!tr || !sr) return null
		const r = (trigger as any)?.borderRadius
		return thumbVisualFrom(tr, sr, live.current.aspect ?? 1, typeof r === 'number' ? r : 0)
	}
	const base = (): Rect => live.current.F!
	const current = (b: Rect): Visual => ({ img: { x: b.x + x.get(), y: b.y + y.get(), w: b.w * scale.get(), h: b.h * scale.get() }, clip: b, radius: 0, opacity: 1 })

	const alt = props.alt ?? item?.alt ?? ''
	if (!item) return null
	return (
		<masonview ref={wrapRef} className={cx('vx-lightbox-image', loaded && 'vx-lightbox-image--loaded', props.className)} style={mergeStyle(F ? { position: 'absolute', left: F.x, top: F.y, width: F.w, height: F.h } : { position: 'absolute', width: 0, height: 0, opacity: 0 }, props.style)} id={props.id}
			testID={props.testID}>
			{failed ? <label accessibilityLabel={alt}>{alt}</label> : null}
			{src ? (
				<image
					key={src}
					ref={imgRef}
					src={src}
					accessibilityLabel={alt}
					style={{ width: '100%', height: '100%' }}
				/>
			) : null}
		</masonview>
	)
}
