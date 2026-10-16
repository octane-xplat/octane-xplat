import type { ParityCheck } from './parity/check-helpers.ts'
import { dims } from './parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [

	{
		fixture: 'navigation-menu-active',
		targets: ['web', 'ios', 'android', 'macos'],
		equalTargets: ['web', 'ios', 'android'],
		elements: { root: 'parity-navmenu-root', active: 'vx-navmenu-strip-item--active' },
		equal: [
			'root.box.w',
			'root.box.h',
			'root.style.backgroundColor',
			'active.box.w',
			'active.box.h',
			'active.style.backgroundColor',
		],
		check: (m) => {
			const active = m('active')
			return [
				dims(m('root'), 220, 40),
				['active item has a visible frame', active.box.w > 0 && active.box.h > 0],
			]
		},
	}
]
