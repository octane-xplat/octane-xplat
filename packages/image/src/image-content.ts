import type {
	ImageContentFit,
	ImageContentPosition,
	ImageContentPositionObject,
	ImageContentPositionValue,
	ImageSourceLike,
} from './props'

/** VENDORED from packages/ui/src/image-content.ts — keep in sync.
 *  Shared `contentFit`/`contentPosition` + multi-source math for `Image` —
 *  pure functions used by every leaf (docs/notes/expo-image-study.md L7/L8).
 *  Semantics mirror CSS `object-fit`/`object-position`, which is also
 *  expo-image's contract: the leaves compute the drawn-content rect
 *  themselves instead of delegating to platform scaleType/contentMode,
 *  so all platforms get the same answer.
 *
 *  The default fit is 'cover' everywhere (the expo/RN default). Today's
 *  platform defaults disagree — web <img> is 'fill' and NS stretch is
 *  'aspectFit' — so an un-propped Image was silently divergent. */

export const DEFAULT_CONTENT_FIT: ImageContentFit = 'cover'

export function resolveContentFit(fit?: ImageContentFit): ImageContentFit {
	return fit ?? DEFAULT_CONTENT_FIT
}

/** expo-image's keyword shorthands; the object form positions relative to
 *  any corner pair ({top,left}, {top,right}, {bottom,left}, {bottom,right}). */
const POSITION_KEYWORDS: Record<string, ImageContentPositionObject> = {
	center: { top: '50%', left: '50%' },
	top: { top: 0, left: '50%' },
	right: { top: '50%', right: 0 },
	bottom: { bottom: 0, left: '50%' },
	left: { top: '50%', left: 0 },
	'top center': { top: 0, left: '50%' },
	'top right': { top: 0, right: 0 },
	'top left': { top: 0, left: 0 },
	'right center': { top: '50%', right: 0 },
	'right top': { top: 0, right: 0 },
	'right bottom': { bottom: 0, right: 0 },
	'bottom center': { bottom: 0, left: '50%' },
	'bottom right': { bottom: 0, right: 0 },
	'bottom left': { bottom: 0, left: 0 },
	'left center': { top: '50%', left: 0 },
	'left top': { top: 0, left: 0 },
	'left bottom': { bottom: 0, left: 0 },
}

export function resolveContentPosition(
	position?: ImageContentPosition,
): ImageContentPositionObject {
	if (typeof position === 'string') {
		return POSITION_KEYWORDS[position] ?? POSITION_KEYWORDS.center
	}

	return position ?? POSITION_KEYWORDS.center
}

type AxisValue = { percent: number } | { dips: number }

function parseAxisValue(value: ImageContentPositionValue | undefined): AxisValue | null {
	if (value == null) {
		return null
	}

	if (typeof value === 'number') {
		return { dips: value }
	}

	const text = String(value).trim()
	if (text === 'center') {
		return { percent: 50 }
	}

	if (text.endsWith('%')) {
		const parsed = Number.parseFloat(text)
		return Number.isNaN(parsed) ? null : { percent: parsed }
	}

	const parsed = Number.parseFloat(text)
	return Number.isNaN(parsed) ? null : { dips: parsed }
}

/** Offset of the drawn content's start edge inside the view along one axis.
 *  expo-image `calcTranslation`: percentages run over the free space
 *  (view − content), absolute dips measure from the named edge, and the
 *  reverse edge (right/bottom) counts back from the far side. */
export function contentAxisOffset(
	viewSize: number,
	contentSize: number,
	start: ImageContentPositionValue | undefined,
	end: ImageContentPositionValue | undefined,
): number {
	const from = parseAxisValue(start)
	if (from) {
		return 'percent' in from ? (from.percent / 100) * (viewSize - contentSize) : from.dips
	}

	const to = parseAxisValue(end)
	if (to) {
		return 'percent' in to
			? (1 - to.percent / 100) * (viewSize - contentSize)
			: viewSize - contentSize - to.dips
	}

	return (viewSize - contentSize) / 2
}

function centeredAxis(
	start: ImageContentPositionValue | undefined,
	end: ImageContentPositionValue | undefined,
): boolean {
	const from = parseAxisValue(start)
	if (from) {
		return 'percent' in from && from.percent === 50
	}

	const to = parseAxisValue(end)
	if (to) {
		return 'percent' in to && to.percent === 50
	}

	return true
}

export function isCenteredContentPosition(position: ImageContentPositionObject): boolean {
	return (
		centeredAxis(position.left, position.right) && centeredAxis(position.top, position.bottom)
	)
}

/** The rect the bitmap occupies inside the view box, in the same units the
 *  caller measures with (native: dips; web: CSS px via object-fit anyway —
 *  only the native leaf calls this). Every length unit is dips except the
 *  intrinsic size, which the leaf must supply in dips too. */
export function contentRect(
	fit: ImageContentFit,
	position: ImageContentPositionObject,
	viewWidth: number,
	viewHeight: number,
	imageWidth: number,
	imageHeight: number,
): { x: number; y: number; width: number; height: number } {
	let width: number
	let height: number
	switch (fit) {
		case 'fill':
			width = viewWidth
			height = viewHeight
			break
		case 'cover': {
			const scale = Math.max(viewWidth / imageWidth, viewHeight / imageHeight)
			width = imageWidth * scale
			height = imageHeight * scale
			break
		}
		case 'scale-down': {
			const scale = Math.min(1, Math.min(viewWidth / imageWidth, viewHeight / imageHeight))
			width = imageWidth * scale
			height = imageHeight * scale
			break
		}
		case 'none':
			width = imageWidth
			height = imageHeight
			break
		default: {
			// 'contain'
			const scale = Math.min(viewWidth / imageWidth, viewHeight / imageHeight)
			width = imageWidth * scale
			height = imageHeight * scale
		}
	}

	return {
		x: contentAxisOffset(viewWidth, width, position.left, position.right),
		y: contentAxisOffset(viewHeight, height, position.top, position.bottom),
		width,
		height,
	}
}

/** True when no platform stretch/scaleType can express the request and the
 *  leaf must measure + lay out the image itself: 'none' (iOS maps NS
 *  stretch='none' to TopLeft, not CSS centered), 'scale-down' (needs the
 *  intrinsic-vs-view compare), or any non-center position. 'fill' is
 *  exempt — its rect is always the whole box, so position can't matter. */
export function needsContentRect(
	fit: ImageContentFit,
	position: ImageContentPositionObject,
): boolean {
	if (fit === 'none' || fit === 'scale-down') {
		return true
	}

	return fit !== 'fill' && !isCenteredContentPosition(position)
}

/** NS `stretch` for the fast path — only reached for fits the platform
 *  vocabulary expresses identically (contain/cover/fill centered). */
export function contentFitToStretch(fit: ImageContentFit): 'aspectFit' | 'aspectFill' | 'fill' {
	switch (fit) {
		case 'contain':
			return 'aspectFit'
		case 'fill':
			return 'fill'
		default:
			return 'aspectFill'
	}
}

/** L8 — expo `getBestSource`: the source whose declared pixel count
 *  (`width·height·scale²`, dips × density) is closest to the view's pixel
 *  count. Needs a real measured size; one source or no size picks nothing
 *  to decide. Unsized sources score worst and are skipped when any sized
 *  candidate exists. */
export function bestImageSource(
	sources: readonly ImageSourceLike[],
	viewWidth: number,
	viewHeight: number,
	screenScale: number,
): ImageSourceLike | null {
	if (sources.length === 0 || viewWidth <= 0 || viewHeight <= 0) {
		return null
	}

	if (sources.length === 1) {
		return sources[0]
	}

	const target = viewWidth * viewHeight * screenScale * screenScale
	let best: ImageSourceLike | null = null
	let bestFit = Infinity
	for (const source of sources) {
		const pixelCount = (source.width ?? 0) * (source.height ?? 0) * (source.scale ?? 1) ** 2
		const fit = Math.abs(1 - pixelCount / target)
		if (fit < bestFit) {
			best = source
			bestFit = fit
		}
	}

	return best
}

function ensureWebUnits(value: ImageContentPositionValue): string {
	const text = String(value).trim()
	return text.endsWith('%') ? text : `${text}px`
}

/** Browser `object-position` for a resolved position — mirrors expo-image
 *  web's `getObjectPositionFromContentPositionObject`. */
export function objectPositionCSSValue(position: ImageContentPositionObject): string {
	const resolved: ImageContentPositionObject = { ...position }
	if (resolved.top == null && resolved.bottom == null) {
		resolved.top = '50%'
	}

	if (resolved.left == null && resolved.right == null) {
		resolved.left = '50%'
	}

	return (
		(['top', 'bottom', 'left', 'right'] as const)
			.map((edge) => (resolved[edge] != null ? `${edge} ${ensureWebUnits(resolved[edge]!)}` : ''))
			.filter((part) => part !== '')
			.join(' ') || '50% 50%'
	)
}

/** Browser `srcset` candidates for a source array: `w` descriptors (real
 *  file px = width·scale) when every source is sized, `x` descriptors when
 *  every source only carries density. `src` falls back to the largest
 *  declared pixel count — guaranteed coverage where srcset is ignored. */
export function imageSrcSet(sources: readonly ImageSourceLike[]): {
	src: string
	srcSet?: string
} {
	if (sources.length === 0) {
		return { src: '' }
	}

	const everyWidth = sources.every(
		(source) => typeof source.width === 'number' && source.width > 0,
	)

	const everyScale =
		!everyWidth &&
		sources.every((source) => typeof source.scale === 'number' && source.scale > 0)

	const srcSet = everyWidth
		? sources
				.map((source) => `${source.uri} ${Math.round(source.width! * (source.scale ?? 1))}w`)
				.join(', ')
		: everyScale
			? sources.map((source) => `${source.uri} ${source.scale}x`).join(', ')
			: undefined

	let fallback = sources[0]
	let bestCount = -Infinity
	for (const source of sources) {
		const count = (source.width ?? 0) * (source.height ?? 0) * (source.scale ?? 1) ** 2
		if (count > bestCount) {
			bestCount = count
			fallback = source
		}
	}

	return { src: fallback.uri, srcSet }
}
