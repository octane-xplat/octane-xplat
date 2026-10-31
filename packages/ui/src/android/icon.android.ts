import type { PlatformIconChoice } from '../props'

/** Selector for glyphs used by Android-authentic widgets; the shared root Icon is unchanged. */
export const PlatformIcon = {
	/** Resolves a platform icon choice to the Android drawable specifier. */
	select(choice: PlatformIconChoice): string {
		return choice.android.startsWith('res://') ? choice.android : `res://drawable/${choice.android}`
	},
}
