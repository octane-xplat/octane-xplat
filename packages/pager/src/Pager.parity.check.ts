import type { ParityCheck } from '@octane-xplat/ui/parity/check-helpers'
import { dims } from '@octane-xplat/ui/parity/check-helpers'

export const CHECKS: ParityCheck[] = [
	{
		fixture: 'pager-two-pages',
		targets: ['web', 'ios', 'android'],
		elements: { pager: 'parity-pager-root', page: 'parity-pager-page' },
		equal: [
			'pager.box.w',
			'pager.box.h',
			'pager.style.backgroundColor',
			'page.box.w',
			'page.box.h',
		],
		check: (m) => [dims(m('pager'), 220, 96), dims(m('page'), 220, 96)],
	},
]
