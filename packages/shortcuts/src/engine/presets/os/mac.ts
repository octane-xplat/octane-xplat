import { blocklistEntry } from '../blocklistEntry.js'

const combos = [
	'Meta+Tab',
	'Meta+Shift+Tab',
	'Meta+Space',
	'Meta+Option+Space',
	'Meta+H',
	'Meta+M',
	'Meta+Option+M',
	'Meta+`',
	'Meta+Q',
	'Meta+Option+Escape',
	'Meta+Shift+3',
	'Meta+Shift+4',
	'Meta+Shift+5',
	'Meta+Option+D',
	'Meta+Control+F',
	'Control+ArrowLeft',
	'Control+ArrowRight',
	'Control+ArrowUp',
	'Control+ArrowDown',
	'Control+F2',
	'Control+F3',
	'Control+F4',
	'Control+F5',
	'Control+F6',
	'Control+F7',
	'Control+F8',
	'Control+Meta+Q',
]

/** Reserved OS-level shortcuts on macOS (Mission Control, Spotlight, screenshots, quit/hide). */
export const macOsShortcuts: import('../../types/public.js').ShortcutBlocklistEntry[] = combos.map(
	(combo) => blocklistEntry(combo, { category: 'os', platform: 'mac' }),
)
