/**
 * Keyframe sampler — GI/AppKit-free. `sampleKeyframeAnimation` evaluates one
 * parsed `KeyframeAnimationInfo` at an elapsed millisecond offset and returns
 * the interpolated property overlay.
 *
 * Follows NS `keyframe-animation.js`: delay, iteration count (Infinity
 * allowed), `reverse` flips the timeline, `forwards|both` fill holds the last
 * frame, and each keyframe's `animation-timing-function` curves the segment
 * that ends at it.
 */
import { evaluateCurve, type KeyframeAnimationInfo, type ParsedKeyframe } from './keyframes.ts'
import type { TranslateAxis } from './transforms.ts'

export interface SampledValues {
	opacity?: number
	backgroundColor?: string
	translateX?: TranslateAxis
	translateY?: TranslateAxis
	scaleX?: number
	scaleY?: number
	rotate?: number
	rotateX?: number
	rotateY?: number
	width?: number
	height?: number
}

// ---- Colour interpolation ---------------------------------------------------

interface Rgba {
	r: number
	g: number
	b: number
	a: number
}

function parseColor(value: any): Rgba | null {
	if (typeof value !== 'string') {
		return null
	}
	const s = value.trim()
	const hex = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(s)
	if (hex) {
		let h = hex[1]
		if (h.length === 3) {
			h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
		}
		const r = parseInt(h.slice(0, 2), 16)
		const g = parseInt(h.slice(2, 4), 16)
		const b = parseInt(h.slice(4, 6), 16)
		const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1
		return { r, g, b, a }
	}
	const rgb = /rgba?\(([^)]*)\)/.exec(s)
	if (rgb) {
		const parts = rgb[1].split(',').map((p) => parseFloat(p))
		return { r: parts[0] ?? 0, g: parts[1] ?? 0, b: parts[2] ?? 0, a: parts[3] ?? 1 }
	}
	return null
}

function formatColor(c: Rgba): string {
	const r = Math.round(c.r)
	const g = Math.round(c.g)
	const b = Math.round(c.b)
	const a = Math.round(c.a * 1000) / 1000
	return a >= 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${a})`
}

// ---- Per-property interpolation ---------------------------------------------

function lerp(a: number, b: number, t: number): number {
	return a + (b - a) * t
}

function interpolate(from: any, to: any, t: number): any {
	if (typeof from === 'number' && typeof to === 'number') {
		return lerp(from, to, t)
	}
	const ca = parseColor(from)
	const cb = parseColor(to)
	if (ca && cb) {
		return formatColor({
			r: lerp(ca.r, cb.r, t),
			g: lerp(ca.g, cb.g, t),
			b: lerp(ca.b, cb.b, t),
			a: lerp(ca.a, cb.a, t),
		})
	}
	// Percent translates and unmixable values step at the halfway point,
	// matching CSS abrupt-interpolation for non-interpolable values.
	return t < 0.5 ? from : to
}

/** Merge a keyframe's declarations into a flat value map. */
function keyframeValues(kf: ParsedKeyframe): Partial<SampledValues> {
	const out: Record<string, any> = {}
	for (const d of kf.declarations) {
		out[d.property] = d.value
	}
	return out as Partial<SampledValues>
}

const ANIMATABLE: (keyof SampledValues)[] = [
	'opacity',
	'backgroundColor',
	'translateX',
	'translateY',
	'scaleX',
	'scaleY',
	'rotate',
	'rotateX',
	'rotateY',
	'width',
	'height',
]

/**
 * Sample `info` at `elapsedMs` (ms since play). `done` is true once the last
 * iteration finished; without a forwards fill `values` is then empty.
 */
export function sampleKeyframeAnimation(
	info: KeyframeAnimationInfo,
	elapsedMs: number,
): { values: Partial<SampledValues>; done: boolean } {
	const keyframes = info.keyframes
	const empty = { values: {}, done: true }
	if (!keyframes || keyframes.length === 0 || info.duration <= 0) {
		return empty
	}

	const durationMs = info.duration * 1000
	const total = durationMs * info.iterations
	let t = elapsedMs - info.delay * 1000
	if (t < 0) {
		return { values: {}, done: false }
	}
	if (t >= total) {
		if (!info.isForwards) {
			return empty
		}
		t = total
	}
	// Position within a single iteration, 0..durationMs.
	let local = t % durationMs
	if (t === total) {
		local = durationMs
	}
	if (info.isReverse) {
		local = durationMs - local
	}

	// Per-iteration keyframe times as ms.
	const times = keyframes.map((k) => k.duration * durationMs)
	// Keyframe 0 == 'from': NS substitutes duration 0.01 for a zero-duration
	// step; for sampling a 0% step simply starts the timeline.
	const segStart = (i: number) => (i === 0 ? 0 : Math.max(times[i], 0.01 * durationMs))
	const segEnd = (i: number) => Math.max(times[i] || 0.01 * durationMs, 0.01 * durationMs)

	// Find the segment [start, end] containing `local`. Before the first
	// keyframe time or after the last, hold that keyframe's values.
	if (local <= times[0]) {
		return { values: keyframeValues(keyframes[0]), done: t >= total && info.isForwards }
	}
	if (local >= times[times.length - 1]) {
		return { values: keyframeValues(keyframes[keyframes.length - 1]), done: t >= total }
	}
	let hi = times.findIndex((x) => local <= x)
	if (hi < 0) {
		hi = times.length - 1
	}
	const lo = hi - 1
	const start = segStart(hi) > times[lo] ? times[lo] : times[lo]
	const end = segEnd(hi)
	const span = end - start || 1
	let progress = (local - start) / span
	progress = Math.max(0, Math.min(1, progress))
	// The curve declared on the destination keyframe curves this segment;
	// absent, the animation-level curve applies.
	const curve = keyframes[hi].curve ?? info.curve
	progress = evaluateCurve(curve, progress)

	const fromValues = keyframeValues(keyframes[lo])
	const toValues = keyframeValues(keyframes[hi])
	const values: Partial<SampledValues> = {}
	for (const prop of ANIMATABLE) {
		const to = (toValues as any)[prop]
		if (to === undefined) {
			continue
		}
		const from = (fromValues as any)[prop] ?? to
		;(values as any)[prop] = interpolate(from, to, progress)
	}
	return { values, done: false }
}
