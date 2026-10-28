import { correctBoxShadow } from 'motion-dom'
import type { ProjectionWrite } from './types'

/** Total scale includes projecting ancestors. Near-zero scales cannot be inverted. */
export function paintScale(write: ProjectionWrite) {
	const x = Math.max(0.0001, Math.abs(write.delta.x.scale * write.treeScale.x))
	const y = Math.max(0.0001, Math.abs(write.delta.y.scale * write.treeScale.y))
	return { x, y, uniform: Math.sqrt(x * y) }
}

/** Preserve platform length units; percentage radii should continue to scale. */
export function divideLength(value: any, scale: number): any {
	if (typeof value === 'number') {
		return value / scale
	}
	if (value && typeof value === 'object' && typeof value.value === 'number') {
		return value.unit === '%' ? value : { ...value, value: value.value / scale }
	}
	if (typeof value === 'string' && /^-?[\d.]+(?:px|dip)?$/.test(value)) {
		return `${parseFloat(value) / scale}${value.replace(/^-?[\d.]+/, '')}`
	}
	return value
}

export const radiusKeys = [
	'borderTopLeftRadius',
	'borderTopRightRadius',
	'borderBottomRightRadius',
	'borderBottomLeftRadius',
] as const

/** NativeScript radii and blur are scalar; nonuniform correction is approximate. */
export function correctNativePaint(style: Record<string, any>, write: ProjectionWrite) {
	const scale = paintScale(write)
	const corrected: Record<string, any> = {}
	if (
		typeof style.borderRadius === 'string' &&
		style.borderRadius.split('/').length <= 2 &&
		style.borderRadius.split('/').every((axis: string) =>
			axis
				.trim()
				.split(/\s+/)
				.every((token) => /^-?(?:\d+\.?\d*|\.\d+)(?:px|dip|%)?$/.test(token)),
		)
	) {
		// Mason core owns resolved CSS radius strings independently of Core's longhands.
		corrected.borderRadius = style.borderRadius.replace(/-?(?:\d*\.)?\d+(?:px|dip|%)?/g, (token) =>
			token.endsWith('%') ? token : String(divideLength(token, scale.uniform)),
		)
	}
	if (typeof style.boxShadow === 'string' && style.boxShadow && style.boxShadow !== 'none') {
		corrected.boxShadow = correctBoxShadow.correct(style.boxShadow, {
			treeScale: write.treeScale,
			projectionDelta: write.delta,
		} as any)
	}
	for (const key of radiusKeys) {
		if (!(key in style)) {
			continue
		}

		corrected[key] = divideLength(style[key], scale.uniform)
	}
	if (Array.isArray(style.boxShadow)) {
		corrected.boxShadow = style.boxShadow.map((shadow: any) => ({
			...shadow,
			offsetX: divideLength(shadow.offsetX, scale.x),
			offsetY: divideLength(shadow.offsetY, scale.y),
			blurRadius: divideLength(shadow.blurRadius, scale.uniform),
			spreadRadius: divideLength(shadow.spreadRadius, scale.uniform),
		}))
	}
	return corrected
}
