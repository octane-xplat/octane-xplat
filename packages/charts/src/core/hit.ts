import type { ChartHit } from '../props'
import { defaultFormat } from './axes'
import type { ChartScene } from './scene'

export interface SceneHit extends ChartHit {
	/** Datum anchor in chart space — tooltip/crosshair position. */
	px: number
	py: number
}

/** Touch slop — how far outside the plot a pointer may sit and still hit.
 *  Also the nearest-point distance gate for scatter. */
export const HIT_SLOP = 24

/** Map a chart-space pointer position to the nearest datum. Cartesian charts
 *  snap to the nearest x group, then pick the closest point inside it —
 *  scatter gates on pointer distance instead of always snapping. Pie hits
 *  resolve by ring + angle. Coordinates outside the plot (+slop) miss. */
export function hitTest(scene: ChartScene, x: number, y: number, slop = HIT_SLOP): SceneHit | null {
	if (scene.pie) {
		return pieHit(scene, x, y, slop)
	}

	const { plot, points } = scene
	if (!points.length) {
		return null
	}

	if (
		x < plot.x - slop ||
		x > plot.x + plot.width + slop ||
		y < plot.y - slop ||
		y > plot.y + plot.height + slop
	) {
		return null
	}

	const centers = new Map<string, number>()
	for (const p of points) {
		const cur = centers.get(p.key)
		centers.set(p.key, cur === undefined ? p.cx : (cur + p.cx) / 2)
	}

	let key: string | null = null
	let keyDist = Infinity
	for (const [k, cx] of centers) {
		const d = Math.abs(cx - x)
		if (d < keyDist) {
			keyDist = d
			key = k
		}
	}

	if (key === null) {
		return null
	}

	let best: SceneHit | null = null
	let bestDist = Infinity
	for (const p of points) {
		if (p.key !== key) {
			continue
		}

		const d = Math.hypot(p.cx - x, p.cy - y)
		if (d < bestDist) {
			bestDist = d
			best = { series: p.series, index: p.index, x: p.x, y: p.y, px: p.cx, py: p.cy }
		}
	}

	// Scatter is a point cloud, not a snapped axis — miss when nothing is
	// actually near the pointer.
	if (best && scene.type === 'scatter' && bestDist > slop) {
		return null
	}

	return best
}

function pieHit(scene: ChartScene, x: number, y: number, slop: number): SceneHit | null {
	const pie = scene.pie!
	const dx = x - pie.cx
	const dy = y - pie.cy
	const r = Math.hypot(dx, dy)
	if (r < pie.rInner - slop || r > pie.rOuter + slop) {
		return null
	}

	// d3 pie angles run clockwise from 12 o'clock in y-down space:
	// θ = atan2(dx, −dy) normalized into [0, 2π).
	const angle = (Math.atan2(dx, -dy) + Math.PI * 2) % (Math.PI * 2)
	const slice = pie.slices.find((s) => angle >= s.startAngle && angle < s.endAngle)
	if (!slice) {
		return null
	}

	return {
		series: slice.series,
		index: slice.index,
		x: slice.label,
		y: slice.value,
		px: slice.cx,
		py: slice.cy,
	}
}

export type ScrubPhase = 'down' | 'move' | 'up' | 'cancel' | 'hover' | 'leave' | 'tap'

export interface ScrubProps {
	tooltip?: boolean
	crosshair?: boolean
	onPress?: (hit: ChartHit) => void
	onScrub?: (hit: ChartHit | null) => void
}

/** Shared gesture → cursor state machine. Both leaves normalize their pointer
 *  source (DOM pointer/click events, NS `touch`+`tap`) to phases and call
 *  this; hit math stays identical across targets. `move` while pressed
 *  scrubs and fires `onScrub`; `hover` (web-only, unpressed move) moves the
 *  cursor without scrubbing; `up` ends the scrub and persists the cursor;
 *  `tap` is a completed press — fires `onPress` and updates the cursor;
 *  `cancel`/`leave` clear. `onPress` lives only on `tap` so NS's tap
 *  recognizer and the web click both reach it exactly once. */
export function createScrub(
	getScene: () => ChartScene | null,
	getProps: () => ScrubProps,
	setCursor: (hit: SceneHit | null) => void,
): (phase: ScrubPhase, x: number, y: number) => void {
	let downAt: { x: number; y: number; t: number } | null = null
	return (phase, x, y) => {
		const scene = getScene()
		const props = getProps()
		const showCursor = props.tooltip === true || props.crosshair === true
		switch (phase) {
			case 'down': {
				downAt = { x, y, t: Date.now() }
				const hit = scene && showCursor ? hitTest(scene, x, y) : null
				setCursor(hit)
				if (hit) {
					props.onScrub?.(hit)
				}

				break
			}
			case 'move': {
				if (!downAt) {
					break
				}

				const hit = scene && showCursor ? hitTest(scene, x, y) : null
				setCursor(hit)
				props.onScrub?.(hit)
				break
			}
			case 'hover': {
				if (downAt) {
					break
				}

				setCursor(scene && showCursor ? hitTest(scene, x, y) : null)
				break
			}
			case 'up': {
				downAt = null
				setCursor(scene ? hitTest(scene, x, y) : null)
				props.onScrub?.(null)
				break
			}
			case 'tap': {
				downAt = null
				const hit = scene ? hitTest(scene, x, y) : null
				setCursor(hit)
				if (hit) {
					props.onPress?.(hit)
				}

				break
			}
			case 'cancel':
			case 'leave': {
				downAt = null
				setCursor(null)
				props.onScrub?.(null)
				break
			}
		}
	}
}

/** Tooltip body for a hit — series name + formatted y for cartesian charts,
 *  slice label + value for pie. */
export function hitLabel(scene: ChartScene, hit: ChartHit): string {
	if (scene.pie) {
		const slice = scene.pie.slices.find((s) => s.series === hit.series && s.index === hit.index)
		return slice ? `${slice.label}: ${defaultFormat(slice.value)}` : defaultFormat(hit.y)
	}

	const name = scene.series[hit.series]?.name ?? String(hit.series)
	return `${name}: ${defaultFormat(hit.y)}`
}
