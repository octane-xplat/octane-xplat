import type { PlatformIconChoice } from '../props'

/** Selector for glyphs used by iOS-authentic widgets; the shared root Icon is unchanged. */
export const PlatformIcon = {
	/** Resolves a platform icon choice to the iOS glyph specifier. */
	select(choice: PlatformIconChoice): string {
		return choice.ios.startsWith('sys://') ? choice.ios : `sys://${choice.ios}`
	},
}
