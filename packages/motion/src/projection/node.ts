import { runAnimation, isOrchestrated } from '../engine'
import type { AnimationControls } from '../engine'
import type { Transition, TransitionInput, Target } from '../types'
import {
	applyBoxDelta,
	applyTreeDeltas,
	aspectRatio,
	axisDeltaEquals,
	boxEquals,
	boxEqualsRounded,
	calcBoxDelta,
	calcLength,
	calcRelativeBox,
	calcRelativePosition,
	copyAxisDeltaInto,
	copyAxisInto,
	copyBoxInto,
	createBox,
	createDelta,
	eachAxis,
	has2DTranslate,
	hasScale,
	isDeltaZero,
	isNear,
	mixAxisDeltaLinear,
	mixBox,
	transformBox,
} from './geometry'

import type { ProjectionRoot } from './root'
import type { SharedStack } from './stack'
import type {
	Axis,
	Box,
	Delta,
	Measurement,
	ProjectionNodeOptions,
	ProjectionWrite,
	Point,
} from './types'

/** Host-side surface a projection node drives; supplied by the adapter. */
export interface ProjectionNodeHooks {
	measureLayout(): Measurement | null
	resetProjection(): void
	project(write: ProjectionWrite | null): void
	writeOpacity?(opacity: number): void
}

const animationTarget = 1000

let id = 0

export class ProjectionNode {
	readonly id: number = id++
	root!: ProjectionRoot
	parent?: ProjectionNode
	path: ProjectionNode[] = []
	children = new Set<ProjectionNode>()
	depth = 0
	options: ProjectionNodeOptions = {}
	shared?: SharedStack
	sharedHandoff = false
	sharedOpacity?: number
	private hadSharedOpacity = false
	isPresent = true
	isAnimationBlocked = false
	private dragProjectionHeld = false
	private onDragLayoutShift?: (shift: Point) => void
	latestValues: Target = {}
	hooks?: ProjectionNodeHooks

	layout?: Measurement
	/** What is on screen now: the projected target, or layout.layoutBox. */
	presented?: Box
	targetLayout?: Box
	layoutVersion = 0

	layoutCorrected: Box = createBox()
	target?: Box
	targetWithTransforms?: Box
	relativeTarget?: Box
	relativeTargetOrigin?: Box
	relativeParent?: ProjectionNode
	linkedParentVersion = 0
	resolvedRelativeTargetAt = 0
	targetDelta?: Delta
	projectionDelta?: Delta
	prevProjectionDelta?: Delta
	projectionDeltaWithTransform?: Delta
	treeScale = { x: 1, y: 1 }

	isProjectionDirty = false
	isSharedProjectionDirty = false
	isTransformDirty = false
	isTreeAnimating = false
	attemptToResolveRelativeTarget?: boolean

	currentAnimation?: AnimationControls
	mixTargetDelta?: (progress: number) => void
	animationProgress = 0
	hasProjected = false
	needsRender = false
	prevLayoutDependency?: unknown

	constructor(parent?: ProjectionNode) {
		this.parent = parent
		this.path = parent ? [...parent.path, parent] : []
		this.depth = parent ? parent.depth + 1 : 0
		parent?.children.add(this)
	}

	attach(hooks: ProjectionNodeHooks) {
		this.hooks = hooks
	}

	detach() {
		this.endDrag()
		this.dragProjectionHeld = false
		if (this.hadSharedOpacity) {
			this.hooks?.writeOpacity?.(this.latestValues.opacity ?? 1)
		}
		if (this.hasProjected) {
			this.hooks?.project(null)
			this.hasProjected = false
		}

		this.currentAnimation?.stop('cancelled')
		this.currentAnimation = undefined
		this.hooks = undefined
		this.parent?.children.delete(this)
	}

	/** Hold the current presentation while channel values take over a drag. */
	beginDrag(rebase: (shift: Point) => void) {
		const shift = { x: 0, y: 0 }
		if (this.layout && this.presented) {
			shift.x = this.presented.x.min - this.layout.layoutBox.x.min
			shift.y = this.presented.y.min - this.layout.layoutBox.y.min
		}
		this.isAnimationBlocked = true
		this.dragProjectionHeld = true
		this.onDragLayoutShift = rebase
		this.currentAnimation?.stop('cancelled')
		this.currentAnimation = undefined
		this.shared?.complete()
		this.targetDelta = undefined
		this.removeRelativeTarget()
		this.mixTargetDelta = undefined
		rebase(shift)
		this.isProjectionDirty = true
		this.root.requestProjectionFrame()
	}

	/** Rebase before rendering the newly measured layout, including ancestor moves. */
	rebaseDrag(previous: Measurement | undefined) {
		if (!this.isAnimationBlocked || !previous || !this.layout) {
			return
		}
		this.onDragLayoutShift?.({
			x: previous.measuredBox.x.min - this.layout.measuredBox.x.min,
			y: previous.measuredBox.y.min - this.layout.measuredBox.y.min,
		})
	}

	endDrag() {
		if (!this.isAnimationBlocked) {
			return
		}
		this.isAnimationBlocked = false
		this.onDragLayoutShift = undefined
		this.removeRelativeTarget()
		this.isProjectionDirty = true
		this.root.invalidate('commit')
	}

	setLatestValues(values: Target) {
		this.latestValues = values
	}

	/**
	 * Decide whether this pass's measurement starts, retargets, finishes, or
	 * leaves alone this node's layout animation. Ported from upstream's
	 * notifyLayoutUpdate + didUpdate handler.
	 */
	notifyLayoutUpdate() {
		if (this.isAnimationBlocked) {
			return
		}
		if (
			this.dragProjectionHeld &&
			this.layout &&
			this.presented &&
			boxEqualsRounded(this.layout.layoutBox, this.presented)
		) {
			return
		}
		if (this.shared?.lead && this.shared.lead !== this) {
			return
		}
		const handoff = this.sharedHandoff
		this.sharedHandoff = false
		const dep = this.options.layoutDependency
		const depChanged = !Object.is(dep, this.prevLayoutDependency)
		this.prevLayoutDependency = dep
		if (!handoff && dep !== undefined && !depChanged) {
			return
		}
		if (!this.layout || !this.presented) {
			return
		}

		const layout = this.layout.layoutBox
		const snapshot = createBox()
		copyBoxInto(snapshot, this.presented)
		const { animationType } = this.options

		if (animationType === 'size') {
			eachAxis((axis) => {
				const axisSnapshot = snapshot[axis]
				const length = calcLength(axisSnapshot)
				axisSnapshot.min = layout[axis].min
				axisSnapshot.max = axisSnapshot.min + length
			})
		} else if (animationType === 'x' || animationType === 'y') {
			const snapAxis = animationType === 'x' ? 'y' : 'x'
			copyAxisInto(snapshot[snapAxis], layout[snapAxis])
		} else if (shouldAnimatePositionOnly(animationType, snapshot, layout)) {
			eachAxis((axis) => {
				const axisSnapshot = snapshot[axis]
				const length = calcLength(layout[axis])
				axisSnapshot.max = axisSnapshot.min + length

				if (this.relativeTarget && !this.currentAnimation) {
					this.isProjectionDirty = true
					this.relativeTarget[axis].max = this.relativeTarget[axis].min + length
				}
			})
		}

		const layoutDelta = createDelta()
		calcBoxDelta(layoutDelta, layout, snapshot)
		const visualDelta = createDelta()
		calcBoxDelta(visualDelta, layout, snapshot)

		const hasLayoutChanged = !isDeltaZero(layoutDelta)
		let hasRelativeLayoutChanged = false

		const relativeParent =
			this.options.layoutAnchor === false ? undefined : this.getClosestProjectingParent()
		if (relativeParent?.layout && relativeParent.presented) {
			const relativeSnapshot = createBox()
			calcRelativePosition(
				relativeSnapshot,
				snapshot,
				relativeParent.presented,
				this.options.layoutAnchor || undefined,
			)

			const relativeLayout = createBox()
			calcRelativePosition(
				relativeLayout,
				layout,
				relativeParent.layout.layoutBox,
				this.options.layoutAnchor || undefined,
			)

			if (relativeParent.options.layoutRoot) {
				this.relativeTarget = relativeLayout
				this.relativeTargetOrigin = relativeSnapshot
				this.relativeParent = relativeParent
			}

			if (!boxEqualsRounded(relativeSnapshot, relativeLayout)) {
				hasRelativeLayoutChanged = true
			}
		}

		const hasTargetChanged = !this.targetLayout || !boxEqualsRounded(this.targetLayout, layout)
		const hasOnlyRelativeTargetChanged = !hasLayoutChanged && hasRelativeLayoutChanged

		if (
			this.options.layoutRoot ||
			handoff ||
			hasOnlyRelativeTargetChanged ||
			(hasLayoutChanged && (hasTargetChanged || !this.currentAnimation))
		) {
			const transition =
				this.options.reduced || this.options.layoutRoot
					? { duration: 0 }
					: resolveLayoutTransition(this.options.transition)

			this.dragProjectionHeld = false
			this.setAnimationOrigin(visualDelta, hasOnlyRelativeTargetChanged)
			this.startAnimation(transition)
		} else if (!hasLayoutChanged && !this.currentAnimation) {
			this.finishAnimation()
		}

		this.targetLayout = layout
	}

	setTargetDelta(delta: Delta) {
		this.targetDelta = delta
		this.root.scheduleUpdateProjection()
		this.isProjectionDirty = true
	}

	resolveTargetDelta(forceRecalculation = false) {
		this.isSharedProjectionDirty ||= Boolean(
			this.isProjectionDirty || this.parent?.isProjectionDirty,
		)
		this.isTransformDirty ||= Boolean(this.parent?.isTransformDirty)

		if (
			(this.isAnimationBlocked ||
				(this.dragProjectionHeld && this.path.some((node) => node.currentAnimation))) &&
			this.layout
		) {
			this.target ??= createBox()
			this.targetWithTransforms ??= createBox()
			copyBoxInto(this.target, this.layout.layoutBox)
			this.isProjectionDirty = true
			this.scheduleRender()
			return
		}
		this.dragProjectionHeld = false
		const canSkip = !(
			forceRecalculation ||
			this.isProjectionDirty ||
			this.parent?.isProjectionDirty ||
			this.attemptToResolveRelativeTarget
		)

		if (canSkip) {
			return
		}
		if (!this.layout || !this.options.animationType) {
			return
		}

		this.resolvedRelativeTargetAt = this.root.frameTimestamp
		const relativeParent =
			this.options.layoutAnchor === false ? undefined : this.getClosestProjectingParent()

		if (
			relativeParent &&
			!relativeParent.options.layoutRoot &&
			this.linkedParentVersion !== relativeParent.layoutVersion
		) {
			this.removeRelativeTarget()
		}

		if (!this.targetDelta && !this.relativeTarget) {
			if (this.options.layoutAnchor !== false && relativeParent?.layout) {
				this.createRelativeTarget(
					relativeParent,
					this.layout.layoutBox,
					relativeParent.layout.layoutBox,
				)
			} else {
				this.removeRelativeTarget()
			}
		}

		if (!this.relativeTarget && !this.targetDelta) {
			return
		}

		if (!this.target) {
			this.target = createBox()
			this.targetWithTransforms = createBox()
		}

		if (this.relativeTarget && this.relativeTargetOrigin && this.relativeParent?.target) {
			this.forceRelativeParentToResolveTarget()
			calcRelativeBox(
				this.target,
				this.relativeTarget,
				this.relativeParent.target,
				this.options.layoutAnchor || undefined,
			)
		} else if (this.targetDelta) {
			copyBoxInto(this.target, this.layout.layoutBox)
			applyBoxDelta(this.target, this.targetDelta)
		} else {
			copyBoxInto(this.target, this.layout.layoutBox)
		}

		if (this.attemptToResolveRelativeTarget) {
			this.attemptToResolveRelativeTarget = false
			if (
				this.options.layoutAnchor !== false &&
				relativeParent?.target &&
				this.animationProgress !== 1
			) {
				this.createRelativeTarget(relativeParent, this.target, relativeParent.target)
			} else {
				this.removeRelativeTarget()
			}
		}
	}

	forceRelativeParentToResolveTarget() {
		if (!this.relativeParent) {
			return
		}
		if (this.relativeParent.resolvedRelativeTargetAt !== this.root.frameTimestamp) {
			this.relativeParent.resolveTargetDelta(true)
		}
	}

	getClosestProjectingParent(): ProjectionNode | undefined {
		if (
			!this.parent ||
			hasScale(this.parent.latestValues) ||
			has2DTranslate(this.parent.latestValues)
		) {
			return undefined
		}

		return this.parent.isProjecting() ? this.parent : this.parent.getClosestProjectingParent()
	}

	isProjecting() {
		return Boolean(
			(this.dragProjectionHeld ||
				this.isAnimationBlocked ||
				this.options.layoutRoot ||
				this.relativeTarget ||
				this.targetDelta ||
				(this.shared?.lead !== this && this.shared?.transitioning)) &&
			this.layout,
		)
	}

	createRelativeTarget(relativeParent: ProjectionNode, layout: Box, parentLayout: Box) {
		this.relativeParent = relativeParent
		this.linkedParentVersion = relativeParent.layoutVersion
		this.forceRelativeParentToResolveTarget()
		this.relativeTarget = createBox()
		this.relativeTargetOrigin = createBox()
		calcRelativePosition(
			this.relativeTargetOrigin,
			layout,
			parentLayout,
			this.options.layoutAnchor || undefined,
		)
		copyBoxInto(this.relativeTarget, this.relativeTargetOrigin)
	}

	removeRelativeTarget() {
		this.relativeParent = this.relativeTarget = undefined
	}

	calcProjection() {
		let canSkip = true
		if (this.isProjectionDirty || this.parent?.isProjectionDirty) {
			canSkip = false
		}
		if (this.isSharedProjectionDirty || this.isTransformDirty) {
			canSkip = false
		}
		if (this.resolvedRelativeTargetAt === this.root.frameTimestamp) {
			canSkip = false
		}
		if (canSkip) {
			return
		}

		this.isTreeAnimating = Boolean(
			(this.parent && this.parent.isTreeAnimating) ||
			this.dragProjectionHeld ||
			this.isAnimationBlocked ||
			this.currentAnimation ||
			this.shared?.transitioning,
		)
		if (!this.isTreeAnimating) {
			this.targetDelta = this.relativeTarget = undefined
		}

		if (!this.layout || !this.options.animationType) {
			return
		}

		copyBoxInto(this.layoutCorrected, this.layout.layoutBox)

		const prevTreeScaleX = this.treeScale.x
		const prevTreeScaleY = this.treeScale.y
		applyTreeDeltas(this.layoutCorrected, this.treeScale, this.path, false)

		if (!this.target && (this.treeScale.x !== 1 || this.treeScale.y !== 1)) {
			this.target = this.layout.layoutBox
			this.targetWithTransforms = createBox()
		}

		const { target } = this
		if (!target) {
			if (this.prevProjectionDelta) {
				this.createProjectionDeltas()
				this.scheduleRender()
			}

			return
		}

		if (!this.projectionDelta || !this.prevProjectionDelta) {
			this.createProjectionDeltas()
		} else {
			copyAxisDeltaInto(this.prevProjectionDelta.x, this.projectionDelta.x)
			copyAxisDeltaInto(this.prevProjectionDelta.y, this.projectionDelta.y)
		}

		calcBoxDelta(this.projectionDelta!, this.layoutCorrected, target, this.latestValues)

		if (
			this.treeScale.x !== prevTreeScaleX ||
			this.treeScale.y !== prevTreeScaleY ||
			!axisDeltaEquals(this.projectionDelta!.x, this.prevProjectionDelta!.x) ||
			!axisDeltaEquals(this.projectionDelta!.y, this.prevProjectionDelta!.y)
		) {
			this.hasProjected = true
			this.scheduleRender()
		}
	}

	applyTransformsToTarget() {
		const { targetWithTransforms, target, layout } = this
		const latestValues = this.shared?.lead?.latestValues ?? this.latestValues
		if (!targetWithTransforms || !target || !layout) {
			return
		}

		copyBoxInto(targetWithTransforms, target)
		transformBox(targetWithTransforms, latestValues)
		calcBoxDelta(
			this.projectionDeltaWithTransform!,
			this.layoutCorrected,
			targetWithTransforms,
			latestValues,
		)
	}

	scheduleRender() {
		this.needsRender = true
	}

	render() {
		const { target } = this
		if (!this.projectionDelta || !this.layout || !target) {
			if (this.hasProjected) {
				this.hooks?.project(null)
				this.hasProjected = false
			}

			this.needsRender = false
			return
		}

		this.applyTransformsToTarget()

		if (!this.currentAnimation && !this.isTreeAnimating && isDeltaZero(this.projectionDelta)) {
			if (this.hasProjected) {
				this.hooks?.project(null)
				this.hasProjected = false
			}

			this.needsRender = false
			return
		}

		if (this.needsRender || this.hasProjected) {
			this.hooks?.project({
				delta: this.projectionDeltaWithTransform!,
				target: this.targetWithTransforms,
				treeScale: this.treeScale,
				latest: this.latestValues,
			})

			this.hasProjected = true
		}

		this.needsRender = false
	}

	refreshPresented() {
		if (!this.layout) {
			return
		}
		if (!this.presented) {
			this.presented = createBox()
		}
		const projecting = this.isProjecting() && this.target
		copyBoxInto(this.presented, projecting ? this.target! : this.layout.layoutBox)
	}

	renderOpacity() {
		if (this.sharedOpacity !== undefined) {
			this.hooks?.writeOpacity?.(this.sharedOpacity)
			this.hadSharedOpacity = true
		} else if (this.hadSharedOpacity) {
			this.hooks?.writeOpacity?.(this.latestValues.opacity ?? 1)
			this.hadSharedOpacity = false
		}
	}

	createProjectionDeltas() {
		this.prevProjectionDelta = createDelta()
		this.projectionDelta = createDelta()
		this.projectionDeltaWithTransform = createDelta()
	}

	setAnimationOrigin(delta: Delta, hasOnlyRelativeTargetChanged = false) {
		if (!this.relativeParent?.options.layoutRoot) {
			this.relativeTarget = this.relativeTargetOrigin = undefined
		}
		this.attemptToResolveRelativeTarget = !hasOnlyRelativeTargetChanged

		const targetDelta = createDelta()
		this.animationProgress = 0
		const relativeLayout = createBox()
		let prevRelativeTarget: Box | undefined

		this.mixTargetDelta = (latest: number) => {
			const progress = latest / 1000
			mixAxisDeltaLinear(targetDelta.x, delta.x, progress)
			mixAxisDeltaLinear(targetDelta.y, delta.y, progress)
			this.setTargetDelta(targetDelta)

			if (
				this.relativeTarget &&
				this.relativeTargetOrigin &&
				this.layout &&
				this.relativeParent?.layout
			) {
				calcRelativePosition(
					relativeLayout,
					this.layout.layoutBox,
					this.relativeParent.layout.layoutBox,
					this.options.layoutAnchor || undefined,
				)

				mixBox(this.relativeTarget, this.relativeTargetOrigin, relativeLayout, progress)

				if (prevRelativeTarget && boxEquals(this.relativeTarget, prevRelativeTarget)) {
					this.isProjectionDirty = false
				}

				if (!prevRelativeTarget) {
					prevRelativeTarget = createBox()
				}

				copyBoxInto(prevRelativeTarget, this.relativeTarget)
			}

			this.root.scheduleUpdateProjection()
			this.animationProgress = progress
			if (this.shared?.lead === this) {
				this.shared.mix(progress)
			}
		}

		this.mixTargetDelta(0)
	}

	startAnimation(transition: Transition) {
		this.currentAnimation?.stop('replaced')

		let started = false
		let completed = false
		const controls = runAnimation(
			this.root.animationClock,
			0,
			animationTarget,
			transition,
			(latest) => {
				if (!started) {
					started = true
					this.options.onLayoutAnimationStart?.()
				}

				this.mixTargetDelta?.(latest)
			},
			() => {
				completed = true
				this.options.onLayoutAnimationComplete?.()
				this.completeAnimation()
			},
		)
		this.currentAnimation = completed ? undefined : controls
	}

	completeAnimation() {
		this.currentAnimation = undefined
		if (this.shared?.lead === this) {
			this.shared.complete()
		}
	}

	finishAnimation() {
		if (this.currentAnimation) {
			this.mixTargetDelta?.(animationTarget)
			this.currentAnimation.stop()
		}

		this.completeAnimation()
	}
}

export function propagateDirtyNodes(node: ProjectionNode) {
	if (!node.parent) {
		return
	}
	if (!node.isProjecting()) {
		node.isProjectionDirty = node.parent.isProjectionDirty
	}

	node.isSharedProjectionDirty ||= Boolean(
		node.isProjectionDirty || node.parent.isProjectionDirty || node.parent.isSharedProjectionDirty,
	)

	node.isTransformDirty ||= node.parent.isTransformDirty
}

export function cleanDirtyNodes(node: ProjectionNode) {
	node.isProjectionDirty = node.isSharedProjectionDirty = node.isTransformDirty = false
}

const defaultLayoutTransition: Transition = {
	duration: 0.45,
	ease: [0.4, 0, 0.1, 1],
}

export function resolveLayoutTransition(input: TransitionInput | undefined): Transition {
	const resolved = input
		? isOrchestrated(input)
			? (input.layout ?? input.default)
			: input
		: undefined
	if (!resolved || !Object.keys(resolved).length) {
		return { ...defaultLayoutTransition }
	}
	const { staggerChildren, delayChildren, when, ...transition } = resolved
	return transition
}

function shouldAnimatePositionOnly(animationType: string | undefined, snapshot: Box, layout: Box) {
	return (
		animationType === 'position' ||
		(animationType === 'preserve-aspect' &&
			!isNear(aspectRatio(snapshot), aspectRatio(layout), 0.2))
	)
}
