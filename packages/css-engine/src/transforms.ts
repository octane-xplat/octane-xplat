/**
 * CSS transform parsing — port of NS 9.1.3 `ui/styling/css-transform.js`
 * (transformConverter) reduced to GI-free data. A translate axis is a dip
 * number or `{ value, unit: '%' }` (fraction) resolved against the element's
 * own size by the renderer.
 */
export type TranslateAxis = number | { value: number; unit: '%' }

export interface TransformParts {
	translateX: TranslateAxis
	translateY: TranslateAxis
	scaleX: number
	scaleY: number
	rotate: number
	rotateX: number
	rotateY: number
}

export const IDENTITY_TRANSFORM: TransformParts = {
	translateX: 0,
	translateY: 0,
	scaleX: 1,
	scaleY: 1,
	rotate: 0,
	rotateX: 0,
	rotateY: 0,
}

interface Converted {
	translate: { x: TranslateAxis; y: TranslateAxis }
	rotate: { x: number; y: number; z: number }
	scale: { x: number; y: number }
}

const IDENTITY = {
	translate: { x: 0, y: 0 },
	rotate: { x: 0, y: 0, z: 0 },
	scale: { x: 1, y: 1 },
}

/** NS `PercentLength.parse` for translate values: `10px`/`10dip` →
 *  {value:10,unit:'px'}, `50%` → {value:0.5,unit:'%'}, bare number stays. */
function parsePercentLength(text: string): TranslateAxis {
	const trimmed = String(text).trim()
	const percent = /^([+-]?(?:\d+\.?\d*|\.\d+))%$/.exec(trimmed)
	if (percent) {
		return { value: Number(percent[1]) / 100, unit: '%' }
	}
	const m = /^([+-]?(?:\d+\.?\d*|\.\d+))(px|dip|pt)?$/.exec(trimmed)
	return m ? Number(m[1]) : 0
}

/** NS `resolveTranslate` — percent resolves against the element's own size. */
export function resolveTranslate(value: TranslateAxis, basis: number): number {
	if (typeof value === 'number') {
		return value
	}
	if (typeof value !== 'object' || value === null) {
		return 0
	}
	return value.unit === '%' ? basis * value.value : value.value
}

export function isPercentTranslate(value: unknown): boolean {
	return typeof value === 'object' && value !== null && (value as any).unit === '%'
}

const TRANSFORM_SPLITTER = /\s*(.+?)\((.*?)\)/g
const TRANSFORMATIONS = new Set([
	'rotate',
	'rotateX',
	'rotateY',
	'rotate3d',
	'translate',
	'translate3d',
	'translateX',
	'translateY',
	'scale',
	'scale3d',
	'scaleX',
	'scaleY',
])
const TRANSLATE_FNS = new Set(['translate', 'translate3d', 'translateX', 'translateY'])

const STYLE_TRANSFORMATION_MAP: Record<string, (v: any) => { property: 'translate' | 'rotate' | 'scale'; value: any }> = {
	scale: (value) => ({ property: 'scale', value }),
	scale3d: (value) => ({ property: 'scale', value }),
	scaleX: ({ x }) => ({ property: 'scale', value: { x, y: 1 } }),
	scaleY: ({ y }) => ({ property: 'scale', value: { y, x: 1 } }),
	translate: (value) => ({ property: 'translate', value }),
	translate3d: (value) => ({ property: 'translate', value }),
	translateX: ({ x }) => ({ property: 'translate', value: { x, y: 0 } }),
	translateY: ({ y }) => ({ property: 'translate', value: { y, x: 0 } }),
	rotate3d: (value) => ({ property: 'rotate', value }),
	rotateX: (x) => ({ property: 'rotate', value: { x, y: 0, z: 0 } }),
	rotateY: (y) => ({ property: 'rotate', value: { x: 0, y, z: 0 } }),
	rotate: (z) => ({ property: 'rotate', value: { x: 0, y: 0, z } }),
}

function convertTransformValue(property: string, rawValue: string) {
	if (property === 'rotate' || property === 'rotateX' || property === 'rotateY') {
		const x = parseFloat(rawValue)
		return rawValue.slice(-3) === 'rad' ? (x * 180) / Math.PI : x
	}
	if (TRANSLATE_FNS.has(property)) {
		const values = rawValue.split(',').map(parsePercentLength)
		const x = values[0]
		const y = property === 'translate' ? (values[1] ?? 0) : (values[1] ?? x)
		return { x, y }
	}
	const values = rawValue.split(',').map(parseFloat)
	const x = values[0]
	const y = values[1] ?? x
	const z = values[2] ?? y
	return { x, y, z }
}

function parseTransformString(text: string) {
	const matches: { property: 'translate' | 'rotate' | 'scale'; value: any }[] = []
	let match
	TRANSFORM_SPLITTER.lastIndex = 0
	while ((match = TRANSFORM_SPLITTER.exec(text)) !== null) {
		const property = match[1]
		if (TRANSFORMATIONS.has(property)) {
			matches.push(STYLE_TRANSFORMATION_MAP[property](convertTransformValue(property, match[2])))
		}
	}
	return matches
}

function isZeroTranslate(value: TranslateAxis): boolean {
	if (typeof value === 'number') {
		return value === 0
	}
	return value.value === 0
}

function translateToNumber(value: TranslateAxis): number {
	if (typeof value === 'number') {
		return value
	}
	// % stores a fraction; matrix composition keeps the raw number, matching
	// NS translateValueToNumber.
	return value.unit === '%' ? value.value * 100 : value.value
}

function mergeTranslateAxis(values: TranslateAxis[]): TranslateAxis {
	const nonZero = values.filter((v) => !isZeroTranslate(v))
	if (nonZero.length === 0) {
		return 0
	}
	if (nonZero.length === 1) {
		return nonZero[0]
	}
	const unit = typeof nonZero[0] === 'object' ? nonZero[0].unit : null
	if (unit !== null && nonZero.every((v) => typeof v === 'object' && (v as any).unit === unit)) {
		return { unit: '%', value: nonZero.reduce((s: number, v) => s + (v as { value: number }).value, 0) }
	}
	return nonZero.reduce((s: number, v) => s + translateToNumber(v), 0)
}

// 2D affine matrix compose/decompose for duplicate non-translate transform
// lists — NS goes through matrix.js getTransformMatrix/multiplyAffine2d and
// decompose2DTransformMatrix; this is the same math inlined.
type Affine = [number, number, number, number, number, number]

function matrixOf(t: { property: string; value: any }): Affine {
	switch (t.property) {
		case 'translate':
			return [1, 0, 0, 1, translateToNumber(t.value.x), translateToNumber(t.value.y)]
		case 'scale':
			return [t.value.x, 0, 0, t.value.y, 0, 0]
		case 'rotate': {
			const r = (t.value.z * Math.PI) / 180
			const c = Math.cos(r)
			const s = Math.sin(r)
			return [c, s, -s, c, 0, 0]
		}
	}
	return [1, 0, 0, 1, 0, 0]
}

function multiply(a: Affine, b: Affine): Affine {
	return [
		a[0] * b[0] + a[2] * b[1],
		a[1] * b[0] + a[3] * b[1],
		a[0] * b[2] + a[2] * b[3],
		a[1] * b[2] + a[3] * b[3],
		a[0] * b[4] + a[2] * b[5] + a[4],
		a[1] * b[4] + a[3] * b[5] + a[5],
	]
}

function decompose(m: Affine): Converted {
	const [a, b, c, d, tx, ty] = m
	const scaleX = Math.sqrt(a * a + b * b)
	const det = a * d - b * c
	const scaleY = det !== 0 ? det / scaleX : d
	const rotate = (Math.atan2(b, a) * 180) / Math.PI
	return {
		translate: { x: tx, y: ty },
		rotate: { x: 0, y: 0, z: rotate },
		scale: { x: scaleX, y: scaleY },
	}
}

/** NS `transformConverter` — `translate(10px, 20%) rotate(45deg)` →
 *  per-axis parts. Duplicate translate fns merge axis-wise (percent-safe);
 *  other duplicates compose through 2D affine matrices like NS. */
export function transformConverter(text: string): Converted {
	if (text === 'none' || text === '') {
		return { ...IDENTITY, translate: { x: 0, y: 0 }, rotate: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1 } }
	}
	const transformations = parseTransformString(text)
	if (!transformations.length) {
		return JSON.parse(JSON.stringify(IDENTITY))
	}
	const props = transformations.map((t) => t.property)
	const dup = props.filter((p, i) => props.indexOf(p) !== i)
	if (dup.length && dup.every((p) => p === 'translate')) {
		// Merge translate axes keeping percent units intact.
		const xs: TranslateAxis[] = []
		const ys: TranslateAxis[] = []
		for (let i = transformations.length - 1; i >= 0; i--) {
			if (transformations[i].property === 'translate') {
				xs.unshift(transformations[i].value.x)
				ys.unshift(transformations[i].value.y)
				transformations.splice(i, 1)
			}
		}
		transformations.unshift({ property: 'translate', value: { x: mergeTranslateAxis(xs), y: mergeTranslateAxis(ys) } })
	}
	const props2 = transformations.map((t) => t.property)
	if (!props2.some((p, i) => props2.indexOf(p) !== i)) {
		const full: Converted = { translate: { x: 0, y: 0 }, rotate: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1 } }
		for (const t of transformations) {
			;(full as any)[t.property] = t.value
		}
		return full
	}
	const m = transformations.map(matrixOf).reduce(multiply)
	return decompose(m)
}

/** Flat parts for the cascade/animator vocabulary. */
export function transformToParts(text: string): TransformParts {
	const t = transformConverter(text)
	return {
		translateX: t.translate.x,
		translateY: t.translate.y,
		scaleX: t.scale.x,
		scaleY: t.scale.y,
		rotate: t.rotate.z,
		rotateX: t.rotate.x,
		rotateY: t.rotate.y,
	}
}

/** Compose transform parts into renderer-agnostic steps — NS
 *  `updateNativeTransform` order: translate, then rotate (z, then x/y),
 *  then scale, applied around the centre. Percent translates resolve
 *  against (width, height). */
export function composeTransform(
	parts: Partial<TransformParts>,
	width: number,
	height: number,
): { kind: 'translate' | 'rotate' | 'rotate3d' | 'scale'; args: number[] }[] {
	const steps: { kind: string; args: number[] }[] = []
	const tx = parts.translateX !== undefined ? resolveTranslate(parts.translateX, width) : 0
	const ty = parts.translateY !== undefined ? resolveTranslate(parts.translateY, height) : 0
	if (tx || ty) {
		steps.push({ kind: 'translate', args: [tx, ty] })
	}
	if (parts.rotate) {
		steps.push({ kind: 'rotate', args: [parts.rotate] })
	}
	if (parts.rotateX || parts.rotateY) {
		steps.push({ kind: 'rotate3d', args: [parts.rotateX ?? 0, parts.rotateY ?? 0] })
	}
	const sx = parts.scaleX ?? 1
	const sy = parts.scaleY ?? 1
	if (sx !== 1 || sy !== 1) {
		steps.push({ kind: 'scale', args: [sx, sy] })
	}
	return steps as any
}
