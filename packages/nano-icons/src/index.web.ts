import { NanoIcon } from './NanoIcon.web'
import { createNanoIconSetImpl } from './set'
import { registerNanoIconFont } from './font.web'

import type { NanoFontSource } from './props'
import type { NanoGlyphMapInput } from './glyphmap'
import type { NanoIconSet } from './set'

/**
 * Create an icon set bound to a generated nano-icons font. `glyphMap` comes
 * from the package's build (`<family>.glyphmap.json` / the generated module);
 * `font.url`/`font.data` are registered through `FontFace` — or link the font
 * yourself and omit `font`.
 */
export function createNanoIconSet<Name extends string = string>(
	glyphMap: NanoGlyphMapInput & { i: Record<Name, unknown> },
	options?: { font?: NanoFontSource; name?: string },
): NanoIconSet<Name> {
	return createNanoIconSetImpl<Name>(glyphMap, options, {
		registerFont: registerNanoIconFont,
		icon: NanoIcon,
	})
}

export { NanoIcon }
export { registerNanoIconFont } from './font.web'
export { resolveNanoIcon } from './set'
export type { NanoIconSet } from './set'
export type { NanoIconProps, NanoIconSetProps, NanoFontSource, NanoFontStatus } from './props'

export type { NanoGlyphMap, NanoGlyphMapInput, GlyphEntry, GlyphLayer, TintMode } from './glyphmap'
