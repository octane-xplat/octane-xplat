import { NanoIcon } from './NanoIcon'
import { createNanoIconSetImpl } from './set'
import { registerNanoIconFont } from './font'

import type { NanoFontSource } from './props'
import type { NanoGlyphMapInput } from './glyphmap'
import type { NanoIconSet } from './set'

/**
 * Create an icon set bound to a generated nano-icons font. `glyphMap` comes
 * from the package's build (`<family>.glyphmap.json` / the generated module);
 * `font` tells the platform where the TTF lives — see `NanoFontSource`.
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
export { registerNanoIconFont } from './font'
export { resolveNanoIcon } from './set'
export type { NanoIconSet } from './set'
export type { NanoIconProps, NanoIconSetProps, NanoFontSource, NanoFontStatus } from './props'

export type { NanoGlyphMap, NanoGlyphMapInput, GlyphEntry, GlyphLayer, TintMode } from './glyphmap'
