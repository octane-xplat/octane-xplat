import type { DelegatedRequest, DelegatedRun } from './host-types'
import { bezierPoints, isBezierEase } from './engine'
import { delegationStats, trackDelegatedRun } from './delegation'
import type { Target } from './types'

// All declarative channels map onto compositor-accelerated WAAPI properties:
// the spatial channels share one transform keyframe pair, opacity animates
// on its own property.
const TRANSFORM_KEYS: (keyof Target)[] = ['x', 'y', 'scale', 'scaleX', 'scaleY', 'rotate']

// Matched function lists make WAAPI interpolate each channel numerically —
// the same order the adapter's write() composes (matrix = T·S·R). The scale
// channel arrives already folded into scaleX/scaleY on the request's `eff`.
const transform = (values: Target) =>
	`translateX(${values.x ?? 0}px) translateY(${values.y ?? 0}px) scaleX(${values.scaleX ?? 1}) scaleY(${values.scaleY ?? 1}) rotate(${values.rotate ?? 0}deg)`

// A computed transform resolves to a matrix composed around transform-origin;
// peel the origin back off so rotation/scale do not leak into x/y. For the
// T·S·R order: a = sx·cos θ, b = sy·sin θ, c = -sx·sin θ, d = sy·cos θ.
function decompose(v: number[], origin: string): Target {
	const [ox, oy] = origin.split(' ').map((part) => Number.parseFloat(part) || 0)
	const [a, b, c, d, e, f] = v.length === 16 ? [v[0], v[1], v[4], v[5], v[12], v[13]] : v
	const scaleX = Math.hypot(a, c)
	const scaleY = Math.hypot(b, d)
	let rotate = scaleX && scaleY ? (Math.atan2(b / scaleY, a / scaleX) * 180) / Math.PI : 0
	if (!Number.isFinite(rotate)) {
		rotate = 0
	}

	let flippedY = scaleY
	// A negative determinant means one axis flipped; folding the sign into
	// scaleY and the angle round-trips the same matrix for every composition.
	if (a * d - b * c < 0) {
		flippedY = -scaleY
		rotate = -rotate
	}

	return {
		x: e + (a - 1) * ox + c * oy,
		y: f + b * ox + (d - 1) * oy,
		scaleX,
		scaleY: flippedY,
		rotate,
	}
}

function readChannels(node: HTMLElement, fallback: Target): Target {
	const computed = getComputedStyle(node)
	const opacity = Number(computed.opacity)
	const base: Target = {
		...fallback,
		opacity: Number.isFinite(opacity) ? opacity : (fallback.opacity ?? 1),
	}

	const match = /matrix(?:3d)?\(([^)]*)\)/.exec(computed.transform)
	if (!match) {
		return computed.transform === 'none'
			? { ...base, x: 0, y: 0, scaleX: 1, scaleY: 1, rotate: 0 }
			: base
	}

	const values = match[1].split(',').map(Number.parseFloat)
	return values.every(Number.isFinite)
		? { ...base, ...decompose(values, computed.transformOrigin) }
		: base
}

function waapiRun(
	node: HTMLElement,
	req: DelegatedRequest,
	write: (t: Target) => void,
): DelegatedRun | null {
	if (typeof node.animate !== 'function') {
		return null
	}

	const { target, eff, transition: t } = req
	const animatesTransform = TRANSFORM_KEYS.some((key) => target[key] !== undefined)
	if (!animatesTransform && target.opacity === undefined) {
		return null
	}

	// Explicit keyframe pairs keep the interpolation in matched-list mode; an
	// implicit "from" resolves to a matrix and would lose rotate windings.
	let last = readChannels(node, { opacity: 1, x: 0, y: 0, scaleX: 1, scaleY: 1, rotate: 0 })
	const frames: Keyframe[] = [{}, {}]
	if (animatesTransform) {
		frames[0].transform = transform(last)
		frames[1].transform = transform(eff)
	}

	if (target.opacity !== undefined) {
		frames[0].opacity = last.opacity ?? 1
		frames[1].opacity = Math.min(1, Math.max(0, eff.opacity ?? 1))
	}

	const [x1, y1, x2, y2] = bezierPoints(t.ease)
	let animation: Animation
	try {
		animation = node.animate(frames, {
			duration: (t.duration ?? 0.3) * 1000,
			delay: (t.delay ?? 0) * 1000,
			easing: `cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})`,
			fill: 'forwards',
		})
	} catch {
		return null
	}

	const sample = (): Target => {
		last = readChannels(node, last)
		return { ...last }
	}

	let resolve!: (result: 'finished' | 'cancelled') => void
	const finished = new Promise<'finished' | 'cancelled'>((done) => {
		resolve = done
	})

	let settled = false
	const settle = (result: 'finished' | 'cancelled') => {
		if (!settled) {
			settled = true
			resolve(result)
		}
	}

	// The platform run owns presentation; sample() reads the composited state.
	// On finish the destination is committed to the base styles before the
	// fill is released, so later adapter writes still apply.
	const complete = () => {
		write(req.dest)
		settle('finished')
		animation.cancel()
	}

	const cancelled = () => settle('cancelled')
	if (typeof animation.finished?.then === 'function') {
		// finished rejects with AbortError on cancel — observed here.
		void animation.finished.then(complete, cancelled)
	} else {
		animation.onfinish = complete
		animation.oncancel = cancelled
	}

	return {
		finished,
		sample,
		cancel() {
			// Cancel reverts the element to its base styles synchronously, so the
			// presentation is sampled first and the adapter write holds the
			// frozen values for the next run's "from" keyframe.
			const current = sample()
			animation.cancel()
			write(current)
			settle('cancelled')
		},
	}
}

// Mirrors the native delegatedRun contract: cubic-bezier eases only, null on
// any missing capability so the caller stays on the JS engine.
export function delegatedRun(
	node: HTMLElement,
	req: DelegatedRequest,
	write: (t: Target) => void,
): DelegatedRun | null {
	if (!isBezierEase(req.transition.ease)) {
		delegationStats().fallback++
		return null
	}

	const run = waapiRun(node, req, write)
	if (!run) {
		delegationStats().fallback++
		return null
	}

	return trackDelegatedRun(run)
}
