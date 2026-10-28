export interface ProjectionScale {
	x: number
	y: number
}

const scales = new WeakMap<object, ProjectionScale>()

export function setProjectionScale(view: object, scale: ProjectionScale | null) {
	if (scale) {
		scales.set(view, scale)
	} else {
		scales.delete(view)
	}
}

export function correctProjectionRadii<T extends Record<string, number>>(
	view: object,
	radii: T,
	authored?: Record<string, unknown>,
): T {
	const scale = scales.get(view)
	if (!scale) {
		return radii
	}
	const divisor = Math.sqrt(
		Math.max(0.0001, Math.abs(scale.x)) * Math.max(0.0001, Math.abs(scale.y)),
	)
	return Object.fromEntries(
		Object.entries(radii).map(([key, radius]) => [
			key,
			typeof authored?.[key] === 'string' && String(authored[key]).trim().endsWith('%')
				? radius
				: radius / divisor,
		]),
	) as T
}

export function correctProjectionShadows<
	T extends { dx: number; dy: number; blur: number; spread: number },
>(view: object, shadows: readonly T[]): readonly T[] {
	const scale = scales.get(view)
	if (!scale) {
		return shadows
	}
	const x = Math.max(0.0001, Math.abs(scale.x)),
		y = Math.max(0.0001, Math.abs(scale.y))
	const uniform = Math.sqrt(x * y)
	return shadows.map((shadow) => ({
		...shadow,
		dx: shadow.dx / x,
		dy: shadow.dy / y,
		blur: shadow.blur / uniform,
		spread: shadow.spread / uniform,
	}))
}
