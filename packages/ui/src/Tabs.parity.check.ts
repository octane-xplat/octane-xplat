import type { ParityCheck } from './parity/check-helpers.ts'
import { dims } from './parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [

	{
		fixture: 'tabs-second-selected',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: {
			root: 'parity-tabs-root',
			tabbar: 'vx-tabbar',
			pane: 'vx-tabpane',
			content: 'parity-tabs-pane-child',
		},
		equal: [
			'root.box.w',
			'root.box.h',
			'root.style.backgroundColor',
			'tabbar.box.w',
			'pane.box.w',
			'content.box.w',
			'content.box.h',
		],
		check: (m) => [dims(m('root'), 200, 104), dims(m('content'), 200, 48)],
	}
]
