/**
 * Keyframe sampler — GI/AppKit-free. Port of NS 9.1.3
 * `ui/animation/keyframe-animation.js` (`keyframeAnimationFromInfo`,
 * `parseKeyframe`, `animate`) expressed as segment sampling: the segment
 * list NS builds is deterministic, so `sampleKeyframeAnimation` walks it
 * instead of playing sub-animations.
 *
 * Times are milliseconds (NS `timeConverter` returns ms; `keyframes.ts`
 * keeps them ms too).
 *
 * NS semantics reproduced here:
 * - Segment 0 is applied instantly at iteration start (NS `animate(view,0)`
 *   writes keyframe 0's values without animating).
 * - Segment i≥1 animates only the properties keyframe i declares and lasts
 *   `(k_i − k_{i−1}) × duration`. A keyframe at time 0 gets duration 0.01ms
 *   and does not advance `startDuration` (`parseKeyframe` lines in NS).
 * - `reverse` iterates keyframes last→first; each segment's time becomes
 *   `info.duration − duration` (NS parseKeyframe formula).
 * - Forward mode: a curve declared on keyframe i is moved onto the segment
 *   that ends at keyframe i+1 (NS shifts `a2.curve` onto `a1`). Reverse: no
 *   shift. Missing curves fall back to `info.curve`.
 * - One iteration lasts the **sum of segment durations** — a 0–50%–100%
 *   track is not required to sum to the whole `duration`.
 * - Each property animates from its most recent earlier-segment value, or
 *   from the caller's `base` when no earlier segment declared it.
 * - Without forwards fill the sampler returns empty `values` once done.
 */
import {
	evaluateCurve,
	type KeyframeAnimationInfo,
	type ParsedKeyframe,
	type TimingCurve,
} from './keyframes.ts'

import { resolveTranslate, type TranslateAxis } from './transforms.ts'

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
	const hex = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(s)
	if (hex) {
		let h = hex[1]
		if (h.length === 3 || h.length === 4) {
			h = [...h].map((c) => c + c).join('')
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

// ---- Segment model (keyframeAnimationFromInfo + parseKeyframe) --------------

interface Segment {
	/** Segment length in ms (0.01 for a time-0 keyframe, like NS). */
	duration: number
	/** Only the properties declared on this keyframe. */
	values: Record<string, any>
	curve?: TimingCurve
}

/**
 * Build NS's `animations` array for one iteration: per-keyframe segments in
 * order, with the forward-mode curve shift applied (a curve declared on
 * keyframe i lands on segment i+1). `isReverse` flips keyframe order and the
 * duration formula, with no shift.
 */
function buildSegments(info: KeyframeAnimationInfo): Segment[] {
	const keyframes = info.keyframes!
	const animations: Segment[] = []
	let startDuration = 0

	const parseKeyframe = (keyframe: ParsedKeyframe) => {
		const values: Record<string, any> = {}
		for (const d of keyframe.declarations) {
			values[d.property] = d.value
		}
		let duration = keyframe.duration
		if (duration === 0) {
			duration = 0.01
		} else {
			duration = info.duration * duration - startDuration
			startDuration += duration
		}
		animations.push({
			// NS `animation.duration`: the reversed formula applies even to
			// the per-segment length in reverse mode.
			duration: info.isReverse ? info.duration - duration : duration,
			values,
			curve: keyframe.curve,
		})
		return startDuration
	}

	if (info.isReverse) {
		for (let i = keyframes.length - 1; i >= 0; i--) {
			parseKeyframe(keyframes[i])
		}
	} else {
		for (const keyframe of keyframes) {
			parseKeyframe(keyframe)
		}

		// NS: shift each keyframe's declared curve onto the NEXT segment.
		for (let index = animations.length - 1; index > 0; index--) {
			const a1 = animations[index]
			const a2 = animations[index - 1]
			if (a2.curve !== undefined) {
				a1.curve = a2.curve
				a2.curve = undefined
			}
		}
	}
	for (const a of animations) {
		if (!a.curve) {
			a.curve = info.curve
		}
	}
	return animations
}

// ---- Sampling ---------------------------------------------------------------

function lerp(a: number, b: number, t: number): number {
	return a + (b - a) * t
}

function isTranslateProp(prop: string): boolean {
	return prop === 'translateX' || prop === 'translateY'
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
	return t < 0.5 ? from : to
}

export interface SampleOptions {
	/** Values a property animates from when no earlier segment declares it —
	 *  typically the node's current computed/inline value. */
	base?: Partial<SampledValues>
	/** Element box for resolving % translates (iOS resolves at play time).
	 *  Without it, percent values step at the halfway point. */
	box?: { width: number; height: number }
}

/**
 * Sample `info` `elapsedMs` ms after play. `done` is true when the last
 * iteration has finished; without a forwards fill `values` is then empty.
 * With forwards fill the last iteration's final values hold.
 */
export function sampleKeyframeAnimation(
	info: KeyframeAnimationInfo,
	elapsedMs: number,
	opts: SampleOptions = {},
): { values: Partial<SampledValues>; done: boolean } {
	const keyframes = info.keyframes
	if (!keyframes || keyframes.length === 0) {
		return { values: {}, done: true }
	}

	const segments = buildSegments(info)
	// NS `animate(view, 0)` applies segment 0 instantly — its duration is
	// never played, so the timeline is the sum of segments 1..n only.
	const iterationMs = segments.slice(1).reduce((s, seg) => s + seg.duration, 0)
	const totalMs = iterationMs * info.iterations

	let t = elapsedMs - info.delay
	if (t < 0) {
		// Inside the delay: NS plays nothing yet — first keyframe not applied.
		return { values: {}, done: false }
	}
	let done = t >= totalMs
	if (done) {
		if (!info.isForwards) {
			return { values: {}, done: true }
		}

		t = totalMs
	}
	let local = t % iterationMs
	if (done) {
		local = iterationMs
	}

	// Walk segments carrying the running value per property — segment 0
	// applies instantly at iteration start, segment i>0 interpolates over
	// its duration from the property's previous value (earlier segment
	// target or `base`).
	const values: Record<string, any> = {}
	const running: Record<string, any> = {}
	for (const p of Object.keys(segments[0].values)) {
		running[p] = segments[0].values[p]
		values[p] = segments[0].values[p]
	}
	let cursor = 0
	for (const seg of segments.slice(1)) {
		const end = cursor + seg.duration
		const props = Object.keys(seg.values)
		if (local >= end) {
			// Segment fully passed: commit targets.
			for (const p of props) {
				running[p] = seg.values[p]
				values[p] = seg.values[p]
			}
		} else if (local > cursor) {
			// Inside this segment.
			const progress = evaluateCurve(seg.curve, (local - cursor) / seg.duration)
			for (const p of props) {
				const to = seg.values[p]
				let from = running[p] ?? (opts.base as any)?.[p] ?? to
				if (opts.box && isTranslateProp(p)) {
					const basis = p === 'translateX' ? opts.box.width : opts.box.height
					from = resolveTranslate(from, basis)
					values[p] = interpolate(from, resolveTranslate(to as TranslateAxis, basis), progress)
				} else {
					values[p] = interpolate(from, to, progress)
				}

				running[p] = values[p]
			}
		} else {
			// Not reached yet.
			break
		}

		cursor = end
	}
	return { values: values as Partial<SampledValues>, done }
}
