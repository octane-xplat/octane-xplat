// Transform / z-index / clip-path resolution for the GTK renderer — GI-free
// so Node tests can exercise it. mason.ts turns the steps into a
// Gsk.Transform on the child allocation (masonview children); style-css.ts
// turns them into GTK CSS `transform` text everywhere else.
//
// NS semantics (ui/core/view/index.ios.js updateNativeTransform): the
// `transform` shorthand and the translateX/…/rotateY longhands feed one
// set of parts; composition is fixed — perspective (only with a 3D
// rotation, default 300), translate, rotate z, rotate x/y, scale — around
// the view's centre, with % translates resolved against its own size.

import {
	transformToParts,
	resolveTranslate,
	type TransformParts,
	type TranslateAxis,
} from '@octane-xplat/css-engine'

type PropBag = Record<string, any>

/** Style keys that feed the transform. The cascade camelCases NS cssNames
 *  verbatim (`rotatex`), inline styles use `rotateX` — both count. */
export const TRANSFORM_KEYS: readonly string[] = [
	'transform',
	'translateX',
	'translateY',
	'scaleX',
	'scaleY',
	'rotate',
	'rotateX',
	'rotatex',
	'rotateY',
	'rotatey',
	'perspective',
]

/** NS default perspective when a 3D rotation is present. */
const DEFAULT_PERSPECTIVE = 300

export interface ResolvedTransform extends TransformParts {
	perspective: number
}

function translateAxis(value: unknown): TranslateAxis | undefined {
	if (typeof value === 'number') {
		return Number.isFinite(value) ? value : undefined
	}
	if (typeof value === 'string') {
		const s = value.trim()
		const pct = /^([+-]?(?:\d+\.?\d*|\.\d+))%$/.exec(s)
		if (pct) {
			return { value: Number(pct[1]) / 100, unit: '%' }
		}

		const n = parseFloat(s)
		return Number.isFinite(n) ? n : undefined
	}
	if (value && typeof value === 'object' && (value as any).unit === '%') {
		return value as TranslateAxis
	}
	return undefined
}

function num(value: unknown): number | undefined {
	const n = typeof value === 'number' ? value : typeof value === 'string' ? parseFloat(value) : NaN
	return Number.isFinite(n) ? n : undefined
}

const IDENTITY_PARTS: TransformParts = {
	translateX: 0,
	translateY: 0,
	scaleX: 1,
	scaleY: 1,
	rotate: 0,
	rotateX: 0,
	rotateY: 0,
}

/** NS transformConverter throws on unknown functions — an invalid
 *  shorthand contributes nothing, like a rejected declaration. */
function shorthandParts(value: unknown): TransformParts {
	if (typeof value !== 'string' || !value.trim() || value.trim() === 'none') {
		return IDENTITY_PARTS
	}
	try {
		return transformToParts(value)
	} catch {
		return IDENTITY_PARTS
	}
}

/** Effective transform for a style bag (plus an optional keyframe overlay
 *  of flat parts). Longhands override the shorthand's parts. Returns null
 *  for the identity so callers keep their fast path. */
export function resolveTransform(
	style: PropBag | null | undefined,
	overlay?: Partial<TransformParts> | null,
): ResolvedTransform | null {
	const s = style ?? {}
	const parts: ResolvedTransform = {
		...shorthandParts(s.transform),
		perspective: num(s.perspective) ?? DEFAULT_PERSPECTIVE,
	}
	const tx = translateAxis(s.translateX)
	const ty = translateAxis(s.translateY)
	if (tx !== undefined) {
		parts.translateX = tx
	}
	if (ty !== undefined) {
		parts.translateY = ty
	}
	parts.scaleX = num(s.scaleX) ?? parts.scaleX
	parts.scaleY = num(s.scaleY) ?? parts.scaleY
	parts.rotate = num(s.rotate) ?? parts.rotate
	parts.rotateX = num(s.rotateX ?? s.rotatex) ?? parts.rotateX
	parts.rotateY = num(s.rotateY ?? s.rotatey) ?? parts.rotateY
	if (overlay) {
		for (const key of Object.keys(overlay) as (keyof TransformParts)[]) {
			if (overlay[key] !== undefined) {
				;(parts as any)[key] = overlay[key]
			}
		}
	}
	const identity =
		resolveTranslate(parts.translateX, 1) === 0 &&
		resolveTranslate(parts.translateY, 1) === 0 &&
		parts.scaleX === 1 &&
		parts.scaleY === 1 &&
		!parts.rotate &&
		!parts.rotateX &&
		!parts.rotateY
	return identity ? null : parts
}

export type TransformStep =
	| { kind: 'perspective'; depth: number }
	| { kind: 'translate'; x: number; y: number }
	| { kind: 'rotate'; deg: number }
	| { kind: 'rotateX'; deg: number }
	| { kind: 'rotateY'; deg: number }
	| { kind: 'scale'; x: number; y: number }

/** Steps in NS composition order, applied after moving the origin to the
 *  element's centre (callers wrap them in ±centre translations). */
export function transformSteps(
	parts: ResolvedTransform,
	width: number,
	height: number,
): TransformStep[] {
	const steps: TransformStep[] = []
	if ((parts.rotateX || parts.rotateY) && parts.perspective > 0) {
		steps.push({ kind: 'perspective', depth: parts.perspective })
	}
	const x = resolveTranslate(parts.translateX, width)
	const y = resolveTranslate(parts.translateY, height)
	if (x || y) {
		steps.push({ kind: 'translate', x, y })
	}
	if (parts.rotate) {
		steps.push({ kind: 'rotate', deg: parts.rotate })
	}
	if (parts.rotateX) {
		steps.push({ kind: 'rotateX', deg: parts.rotateX })
	}
	if (parts.rotateY) {
		steps.push({ kind: 'rotateY', deg: parts.rotateY })
	}
	if (parts.scaleX !== 1 || parts.scaleY !== 1) {
		steps.push({ kind: 'scale', x: parts.scaleX, y: parts.scaleY })
	}
	return steps
}

/** GTK CSS `transform` text for the non-Mason path (GTK rejects % in
 *  transforms, so translates are pre-resolved against the current size).
 *  Pair with `transform-origin: center`. */
export function cssTransformText(parts: ResolvedTransform, width: number, height: number): string {
	return transformSteps(parts, width, height)
		.map((step) => {
			switch (step.kind) {
				case 'perspective':
					return `perspective(${step.depth}px)`
				case 'translate':
					return `translate(${step.x}px, ${step.y}px)`
				case 'rotate':
					return `rotate(${step.deg}deg)`
				case 'rotateX':
					return `rotateX(${step.deg}deg)`
				case 'rotateY':
					return `rotateY(${step.deg}deg)`
				case 'scale':
					return `scale(${step.x}, ${step.y})`
			}
		})
		.join(' ')
}

/** NS z-index (integer, default 0). */
export function zIndexOf(style: PropBag | null | undefined): number {
	const z = num(style?.zIndex)
	return z === undefined ? 0 : Math.trunc(z)
}

/** Paint order for children with these z-indices — stable, ascending.
 *  Null when every child is 0 (keep document order, no sort). */
export function paintOrder(zIndices: number[]): number[] | null {
	if (zIndices.every((z) => z === 0)) {
		return null
	}
	return zIndices
		.map((z, index) => [z, index] as const)
		.sort((a, b) => a[0] - b[0] || a[1] - b[1])
		.map(([, index]) => index)
}
