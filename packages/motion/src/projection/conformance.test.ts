import { describe, expect, it } from 'vitest'
import type { Clock } from '../clock-types'
import { cleanDirtyNodes, propagateDirtyNodes, ProjectionNode } from './node'
import { ProjectionRoot } from './root'
import type { LayoutBarrier } from './types'
import type { Box, Measurement, ProjectionWrite } from './types'

// Adapted from motion-dom@12.42.2 projection/node/__tests__/node.test.ts.
// The upstream suite drives willUpdate/didUpdate directly against jest fake
// instances; here the equivalent trigger is root.invalidate('commit') with
// scripted measureLayout boxes, and resetTransform maps to resetProjection.

function makeClock() {
	let time = 0
	let seq = 0
	const queue: { id: number; cb: () => void }[] = []
	const clock: Clock & { advance(ms: number): void } = {
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
	}
	return clock
}

function makeBarrier() {
	const scheduled: (() => void)[] = []
	const barrier: LayoutBarrier & { flush(): void } = {
		schedule: (pass) => scheduled.push(pass),
		observe: () => () => {},
		flush() {
			const pending = [...scheduled]
			scheduled.length = 0
			for (const pass of pending) pass()
		},
	}
	return barrier
}

function box(x: number, y: number, width: number, height: number): Box {
	return { x: { min: x, max: x + width }, y: { min: y, max: y + height } }
}

function fakeHooks() {
	const state = {
		box: box(0, 0, 100, 100),
		resets: 0,
		writes: [] as (ProjectionWrite | null)[],
	}
	const hooks = {
		measureLayout: (): Measurement => {
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
	return { clock, root, commit }
}

function makeNode(root: ProjectionRoot, hooks: ReturnType<typeof fakeHooks>['hooks'], parent?: ProjectionNode) {
	const node = new ProjectionNode(parent)
	node.attach(hooks)
	node.options.animationType = 'both'
	node.options.transition = { duration: 1, ease: 'linear' }
	root.add(node)
	return node
}

describe('projection node conformance', () => {
	it('resets the projected transform of animating nodes before measuring', () => {
		// Upstream: "If a child updates layout, and parent has scale, parent
		// resetsTransform during measurement". Our resetProjection only covers
		// applied projections — channel transforms are removed mathematically
		// by the adapter — so the ported assertion is that projected nodes are
		// reset once per pass while projecting.
		const { root, commit } = setup()
		const parentHost = fakeHooks()
		const parent = makeNode(root, parentHost.hooks)

		const childHost = fakeHooks()
		childHost.state.box = box(0, 0, 50, 50)
		const child = makeNode(root, childHost.hooks, parent)

		commit()
		expect(parentHost.state.resets).toBe(0)
		expect(childHost.state.resets).toBe(0)

		parentHost.state.box = box(100, 100, 100, 100)
		childHost.state.box = box(150, 150, 50, 50)
		commit()
		expect(parentHost.state.writes.length).toBeGreaterThan(0)

		childHost.state.box = box(0, 0, 150, 150)
		commit()
		expect(parentHost.state.resets).toBe(1)
		expect(childHost.state.resets).toBe(1)
	})

	it('does not reset when no projection transform was applied', () => {
		// Upstream: "If a child updates layout, parent doesn't resetTransform
		// during measurement if it has no projection transform".
		const { root, commit } = setup()
		const parentHost = fakeHooks()
		const parent = makeNode(root, parentHost.hooks)

		const childHost = fakeHooks()
		childHost.state.box = box(0, 0, 50, 50)
		const child = makeNode(root, childHost.hooks, parent)

		commit()
		expect(parentHost.state.resets).toBe(0)
		expect(childHost.state.resets).toBe(0)

		childHost.state.box = box(150, 150, 50, 50)
		commit()

		// The child projected; a further pass resets it but not the parent,
		// which never projected.
		childHost.state.box = box(0, 0, 150, 150)
		commit()
		expect(parentHost.state.resets).toBe(0)
		expect(childHost.state.resets).toBe(1)
	})

	it('propagates isProjectionDirty down subtrees with updated targets', () => {
		const { root, commit } = setup()

		const aHost = fakeHooks()
		const a = makeNode(root, aHost.hooks)
		const bHost = fakeHooks()
		bHost.state.box = box(0, 0, 50, 50)
		const b = makeNode(root, bHost.hooks, a)
		const cHost = fakeHooks()
		cHost.state.box = box(0, 0, 50, 50)
		const c = makeNode(root, cHost.hooks, b)
		const dHost = fakeHooks()
		dHost.state.box = box(0, 0, 50, 50)
		const d = makeNode(root, dHost.hooks, c)

		commit()

		b.setTargetDelta({
			x: { translate: 200, scale: 2, origin: 0.5, originPoint: 100 },
			y: { translate: 200, scale: 2, origin: 0.5, originPoint: 100 },
		})
		c.relativeTarget = box(0, 0, 100, 100)

		propagateDirtyNodes(a)
		propagateDirtyNodes(b)
		propagateDirtyNodes(c)
		propagateDirtyNodes(d)

		expect(a.isProjectionDirty).toBe(false)
		expect(a.isSharedProjectionDirty).toBe(false)
		expect(b.isProjectionDirty).toBe(true)
		expect(b.isSharedProjectionDirty).toBe(true)
		expect(c.isProjectionDirty).toBe(false)
		expect(c.isSharedProjectionDirty).toBe(true)
		expect(d.isProjectionDirty).toBe(false)
		expect(d.isSharedProjectionDirty).toBe(true)

		a.resolveTargetDelta()
		b.resolveTargetDelta()
		c.resolveTargetDelta()
		d.resolveTargetDelta()

		a.calcProjection()
		b.calcProjection()
		c.calcProjection()
		d.calcProjection()

		cleanDirtyNodes(a)
		cleanDirtyNodes(b)
		cleanDirtyNodes(c)
		cleanDirtyNodes(d)

		expect(
			a.isProjectionDirty ||
				a.isSharedProjectionDirty ||
				b.isProjectionDirty ||
				b.isSharedProjectionDirty ||
				c.isProjectionDirty ||
				c.isSharedProjectionDirty ||
				d.isProjectionDirty ||
				d.isSharedProjectionDirty,
		).toBe(false)
	})
})
