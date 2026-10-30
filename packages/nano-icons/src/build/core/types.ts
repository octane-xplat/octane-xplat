// Ported from react-native-nano-icons (MIT, © Software Mansion) — see
// packages/nano-icons/LICENSES.md for full attribution.
/** Progress reporter contract for the font pipeline. */
export type NanoLogger = {
	/** Begin a progress step. */
	start: (msg: string) => void
	/** Update step progress. */
	update: (msg: string) => void
	/** Mark a step done. */
	succeed: (msg: string) => void
	/** Mark a step failed. */
	fail: (msg: string) => void
	/** Only printed when level is 'verbose'. */
	info: (msg: string) => void
	/** Emit a warning. */
	warn: (msg: string) => void
}

export type GlyphLayer = [codepoint: number, color: string]
export type GlyphEntry = [adv: number, layers: GlyphLayer[]]
export type IconsMap = Record<string, GlyphEntry>

/**
 * m - metadata,
 *   f - font family,
 *   u - units per em,
 *   z - safe zone,
 *   s - start unicode,
 *   h - hash,
 *   l - linking mode: 's' (static, bundled — default when absent) or 'd' (dynamic, OTA-delivered),
 *   w - web output: true when a .woff2 was built alongside the .ttf (absent otherwise),
 * i - icons,
 *   adv - advance width,
 */
export type NanoGlyphMap = {
	/** Codepoint map. */
	m: {
		f: string
		u: number
		z: number
		s: number
		h?: string
		l?: 's' | 'd'
		w?: true
	}
	/** Icon-name index. */
	i: IconsMap
}

/** Accepts JSON-inferred types where arrays aren't tuples. */
export type NanoGlyphMapInput = {
	/** Codepoint map. */
	m: {
		f: string
		u: number
		z: number
		s: number
		h?: string
		l?: 's' | 'd' | (string & {})
		w?: boolean
	}
	/** Icon-name index. */
	i: Record<string, readonly unknown[]>
}
