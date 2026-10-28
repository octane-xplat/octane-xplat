import type { SliderProps } from './props'
export type SliderValue = number | [number, number]
export interface SliderLimits { min: number; max: number; step: number }
export function sliderLimits(props: SliderProps): SliderLimits {
	const low = props.min ?? props.minValue ?? 0, high = props.max ?? props.maxValue ?? 100
	const min = Number.isFinite(low) ? low : 0
	return { min, max: Number.isFinite(high) ? Math.max(min, high) : Math.max(min, 100), step: Number.isFinite(props.step) && props.step! > 0 ? props.step! : 0 }
}
const clamp = (value: number, { min, max }: SliderLimits) => Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min
export function sliderValue(value: SliderValue, limits: SliderLimits): SliderValue {
	if (!Array.isArray(value)) return clamp(value, limits)
	const a = clamp(value[0], limits), b = clamp(value[1], limits)
	return [Math.min(a, b), Math.max(a, b)]
}
export function sliderRatio(value: number, limits: SliderLimits): number {
	return limits.max === limits.min ? 0 : (clamp(value, limits) - limits.min) / (limits.max - limits.min)
}
export function moveSlider(value: SliderValue, thumb: 0 | 1, proposed: number, limits: SliderLimits): SliderValue {
	if (!Number.isFinite(proposed)) return value
	// Match the current web leaf's zero-origin step grid; clamp after snapping.
	const next = clamp(limits.step > 0 ? Math.round(proposed / limits.step) * limits.step : proposed, limits)
	if (!Array.isArray(value)) return next
	return thumb === 0 ? [Math.min(next, value[1]), value[1]] : [value[0], Math.max(next, value[0])]
}
export function sameSliderValue(a: SliderValue, b: SliderValue): boolean {
	return Array.isArray(a) && Array.isArray(b) ? a[0] === b[0] && a[1] === b[1] : a === b
}
export function sliderKey(key: string, value: number, limits: SliderLimits): number | undefined {
	const delta = limits.step || (limits.max - limits.min) / 100
	switch (key) {
		case 'ArrowRight': case 'ArrowUp': return value + delta
		case 'ArrowLeft': case 'ArrowDown': return value - delta
		case 'Home': return limits.min
		case 'End': return limits.max
		default: return undefined
	}
}
