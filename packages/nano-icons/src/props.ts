import type { TintMode } from './glyphmap'
import type { NanoIconSet } from './set'

/**
 * Props for `NanoIcon` / a set's bound `Icon`. Same contract as
 * `@octane-xplat/icons`' `Icon` plus font-pipeline specifics: `name` is an
 * icon in a generated set (optionally `family:icon`), `color` tints layers,
 * `tintMode` selects which layers are tinted.
 */
export interface NanoIconProps {
	/** Icon name in the set — bare name or `family:icon` for unbound `NanoIcon`. */
	name: string
	/** Rendered size in logical px; the glyph's em maps to this height. Default 24. */
	size?: number
	/** Tint for layers — a color, or a per-layer palette. Which layers it applies to depends on `tintMode`. */
	color?: string | string[]
	/** `'all'` tints every layer; `'currentColor'` (default) only tints `currentColor` layers. */
	tintMode?: TintMode
	/** Quarter turns, same as the Iconify `rotate` customization (0–3 → ×90°). */
	rotate?: number
	/** Mirror horizontally. */
	hFlip?: boolean
	/** Mirror vertically. */
	vFlip?: boolean
	/** Accessible label; omit for decorative icons. */
	label?: string
	/** Element id passed through to the host element. */
	id?: string
	/** Class list applied to the icon element. */
	className?: any
	/** Inline style (string CSS or object). */
	style?: any
	/** Explicit icon set; when omitted, `NanoIcon` resolves `name` across registered sets. */
	set?: NanoIconSet
	/** Platform escape hatch (native font/icon props). */
	ios?: Record<string, any>
	/** Platform escape hatch — same bag contract as `ios`. */
	android?: Record<string, any>
	/** Platform escape hatch — same bag contract as `ios`. */
	web?: Record<string, any>
}

/** A set-bound `Icon` takes the same props with names typed to the set. */
export type NanoIconSetProps<Name extends string = string> = Omit<NanoIconProps, 'name' | 'set'> & {
	/** Icon name within the generated set. */
	name: Name
}

/** Font asset descriptor for `createNanoIconSet` / `registerNanoIconFont`. */
export interface NanoFontSource {
	/**
	 * iOS/Android: file name inside the app's `fonts` directory — must equal
	 * `<family>.ttf` (NativeScript resolves custom fonts by file name).
	 * Defaults to `<family>.ttf`.
	 */
	fileName?: string
	/** Web: URL (or `data:` URI) of the `.woff2`/`.ttf`, registered through `FontFace`. */
	url?: string
	/**
	 * Raw font bytes (e.g. a bundled ArrayBuffer), or a base64 string payload —
	 * portable across JS hosts that can't produce typed arrays from assets.
	 */
	data?: ArrayBuffer | Uint8Array | string
	/** macOS: filesystem path to the `.ttf` file. */
	path?: string
}

/** Lifecycle states of the generated icon font (loading/ready/error). */
export type NanoFontStatus = 'ready' | 'missing' | 'unavailable'
