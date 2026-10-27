import { band, clamp, panRange, zoomAt } from './math'

export type XY = { x: number; y: number }
export type Rect = { x: number; y: number; w: number; h: number }
/** Transform with origin 0 0, relative to the fitted rect. */
export type Transform = { x: number; y: number; scale: number }
export type PointerKind = 'touch' | 'mouse' | 'pen' | 'wheel'

export interface MachineEnv {
	/** F: fitted image rect; null until measured. */
	fit(): Rect | null
	/** Slide content size. */
	view(): { w: number; h: number }
	/** Current live transform values. */
	transform(): Transform
	maxZoom(): number
	itemCount(): number
	/** phase 'open' && current slide && not morphing. */
	interactive(): boolean
}

export type Intent =
	| { kind: 'panStart'; at: XY; pointer: PointerKind }
	| { kind: 'panMove'; at: XY }
	| { kind: 'panEnd'; at: XY; velocity: XY; cancelled: boolean }
	| { kind: 'pinchStart'; a: XY; b: XY }
	| { kind: 'pinchMove'; a: XY; b: XY }
	| { kind: 'pinchEnd'; cancelled: boolean }
	| { kind: 'tap'; at: XY; pointer: PointerKind }
	| { kind: 'doubleTap'; at: XY }
	| { kind: 'zoomNow'; scale: number; focal: XY }
	| { kind: 'panBy'; delta: XY }
	| { kind: 'zoomBy'; factor: number }
	| { kind: 'resetZoom' }
	| { kind: 'reset' }

export type Command =
	| { kind: 'stop' }
	| { kind: 'set'; t: Transform }
	| { kind: 'settle'; t: Transform }
	| { kind: 'inertia'; velocity: XY; bounds: { minX: number; maxX: number; minY: number; maxY: number } }
	| { kind: 'presence'; value: number }
	| { kind: 'restorePresence' }
	| { kind: 'dragging'; value: boolean }
	| { kind: 'close'; velocity?: XY }
	| { kind: 'tap'; target: 'image' | 'backdrop'; x: number; y: number; pointer: PointerKind }
	| { kind: 'track'; phase: 'start' | 'move' | 'end'; dx: number; vx: number; cancelled?: boolean }

const SLOP = 6
const ZOOMED = 1.01

type Gesture =
	| { kind: 'pending' | 'pan' | 'dismiss'; start: XY; x0: number; y0: number; pointer: PointerKind }
	| { kind: 'track'; start: XY; pointer: PointerKind }
	| { kind: 'pinch'; d0: number; m0: XY; m: XY; s0: number; x0: number; y0: number; wasZoomed: boolean }

const dist = (a: XY, b: XY) => Math.hypot(a.x - b.x, a.y - b.y)
const mid = (a: XY, b: XY): XY => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })

/**
 * One machine per slide; slide-local coordinates. Ported from upstream's
 * `Image` gesture effect (lightbox.tsx ~978-1290). The machine owns no
 * timers — tap timing lives in the adapters.
 */
export function createGestureMachine(env: MachineEnv): { send(intent: Intent): Command[] } {
	let g: Gesture | null = null

	const ready = () => env.interactive() && env.fit() !== null
	const bounds = (s: number) => {
		const f = env.fit()!
		const view = env.view()
		const [minX, maxX] = panRange(f.x, f.w, s, view.w)
		const [minY, maxY] = panRange(f.y, f.h, s, view.h)
		return { minX, maxX, minY, maxY }
	}
	const reset = (): Command[] => {
		const wasDismiss = g?.kind === 'dismiss'
		g = null
		return wasDismiss ? [{ kind: 'dragging', value: false }] : []
	}
	/** Pull-to-dismiss: shrink around the grab point, fade the backdrop (upstream `pull`). */
	const pull = (grab: XY, dx: number, dy: number): Command[] => {
		const f = env.fit()!
		const H = env.view().h
		const k = 1 - clamp(Math.abs(dy) / (H * 0.5), 0, 1) * 0.3
		return [
			{
				kind: 'set',
				t: {
					x: grab.x + dx - (grab.x - f.x) * k - f.x,
					y: grab.y + dy - (grab.y - f.y) * k - f.y,
					scale: k,
				},
			},
			{ kind: 'presence', value: 1 - clamp(Math.abs(dy) / (H * 0.35), 0, 1) },
		]
	}
	/** Release after a pull: fly home with velocity or spring back (upstream `letGo`). */
	const letGo = (dy: number, v: XY, cancelled: boolean): Command[] => {
		const out: Command[] = [{ kind: 'dragging', value: false }]
		const projected = dy + v.y * 0.2
		if (!cancelled && Math.abs(projected) > env.view().h * 0.15 && Math.sign(projected) === Math.sign(dy)) {
			out.push({ kind: 'close', velocity: v })
		} else {
			out.push({ kind: 'settle', t: { x: 0, y: 0, scale: 1 } }, { kind: 'restorePresence' })
		}
		return out
	}
	/** Spring target zoomed about a point (upstream `settle` + `zoomTo`). */
	const settleTo = (s1: number, focus: XY | null): Command[] => {
		const f = env.fit()
		if (!f) {return []}
		const view = env.view()
		const t = env.transform()
		const s0 = t.scale
		const s = clamp(s1, 1, env.maxZoom())
		const p = focus ?? { x: view.w / 2, y: view.h / 2 }
		const b = bounds(s)
		return [
			{ kind: 'stop' },
			{
				kind: 'settle',
				t: {
					x: clamp(zoomAt(f.x, t.x, s0, s, p.x), b.minX, b.maxX),
					y: clamp(zoomAt(f.y, t.y, s0, s, p.y), b.minY, b.maxY),
					scale: s,
				},
			},
		]
	}

	const send = (intent: Intent): Command[] => {
		if (intent.kind === 'reset') {
			return reset()
		}

		switch (intent.kind) {
			case 'panStart': {
				if (!ready()) {
					g = null
					return []
				}
				const t = env.transform()
				g = { kind: 'pending', start: intent.at, x0: t.x, y0: t.y, pointer: intent.pointer }
				return [{ kind: 'stop' }]
			}
			case 'panMove': {
				if (!g || g.kind === 'pinch') {return []}
				if (!ready()) {return reset()}
				const p = intent.at
				if (g.kind === 'pending') {
					if (dist(p, g.start) < SLOP) {return []}
					const adx = Math.abs(p.x - g.start.x)
					const ady = Math.abs(p.y - g.start.y)
					const s = env.transform().scale
					if (s > ZOOMED) {
						g = { ...g, kind: 'pan' }
					} else if (g.pointer === 'wheel') {
						// A wheel stream never owns the track — vertical pulls, horizontal stays native.
						if (ady <= adx) {
							g = null
							return []
						}
						g = { ...g, kind: 'dismiss' }
						return [{ kind: 'dragging', value: true }]
					} else {
						// A mouse swiping slightly diagonally is still swiping; only a clearly vertical drag dismisses.
						const horizontal =
							g.pointer === 'mouse' && env.itemCount() > 1 ? ady <= adx * 1.5 : adx > ady
						if (!horizontal) {
							g = { ...g, kind: 'dismiss' }
							return [{ kind: 'dragging', value: true }]
						}
						g = { kind: 'track', start: g.start, pointer: g.pointer }
						return [{ kind: 'track', phase: 'start', dx: 0, vx: 0 }]
					}
				}
				const dx = p.x - g.start.x
				const dy = p.y - g.start.y
				if (g.kind === 'pan') {
					const t = env.transform()
					const b = bounds(t.scale)
					const view = env.view()
					return [
						{
							kind: 'set',
							t: {
								x: band(g.x0 + dx, b.minX, b.maxX, view.w),
								y: band(g.y0 + dy, b.minY, b.maxY, view.h),
								scale: t.scale,
							},
						},
					]
				}
				if (g.kind === 'dismiss') {return pull(g.start, dx, dy)}
				return [{ kind: 'track', phase: 'move', dx, vx: 0 }]
			}
			case 'panEnd': {
				if (!g || g.kind === 'pinch') {return []}
				const gesture = g
				g = null
				if (gesture.kind === 'pending') {return []}
				if (gesture.kind === 'track') {
					return [
						{
							kind: 'track',
							phase: 'end',
							dx: intent.at.x - gesture.start.x,
							vx: intent.velocity.x,
							cancelled: intent.cancelled,
						},
					]
				}
				if (gesture.kind === 'dismiss') {return letGo(intent.at.y - gesture.start.y, intent.velocity, intent.cancelled)}
				const t = env.transform()
				return [{ kind: 'inertia', velocity: intent.velocity, bounds: bounds(t.scale) }]
			}
			case 'pinchStart': {
				if (!ready()) {
					g = null
					return []
				}
				const t = env.transform()
				g = {
					kind: 'pinch',
					d0: dist(intent.a, intent.b) || 1,
					m0: mid(intent.a, intent.b),
					m: mid(intent.a, intent.b),
					s0: t.scale,
					x0: t.x,
					y0: t.y,
					wasZoomed: t.scale > ZOOMED,
				}
				return [{ kind: 'stop' }]
			}
			case 'pinchMove': {
				if (g?.kind !== 'pinch') {return []}
				if (!ready()) {return reset()}
				const f = env.fit()!
				const max = env.maxZoom()
				const pinch = g
				let s = (pinch.s0 * dist(intent.a, intent.b)) / pinch.d0
				s = s > max ? max * (s / max) ** 0.3 : s < 1 ? s ** 0.75 : s
				pinch.m = mid(intent.a, intent.b)
				const out: Command[] = [
					{
						kind: 'set',
						t: {
							x: pinch.m.x - (pinch.m0.x - (f.x + pinch.x0)) * (s / pinch.s0) - f.x,
							y: pinch.m.y - (pinch.m0.y - (f.y + pinch.y0)) * (s / pinch.s0) - f.y,
							scale: s,
						},
					},
				]
				if (!pinch.wasZoomed) {
					out.push({ kind: 'presence', value: clamp((s - 0.5) / 0.5, 0, 1) })
				}
				return out
			}
			case 'pinchEnd': {
				if (g?.kind !== 'pinch') {return []}
				const pinch = g
				g = null
				const t = env.transform()
				if (!pinch.wasZoomed && t.scale < 0.85 && !intent.cancelled) {
					return [{ kind: 'close' }]
				}
				const s1 = clamp(t.scale, 1, env.maxZoom())
				const f = env.fit()!
				return [
					{ kind: 'stop' },
					{
						kind: 'settle',
						t: {
							x: zoomAt(f.x, t.x, t.scale, s1, pinch.m.x),
							y: zoomAt(f.y, t.y, t.scale, s1, pinch.m.y),
							scale: s1,
						},
					},
					{ kind: 'restorePresence' },
				]
			}
			case 'tap': {
				const f = env.fit()
				if (!f) {return []}
				const t = env.transform()
				const box = { x: f.x + t.x, y: f.y + t.y, w: f.w * t.scale, h: f.h * t.scale }
				const onImage =
					intent.at.x >= box.x &&
					intent.at.x <= box.x + box.w &&
					intent.at.y >= box.y &&
					intent.at.y <= box.y + box.h
				return [
					{
						kind: 'tap',
						target: onImage ? 'image' : 'backdrop',
						x: (intent.at.x - box.x) / box.w,
						y: (intent.at.y - box.y) / box.h,
						pointer: intent.pointer,
					},
				]
			}
			case 'doubleTap': {
				const f = env.fit()
				if (!f) {return []}
				const view = env.view()
				if (env.transform().scale > ZOOMED) {
					return settleTo(1, null)
				}
				return settleTo(Math.max(2, view.w / f.w, view.h / f.h), intent.at)
			}
			case 'zoomNow': {
				const f = env.fit()
				if (!f) {return []}
				const t = env.transform()
				const s1 = clamp(intent.scale, 1, env.maxZoom())
				const b = bounds(s1)
				return [
					{ kind: 'stop' },
					{
						kind: 'set',
						t: {
							x: clamp(zoomAt(f.x, t.x, t.scale, s1, intent.focal.x), b.minX, b.maxX),
							y: clamp(zoomAt(f.y, t.y, t.scale, s1, intent.focal.y), b.minY, b.maxY),
							scale: s1,
						},
					},
				]
			}
			case 'panBy': {
				const t = env.transform()
				const b = bounds(t.scale)
				return [
					{
						kind: 'set',
						t: {
							x: clamp(t.x - intent.delta.x, b.minX, b.maxX),
							y: clamp(t.y - intent.delta.y, b.minY, b.maxY),
							scale: t.scale,
						},
					},
				]
			}
			case 'zoomBy': {
				return settleTo(env.transform().scale * intent.factor, null)
			}
			case 'resetZoom': {
				return settleTo(1, null)
			}
		}
	}

	return { send }
}
