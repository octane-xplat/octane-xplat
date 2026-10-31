/**
 * CSS background parsing and paint geometry for the AppKit renderer —
 * GI-free so Node tests exercise the model. Mirrors the GTK target's
 * vocabulary (GTK CSS gets these from `background`,
 * `background-image/-repeat/-position/-size`): comma-separated layers of
 * `url()` images and linear/radial/conic gradients (incl. `repeating-`),
 * per-layer repeat/position/size/origin/clip, and the `background`
 * shorthand. `background-attachment`, `background-blend-mode` and
 * `background-clip: text` stay explicitly unsupported.
 */
import { splitStyleTokens, splitTopLevelCommas } from './css-text.ts'
import { parseImagePosition, type ImagePosition, type ImageRect } from './image-fit.ts'

export type BgBox = 'border-box' | 'padding-box' | 'content-box'
export type RepeatMode = 'repeat' | 'space' | 'round' | 'no-repeat'
export interface BgStop {
	color: string
	/** Percent of the gradient extent, or a point length — resolved at paint. */
	at: { frac: number } | { len: number } | null
}
export interface BgGradient {
	type: 'linear' | 'radial' | 'conic'
	repeating: boolean
	angle: number
	shape: 'circle' | 'ellipse'
	size: 'closest-side' | 'farthest-side' | 'closest-corner' | 'farthest-corner' | 'explicit'
	rx: { frac: number } | { len: number } | null
	ry: { frac: number } | { len: number } | null
	center: ImagePosition
	stops: BgStop[]
}
export type BgImage = { kind: 'gradient'; gradient: BgGradient } | { kind: 'url'; url: string }
export type BgSizeToken = { kind: 'auto' } | { kind: 'frac'; v: number } | { kind: 'len'; v: number }
export type BgSize = 'auto' | 'cover' | 'contain' | { w: BgSizeToken; h: BgSizeToken }
export interface BgLayerSpec {
	image: BgImage
	repeat: { x: RepeatMode; y: RepeatMode }
	position: ImagePosition
	size: BgSize
	origin: BgBox
	clip: BgBox
}
export interface BackgroundSpec {
	/** Color carried by the `background` shorthand — paints as background-color. */
	color: any
	layers: BgLayerSpec[]
}

const BOXES = new Set(['border-box', 'padding-box', 'content-box'])
const REPEATS = new Set(['repeat', 'repeat-x', 'repeat-y', 'no-repeat', 'space', 'round'])
const POSITION_WORDS = new Set(['left', 'right', 'top', 'bottom', 'center'])
const LENGTH_OR_PCT = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:px|dip|pt|%)?$/i
const ANGLE = /^([+-]?(?:\d+\.?\d*|\.\d+))(deg|turn|rad|grad)$/i

function parseLengthToken(token: string): { frac: number } | { len: number } | null {
	const m = /^([+-]?(?:\d+\.?\d*|\.\d+))(px|dip|pt|%)?$/i.exec(token)
	if (!m || !Number.isFinite(Number(m[1])) || (!m[2] && Number(m[1]) !== 0)) {return null}
	return m[2] === '%' ? { frac: Number(m[1]) / 100 } : { len: Number(m[1]) }
}

function parseAngle(token: string): number | null {
	const m = ANGLE.exec(token)
	if (!m) {return null}
	const v = Number(m[1])
	switch (m[2].toLowerCase()) {
		case 'deg': return v
		case 'turn': return v * 360
		case 'grad': return v * 0.9
		case 'rad': return (v * 180) / Math.PI
	}
	return null
}

const GRADIENT_RE = /^(repeating-)?(linear|radial|conic)-gradient\((.*)\)$/s

/** One background-image term: `url()`, `none`, or a gradient function.
 *  null → recognized-but-empty (`none`); undefined → unparseable. */
export function parseBgImageTerm(term: string): BgImage | null | undefined {
	const t = term.trim()
	if (!t) {return undefined}
	if (t === 'none' || t === 'initial' || t === 'unset' || t === 'auto') {return null}
	const url = /^url\(\s*(['"]?)(.*?)\1\s*\)$/s.exec(t)
	if (url) {
		const src = url[2].trim()
		return src ? { kind: 'url', url: src } : null
	}
	const g = GRADIENT_RE.exec(t)
	if (g) {
		const gradient = parseGradient(g[2] as 'linear' | 'radial' | 'conic', g[3], g[1] === 'repeating-')
		return gradient ? { kind: 'gradient', gradient } : undefined
	}
	return undefined
}

/** `<stop> = color [pos [pos]?]` — double positions become two stops. */
function parseStops(parts: string[]): BgStop[] | null {
	const stops: BgStop[] = []
	for (const part of parts) {
		const tokens = splitStyleTokens(part)
		if (!tokens.length) {return null}
		const positions: ({ frac: number } | { len: number })[] = []
		let colorEnd = tokens.length
		for (let i = 1; i < tokens.length; i++) {
			const p = parseLengthToken(tokens[i])
			if (!p) { colorEnd = i; break }
			positions.push(p)
			if (positions.length === 2) { colorEnd = i + 1; break }
		}
		const color = tokens.slice(0, colorEnd).slice(0, tokens.length - positions.length).join(' ') || tokens[0]
		if (positions.length && tokens.slice(1).length !== positions.length) {return null}
		if (positions.length === 2) {
			stops.push({ color, at: positions[0] }, { color, at: positions[1] })
		} else {
			stops.push({ color, at: positions[0] ?? null })
		}
	}
	return stops.length >= 2 ? stops : null
}

const LINEAR_DIRECTIONS: Record<string, number> = {
	'to top': 0, 'to right': 90, 'to bottom': 180, 'to left': 270,
	'to top right': 45, 'to right top': 45,
	'to bottom right': 135, 'to right bottom': 135,
	'to bottom left': 225, 'to left bottom': 225,
	'to top left': 315, 'to left top': 315,
}

function parseGradient(type: 'linear' | 'radial' | 'conic', args: string, repeating: boolean): BgGradient | null {
	const parts = splitTopLevelCommas(args)
	if (parts.length < 2) {return null}
	const out: BgGradient = {
		type, repeating,
		angle: type === 'linear' ? 180 : 0,
		shape: 'ellipse',
		size: 'farthest-corner',
		rx: null, ry: null,
		center: parseImagePosition(undefined)!,
		stops: [],
	}

	let stopParts = parts
	// Lead clause: everything before the first color stop. For linear it's a
	// direction/angle; for radial/conic it's only a prelude when every token
	// is a valid shape/size/`at`/`from`/position token — a color or stray
	// word demotes the whole part to a stop.
	const RADIAL_PRELUDE = new Set([
		'circle', 'ellipse', 'closest-side', 'closest-corner', 'farthest-side', 'farthest-corner',
		'from', 'at', 'left', 'right', 'top', 'bottom', 'center',
	])
	const firstPart = parts[0].trim().toLowerCase()
	const isPrelude =
		type === 'linear'
			? firstPart in LINEAR_DIRECTIONS || parseAngle(firstPart) != null
			: splitStyleTokens(firstPart).every((t) => RADIAL_PRELUDE.has(t) || parseLengthToken(t) != null || parseAngle(t) != null)
	if (isPrelude) {
		stopParts = parts.slice(1)
		if (type === 'linear') {
			const clause = parts[0].trim().toLowerCase()
			if (clause in LINEAR_DIRECTIONS) {
				out.angle = LINEAR_DIRECTIONS[clause]
			} else {
				const angle = parseAngle(clause)
				if (angle == null) {return null}
				out.angle = angle
			}
		} else {
			// radial/conic prelude: [shape] [size] [from angle] [at position]
			const tokens = splitStyleTokens(parts[0])
			const at = tokens.findIndex((t) => t.toLowerCase() === 'at')
			if (at >= 0) {
				const pos = parseImagePosition(tokens.slice(at + 1).join(' '))
				if (!pos) {return null}
				out.center = pos
				tokens.length = at
			}
			for (let i = 0; i < tokens.length; i++) {
				const t = tokens[i].toLowerCase()
				if (t === 'circle' || t === 'ellipse') { out.shape = t; continue }
				if (t === 'from' && type === 'conic') {
					const angle = parseAngle(tokens[++i] ?? '')
					if (angle == null) {return null}
					out.angle = angle
					continue
				}
				if (t === 'closest-side' || t === 'farthest-side' || t === 'closest-corner' || t === 'farthest-corner') { out.size = t; continue }
				if (type === 'radial') {
					const len = parseLengthToken(t)
					if (len) {
						if (out.rx == null) { out.rx = len; out.size = 'explicit'; continue }
						if (out.ry == null) { out.ry = len; out.size = 'explicit'; continue }
					}
				}
				return null
			}
			if (out.shape === 'circle' && out.ry != null) {return null}
		}
	}
	const stops = parseStops(stopParts)
	if (!stops) {return null}
	out.stops = stops
	return out
}

/** Parse `background-image`'s comma list. `null` = nothing usable.
 *  `warnings` collects one message per rejected term. */
export function parseBackgroundImage(value: any, warnings: string[]): BgImage[] | null {
	if (value == null) {return null}
	const text = String(value).trim()
	if (!text || text === 'none' || text === 'initial' || text === 'unset') {return null}
	const layers: BgImage[] = []
	for (const term of splitTopLevelCommas(text)) {
		const image = parseBgImageTerm(term)
		if (image === undefined) {
			warnings.push(term)
			continue
		}
		if (image) {layers.push(image)}
	}
	return layers
}

function repeatMode(value: any): { x: RepeatMode; y: RepeatMode } | null {
	const text = String(value ?? '').trim().toLowerCase()
	if (!text) {return null}
	if (text === 'repeat-x') {return { x: 'repeat', y: 'no-repeat' }}
	if (text === 'repeat-y') {return { x: 'no-repeat', y: 'repeat' }}
	const tokens = text.split(/\s+/)
	if (tokens.length > 2 || tokens.some((t) => !REPEATS.has(t))) {return null}
	const x = (tokens[0] === 'no-repeat' ? 'no-repeat' : tokens[0]) as RepeatMode
	return { x, y: (tokens[1] ?? tokens[0]) as RepeatMode }
}

function sizeToken(token: string): BgSizeToken | null {
	if (token === 'auto') {return { kind: 'auto' }}
	const len = parseLengthToken(token)
	if (!len) {return null}
	return 'frac' in len ? { kind: 'frac', v: len.frac } : { kind: 'len', v: len.len }
}

function bgSize(value: any): BgSize | null {
	const text = String(value ?? '').trim().toLowerCase()
	if (!text) {return null}
	if (text === 'cover' || text === 'contain') {return text}
	if (text === 'auto') {return 'auto'}
	const tokens = text.split(/\s+/).filter(Boolean)
	if (tokens.length > 2) {return null}
	const w = sizeToken(tokens[0])
	if (!w) {return null}
	return { w, h: tokens.length > 1 ? (sizeToken(tokens[1]) ?? { kind: 'auto' }) : { kind: 'auto' } }
}

function boxValue(value: any): BgBox | null {
	const text = String(value ?? '').trim().toLowerCase()
	return BOXES.has(text) ? (text as BgBox) : null
}

const DEFAULT_LAYER = (): Omit<BgLayerSpec, 'image'> => ({
	repeat: { x: 'repeat', y: 'repeat' },
	position: parseImagePosition(undefined)!,
	size: 'auto',
	origin: 'padding-box',
	clip: 'border-box',
})

/** Assemble the final layer list from the resolved slots — per-layer
 *  longhand lists cycle when shorter than the image list (CSS list
 *  coordination). */
function buildLayers(
	images: BgImage[],
	repeat: any[], position: any[], size: any[], origin: any[], clip: any[],
): BgLayerSpec[] {
	const at = <T>(list: T[], i: number): T | undefined => (list.length ? list[i % list.length] : undefined)
	return images.map((image, i) => {
		const base = DEFAULT_LAYER()
		return {
			image,
			repeat: at(repeat, i) ?? base.repeat,
			position: at(position, i) ?? base.position,
			size: at(size, i) ?? base.size,
			origin: at(origin, i) ?? base.origin,
			clip: at(clip, i) ?? base.clip,
		}
	})
}

interface BgSlots {
	color?: any
	image?: any
	repeat?: any
	position?: any
	size?: any
	origin?: any
	clip?: any
}

/** `background` shorthand → slots. Each comma-separated layer carries image,
 *  position[/size], repeat and box tokens; only the last layer's color counts. */
export function parseBackgroundShorthand(value: any): BgSlots {
	const slots: BgSlots = {}
	const text = String(value ?? '').trim()
	if (!text) {return slots}
	const layerTexts = splitTopLevelCommas(text)
	const images: string[] = []
	const repeats: string[] = []
	const positions: string[] = []
	const sizes: string[] = []
	const origins: string[] = []
	const clips: string[] = []
	layerTexts.forEach((layerText, index) => {
		const tokens = splitStyleTokens(layerText)
		const positionTokens: string[] = []
		const sizeTokens: string[] = []
		const boxTokens: string[] = []
		const repeatTokens: string[] = []
		let image: string | undefined
		let color: string | undefined
		for (let i = 0; i < tokens.length; i++) {
			// `position/size` — the '/' may sit inside a token (`center/cover`),
			// but never inside parentheses (url() paths).
			let token = tokens[i]
			let depth = 0
			let slash = -1
			for (let j = 0; j < token.length; j++) {
				const c = token[j]
				if (c === '(') {depth++}
				else if (c === ')') {depth = Math.max(0, depth - 1)}
				else if (c === '/' && depth === 0) { slash = j; break }
			}
			const afterSlash: string[] = []
			if (slash >= 0) {
				afterSlash.push(...token.slice(slash + 1).split('/').filter(Boolean))
				token = token.slice(0, slash)
			}
			const low = token.toLowerCase()
			if (/^url\(/i.test(token) || GRADIENT_RE.test(token) || low === 'none') {
				image = token
			} else if (REPEATS.has(low)) {
				repeatTokens.push(low)
			} else if (BOXES.has(low)) {
				boxTokens.push(low)
			} else if (low === 'text') {
				boxTokens.push(low)
			} else if (POSITION_WORDS.has(low) || LENGTH_OR_PCT.test(token)) {
				positionTokens.push(token)
			} else if (token) {
				color = token
			}
			for (const size of afterSlash) {
				const low = size.toLowerCase()
				if (sizeTokens.length < 2 && (low === 'auto' || low === 'cover' || low === 'contain' || LENGTH_OR_PCT.test(low))) {
					sizeTokens.push(size)
				}
			}
		}
		images.push(image ?? 'none')
		if (positionTokens.length) {positions[index] = positionTokens.join(' ')}
		if (sizeTokens.length) {sizes[index] = sizeTokens.join(' ')}
		if (repeatTokens.length) {repeats[index] = repeatTokens.join(' ')}
		if (boxTokens[0]) {origins[index] = boxTokens[0]}
		if (boxTokens[1]) {clips[index] = boxTokens[1]}
		if (index === layerTexts.length - 1 && color != null) {slots.color = color}
	})
	slots.image = images.join(', ')
	if (positions.length) {slots.position = layerTexts.map((_, i) => positions[i] ?? '0% 0%').join(', ')}
	if (sizes.length) {slots.size = layerTexts.map((_, i) => sizes[i] ?? 'auto auto').join(', ')}
	if (repeats.length) {slots.repeat = layerTexts.map((_, i) => repeats[i] ?? 'repeat').join(', ')}
	if (origins.length) {slots.origin = layerTexts.map((_, i) => origins[i] ?? 'padding-box').join(', ')}
	if (clips.length) {slots.clip = layerTexts.map((_, i) => clips[i] ?? 'border-box').join(', ')}
	return slots
}

/**
 * The ordered style bag → resolved background spec. `background` resets all
 * slots first (shorthand semantics), longhands override it later in the bag.
 * Returns null when no layer or shorthand color survives.
 */
export function collectBackground(style: Record<string, any>, warnings: string[]): BackgroundSpec | null {
	const slots: BgSlots = {}
	let touched = false
	for (const [name, value] of Object.entries(style)) {
		if (value == null) {continue}
		switch (name) {
			case 'background': {
				const parsed = parseBackgroundShorthand(value)
				if (parsed.color != null) {slots.color = parsed.color}
				if (parsed.image != null) {slots.image = parsed.image}
				if (parsed.repeat != null) {slots.repeat = parsed.repeat}
				if (parsed.position != null) {slots.position = parsed.position}
				if (parsed.size != null) {slots.size = parsed.size}
				if (parsed.origin != null) {slots.origin = parsed.origin}
				if (parsed.clip != null) {slots.clip = parsed.clip}
				touched = true
				break
			}
			case 'backgroundColor': slots.color = value; break
			case 'backgroundImage': slots.image = value; touched = true; break
			case 'backgroundRepeat': slots.repeat = value; break
			case 'backgroundPosition': slots.position = value; break
			case 'backgroundSize': slots.size = value; break
			case 'backgroundOrigin': slots.origin = value; break
			case 'backgroundClip': slots.clip = value; break
			case 'backgroundAttachment':
			case 'backgroundBlendMode':
				warnings.push(`unsupported ${name}`)
				break
		}
	}
	if (!touched && slots.color == null) {return null}
	const imageTerms = slots.image == null ? [] : splitTopLevelCommas(String(slots.image))
	const images: BgImage[] = []
	for (const term of imageTerms) {
		const image = parseBgImageTerm(term)
		if (image === undefined) {
			warnings.push(term)
			continue
		}
		if (image) {images.push(image)}
	}
	const perLayer = (value: any): string[] => (value == null ? [] : splitTopLevelCommas(String(value)))
	const repeatList = perLayer(slots.repeat).map(repeatMode).filter(Boolean) as { x: RepeatMode; y: RepeatMode }[]
	const positionList = perLayer(slots.position)
	const sizeList = perLayer(slots.size).map(bgSize).filter(Boolean) as BgSize[]
	const originList = perLayer(slots.origin).map(boxValue).filter(Boolean) as BgBox[]
	const clipList = perLayer(slots.clip).map(boxValue).filter(Boolean) as BgBox[]
	if (slots.clip != null && String(slots.clip).includes('text')) {warnings.push('unsupported background-clip: text')}
	const layers = buildLayers(
		images,
		repeatList,
		positionList.map((p) => parseImagePosition(p)).filter(Boolean) as ImagePosition[],
		sizeList,
		originList,
		clipList,
	)
	if (!layers.length && slots.color == null) {return null}
	return { color: slots.color, layers }
}

// ---- Paint geometry ---------------------------------------------------------

export interface BoxEdges { top: number; right: number; bottom: number; left: number }

/** The box a layer's position/size resolve against, in host (view-bounds) coordinates. */
export function positioningBox(box: BgBox, w: number, h: number, border: BoxEdges, padding: BoxEdges): ImageRect {
	if (box === 'border-box') {return { x: 0, y: 0, width: w, height: h }}
	const x = border.left + (box === 'content-box' ? padding.left : 0)
	const y = border.top + (box === 'content-box' ? padding.top : 0)
	const width = Math.max(0, w - border.left - border.right - (box === 'content-box' ? padding.left + padding.right : 0))
	const height = Math.max(0, h - border.top - border.bottom - (box === 'content-box' ? padding.top + padding.bottom : 0))
	return { x, y, width, height }
}

/** Drawn size of one image instance inside `box`. */
export function resolveImageSize(size: BgSize, iw: number, ih: number, box: { width: number; height: number }): { w: number; h: number } {
	if (!(iw > 0) || !(ih > 0)) {return { w: 0, h: 0 }}
	if (size === 'cover' || size === 'contain') {
		const scale = size === 'cover' ? Math.max(box.width / iw, box.height / ih) : Math.min(box.width / iw, box.height / ih)
		return { w: iw * scale, h: ih * scale }
	}
	if (size === 'auto') {return { w: iw, h: ih }}
	const axisLen = (token: BgSizeToken, extent: number) =>
		token.kind === 'len' ? token.v : token.kind === 'frac' ? token.v * extent : null
	let w = axisLen(size.w, box.width)
	let h = axisLen(size.h, box.height)
	if (w == null && h == null) {return { w: iw, h: ih }}
	if (w == null) {w = (iw * h!) / ih}
	if (h == null) {h = (ih * w) / iw}
	return { w, h }
}

/** First-tile anchor rect for a layer, per CSS position semantics
 *  ((box - drawn) * fraction + offset). */
export function anchorRect(position: ImagePosition, w: number, h: number, box: ImageRect): ImageRect {
	return {
		x: box.x + (box.width - w) * position.x.fraction + position.x.offset,
		y: box.y + (box.height - h) * position.y.fraction + position.y.offset,
		width: w,
		height: h,
	}
}

/** Tile rectangles covering `box` for one layer — the positioned tile anchors
 *  the pattern; `space` spreads tiles edge-to-edge, `round` rescales. */
export function tileRects(layer: Pick<BgLayerSpec, 'repeat' | 'position'>, drawn: { w: number; h: number }, box: ImageRect): ImageRect[] {
	const anchor = anchorRect(layer.position, drawn.w, drawn.h, box)
	const axis = (mode: RepeatMode, a0: number, tile: number, extent: number): { start: number; step: number; count: number; size: number } => {
		if (!(tile > 0) || !(extent > 0)) {return { start: a0, step: tile, count: 0, size: tile }}
		switch (mode) {
			case 'no-repeat':
				return { start: a0, step: tile, count: 1, size: tile }
			case 'space': {
				const count = Math.floor(extent / tile)
				if (count < 1) {return { start: a0, step: tile, count: 1, size: tile }}
				const step = count > 1 ? tile + (extent - count * tile) / (count - 1) : tile
				return { start: count > 1 ? 0 : (extent - tile) / 2, step, count, size: tile }
			}
			case 'round': {
				const count = Math.max(1, Math.round(extent / tile))
				return { start: 0, step: extent / count, count, size: extent / count }
			}
			default: {
				// First tile whose right/bottom edge reaches inside the box;
				// last whose start still lands inside.
				const first = Math.floor(-(a0 + tile) / tile) + 1
				const last = Math.ceil((extent - a0) / tile) - 1
				return { start: a0 + first * tile, step: tile, count: Math.max(0, last - first + 1), size: tile }
			}
		}
	}
	const xs = axis(layer.repeat.x, anchor.x - box.x, drawn.w, box.width)
	const ys = axis(layer.repeat.y, anchor.y - box.y, drawn.h, box.height)
	const out: ImageRect[] = []
	for (let i = 0; i < xs.count; i++) {
		for (let j = 0; j < ys.count; j++) {
			out.push({
				x: box.x + xs.start + i * xs.step,
				y: box.y + ys.start + j * ys.step,
				width: xs.size,
				height: ys.size,
			})
		}
	}
	return out
}

/** Resolve authored stops to absolute positions along the gradient extent
 *  (points or turn-fractions), distributing null positions and clamping
 *  monotonic — then repeating gradients tile the pattern across [0, extent]. */
export function resolveStops(stops: BgStop[], extent: number, repeating: boolean): { color: string; at: number }[] {
	const at = (stop: BgStop): number | null =>
		stop.at == null ? null : 'frac' in stop.at ? stop.at.frac * extent : stop.at.len
	const out = stops.map((stop) => ({ color: stop.color, at: at(stop) }))
	out[0].at ??= 0
	out[out.length - 1].at ??= extent
	let previous = 0
	for (let i = 1; i < out.length; i++) {
		if (out[i].at == null) {continue}
		out[i].at = Math.max(out[previous].at!, out[i].at!)
		for (let j = previous + 1; j < i; j++) {
			out[j].at = out[previous].at! + ((out[i].at! - out[previous].at!) * (j - previous)) / (i - previous)
		}
		previous = i
	}
	for (let j = previous + 1; j < out.length; j++) {out[j].at = out[previous].at!}
	if (!repeating) {return out.map((s) => ({ color: s.color, at: extent > 0 ? s.at! / extent : 0 }))}
	// Tile the [first..last] pattern until it covers [0, extent].
	const first = out[0].at!, last = out[out.length - 1].at!
	const period = last - first
	if (!(period > 0)) {return out.map((s) => ({ color: s.color, at: extent > 0 ? s.at! / extent : 0 }))}
	const tiled: { color: string; at: number }[] = []
	for (let copy = Math.floor(-first / period) - 1; (first + copy * period) <= extent + period; copy++) {
		for (const s of out) {
			const pos = s.at! + copy * period
			if (pos >= -period && pos <= extent + period) {tiled.push({ color: s.color, at: pos })}
		}
	}
	return tiled.map((s) => ({ color: s.color, at: Math.min(1, Math.max(0, extent > 0 ? s.at / extent : 0)) }))
}
