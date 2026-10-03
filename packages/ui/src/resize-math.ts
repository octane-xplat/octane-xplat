import type { ResizablePercentSize, ResizablePixelSize, ResizableSize } from './props'

/**
 * Resizable size math — 1:1 port of Astryx's parse/toPixels/clamp helpers.
 * Pixel and percentage size constructors plus the basis-resolving and
 * clamping used by the hook.
 */

/** An exact pixel/dip size — `pixel(240)`. */
export function pixel(value: number): ResizablePixelSize {
	return { type: 'pixel', value }
}

/** A percentage with exactly one pixel bound — `percent(50, {min: pixel(200)})`
 *  means 50% of the basis, not below 200px. Throws on out-of-range or
 *  conflicting inputs like upstream. */
export function percent(
	value: number,
	constraint: { min: ResizablePixelSize } | { max: ResizablePixelSize },
): ResizablePercentSize {
	if (!Number.isFinite(value) || value < 0 || value > 100) {
		throw new Error(`percent(): value must be a number in [0, 100], received ${String(value)}`)
	}

	if (!constraint || 'min' in constraint === 'max' in constraint) {
		throw new Error('percent(): supply exactly one of { min: pixel(px) } or { max: pixel(px) }')
	}

	const bound = 'min' in constraint ? constraint.min : constraint.max
	if (bound.type !== 'pixel' || !Number.isFinite(bound.value) || bound.value < 0) {
		throw new Error('percent(): the bound must be pixel(px) with a non-negative finite number')
	}

	return 'min' in constraint
		? { type: 'percent', value, min: bound }
		: { type: 'percent', value, max: bound }
}

export function isPixelSize(v: unknown): v is ResizablePixelSize {
	return typeof v === 'object' && v !== null && (v as any).type === 'pixel'
}

export function isPercentSize(v: unknown): v is ResizablePercentSize {
	return typeof v === 'object' && v !== null && (v as any).type === 'percent'
}

/**
 * Resolve a ResizableSize to a pixel value.
 * @param basis The pixel size of the reference container/viewport, used for
 *   percentage sizes and bounds. Returns null when the size cannot resolve.
 */
export function toPixels(size: ResizableSize | undefined, basis: number): number | null {
	if (size == null) {
		return null
	}

	if (typeof size === 'number') {
		return size
	}

	if (typeof size === 'string') {
		const trimmed = size.trim()
		if (trimmed.endsWith('px')) {
			const n = parseFloat(trimmed)
			return Number.isFinite(n) ? n : null
		}

		if (trimmed.endsWith('%')) {
			const pct = parseFloat(trimmed)
			return Number.isFinite(pct) ? (pct / 100) * basis : null
		}

		const n = parseFloat(trimmed)
		return Number.isFinite(n) ? n : null
	}

	if (isPixelSize(size)) {
		return size.value
	}

	if (isPercentSize(size)) {
		const px = (size.value / 100) * basis
		if ('min' in size && size.min) {
			return Math.max(px, size.min.value)
		}

		if ('max' in size && size.max) {
			return Math.min(px, size.max.value)
		}

		return px
	}

	return null
}

/** Clamp a size to [min, max] then snap to the nearest configured snap
 *  point. Snaps always win — the panel can only rest at snap values. */
export function clampSize(
	size: number,
	minPx: number,
	maxPx: number,
	snaps: readonly number[],
): number {
	const clamped = Math.max(minPx, Math.min(size, maxPx))
	if (snaps.length === 0) {
		return clamped
	}

	let nearest = snaps[0]
	let dist = Math.abs(clamped - snaps[0])
	for (let i = 1; i < snaps.length; i++) {
		const d = Math.abs(clamped - snaps[i])
		if (d < dist) {
			dist = d
			nearest = snaps[i]
		}
	}

	return nearest
}
