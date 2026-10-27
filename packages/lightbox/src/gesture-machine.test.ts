import { describe, expect, it } from 'vitest'
import { createGestureMachine, type Command, type Intent, type MachineEnv, type Transform } from './gesture-machine'

// Slide 400x300, image fitted at {0, 50, 400, 200} (4:3 into 400x300? 2:1 → contain 400x200).
const F = { x: 0, y: 50, w: 400, h: 200 }
const VIEW = { w: 400, h: 300 }

function make(over: Partial<MachineEnv> = {}, t: Transform = { x: 0, y: 0, scale: 1 }) {
	const env: MachineEnv = {
		fit: () => F,
		view: () => VIEW,
		transform: () => t,
		maxZoom: () => 4,
		itemCount: () => 3,
		interactive: () => true,
		...over,
	}
	const machine = createGestureMachine(env)
	const run = (...intents: Intent[]) => intents.flatMap((i) => machine.send(i))
	return { machine, run, env }
}

const pan = (kind: 'panStart' | 'panMove' | 'panEnd', at: { x: number; y: number }, extra: any = {}): Intent =>
	({ kind, at, ...extra }) as Intent
const kinds = (out: Command[]) => out.map((c) => c.kind)

describe('gesture machine', () => {
	it('emits stop on panStart and ignores moves under the 6px slop', () => {
		const { run } = make()
		expect(run(pan('panStart', { x: 100, y: 100 }, { pointer: 'touch' }))).toEqual([{ kind: 'stop' }])
		expect(run(pan('panMove', { x: 104, y: 101 }))).toEqual([])
	})

	it('vertical drag past slop pulls to dismiss with shrink + presence', () => {
		const { run } = make()
		run(pan('panStart', { x: 200, y: 150 }, { pointer: 'touch' }))
		const out = run(pan('panMove', { x: 200, y: 200 }))
		expect(kinds(out)).toEqual(['dragging'])
		const set = run(pan('panMove', { x: 205, y: 250 }))
		// dy=100, H=300: k = 1 − clamp(100/150)·0.3 = 1 − 0.2 = 0.8
		const t = set.find((c): c is Command & { kind: 'set' } => c.kind === 'set')!
		expect(t.t.scale).toBeCloseTo(0.8)
		const presence = set.find((c): c is Command & { kind: 'presence' } => c.kind === 'presence')!
		expect(presence.value).toBeCloseTo(1 - 100 / 105)
	})

	it('cancelled panEnd zeroes track-end and inertia velocity', () => {
		const { run } = make()
		run(pan('panStart', { x: 100, y: 100 }, { pointer: 'touch' }))
		run(pan('panMove', { x: 140, y: 100 }))
		expect(run(pan('panEnd', { x: 160, y: 100 }, { velocity: { x: 900, y: 0 }, cancelled: true }))).toEqual([
			{ kind: 'track', phase: 'end', dx: 60, vx: 0, cancelled: true },
		])

		const zoomed = make({}, { x: 0, y: 0, scale: 2 })
		zoomed.run(pan('panStart', { x: 100, y: 100 }, { pointer: 'touch' }))
		zoomed.run(pan('panMove', { x: 140, y: 130 }))
		const out = zoomed.run(pan('panEnd', { x: 140, y: 130 }, { velocity: { x: 500, y: 300 }, cancelled: true }))
		const inertia = out[0]!
		expect(inertia.kind).toBe('inertia')
		if (inertia.kind === 'inertia') {
			expect(inertia.velocity).toEqual({ x: 0, y: 0 })
		}
	})

	it('unzoomed horizontal goes to the track', () => {
		const { run } = make()
		run(pan('panStart', { x: 100, y: 100 }, { pointer: 'touch' }))
		expect(kinds(run(pan('panMove', { x: 130, y: 102 })))).toEqual(['track'])
		expect(run(pan('panMove', { x: 160, y: 102 }))).toEqual([
			{ kind: 'track', phase: 'move', dx: 60, vx: 0 },
		])
		const end = run(pan('panEnd', { x: 170, y: 102 }, { velocity: { x: -900, y: 0 }, cancelled: false }))
		expect(end).toEqual([{ kind: 'track', phase: 'end', dx: 70, vx: -900, cancelled: false }])
	})

	it('mouse multi-item: slightly diagonal still counts as horizontal', () => {
		const { run } = make()
		run(pan('panStart', { x: 100, y: 100 }, { pointer: 'mouse' }))
		// adx=40, ady=50: ady <= 1.5·adx → track (mouse + 3 items)
		expect(kinds(run(pan('panMove', { x: 140, y: 150 })))).toEqual(['track'])
	})

	it('mouse single item behaves like touch: vertical dismisses', () => {
		const { run } = make({ itemCount: () => 1 })
		run(pan('panStart', { x: 100, y: 100 }, { pointer: 'mouse' }))
		expect(kinds(run(pan('panMove', { x: 110, y: 140 })))).toEqual(['dragging'])
	})

	it('wheel pointer never emits track — horizontal is ignored, vertical dismisses', () => {
		const { run } = make()
		run(pan('panStart', { x: 100, y: 100 }, { pointer: 'wheel' }))
		expect(run(pan('panMove', { x: 140, y: 101 }))).toEqual([])
		run(pan('panStart', { x: 100, y: 100 }, { pointer: 'wheel' }))
		expect(kinds(run(pan('panMove', { x: 105, y: 140 })))).toEqual(['dragging'])
	})

	it('zoomed pan rubber-bands and releases into inertia with bounds', () => {
		const t: Transform = { x: 0, y: 0, scale: 2 }
		const { run } = make({}, t)
		run(pan('panStart', { x: 100, y: 100 }, { pointer: 'touch' }))
		const out = run(pan('panMove', { x: 200, y: 180 }))
		const set = out.find((c): c is Command & { kind: 'set' } => c.kind === 'set')!
		// rubber banded: less than raw +100 translate
		expect(set.t.x).toBeLessThan(100)
		expect(set.t.x).toBeGreaterThan(-1)
		const end = run(pan('panEnd', { x: 200, y: 180 }, { velocity: { x: 300, y: 50 }, cancelled: false }))
		const inertia = end[0]!
		expect(inertia.kind).toBe('inertia')
		if (inertia.kind === 'inertia') {
			// panRange(0, 400, 2, 400) → [-400, 0]; panRange(50, 200, 2, 300) → [-150, -50]
			expect(inertia.bounds.minX).toBe(-400)
			expect(Math.abs(inertia.bounds.maxX)).toBe(0)
			expect(inertia.bounds.minY).toBe(-150)
			expect(inertia.bounds.maxY).toBe(-50)
			expect(inertia.velocity).toEqual({ x: 300, y: 50 })
		}
	})

	it('dismiss release closes past the projected threshold, else settles', () => {
		const { run } = make()
		run(pan('panStart', { x: 200, y: 150 }, { pointer: 'touch' }))
		run(pan('panMove', { x: 200, y: 200 }))
		// dy=30, vy=400 → projected 110 > 45 (0.15·300), same sign → close
		const close = run(pan('panEnd', { x: 200, y: 180 }, { velocity: { x: 0, y: 400 }, cancelled: false }))
		expect(close).toEqual([
			{ kind: 'dragging', value: false },
			{ kind: 'close', velocity: { x: 0, y: 400 } },
		])

		run(pan('panStart', { x: 200, y: 150 }, { pointer: 'touch' }))
		run(pan('panMove', { x: 200, y: 190 }))
		// dy=20, vy=0 → settle identity + restorePresence
		const back = run(pan('panEnd', { x: 200, y: 170 }, { velocity: { x: 0, y: 0 }, cancelled: false }))
		expect(back).toEqual([
			{ kind: 'dragging', value: false },
			{ kind: 'settle', t: { x: 0, y: 0, scale: 1 } },
			{ kind: 'restorePresence' },
		])
	})

	it('pinch rubber-bands above max and below 1, and drives presence when not zoomed at start', () => {
		const { run } = make()
		run({ kind: 'pinchStart', a: { x: 100, y: 150 }, b: { x: 300, y: 150 } })
		const out = run({ kind: 'pinchMove', a: { x: 40, y: 150 }, b: { x: 360, y: 150 } })
		// d0=200 → d=320 → raw s=1.6 within max → set scale 1.6, presence (1.6−0.5)/0.5=2.2→1
		const set = out.find((c): c is Command & { kind: 'set' } => c.kind === 'set')!
		expect(set.t.scale).toBeCloseTo(1.6)
		// (1.6−0.5)/0.5 = 2.2 → presence is emitted, clamped to 1
		const presence = out.find((c): c is Command & { kind: 'presence' } => c.kind === 'presence')!
		expect(presence.value).toBe(1)
	})

	it('pinch above maxZoom rubber-bands with (s/max)^0.3', () => {
		const { run } = make()
		run({ kind: 'pinchStart', a: { x: 100, y: 150 }, b: { x: 300, y: 150 } })
		const out = run({ kind: 'pinchMove', a: { x: -300, y: 150 }, b: { x: 700, y: 150 } })
		// raw s = 5 > max 4 → 4·(5/4)^0.3 ≈ 4.276
		const set = out.find((c): c is Command & { kind: 'set' } => c.kind === 'set')!
		expect(set.t.scale).toBeCloseTo(4 * (5 / 4) ** 0.3)
	})

	it('pinch below fit rubber-bands with s^0.75', () => {
		const { run } = make()
		run({ kind: 'pinchStart', a: { x: 100, y: 150 }, b: { x: 300, y: 150 } })
		const out = run({ kind: 'pinchMove', a: { x: 140, y: 150 }, b: { x: 260, y: 150 } })
		// d0=200, d=120 → raw s=0.6 → s^0.75
		const set = out.find((c): c is Command & { kind: 'set' } => c.kind === 'set')!
		expect(set.t.scale).toBeCloseTo(0.6 ** 0.75)
	})

	it('double tap: unzoomed zooms to max(2, W/F.w, H/F.h) at the point; zoomed settles to identity', () => {
		const t: Transform = { x: 0, y: 0, scale: 1 }
		const { run } = make({}, t)
		const out = run({ kind: 'doubleTap', at: { x: 200, y: 150 } })
		// max(2, 400/400, 300/200) = 2 → settle to scale 2 at the point
		const settle = out.find((c): c is Command & { kind: 'settle' } => c.kind === 'settle')!
		expect(settle.t.scale).toBe(2)

		const zoomed = make({}, { x: 10, y: 10, scale: 2 })
		const out2 = zoomed.run({ kind: 'doubleTap', at: { x: 200, y: 150 } })
		const settle2 = out2.find((c): c is Command & { kind: 'settle' } => c.kind === 'settle')!
		expect(settle2.t).toEqual({ x: 0, y: 0, scale: 1 })
	})

	it('tap reports image vs backdrop with normalized coordinates', () => {
		const { run } = make()
		const img = run({ kind: 'tap', at: { x: 200, y: 150 }, pointer: 'touch' })
		expect(img).toEqual([{ kind: 'tap', target: 'image', x: 0.5, y: 0.5, pointer: 'touch' }])
		const back = run({ kind: 'tap', at: { x: 200, y: 10 }, pointer: 'touch' })
		expect(back[0]).toMatchObject({ target: 'backdrop' })
	})

	it('interactive() === false ignores input; reset drops an in-flight gesture', () => {
		const { run, env } = make({ interactive: () => false })
		expect(run(pan('panStart', { x: 0, y: 0 }, { pointer: 'touch' }))).toEqual([])
		expect(run(pan('panMove', { x: 50, y: 50 }))).toEqual([])

		const m = make()
		m.run(pan('panStart', { x: 0, y: 0 }, { pointer: 'touch' }))
		m.run({ kind: 'reset' })
		expect(m.run(pan('panMove', { x: 50, y: 50 }))).toEqual([])
		void env
	})

	it('pinch-below-fit close requires s < 0.85 and not cancelled', () => {
		// pinch that ends at scale < 0.85 (rubber-banded s^0.75)
		const t: Transform = { x: 0, y: 0, scale: 0.7 }
		const { run } = make({}, t)
		run({ kind: 'pinchStart', a: { x: 100, y: 150 }, b: { x: 300, y: 150 } })
		expect(run({ kind: 'pinchEnd', cancelled: false })).toEqual([{ kind: 'close' }])
		// cancelled → settle clamped instead
		const m2 = make({}, { x: 0, y: 0, scale: 0.7 })
		m2.run({ kind: 'pinchStart', a: { x: 100, y: 150 }, b: { x: 300, y: 150 } })
		const out = m2.run({ kind: 'pinchEnd', cancelled: true })
		expect(kinds(out)).toEqual(['stop', 'settle', 'restorePresence'])
	})
})
