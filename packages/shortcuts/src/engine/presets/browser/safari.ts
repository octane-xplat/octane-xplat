import { blocklistEntry } from '../blocklistEntry.js'

const combos = [
	['Meta+Shift+N', 'mac'],
	['Control+Tab', 'mac'],
	['Control+Shift+Tab', 'mac'],
	['Shift+Meta+[', 'mac'],
	['Shift+Meta+]', 'mac'],
	['Shift+Meta+\\', 'mac'],
	['Meta+[', 'mac'],
	['Meta+]', 'mac'],
	['Meta+`', 'mac'],
	['Meta+Shift+H', 'mac'],
	['Meta+,', 'mac'],
	['Meta+Control+1', 'mac'],
	['Meta+Control+2', 'mac'],
	['Meta+D', 'mac'],
	['Meta+G', 'mac'],
	['Meta+Shift+G', 'mac'],
	['Meta+Shift+D', 'mac'],
] as const

/** Reserved shortcuts specific to Safari, beyond the common browser set. */
export const safariBrowserShortcuts: import('../../types/public.js').ShortcutBlocklistEntry[] =
	combos.map(([combo, platform]) =>
		blocklistEntry(combo, { category: 'browser', browser: 'safari', platform }),
	)
