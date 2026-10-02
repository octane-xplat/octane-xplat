import { describe, expect, it, vi } from 'vitest'
import { attachDrag, validateDrag } from './drag'
import { Controller } from './controller'
import type { Clock } from './clock-types'
import type { PanCallbacks, HostAdapter } from './host-types'
import type { DragInfo, MotionProps } from './types'

function fixture(props: MotionProps, reduced = false) {
	let time = 0
	let id = 0
	const frames = new Map<number, () => void>()
	const clock: Clock = {
		now: () => time,
		request: (fn) => {
			frames.set(++id, fn)
			return id
		},
		cancel: (key) => {
			frames.delete(key)
		},
	}

	const controller = new Controller(clock)
	controller.seed({ x: 10, y: 20 })
	let callbacks: PanCallbacks
	const detach = vi.fn()
	const delegate = vi.fn()
	const writes: number[] = []
	const adapter: HostAdapter = {
		read: () => ({}),
		write: (next) => {
			writes.push(next.x ?? 0)
		},
		restore() {},
		delegate,
		pan(_axis, cb) {
			callbacks = cb
			return detach
		},
	}

	controller.attach(adapter)
	const off = attachDrag(
		adapter,
		controller,
		props,
		(axis) => controller.value(axis),
		() => reduced,
		() => props,
	)

	return {
		controller,
		off,
		detach,
		delegate,
		writes,
		emit(phase: keyof PanCallbacks, x: number, velocity = 0, cancelled = false) {
			const info: DragInfo = {
				point: { x, y: 0 },
				offset: { x, y: x },
				delta: { x, y: 0 },
				velocity: { x: velocity, y: velocity },
				cancelled,
			}

			callbacks[phase]({}, info)
		},
		advance(ms: number) {
			time += ms
			const pending = [...frames.values()]
			frames.clear()
			pending.forEach((fn) => fn())
		},
		count: () => frames.size,
	}
}

describe('bounded drag', () => {
	it('clamps live displacement, keeps the other axis, and emits callbacks once', () => {
		const onDragStart = vi.fn(),
			onDrag = vi.fn(),
			onDragEnd = vi.fn()

		const f = fixture({
			drag: 'x',
			dragConstraints: { left: -20, right: 30 },
			dragElastic: 0,
			dragMomentum: false,
			onDragStart,
			onDrag,
			onDragEnd,
		})

		f.emit('start', 0)
		f.emit('move', 100)
		expect(f.controller.snapshot()).toEqual({ x: 30, y: 20 })
		f.emit('end', 100, 500)
		f.emit('end', 100)
		expect(onDragStart).toHaveBeenCalledTimes(1)
		expect(onDrag).toHaveBeenCalledTimes(1)
		expect(onDragEnd).toHaveBeenCalledTimes(1)
		expect(f.count()).toBe(0)
		f.off()
		expect(f.detach).toHaveBeenCalledOnce()
	})

	it('uses default elasticity and springs back inside constraints without momentum', () => {
		const f = fixture({ drag: 'x', dragConstraints: { right: 30 }, dragMomentum: false })
		f.emit('start', 0)
		f.emit('move', 100)
		expect(f.controller.value('x').get()).toBe(58)
		f.emit('end', 100)
		for (let i = 0; i < 200; i++) {
			f.advance(16)
		}

		expect(f.controller.value('x').get()).toBe(30)
		expect(f.delegate).not.toHaveBeenCalled()
		f.off()
	})

	it('hands release velocity to a JS spring and bounds every hard-constraint sample', () => {
		const f = fixture({ drag: 'x', dragConstraints: { left: -20, right: 50 }, dragElastic: false })
		f.emit('start', 0)
		f.emit('move', 10)
		f.emit('end', 10, 500)
		f.advance(16)
		expect(f.controller.value('x').get()).toBeGreaterThan(20)
		for (let i = 0; i < 200; i++) {
			f.advance(16)
		}

		expect(f.controller.value('x').get()).toBe(50)
		expect(Math.max(...f.writes)).toBeLessThanOrEqual(50)
		expect(f.delegate).not.toHaveBeenCalled()
		f.off()
	})

	it('cancellation drops momentum; reduced motion snaps; teardown cancels settlement', () => {
		const cancel = fixture({ drag: true })
		cancel.emit('start', 0)
		cancel.emit('move', 20)
		cancel.emit('end', 20, 500, true)
		expect(cancel.count()).toBe(0)
		cancel.off()
		const reduced = fixture({ drag: 'x' }, true)
		reduced.emit('start', 0)
		reduced.emit('end', 10, 500)
		expect(reduced.controller.value('x').get()).toBe(120)
		expect(reduced.count()).toBe(0)
		reduced.off()
		const f = fixture({ drag: 'x' })
		f.emit('start', 0)
		f.emit('end', 10, 500)
		expect(f.count()).toBe(1)
		f.off()
		expect(f.count()).toBe(0)
	})

	it('rejects refs, invalid bounds, elasticity and competing axis targets', () => {
		expect(() => validateDrag({ dragConstraints: { current: null } } as any)).toThrow('refs')
		expect(() => validateDrag({ dragConstraints: { left: 20, right: 10 } })).toThrow('reversed')
		expect(() => validateDrag({ dragElastic: 2 })).toThrow('dragElastic')
		expect(() => validateDrag({ drag: 'x', animate: { x: 20 } })).toThrow('both own x')
	})
})
