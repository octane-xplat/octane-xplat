import { mixNumber } from 'motion-dom'
import type { Axis, AxisDelta, Box } from './types'

// Single import seam for motion-dom's pure projection geometry.
export {
	createBox,
	createDelta,
	copyBoxInto,
	copyAxisInto,
	copyAxisDeltaInto,
	calcBoxDelta,
	calcLength,
	calcRelativePosition,
	calcRelativeBox,
	applyBoxDelta,
	applyTreeDeltas,
	transformBox,
	removeBoxTransforms,
	translateAxis,
	buildProjectionTransform,
	isDeltaZero,
	boxEquals,
	boxEqualsRounded,
	axisDeltaEquals,
	eachAxis,
	aspectRatio,
	isNear,
	hasTransform,
	hasScale,
	has2DTranslate,
} from 'motion-dom'

export function mixAxisDeltaLinear(output: AxisDelta, delta: AxisDelta, p: number) {
	output.translate = mixNumber(delta.translate, 0, p)
	output.scale = mixNumber(delta.scale, 1, p)
	output.origin = delta.origin
	output.originPoint = delta.originPoint
}

export function mixAxis(output: Axis, from: Axis, to: Axis, p: number) {
	output.min = mixNumber(from.min, to.min, p)
	output.max = mixNumber(from.max, to.max, p)
}

export function mixBox(output: Box, from: Box, to: Box, p: number) {
	mixAxis(output.x, from.x, to.x, p)
	mixAxis(output.y, from.y, to.y, p)
}
