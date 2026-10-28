import { clock } from '../clock'
import type { Clock } from '../clock-types'
import { barrier } from './barrier'
import type { LayoutBarrier } from './types'
import { boxEqualsRounded } from './geometry'
import { cleanDirtyNodes, propagateDirtyNodes, ProjectionNode } from './node'
import { SharedStack } from './stack'

export interface ProjectionRootOptions {
	clock: Clock
	barrier: LayoutBarrier
}

/**
 * Depth-ordered registry of projection nodes plus the shared update cycle:
 * a barrier-scheduled measurement pass per commit/mutation, a refresh-only
 * pass per resize, and one frame loop driving every layout animation.
 */
export class ProjectionRoot {
	readonly nodes: ProjectionNode[] = []
	readonly sharedStacks = new Map<string, SharedStack>()
	readonly animationClock: Clock
	frameTimestamp = 0
	private frameScheduled = false
	private passScheduled = false
	private resizePending = false
	private needsProjectionUpdate = false
	private queuedTicks = new Map<number, () => void>()
	private nextTickId = 0
	private observeStop?: () => void

	constructor(private options: ProjectionRootOptions) {
		this.animationClock = {
			now: options.clock.now,
			request: (tick) => {
				const id = ++this.nextTickId
				this.queuedTicks.set(id, tick)
				this.ensureFrame()
				return id
			},
			cancel: (id) => {
				this.queuedTicks.delete(id)
			},
		}
	}

	get isMotionHost() {
		return this.options.barrier.isMotionHost?.bind(this.options.barrier) ?? (() => false)
	}

	add(node: ProjectionNode) {
		node.root = this
		let index = this.nodes.length
		while (index > 0 && this.nodes[index - 1].depth > node.depth) {
			index--
		}
		this.nodes.splice(index, 0, node)
		if (node.options.layoutId !== undefined) {
			const key = node.options.layoutId
			let stack = this.sharedStacks.get(key)
			if (!stack) {
				stack = new SharedStack()
				this.sharedStacks.set(key, stack)
			}

			stack.add(node)
		}
		if (this.nodes.length === 1) {
			this.observeStop = this.options.barrier.observe(this)
		}
	}

	remove(node: ProjectionNode) {
		const index = this.nodes.indexOf(node)
		if (index === -1) {
			return
		}
		this.nodes.splice(index, 1)
		node.shared?.remove(node)
		node.detach()
		this.invalidate('mutation')
		if (!this.nodes.length) {
			this.observeStop?.()
			this.observeStop = undefined
		}
	}

	invalidate(kind: 'commit' | 'mutation' | 'resize') {
		if (kind === 'resize') {
			this.resizePending = true
			this.ensureFrame()
			return
		}

		if (this.passScheduled || (!this.nodes.length && !this.sharedStacks.size)) {
			return
		}
		this.passScheduled = true
		this.options.barrier.schedule(() => {
			this.passScheduled = false
			this.runPass()
		})
	}

	scheduleUpdateProjection() {
		this.needsProjectionUpdate = true
		this.ensureFrame()
	}

	/** Channel writes while projecting recalc this frame's projected transform. */
	requestProjectionFrame() {
		this.scheduleUpdateProjection()
	}

	private ensureFrame() {
		if (this.frameScheduled) {
			return
		}
		this.frameScheduled = true
		this.options.clock.request(() => this.runFrame())
	}

	private runFrame() {
		this.frameScheduled = false
		this.frameTimestamp = this.options.clock.now()

		if (this.resizePending) {
			this.resizePending = false
			this.runResizePass()
		}

		const ticks = [...this.queuedTicks.values()]
		this.queuedTicks.clear()
		for (const tick of ticks) {
			tick()
		}

		if (this.needsProjectionUpdate) {
			this.needsProjectionUpdate = false
			this.updateProjection()
		}
	}

	private measureNodes() {
		for (const node of this.nodes) {
			if (node.hasProjected) {
				node.hooks?.resetProjection()
			}
		}

		for (const node of this.nodes) {
			const measurement = node.hooks?.measureLayout()
			if (measurement) {
				const previous = node.layout
				node.layout = measurement
				if (!previous || !boxEqualsRounded(previous.layoutBox, measurement.layoutBox)) {
					node.layoutVersion++
				}
			}
		}
	}

	private runPass() {
		this.frameTimestamp = this.options.clock.now()
		if (this.resizePending) {
			this.resizePending = false
			this.runResizePass()
			return
		}

		this.measureNodes()
		for (const stack of this.sharedStacks.values()) {
			stack.prepare()
		}
		for (const node of this.nodes) {
			node.notifyLayoutUpdate()
		}
		this.updateProjection()
		for (const [key, stack] of this.sharedStacks) {
			stack.settleExits()
			if (!stack.members.length) {
				this.sharedStacks.delete(key)
			}
		}
	}

	private runResizePass() {
		this.measureNodes()
		for (const node of this.nodes) {
			if (node.currentAnimation) {
				node.finishAnimation()
				node.targetDelta = node.relativeTarget = node.target = undefined
				node.isProjectionDirty = true
			}
		}

		for (const stack of this.sharedStacks.values()) {
			stack.complete()
		}
		this.updateProjection()
	}

	private updateProjection() {
		this.needsProjectionUpdate = false
		for (const node of this.nodes) {
			propagateDirtyNodes(node)
		}
		for (const node of this.nodes) {
			if (node.shared?.lead && node.shared.lead !== node) {
				node.shared.follow(node)
			} else {
				node.resolveTargetDelta()
			}
		}
		for (const node of this.nodes) {
			node.calcProjection()
		}
		for (const node of this.nodes) {
			node.render()
		}
		for (const node of this.nodes) {
			node.renderOpacity()
		}
		for (const node of this.nodes) {
			node.refreshPresented()
		}
		for (const node of this.nodes) {
			cleanDirtyNodes(node)
		}
	}
}

let sharedRoot: ProjectionRoot | undefined

/** Per-Renderer-tree projection root; created on first layout host. */
export function projectionRoot(): ProjectionRoot {
	return (sharedRoot ??= new ProjectionRoot({ clock, barrier }))
}
