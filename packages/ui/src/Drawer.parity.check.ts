import type { ParityCheck } from './parity/check-helpers.ts'
import { near, dims } from './parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [

	{
		fixture: 'drawer-open-frame',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: {
			root: 'parity-drawer-root',
			main: 'vx-drawer-main',
			backdrop: 'vx-drawer-backdrop',
			panel: 'vx-drawer-panel',
		},
		equal: [
			'root.box.w',
			'root.box.h',
			'root.style.backgroundColor',
			'main.box.w',
			'main.box.h',
			'backdrop.box.w',
			'backdrop.box.h',
			'panel.box.x',
			'panel.box.y',
			'panel.box.w',
			'panel.box.h',
		],
		check: (m) => {
			const root = m('root')
			const main = m('main')
			const backdrop = m('backdrop')
			const panel = m('panel')
			return [
				dims(root, 320, 48),
				dims(main, 320, 48),
				dims(backdrop, 320, 48),
				['drawer panel is 280 dip wide', near(panel.box.w, 280, 1), panel.box.w],
				[
					'drawer panel starts at the root origin',
					near(panel.box.x - root.box.x, 0, 1) && near(panel.box.y - root.box.y, 0, 1),
				],
			]
		},
	}
]
