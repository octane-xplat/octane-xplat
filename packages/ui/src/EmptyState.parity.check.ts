import type { ParityCheck } from './parity/check-helpers.ts'
import { dims } from './parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [

	{
		fixture: 'empty-state',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { empty: 'parity-empty-root', icon: 'vx-empty-icon' },
		equal: [
			'empty.box.w',
			'empty.box.h',
			'empty.style.backgroundColor',
			'icon.box.w',
			'icon.box.h',
		],
		check: (m) => [dims(m('empty'), 220, 120), dims(m('icon'), 24, 24)],
	}
]
