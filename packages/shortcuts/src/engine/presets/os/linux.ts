import { blocklistEntry } from '../blocklistEntry.js'

const combos = [
	'Meta+L',
	'Meta+Tab',
	'Meta+`',
	'Meta+A',
	'Meta+V',
	'Meta+PageUp',
	'Meta+PageDown',
	'Shift+Meta+PageUp',
	'Shift+Meta+PageDown',
	'Shift+Meta+ArrowLeft',
	'Shift+Meta+ArrowRight',
	'Alt+Tab',
	'Alt+Esc',
	'Alt+F2',
	'Alt+F4',
	'Ctrl+Alt+Tab',
	'Ctrl+Alt+Delete',
	'Ctrl+Alt+T',
	'Ctrl+Alt+ArrowLeft',
	'Ctrl+Alt+ArrowRight',
	'Ctrl+Alt+Shift+R',
]

export const linuxOsShortcuts = combos.map((combo) =>
	blocklistEntry(combo, { category: 'os', platform: 'linux' }),
)
