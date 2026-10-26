/**
 * Keyframe-animation declaration parsing — port of NS 9.1.3
 * `ui/styling/css-animation-parser.js` against the vendored engine's
 * declaration records. AppKit-free so Node tests and the GTK renderer
 * share it.
 *
 * Curve values are data (`TimingCurve`), not platform objects — samplers
 * evaluate them via `evaluateCurve`.
 */
import { transformConverter } from './transforms.ts'

export type TimingCurve =
	| { type: 'named'; name: 'ease' | 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring' }
	| { type: 'bezier'; x1: number; y1: number; x2: number; y2: number }

export interface KeyframeDecl {
	property: string
	value: any
}

/** One `@keyframes` step after parsing — `duration` is the fraction 0–1. */
export interface ParsedKeyframe {
	duration: number
	declarations: KeyframeDecl[]
	curve?: TimingCurve
}

/** NS `KeyframeAnimationInfo` — what a matched `animation*` rule describes. */
export interface KeyframeAnimationInfo {
	name: string
	duration: number
	delay: number
	iterations: number
	curve: TimingCurve
	isForwards: boolean
	isReverse: boolean
	keyframes?: ParsedKeyframe[]
}

function newInfo(): KeyframeAnimationInfo {
	return {
		name: '',
		duration: 0.3,
		delay: 0,
		iterations: 1,
		curve: { type: 'named', name: 'ease' },
		isForwards: false,
		isReverse: false,
	}
}

const NAMED_CURVES = new Set(['ease', 'linear', 'ease-in', 'ease-out', 'ease-in-out', 'spring'])

/** NS `timeConverter` (`converters.js`): milliseconds. `0.3s` → 300;
 *  `300ms` → 300; bare `0.3` → 0.3ms (the upstream quirk — NS's default
 *  duration 0.3 is equally tiny, matching upstream). */
function timeConverter(value: string): number {
	let result = parseFloat(value)
	if (isNaN(result) || !isFinite(result)) {
		return 0
	}
	if (!String(value).includes('ms')) {
		result = result * 1000
	}
	return Math.max(0.0, Math.min(10000, result))
}

function clamp01(n: number): number {
	return n < 0 ? 0 : n > 1 ? 1 : n
}

/** NS `animationTimingFunctionConverter` — named curves + cubic-bezier. */
export function animationTimingFunctionConverter(value: string): TimingCurve {
	if (!value) {
		return { type: 'named', name: 'ease' }
	}
	if (NAMED_CURVES.has(value)) {
		return { type: 'named', name: value as any }
	}
	const coordsString = /\((.*?)\)/.exec(value)
	const coords = coordsString && coordsString[1].split(',').map((s) => clamp01(parseFloat(s)))
	if (value.startsWith('cubic-bezier') && coords && coords.length === 4) {
		return { type: 'bezier', x1: coords[0], y1: coords[1], x2: coords[2], y2: coords[3] }
	}
	throw new Error(`Invalid value for animation: ${value}`)
}

const ANIMATION_PROPERTY_HANDLERS: Record<string, (info: KeyframeAnimationInfo, value: any) => void> = {
	'animation-name': (info, value) => (info.name = String(value).replace(/['"]/g, '')),
	'animation-duration': (info, value) => (info.duration = timeConverter(String(value))),
	'animation-delay': (info, value) => (info.delay = timeConverter(String(value))),
	'animation-timing-function': (info, value) => (info.curve = animationTimingFunctionConverter(String(value))),
	'animation-iteration-count': (info, value) =>
		(info.iterations = value === 'infinite' ? Number.POSITIVE_INFINITY : parseFloat(value)),
	'animation-direction': (info, value) => (info.isReverse = value === 'reverse'),
	'animation-fill-mode': (info, value) => (info.isForwards = value === 'forwards' || value === 'both'),
}

export function isAnimationDeclaration(property: string): boolean {
	return property === 'animation' || property.startsWith('animation-')
}

/** NS `keyframeAnimationsFromCSSProperty` — the `animation` shorthand. */
function keyframeAnimationsFromCSSProperty(value: any, animations: KeyframeAnimationInfo[]) {
	if (typeof value !== 'string' || value.trim().length === 0) {
		return
	}
	// Whitespace/commas split except inside parens (cubic-bezier).
	const VALUE_SPLIT_RE = /\s(?![^(]*\))/
	const MULTIPLE_SPLIT_RE = /,(?![^(]*\))/
	const isTime = (v: string) => !!v.match(/\dm?s$/g)
	const isTimingFunction = (v: string) => !!v.match(/ease|linear|ease-in|ease-out|ease-in-out|spring|cubic-bezier/g)
	const isIterationCount = (v: string) => !!v.match(/infinite|[\d.]+$/g)
	const isDirection = (v: string) => !!v.match(/normal|reverse|alternate|alternate-reverse/g)
	const isFillMode = (v: string) => !!v.match(/none|forwards|backwards|both/g)
	const isPlayState = (v: string) => !!v.match(/running|paused/g)

	for (const parsedValue of value.split(MULTIPLE_SPLIT_RE)) {
		const info = newInfo()
		const parts = parsedValue.trim().split(VALUE_SPLIT_RE)
		const [duration, delay] = parts.filter(isTime)
		const [timing] = parts.filter(isTimingFunction)
		const [iterationCount] = parts.filter(isIterationCount)
		const [direction] = parts.filter(isDirection)
		const [fillMode] = parts.filter(isFillMode)
		const [playState] = parts.filter(isPlayState)
		const [name] = parts.filter(
			(v) => ![duration, delay, timing, iterationCount, direction, fillMode, playState].filter(Boolean).includes(v),
		)
		if (duration) {
		ANIMATION_PROPERTY_HANDLERS['animation-duration'](info, duration)
	}
		if (delay) {
		ANIMATION_PROPERTY_HANDLERS['animation-delay'](info, delay)
	}
		if (timing) {
		ANIMATION_PROPERTY_HANDLERS['animation-timing-function'](info, timing)
	}
		if (iterationCount) {
		ANIMATION_PROPERTY_HANDLERS['animation-iteration-count'](info, iterationCount)
	}
		if (direction) {
		ANIMATION_PROPERTY_HANDLERS['animation-direction'](info, direction)
	}
		if (fillMode) {
		ANIMATION_PROPERTY_HANDLERS['animation-fill-mode'](info, fillMode)
	}
		if (playState) {
			// NS: play state parsed but not implemented.
		}
		if (name) {
		ANIMATION_PROPERTY_HANDLERS['animation-name'](info, name)
	}
		animations.push(info)
	}
}

/** NS `keyframeAnimationsFromCSSDeclarations` — one ruleset's declarations
 *  produce the animation infos for the node that matched it. */
export function keyframeAnimationsFromCSSDeclarations(
	declarations: { property: string; value: any }[] | null | undefined,
): KeyframeAnimationInfo[] | undefined {
	if (!declarations) {
		return undefined
	}
	const animations: KeyframeAnimationInfo[] = []
	let info: KeyframeAnimationInfo | undefined
	for (const { property, value } of declarations) {
		if (property === 'animation') {
			keyframeAnimationsFromCSSProperty(value, animations)
			info = undefined
		} else {
			const handler = ANIMATION_PROPERTY_HANDLERS[property]
			if (handler) {
				if (info === undefined) {
					info = newInfo()
					animations.push(info)
				}
				handler(info, value)
			}
		}
	}
	return animations.length === 0 ? undefined : animations
}

/** Convert one keyframe declaration value into the sampler vocabulary. */
function convertKeyframeValue(property: string, value: any): any {
	const text = String(value).trim()
	switch (property) {
		case 'opacity':
			return parseFloat(text)
		case 'width':
		case 'height':
		case 'translateX':
		case 'translateY': {
			const percent = /^([+-]?(?:\d+\.?\d*|\.\d+))%$/.exec(text)
			if (percent) {
				return property.startsWith('translate') ? { value: Number(percent[1]) / 100, unit: '%' } : NaN
			}
			const m = /^([+-]?(?:\d+\.?\d*|\.\d+))(px|dip|pt)?$/.exec(text)
			return m ? Number(m[1]) : NaN
		}
		default:
			return text
	}
}

/** NS `parseKeyframeDeclarations` reduced to the animatable vocabulary:
 *  opacity, background-color, width/height, and `transform` (through the
 *  ported transformConverter, flattened to translate/rotate/scale axes). */
export function parseKeyframeDeclarations(
	unparsed: { property: string; value: any }[],
): KeyframeDecl[] {
	const out: Record<string, any> = {}
	for (const { property, value } of unparsed) {
		switch (property) {
			case 'opacity':
			case 'backgroundColor':
			case 'background-color':
			case 'width':
			case 'height': {
				const name = property === 'background-color' ? 'backgroundColor' : property
				out[name] = convertKeyframeValue(name, value)
				break
			}
			case 'transform': {
				const t = transformConverter(String(value))
				Object.assign(out, {
					translateX: t.translate.x,
					translateY: t.translate.y,
					scaleX: t.scale.x,
					scaleY: t.scale.y,
					rotate: t.rotate.z,
					rotateX: t.rotate.x,
					rotateY: t.rotate.y,
				})
				break
			}
		}
	}
	return Object.keys(out).map((property) => ({ property, value: out[property] }))
}

/** NS `keyframesArrayFromCSS` — vendored `Keyframes.keyframes` records
 *  (`{ values: ['0%','100%'], declarations: [...] }` per block) sorted by time. */
export function keyframesArrayFromCSS(
	keyframes: { values: string[]; declarations: { property: string; value: any }[] }[],
): ParsedKeyframe[] {
	const parsedKeyframes: Record<number, ParsedKeyframe> = {}
	for (const keyframe of keyframes) {
		const declarations = parseKeyframeDeclarations(keyframe.declarations as any)
		for (const raw of keyframe.values) {
			let time: any = raw
			if (time === 'from') {
				time = 0
			} else if (time === 'to') {
				time = 1
			} else {
				time = parseFloat(time) / 100
				if (time < 0) {
					time = 0
				}
				if (time > 100) {
					time = 100
				}
			}
			let current = parsedKeyframes[time]
			if (current === undefined) {
				current = { duration: time, declarations: [] }
				parsedKeyframes[time] = current
			}
			for (const declaration of keyframe.declarations) {
				if ((declaration as any).property === 'animation-timing-function') {
					current.curve = animationTimingFunctionConverter(String((declaration as any).value))
				}
			}
			current.declarations = current.declarations.concat(declarations)
		}
	}
	return Object.values(parsedKeyframes).sort((a, b) => a.duration - b.duration)
}

// ---- Timing curves ---------------------------------------------------------

const NAMED_BEZIER: Record<string, [number, number, number, number]> = {
	ease: [0.25, 0.1, 0.25, 1],
	'ease-in': [0.42, 0, 1, 1],
	'ease-out': [0, 0, 0.58, 1],
	'ease-in-out': [0.42, 0, 0.58, 1],
	spring: [0.5, 1.1, 0.4, 0.9],
}

function cubicBezier(p1x: number, p1y: number, p2x: number, p2y: number) {
	const ax = 1 - 3 * p2x + 3 * p1x
	const bx = 3 * p2x - 6 * p1x
	const cx = 3 * p1x
	const ay = 1 - 3 * p2y + 3 * p1y
	const by = 3 * p2y - 6 * p1y
	const cy = 3 * p1y
	const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t
	const sampleY = (t: number) => ((ay * t + by) * t + cy) * t
	const sampleDerivX = (t: number) => (3 * ax * t + 2 * bx) * t + cx
	return (x: number): number => {
		let t = x
		for (let i = 0; i < 8; i++) {
			const err = sampleX(t) - x
			if (Math.abs(err) < 1e-6) {
				return sampleY(t)
			}
			const d = sampleDerivX(t)
			if (Math.abs(d) < 1e-6) {
				break
			}
			t -= err / d
		}
		if (t < 0) {
			t = 0
		}
		if (t > 1) {
			t = 1
		}
		return sampleY(t)
	}
}

const bezierCache = new Map<string, (x: number) => number>()

/** Evaluate a TimingCurve at progress x∈[0,1]. */
export function evaluateCurve(curve: TimingCurve | undefined, x: number): number {
	if (!curve) {
		return x
	}
	if (curve.type === 'named') {
		if (curve.name === 'linear') {
			return x
		}
		const pts = NAMED_BEZIER[curve.name]
		if (!pts) {
			return x
		}
		const key = curve.name
		let f = bezierCache.get(key)
		if (!f) {
			f = cubicBezier(pts[0], pts[1], pts[2], pts[3])
			bezierCache.set(key, f)
		}
		return f(x)
	}
	const key = `b${curve.x1},${curve.y1},${curve.x2},${curve.y2}`
	let f = bezierCache.get(key)
	if (!f) {
		f = cubicBezier(curve.x1, curve.y1, curve.x2, curve.y2)
		bezierCache.set(key, f)
	}
	return f(x)
}
