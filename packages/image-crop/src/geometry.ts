import type {
	Crop,
	CropConstraints,
	CropHandle,
	ImageFrame,
	PercentCrop,
	PixelCrop,
	Size,
} from './props'

const positive = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0)
const finite = (n: number) => (Number.isFinite(n) ? n : 0)
const clamp = (n: number, low: number, high: number) =>
	Math.min(Math.max(n, Math.min(low, high)), high)

/** Displayed image rectangle inside a centered contain-fit viewport. */
export function containFrame(view: Size, natural: Size): ImageFrame {
	const scale =
		natural.width > 0 && natural.height > 0
			? Math.min(positive(view.width) / natural.width, positive(view.height) / natural.height)
			: 0

	const width = positive(natural.width * scale),
		height = positive(natural.height * scale)

	return {
		x: (positive(view.width) - width) / 2,
		y: (positive(view.height) - height) / 2,
		width,
		height,
	}
}

export function convertToPixelCrop(crop: Crop, size: Size): PixelCrop {
	const sx = crop.unit === '%' ? positive(size.width) / 100 : 1
	const sy = crop.unit === '%' ? positive(size.height) / 100 : 1
	return {
		unit: 'px',
		x: finite(crop.x) * sx,
		y: finite(crop.y) * sy,
		width: positive(crop.width) * sx,
		height: positive(crop.height) * sy,
	}
}

export function convertToPercentCrop(crop: Crop, size: Size): PercentCrop {
	const p = convertToPixelCrop(crop, size)
	return {
		unit: '%',
		x: size.width > 0 ? (p.x / size.width) * 100 : 0,
		y: size.height > 0 ? (p.y / size.height) * 100 : 0,
		width: size.width > 0 ? (p.width / size.width) * 100 : 0,
		height: size.height > 0 ? (p.height / size.height) * 100 : 0,
	}
}

/** Convert displayed-image coordinates to natural pixels for a separate pixel exporter. */
export function toNaturalCrop(crop: Crop, displayed: Size, natural: Size): PixelCrop {
	const p = convertToPercentCrop(crop, displayed)
	return convertToPixelCrop(p, natural)
}

export function fromNaturalCrop(crop: PixelCrop, natural: Size, displayed: Size): PixelCrop {
	return convertToPixelCrop(convertToPercentCrop(crop, natural), displayed)
}

/** Clamp external controlled input. Impossible minimums yield to bounds/maxima. */
export function constrainCrop(crop: Crop, size: Size, limits: CropConstraints = {}): PixelCrop {
	const p = convertToPixelCrop(crop, size)
	const maxW = Math.min(
		positive(size.width),
		limits.maxWidth === undefined ? Infinity : positive(limits.maxWidth),
	)

	const maxH = Math.min(
		positive(size.height),
		limits.maxHeight === undefined ? Infinity : positive(limits.maxHeight),
	)

	let width = clamp(p.width, positive(limits.minWidth ?? 0), maxW)
	let height = clamp(p.height, positive(limits.minHeight ?? 0), maxH)
	const aspect = positive(limits.aspect ?? 0)
	if (aspect) {
		width = clamp(
			width,
			Math.max(positive(limits.minWidth ?? 0), positive(limits.minHeight ?? 0) * aspect),
			Math.min(maxW, maxH * aspect),
		)

		height = width / aspect
	}

	return {
		unit: 'px',
		x: clamp(p.x, 0, positive(size.width) - width),
		y: clamp(p.y, 0, positive(size.height) - height),
		width,
		height,
	}
}

/** Resize from a frozen gesture origin using cumulative view-space deltas. */
export function dragCrop(
	start: Crop,
	handle: CropHandle,
	dx: number,
	dy: number,
	size: Size,
	limits: CropConstraints = {},
): PixelCrop {
	const p = constrainCrop(start, size, limits)
	dx = finite(dx)
	dy = finite(dy)
	if (handle === 'move') {
		return {
			...p,
			x: clamp(p.x + dx, 0, size.width - p.width),
			y: clamp(p.y + dy, 0, size.height - p.height),
		}
	}

	const west = handle.includes('w'),
		east = handle.includes('e')

	const north = handle.includes('n'),
		south = handle.includes('s')

	// Corners anchor their opposite corner; side handles anchor the opposite
	// edge midpoint under aspect lock, so the other axis expands symmetrically.
	const ax = west ? p.x + p.width : east ? p.x : p.x + p.width / 2
	const ay = north ? p.y + p.height : south ? p.y : p.y + p.height / 2
	const boundW = west ? ax : east ? size.width - ax : 2 * Math.min(ax, size.width - ax)
	const boundH = north ? ay : south ? size.height - ay : 2 * Math.min(ay, size.height - ay)
	const maxW = Math.min(boundW, limits.maxWidth ?? Infinity)
	const maxH = Math.min(boundH, limits.maxHeight ?? Infinity)
	let width = p.width + (west ? -dx : east ? dx : 0)
	let height = p.height + (north ? -dy : south ? dy : 0)
	const aspect = positive(limits.aspect ?? 0)
	if (aspect) {
		if ((!west && !east) || ((north || south) && Math.abs(dy * aspect) > Math.abs(dx))) {
			width = height * aspect
		}

		width = clamp(
			width,
			Math.max(positive(limits.minWidth ?? 0), positive(limits.minHeight ?? 0) * aspect),
			Math.max(0, Math.min(maxW, maxH * aspect)),
		)

		height = width / aspect
	} else {
		width = clamp(width, positive(limits.minWidth ?? 0), Math.max(0, maxW))
		height = clamp(height, positive(limits.minHeight ?? 0), Math.max(0, maxH))
	}

	return {
		unit: 'px',
		x: west ? ax - width : east ? ax : ax - width / 2,
		y: north ? ay - height : south ? ay : ay - height / 2,
		width,
		height,
	}
}
