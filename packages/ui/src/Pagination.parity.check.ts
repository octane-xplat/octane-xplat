import type { ParityCheck } from './parity/check-helpers.ts'
import { dims } from './parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [

	{
		fixture: 'pagination-window',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { pages: 'parity-pagination-root', active: 'vx-page-btn--on' },
		equal: [
			'pages.box.w',
			'pages.box.h',
			'pages.style.backgroundColor',
			'active.box.w',
			'active.box.h',
		],
		check: (m) => {
			const active = m('active')
			return [
				dims(m('pages'), 220, 36),
				['active page has a visible frame', active.box.w > 0 && active.box.h > 0],
			]
		},
	}
]
