import type { ParityCheck } from './parity/check-helpers.ts'
import { dims } from './parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [
	{
		fixture: 'context-menu-target',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { root: 'parity-contextmenu-root', target: 'parity-contextmenu-target' },
		equal: [
			'root.box.w',
			'root.box.h',
			'root.style.backgroundColor',
			'target.box.w',
			'target.box.h',
		],
		check: (m) => [dims(m('root'), 180, 56), dims(m('target'), 144, 28)],
	},
]
