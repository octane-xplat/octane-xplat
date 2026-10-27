import { describe, expect, it, vi } from 'vitest'
import type { Clock } from '../clock-types'
import { ProjectionNode } from './node'
import { ProjectionRoot } from './root'
import type { LayoutBarrier } from './types'
import type { Box, Measurement, ProjectionWrite } from './types'

function makeClock() {
	let time = 0
	let seq = 0
	const queue: { id: number; cb: () => void }[] = []
	const clock: Clock & { advance(ms: number): void; pending(): number } = {
		now: () => time,
		request: (cb) => {
			const id = ++seq
			queue.push({ id, cb })
			return id
		},
		cancel: (id) => {
			const index = queue.findIndex((entry) => entry.id === id)
			if (index !== -1) queue.splice(index, 1)
		},
		advance(ms) {
			time += ms
			const queued = [...queue]
			queue.length = 0
			for (const entry of queued) entry.cb()
		},
		pending: () => queue.length,
	}
	return clock
}

function makeBarrier() {
	const scheduled: (() => void)[] = []
	let observing = false
	const barrier: LayoutBarrier & { flush(): void; observing(): boolean } = {
		schedule: (pass) => scheduled.push(pass),
		observe: () => {
			observing = true
			return () => {
				observing = false
			}
		},
		flush() {
			const pending = [...scheduled]
			scheduled.length = 0
			for (const pass of pending) pass()
		},
		observing: () => observing,
	}
	return barrier
}

function box(x: number, y: number, width: number, height: number): Box {
	return { x: { min: x, max: x + width }, y: { min: y, max: y + height } }
}

function fakeHooks() {
	const state = {
		box: box(0, 0, 100, 100),
		writes: [] as (ProjectionWrite | null)[],
		resets: 0,
		measures: 0,
	}
	const hooks = {
		measureLayout: (): Measurement => {
			state.measures++
			const b = state.box
			return {
				layoutBox: { x: { ...b.x }, y: { ...b.y } },
				measuredBox: { x: { ...b.x }, y: { ...b.y } },
			}
		},
		resetProjection: () => {
			state.resets++
		},
		project: (write: ProjectionWrite | null) => {
			state.writes.push(write)
		},
	}
	return { state, hooks }
}

function setup() {
	const clock = makeClock()
	const barrier = makeBarrier()
	const root = new ProjectionRoot({ clock, barrier })
	const commit = () => {
		root.invalidate('commit')
		barrier.flush()
	}
	const resize = () => {
		root.invalidate('resize')
		clock.advance(16)
	}
	return { clock, barrier, root, commit, resize }
}

function makeNode(root: ProjectionRoot, hooks: ReturnType<typeof fakeHooks>['hooks'], parent?: ProjectionNode) {
	const node = new ProjectionNode(parent)
	node.attach(hooks)
	node.options.animationType = 'both'
	root.add(node)
	return node
}

function applyDelta(target: Box, write: ProjectionWrite): Box {
	const result: Box = { x: { ...target.x }, y: { ...target.y } }
	for (const axis of ['x', 'y'] as const) {
		const d = write.delta[axis]
		const a = result[axis]
		a.min = d.originPoint + d.scale * (a.min - d.originPoint) + d.translate
		a.max = d.originPoint + d.scale * (a.max - d.originPoint) + d.translate
	}
	return result
}

describe('projection update cycle', () => {
	it('animates a single move: inverse translate at p=0, half at midpoint, project(null) at the end', () => {
		const { clock, root, commit } = setup()
		const host = fakeHooks()
		const node = makeNode(root, host.hooks)
		node.options.transition = { duration: 1, ease: 'linear' }

		commit()
		expect(host.state.writes).toEqual([])

		host.state.box = box(50, 0, 100, 100)
		commit()

		const first = host.state.writes.at(-1)!
		expect(first).not.toBeNull()
		expect(first!.delta.x.translate).toBeCloseTo(-50)
		expect(first!.delta.x.scale).toBe(1)

		clock.advance(500)
		const mid = host.state.writes.at(-1)!
		expect(mid!.delta.x.translate).toBeCloseTo(-25)

		clock.advance(600)
		expect(host.state.writes.at(-1)).toBeNull()
	})

	it('scales a 100→200 resize from the center with a compensating translate', () => {
		const { root, commit } = setup()
		const host = fakeHooks()
		makeNode(root, host.hooks)
		commit()

		host.state.box = box(0, 0, 200, 100)
		commit()

		const first = host.state.writes.at(-1)!
		expect(first!.delta.x.scale).toBeCloseTo(0.5)
		expect(first!.delta.x.translate).toBeCloseTo(-50)
	})

	it('keeps a layout="position" child at constant size while the parent scales', () => {
		const { clock, root, commit } = setup()
		const parentHost = fakeHooks()
		const parent = makeNode(root, parentHost.hooks)
		parent.options.transition = { duration: 1, ease: 'linear' }

		const childHost = fakeHooks()
		childHost.state.box = box(0, 0, 50, 50)
		const child = makeNode(root, childHost.hooks, parent)
		child.options.animationType = 'position'
		child.options.transition = { duration: 1, ease: 'linear' }

		commit()

		parentHost.state.box = box(0, 0, 200, 100)
		commit()

		const onScreen = () => {
			const parentWrite = parentHost.state.writes.at(-1)
			const childWrite = childHost.state.writes.at(-1)
			const projected = childWrite
				? applyDelta(child.layout!.layoutBox, childWrite)
				: { x: { ...child.layout!.layoutBox.x }, y: { ...child.layout!.layoutBox.y } }
			return parentWrite ? applyDelta(projected, parentWrite) : projected
		}

		const before = box(0, 0, 50, 50)
		for (const p of [0, 250, 500, 1000]) {
			if (p) clock.advance(p === 1000 ? 500 : 250)
			const onScreenBox = onScreen()
			const width = onScreenBox.x.max - onScreenBox.x.min
			expect(Math.abs(width - 50)).toBeLessThanOrEqual(0.5)
			if (p === 0) {
				expect(onScreenBox.x.min).toBeCloseTo(before.x.min, 0)
				expect(onScreenBox.y.min).toBeCloseTo(before.y.min, 0)
			}
		}
	})

	it('honors each layout mode', () => {
		const { root, commit } = setup()

		const positionHost = fakeHooks()
		const position = makeNode(root, positionHost.hooks)
		position.options.animationType = 'position'
		commit()
		positionHost.state.box = box(50, 0, 200, 100)
		commit()
		const positionWrite = positionHost.state.writes.at(-1)!
		expect(positionWrite!.delta.x.scale).toBe(1)
		expect(positionWrite!.delta.x.translate).toBeCloseTo(-50)
		root.remove(position)

		const sizeHost = fakeHooks()
		const size = makeNode(root, sizeHost.hooks)
		size.options.animationType = 'size'
		commit()
		sizeHost.state.box = box(50, 0, 200, 100)
		commit()
		const sizeWrite = sizeHost.state.writes.at(-1)!
		// Position snaps to the new layout; size animates. The p=0 projection
		// puts the old-sized box at the new position.
		const sizeBox = applyDelta({ x: { min: 50, max: 250 }, y: { min: 0, max: 100 } }, sizeWrite!)
		expect(sizeBox.x.min).toBeCloseTo(50)
		expect(sizeBox.x.max - sizeBox.x.min).toBeCloseTo(100)
		root.remove(size)

		const xHost = fakeHooks()
		const x = makeNode(root, xHost.hooks)
		x.options.animationType = 'x'
		commit()
		xHost.state.box = box(50, 30, 100, 100)
		commit()
		const xWrite = xHost.state.writes.at(-1)!
		expect(xWrite!.delta.x.translate).toBeCloseTo(-50)
		expect(xWrite!.delta.y.translate).toBe(0)
		root.remove(x)

		const yHost = fakeHooks()
		const y = makeNode(root, yHost.hooks)
		y.options.animationType = 'y'
		commit()
		yHost.state.box = box(50, 30, 100, 100)
		commit()
		const yWrite = yHost.state.writes.at(-1)!
		expect(yWrite!.delta.x.translate).toBe(0)
		expect(yWrite!.delta.y.translate).toBeCloseTo(-30)
		root.remove(y)

		const aspectHost = fakeHooks()
		const aspect = makeNode(root, aspectHost.hooks)
		aspect.options.animationType = 'preserve-aspect'
		commit()
		aspectHost.state.box = box(50, 0, 200, 100)
		commit()
		const aspectWrite = aspectHost.state.writes.at(-1)!
		expect(aspectWrite!.delta.x.scale).toBe(1)
		expect(aspectWrite!.delta.x.translate).toBeCloseTo(-50)
		root.remove(aspect)
	})

	it('retargets mid-animation without a visual jump', () => {
		const { clock, root, commit } = setup()
		const host = fakeHooks()
		const node = makeNode(root, host.hooks)
		node.options.transition = { duration: 1, ease: 'linear' }

		commit()
		host.state.box = box(100, 0, 100, 100)
		commit()
		clock.advance(500)

		const presented = { ...node.presented! }
		host.state.box = box(300, 0, 100, 100)
		commit()

		const first = host.state.writes.at(-1)!
		const projected = applyDelta(node.layout!.layoutBox, first!)
		expect(projected.x.min).toBeCloseTo(presented.x.min, 0)
		expect(projected.x.max).toBeCloseTo(presented.x.max, 0)
	})

	it('does not restart a running animation on an unchanged-layout pass', () => {
		const { clock, root, commit } = setup()
		const host = fakeHooks()
		const node = makeNode(root, host.hooks)
		node.options.transition = { duration: 1, ease: 'linear' }

		commit()
		host.state.box = box(100, 0, 100, 100)
		commit()
		clock.advance(300)
		const writesBefore = host.state.writes.length
		const animation = node.currentAnimation

		commit()
		expect(node.currentAnimation).toBe(animation)
		clock.advance(700)
		expect(host.state.writes.at(-1)).toBeNull()
		expect(host.state.writes.length).toBeGreaterThan(writesBefore)
	})

	it('gates animation on layoutDependency but still refreshes the box', () => {
		const { root, commit } = setup()
		const host = fakeHooks()
		const node = makeNode(root, host.hooks)
		node.options.transition = { duration: 1, ease: 'linear' }
		node.options.layoutDependency = 'a'
		commit()

		host.state.box = box(100, 0, 100, 100)
		node.options.layoutDependency = 'a'
		commit()
		expect(host.state.writes).toEqual([])
		expect(node.presented!.x.min).toBe(100)

		host.state.box = box(200, 0, 100, 100)
		node.options.layoutDependency = 'b'
		commit()
		expect(host.state.writes.at(-1)!.delta.x.translate).toBeCloseTo(-100)
	})

	it('snaps layout changes when reduced motion is set', () => {
		const { clock, root, commit } = setup()
		const host = fakeHooks()
		const node = makeNode(root, host.hooks)
		node.options.reduced = true
		node.options.transition = { duration: 1 }

		commit()
		host.state.box = box(100, 0, 100, 100)
		commit()
		clock.advance(32)

		const nonNullWrites = host.state.writes.filter(Boolean)
		expect(node.presented!.x.min).toBe(100)
		expect(node.currentAnimation).toBeUndefined()
		for (const write of nonNullWrites) {
			expect(write!.delta.x.translate).toBeCloseTo(0)
		}
	})

	it('snaps a spring transition under reduced motion without NaN', () => {
		const { root, commit } = setup()
		const host = fakeHooks()
		const node = makeNode(root, host.hooks)
		node.options.reduced = true
		node.options.transition = { type: 'spring' }

		commit()
		host.state.box = box(100, 0, 100, 100)
		commit()

		expect(node.currentAnimation).toBeUndefined()
		expect(node.presented!.x.min).toBe(100)
		for (const write of host.state.writes) {
			if (write) expect(Number.isNaN(write.delta.x.translate)).toBe(false)
		}
	})

	it('keeps relative targets linked through a no-change pass mid-animation', () => {
		const run = (extraPass: boolean) => {
			const { clock, root, commit } = setup()
			const parentHost = fakeHooks()
			const parent = makeNode(root, parentHost.hooks)
			parent.options.transition = { duration: 1, ease: 'linear' }
			const childHost = fakeHooks()
			childHost.state.box = box(0, 0, 50, 50)
			const child = makeNode(root, childHost.hooks, parent)
			child.options.animationType = 'position'
			child.options.transition = { duration: 1, ease: 'linear' }

			commit()
			parentHost.state.box = box(0, 0, 200, 100)
			commit()
			clock.advance(500)
			if (extraPass) commit()
			expect(child.relativeTarget).toBeDefined()

			const frames: Box[] = []
			for (let i = 0; i < 4; i++) {
				clock.advance(125)
				const parentWrite = parentHost.state.writes.at(-1)
				const childWrite = childHost.state.writes.at(-1)
				const projected = childWrite
					? applyDelta(child.layout!.layoutBox, childWrite)
					: { x: { ...child.layout!.layoutBox.x }, y: { ...child.layout!.layoutBox.y } }
				frames.push(parentWrite ? applyDelta(projected, parentWrite) : projected)
			}

			return frames
		}

		const clean = run(false)
		const interrupted = run(true)
		for (let i = 0; i < clean.length; i++) {
			expect(interrupted[i].x.min).toBeCloseTo(clean[i].x.min, 0)
			expect(interrupted[i].x.max).toBeCloseTo(clean[i].x.max, 0)
			expect(interrupted[i].y.min).toBeCloseTo(clean[i].y.min, 0)
		}
	})

	it('resize finishes running animations and starts none', () => {
		const { root, commit, resize } = setup()
		const host = fakeHooks()
		const node = makeNode(root, host.hooks)
		node.options.transition = { duration: 1, ease: 'linear' }
		const onComplete = vi.fn()
		node.options.onLayoutAnimationComplete = onComplete

		commit()
		host.state.box = box(100, 0, 100, 100)
		commit()
		expect(node.currentAnimation).toBeDefined()

		host.state.box = box(200, 0, 100, 100)
		resize()
		expect(node.currentAnimation).toBeUndefined()
		expect(node.presented!.x.min).toBe(200)
		expect(host.state.writes.at(-1)).toBeNull()
	})

	it('composes a user x channel into the projected transform', () => {
		const { root, commit } = setup()
		const host = fakeHooks()
		const node = makeNode(root, host.hooks)
		node.setLatestValues({ x: 10 })
		commit()
		host.state.box = box(50, 0, 100, 100)
		commit()
		const first = host.state.writes.at(-1)!
		expect(first!.delta.x.translate).toBeCloseTo(-40)
	})

	it('fires start and complete exactly once, and never completes on interruption', () => {
		const { clock, root, commit } = setup()
		const host = fakeHooks()
		const node = makeNode(root, host.hooks)
		node.options.transition = { duration: 1, ease: 'linear' }
		const onStart = vi.fn()
		const onComplete = vi.fn()
		node.options.onLayoutAnimationStart = onStart
		node.options.onLayoutAnimationComplete = onComplete

		commit()
		host.state.box = box(100, 0, 100, 100)
		commit()
		clock.advance(16)
		expect(onStart).toHaveBeenCalledTimes(1)

		host.state.box = box(300, 0, 100, 100)
		commit()
		expect(onComplete).not.toHaveBeenCalled()

		clock.advance(1000)
		expect(onStart).toHaveBeenCalledTimes(2)
		expect(onComplete).toHaveBeenCalledTimes(1)
	})
})
