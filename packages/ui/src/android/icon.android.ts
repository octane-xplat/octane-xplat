import type { PlatformIconChoice } from '../props'

/** Selector for glyphs used by Android-authentic widgets; the shared root Icon is unchanged. */
export const Icon = {
	select(choice: PlatformIconChoice): string {
		return choice.android.startsWith('res://') ? choice.android : `res://drawable/${choice.android}`
	},
}
