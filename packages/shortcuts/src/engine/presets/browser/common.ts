import { blocklistEntry } from '../blocklistEntry.js'

const combos = [
	'Mod+N',
	'Mod+T',
	'Mod+Shift+T',
	'Mod+W',
	'Mod+L',
	'Mod+R',
	'Mod+Shift+R',
	'Mod+F',
	'Mod+P',
	'Mod+S',
	'Mod+O',
	'Mod+0',
	'Mod+-',
	'Mod+1',
	'Mod+2',
	'Mod+3',
	'Mod+4',
	'Mod+5',
	'Mod+6',
	'Mod+7',
	'Mod+8',
	'Mod+9',
]

export const commonBrowserShortcuts: import('../../types/public.js').ShortcutBlocklistEntry[] =
	combos.map((combo) => blocklistEntry(combo, { category: 'browser' }))
