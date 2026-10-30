// Glyph map model and per-layer resolution. The glyphmap shape and the
// layer/color helpers are ported from react-native-nano-icons (MIT,
// © Software Mansion) — see LICENSES.md.

/**
 * One glyphmap layer: a codepoint in the generated font plus the layer's
 * source fill. `currentColor` layers are tint slots resolved at render time.
 */
export type GlyphLayer = [codepoint: number, color: string]
/** `name → [advanceWidth, layers]` — advance is in font units (per upm). */
export type GlyphEntry = [adv: number, layers: GlyphLayer[]]
export type IconsMap = Record<string, GlyphEntry>

/**
 * The generated `<family>.glyphmap.json` shape (mirrors upstream):
 * `m.f` runtime family (set name + content hash), `m.u` units per em,
 * `m.z` safe zone, `m.s` first codepoint, `m.h` input fingerprint,
 * `m.w` set when a .woff2 was emitted.
 */
export type NanoGlyphMap = {
	/** Codepoint map (name → char). */
	m: {
		f: string
		u: number
		z: number
		s: number
		h?: string
		w?: true
	}
	/** Icon-name index. */
	i: IconsMap
}

/** JSON-inferred input where arrays aren't tuples. */
export type NanoGlyphMapInput = {
	/** Codepoint map (name → char). */
	m: {
		f: string
		u: number
		z: number
		s: number
		h?: string
		w?: boolean
	}
	/** Icon-name index. */
	i: Record<string, readonly unknown[]>
}

/** Default icon size (px) shared by every platform renderer. */
export const DEFAULT_ICON_SIZE = 24

/**
 * How an explicit `color` prop is applied to layers:
 * - `'all'` tints every layer (upstream default);
 * - `'currentColor'` only tints layers whose source fill was `currentColor` —
 *   preserves multicolor artwork, matching the previous Iconify behavior.
 */
export type TintMode = 'all' | 'currentColor'

export function normalizeGlyphMap(map: NanoGlyphMapInput): NanoGlyphMap {
	if (!map || typeof map !== 'object') {
		throw new TypeError('createNanoIconSet needs a glyph map object')
	}

	const meta = map.m
	if (!meta || typeof meta.f !== 'string' || !Number.isFinite(meta.u) || !Number.isFinite(meta.s)) {
		throw new TypeError('Glyph map metadata is missing or malformed (expected m.f, m.u, m.s)')
	}

	return map as NanoGlyphMap
}

/**
 * Look up a glyph entry by name, falling back to a single '?' layer
 * (codepoint 63) sized to the font's em when the name is unknown.
 */
export function resolveGlyphEntry(glyphMap: NanoGlyphMapInput, name: string): GlyphEntry {
	return (glyphMap.i[name] ?? [glyphMap.m.u, [[63, 'black']]]) as GlyphEntry
}

/** A memoized codepoint → string converter, scoped per icon set. */
export function createCharCache(): (codepoint: number) => string {
	const cache = new Map<number, string>()
	return (codepoint) => {
		let ch = cache.get(codepoint)
		if (ch === undefined) {
			ch = String.fromCodePoint(codepoint)
			cache.set(codepoint, ch)
		}

		return ch
	}
}

/**
 * Build a per-layer color resolver for one render: an explicit per-index
 * color wins, else the last supplied palette color spills onto remaining
 * layers, else the glyph's own source color, else the platform default.
 */
export function createLayerColorResolver(
	color: string | string[] | undefined,
	tintMode: TintMode = 'currentColor',
	layers: GlyphLayer[] = [],
): (index: number, srcColor: string | undefined) => string | undefined {
	const colorArray = Array.isArray(color) ? color : [color]
	const lastPaletteColor = colorArray[colorArray.length - 1]
	const paletteIndexByLayer =
		tintMode === 'currentColor' ? currentColorPositions(layers) : undefined

	return (index, srcColor) => {
		const paletteIndex = paletteIndexByLayer ? (paletteIndexByLayer[index] ?? -1) : index

		const paletteColor =
			paletteIndex < 0 ? undefined : (colorArray[paletteIndex] ?? lastPaletteColor)

		return paletteColor ?? srcColor ?? undefined
	}
}

const positionsByLayers = new WeakMap<readonly GlyphLayer[], number[]>()

/** Layer index → palette position for `currentColor` tinting. */
export function currentColorPositions(layers: readonly GlyphLayer[]): number[] {
	let positions = positionsByLayers.get(layers)
	if (!positions) {
		let next = 0
		positions = layers.map(([, srcColor]) => (srcColor === 'currentColor' ? next++ : -1))

		positionsByLayers.set(layers, positions)
	}

	return positions
}
