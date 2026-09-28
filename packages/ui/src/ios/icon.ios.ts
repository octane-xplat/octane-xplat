import type { PlatformIconChoice } from '../props'

/** Selector for glyphs used by iOS-authentic widgets; the shared root Icon is unchanged. */
export const Icon = {
	select(choice: PlatformIconChoice): string {
		return choice.ios.startsWith('sys://') ? choice.ios : `sys://${choice.ios}`
	},
}
