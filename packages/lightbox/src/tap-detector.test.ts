import { describe, expect, it } from 'vitest'
import { createTapDetector } from './tap-detector'
import type { Intent } from './gesture-machine'

function fakeClock() {
	let time = 0
	const timers = new Map<number, { at: number; fn: () => void }>()
	let id = 0
	return {
		now: () => time,
		advance: (ms: number) => {
			time += ms
			for (const [key, timer] of [...timers]) {
				if (timer.at <= time) {
					timers.delete(key)
					timer.fn()
				}
			}
		},
		schedule: (fn: () => void, ms: number) => {
			const key = ++id
			timers.set(key, { at: time + ms, fn })
			return () => void timers.delete(key)
		},
		pending: () => timers.size,
	}
}

describe('tap detector', () => {
	it('delays a single tap 260 ms when waiting for a double tap', () => {
		const clock = fakeClock()
		const det = createTapDetector(clock)
		const out: Intent[] = []
		det.up({ x: 10, y: 10 }, 'touch', true, (i) => out.push(i))
		expect(out).toEqual([])
		clock.advance(260)
		expect(out).toEqual([{ kind: 'tap', at: { x: 10, y: 10 }, pointer: 'touch' }])
	})

	it('emits doubleTap for two taps within 300 ms / 30 px', () => {
		const clock = fakeClock()
		const det = createTapDetector(clock)
		const out: Intent[] = []
		det.up({ x: 10, y: 10 }, 'touch', true, (i) => out.push(i))
		clock.advance(100)
		det.up({ x: 15, y: 12 }, 'touch', true, (i) => out.push(i))
		expect(out).toEqual([{ kind: 'doubleTap', at: { x: 15, y: 12 } }])
	})

	it('two taps past the 300 ms window are two delayed singles', () => {
		const clock = fakeClock()
		const det = createTapDetector(clock)
		const out: Intent[] = []
		det.up({ x: 10, y: 10 }, 'touch', true, (i) => out.push(i))
		clock.advance(350)
		det.up({ x: 10, y: 10 }, 'touch', true, (i) => out.push(i))
		clock.advance(260)
		expect(out.filter((i) => i.kind === 'tap')).toHaveLength(2)
	})

	it('a second tap outside the 30 px radius replaces the pending single', () => {
		// Upstream clears the pending fire on every tap — only the last tap emits.
		const clock = fakeClock()
		const det = createTapDetector(clock)
		const out: Intent[] = []
		det.up({ x: 10, y: 10 }, 'touch', true, (i) => out.push(i))
		clock.advance(50)
		det.up({ x: 60, y: 10 }, 'touch', true, (i) => out.push(i))
		clock.advance(260)
		expect(out).toEqual([{ kind: 'tap', at: { x: 60, y: 10 }, pointer: 'touch' }])
	})

	it('waitForDouble false emits immediately', () => {
		const clock = fakeClock()
		const det = createTapDetector(clock)
		const out: Intent[] = []
		det.up({ x: 10, y: 10 }, 'mouse', false, (i) => out.push(i))
		expect(out).toEqual([{ kind: 'tap', at: { x: 10, y: 10 }, pointer: 'mouse' }])
	})

	it('cancel drops the pending tap', () => {
		const clock = fakeClock()
		const det = createTapDetector(clock)
		const out: Intent[] = []
		det.up({ x: 10, y: 10 }, 'touch', true, (i) => out.push(i))
		det.cancel()
		clock.advance(1000)
		expect(out).toEqual([])
	})
})
