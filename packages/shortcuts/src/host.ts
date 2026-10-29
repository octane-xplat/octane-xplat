import type { ShortcutHost } from './host-types.js'

export const host: ShortcutHost = {
	delay() {
		throw new Error('Shortcut timers require a supported host')
	},
	platform: () => 'other',
	subscribe() {
		throw new Error(
			'Keyboard shortcuts require a web, macos, gtk or windows host condition. Mobile hardware shortcuts are not supported.',
		)
	},
	boundaryDepth: () => undefined,
	isEditableTarget: () => false,
}
