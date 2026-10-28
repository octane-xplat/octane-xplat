import type { Target, TransitionInput } from '../types'

/** One geometric axis of a box. */
export interface Axis {
	min: number
	max: number
}

/** A rectangle expressed as x/y axes. */
export interface Box {
	x: Axis
	y: Axis
}

/** Translate/scale/origin applied to one axis. */
export interface AxisDelta {
	translate: number
	scale: number
	origin: number
	originPoint: number
}

/** A two-axis projection transform. */
export interface Delta {
	x: AxisDelta
	y: AxisDelta
}

export interface Point {
	x: number
	y: number
}

/** Accepted values for the `layout` prop. */
export type LayoutMode = true | 'position' | 'size' | 'preserve-aspect' | 'x' | 'y'

/** Upstream animationType vocabulary; `true` maps to 'both'. */
export type AnimationType = 'both' | 'position' | 'size' | 'preserve-aspect' | 'x' | 'y'

/** One layout measurement produced by the host adapter. */
export interface Measurement {
	/** Untransformed content box with ancestor scroll removed. */
	layoutBox: Box
	/** Visual box in window coordinates. */
	measuredBox: Box
	/** Live content-to-viewport translation, retaining ancestor identities through unmount. */
	viewportOffset?: () => Point
}

/** A per-frame projection transform handed to the host adapter. */
export interface ProjectionWrite {
	delta: Delta
	/** Layout-only projection, excluding intentional user channel transforms. */
	layoutDelta?: Delta
	/** Current layout target before user channel transforms, for corner correction. */
	target?: Box
	treeScale: Point
	latest: Target
}

/** Platform hook that runs the update pass after layout and before paint. */
export interface LayoutBarrier {
	/** Run `pass` after the platform's next layout and before paint. The root coalesces calls. */
	schedule(pass: () => void): void
	/** Observe layout-changing events for the root; returns a stop function. */
	observe(root: {
		invalidate(kind: 'mutation' | 'resize'): void
		isMotionHost(node: unknown): boolean
	}): () => void
	/** Identify elements owned by motion hosts so own-writes can be filtered. */
	isMotionHost?(node: unknown): boolean
}

export interface ProjectionNodeOptions {
	layoutId?: string
	layoutRoot?: boolean
	layoutAnchor?: Point | false
	crossfade?: boolean
	animationType?: AnimationType
	layoutDependency?: unknown
	transition?: TransitionInput
	reduced?: boolean
	onLayoutAnimationStart?: () => void
	onLayoutAnimationComplete?: () => void
}
