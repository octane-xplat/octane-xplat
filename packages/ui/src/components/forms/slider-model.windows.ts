import type { SliderProps } from '../../props'

export type SliderBounds = {
	min: number
	max: number
	step: number
}

export type SliderValue = number | [number, number]
export type SliderThumb = 'lower' | 'upper'

export function sliderBounds(props: SliderProps): SliderBounds {
	const requestedMin = props.min ?? props.minValue ?? 0
	const requestedMax = props.max ?? props.maxValue ?? 100
	const min = Number.isFinite(requestedMin) ? requestedMin : 0
	const max = Number.isFinite(requestedMax) ? Math.max(min, requestedMax) : min
	const step = props.step != null && Number.isFinite(props.step) && props.step > 0 ? props.step : 0
	return { min, max, step }
}

export function normalizeSliderValue(
	value: SliderValue | undefined,
	min: number,
	max: number,
): SliderValue {
	const clamp = (n: number, fallback: number) =>
		Math.min(max, Math.max(min, Number.isFinite(n) ? n : fallback))
	if (!Array.isArray(value)) {
		return clamp(value ?? min, min)
	}

	const a = clamp(value[0], min)
	const b = clamp(value[1], max)
	return [Math.min(a, b), Math.max(a, b)]
}

export function moveSliderThumb(
	value: SliderValue,
	thumb: SliderThumb,
	requested: number,
	bounds: ReturnType<typeof sliderBounds>,
): SliderValue {
	if (!Number.isFinite(requested)) {
		return value
	}

	const { min, max, step } = bounds
	const snapped = step > 0 ? min + Math.round((requested - min) / step) * step : requested
	// Avoid ordinary decimal-step drift; preserve continuous requests without rounding.
	const next = Math.min(max, Math.max(min, step > 0 ? Number(snapped.toPrecision(15)) : snapped))
	if (!Array.isArray(value)) {
		return next
	}

	return thumb === 'lower'
		? [Math.min(next, value[1]), value[1]]
		: [value[0], Math.max(next, value[0])]
}

export function sameSliderValue(a: SliderValue, b: SliderValue): boolean {
	return Array.isArray(a) && Array.isArray(b) ? a[0] === b[0] && a[1] === b[1] : a === b
}

/** Decode Core's native touch methods without treating pan translation as a local position. */
export function sliderTouch(event: unknown): {
	action: unknown
	x: number | undefined
} | null {
	if (event == null || typeof event !== 'object' || !('action' in event)) {
		return null
	}

	const x =
		'getX' in event && typeof event.getX === 'function'
			? event.getX()
			: 'x' in event
				? event.x
				: undefined
	return { action: event.action, x: typeof x === 'number' && Number.isFinite(x) ? x : undefined }
}
