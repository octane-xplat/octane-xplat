import { clamp, lerp } from './math'
import type { Rect } from './math'

/** Interpolate the mounted thumbnails, including sparse strips and overscroll. */
export function thumbnailBox(boxes: ReadonlyMap<number, Rect>, progress: number): Rect | null {
	const indices = [...boxes.keys()].sort((a, b) => a - b)
	if (!indices.length) {
		return null
	}
	let from = indices[0]!
	let to = indices[indices.length - 1]!
	for (const index of indices) {
		if (index <= progress) {
			from = index
		}

		if (index >= progress) {
			to = index
			break
		}
	}
	const a = boxes.get(from)!
	const b = boxes.get(to)!
	const t = from === to ? 0 : clamp((progress - from) / (to - from), 0, 1)
	return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t) }
}

export function createThumbnailLayout<Host>(adapter: {
	measure(host: Host): Rect | null
	place(host: Host, box: Rect): void
	center(box: Rect): void
}): {
	place: (value?: number) => void
	remeasure: () => void
	register: (index: number, host: Host) => () => void
	indicator: (host: Host) => () => void
} {
	const hosts = new Map<number, Host>()
	const boxes = new Map<number, Rect>()
	const indicators = new Set<Host>()
	let progress = 0
	const place = (value = progress): void => {
		progress = value
		const box = thumbnailBox(boxes, progress)
		if (!box) {
			return
		}
		for (const host of indicators) {
			adapter.place(host, box)
		}
		adapter.center(box)
	}
	const remeasure = (): void => {
		boxes.clear()
		for (const [index, host] of hosts) {
			const box = adapter.measure(host)
			if (box && box.w > 0 && box.h > 0) {
				boxes.set(index, box)
			}
		}
		place()
	}
	return {
		place,
		remeasure,
		register(index: number, host: Host) {
			hosts.set(index, host)
			remeasure()
			return () => {
				if (hosts.get(index) !== host) {
					return
				}
				hosts.delete(index)
				remeasure()
			}
		},
		indicator(host: Host) {
			indicators.add(host)
			place()
			return (): void => {
				indicators.delete(host)
			}
		},
	}
}
