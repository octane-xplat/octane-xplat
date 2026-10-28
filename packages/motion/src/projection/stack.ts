import { mixValues } from 'motion-dom'
import { copyBoxInto, createBox, transformBox, removeBoxTransforms } from './geometry'
import type { ProjectionNode } from './node'
import type { Box } from './types'
import type { Target } from '../types'
import type { AnimationResult } from '../engine'

interface Snapshot {
	box: Box
	values: Target
}

/** Convert a presented content box to another member's content coordinate space. */
export function transferBox(box: Box, from: ProjectionNode, to?: ProjectionNode): Box {
	const result = createBox()
	copyBoxInto(result, box)
	for (const axis of ['x', 'y'] as const) {
		const offset =
			from.layout?.viewportOffset?.()[axis] ??
			(from.layout ? from.layout.measuredBox[axis].min - from.layout.layoutBox[axis].min : 0)

		const destination = to?.layout?.viewportOffset
			? -to.layout.viewportOffset()[axis]
			: to?.layout
				? to.layout.layoutBox[axis].min - to.layout.measuredBox[axis].min
				: 0

		result[axis].min += offset + destination
		result[axis].max += offset + destination
	}
	return result
}

/** Shared-element lead/follow lifetime, modeled on Motion's NodeStack. */
export class SharedStack {
	readonly members: ProjectionNode[] = []
	lead?: ProjectionNode
	private outgoing?: ProjectionNode
	private pending?: Snapshot
	private fromValues: Target = {}
	private leadFromOpacity = 0
	private exits = new Map<ProjectionNode, ((result: AnimationResult) => void)[]>()
	transitioning = false

	private snapshot(node: ProjectionNode): Snapshot | undefined {
		if (!node.presented) {
			return undefined
		}
		const presented = createBox()
		copyBoxInto(presented, node.presented)
		transformBox(presented, node.latestValues)
		return {
			box: transferBox(presented, node),
			values: {
				...node.latestValues,
				opacity: node.sharedOpacity ?? node.latestValues.opacity ?? 1,
			},
		}
	}

	add(node: ProjectionNode) {
		this.members.push(node)
		node.shared = this
		if (node.isPresent) {
			this.promote(node)
		}
	}

	remove(node: ProjectionNode) {
		if (this.outgoing === node) {
			this.outgoing = undefined
		}
		const index = this.members.indexOf(node)
		if (index >= 0) {
			this.members.splice(index, 1)
		}
		if (this.lead === node) {
			this.pending = this.snapshot(node) ?? this.pending
			this.lead = undefined
			const next = [...this.members].reverse().find((member) => member.isPresent)
			if (next) {
				this.promote(next)
			}
		}
		this.resolveExit(node, 'finished')
		node.shared = undefined
	}

	promote(node: ProjectionNode) {
		if (node === this.lead) {
			return
		}
		const previous = this.lead
		this.leadFromOpacity = node.sharedOpacity ?? 0
		if (previous) {
			this.pending = this.snapshot(previous) ?? this.pending
			const previousOpacity = previous.sharedOpacity ?? previous.latestValues.opacity ?? 1
			const outgoing =
				previousOpacity <= 0 && this.outgoing && this.outgoing !== node ? this.outgoing : previous

			this.outgoing = outgoing
			if (this.pending) {
				this.pending.values.opacity = outgoing.sharedOpacity ?? outgoing.latestValues.opacity ?? 1
			}

			previous.currentAnimation?.stop('replaced')
			previous.currentAnimation = undefined
		}
		this.lead = node
		this.transitioning = Boolean(this.pending)
		for (const member of this.members) {
			member.isProjectionDirty = true
			member.scheduleRender()
		}
	}

	setPresent(node: ProjectionNode, present: boolean): Promise<AnimationResult> {
		node.isPresent = present
		if (present) {
			this.resolveExit(node, 'cancelled')
			this.promote(node)
			node.root.invalidate('commit')
			return Promise.resolve('finished')
		}
		if (this.lead === node) {
			const next = [...this.members].reverse().find((member) => member !== node && member.isPresent)
			if (next) {
				this.promote(next)
			}
		}
		const result = new Promise<AnimationResult>((resolve) => {
			const waiting = this.exits.get(node) ?? []
			waiting.push(resolve)
			this.exits.set(node, waiting)
		})
		node.root.invalidate('commit')
		return result
	}

	prepare() {
		const lead = this.lead
		if (!lead?.layout) {
			return
		}
		if (this.pending) {
			const snapshot = this.pending
			this.pending = undefined
			lead.presented = createBox()
			copyBoxInto(lead.presented, snapshot.box)
			for (const axis of ['x', 'y'] as const) {
				const offset = lead.layout.viewportOffset
					? -lead.layout.viewportOffset()[axis]
					: lead.layout.layoutBox[axis].min - lead.layout.measuredBox[axis].min

				lead.presented[axis].min += offset
				lead.presented[axis].max += offset
			}

			removeBoxTransforms(lead.presented, lead.latestValues)
			lead.targetLayout = undefined
			lead.sharedHandoff = true
			this.fromValues = snapshot.values
			this.transitioning = true
			this.mix(0)
		} else if (!this.transitioning) {
			this.complete()
		}
	}

	mix(progress: number) {
		const lead = this.lead
		if (!lead || !this.transitioning) {
			return
		}
		const values: Record<string, number> = {}
		const crossfade = lead.options.crossfade !== false && Boolean(this.outgoing?.hooks)
		mixValues(
			values,
			this.fromValues,
			crossfade ? { ...lead.latestValues, opacity: 1 } : lead.latestValues,
			progress,
			crossfade,
			this.members.length === 1,
		)
		lead.sharedOpacity = crossfade
			? this.leadFromOpacity +
				((lead.latestValues.opacity ?? 1) - this.leadFromOpacity) * values.opacity
			: typeof values.opacity === 'number'
				? values.opacity
				: undefined
		for (const member of this.members) {
			if (member !== lead) {
				member.sharedOpacity = crossfade && member === this.outgoing ? values.opacityExit : 0
			}

			member.isProjectionDirty = true
			member.scheduleRender()
		}
	}

	follow(node: ProjectionNode) {
		const lead = this.lead
		if (!lead || lead === node || !node.layout || !lead.layout) {
			return
		}
		lead.resolveTargetDelta(true)
		node.target = transferBox(lead.target ?? lead.layout.layoutBox, lead, node)
		node.targetWithTransforms ??= createBox()
		node.isProjectionDirty = true
	}

	complete() {
		this.transitioning = false
		this.outgoing = undefined
		for (const member of this.members) {
			member.sharedOpacity = member === this.lead ? undefined : 0
			member.scheduleRender()
		}
		for (const node of this.exits.keys()) {
			this.resolveExit(node, 'finished')
		}
	}

	settleExits() {
		if (!this.pending && !this.lead?.currentAnimation) {
			this.complete()
		}
	}

	private resolveExit(node: ProjectionNode, result: AnimationResult) {
		const waiting = this.exits.get(node)
		this.exits.delete(node)
		for (const resolve of waiting ?? []) {
			resolve(result)
		}
	}
}
