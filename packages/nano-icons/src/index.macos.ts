import { NanoIcon } from './NanoIcon.macos'
import { createNanoIconSetImpl } from './set'
import { registerNanoIconFont } from './font.macos'

import type { NanoFontSource } from './props'
import type { NanoGlyphMapInput } from './glyphmap'
import type { NanoIconSet } from './set'

/**
 * Create an icon set bound to a generated nano-icons font. `glyphMap` comes
 * from the package's build (`<family>.glyphmap.json` / the generated module);
 * `font.path`/`font.data` register the TTF through CoreText + the renderer's
 * family registry.
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
export { registerNanoIconFont } from './font.macos'
export { resolveNanoIcon } from './set'
export type { NanoIconSet } from './set'
export type { NanoIconProps, NanoIconSetProps, NanoFontSource, NanoFontStatus } from './props'

export type { NanoGlyphMap, NanoGlyphMapInput, GlyphEntry, GlyphLayer, TintMode } from './glyphmap'
