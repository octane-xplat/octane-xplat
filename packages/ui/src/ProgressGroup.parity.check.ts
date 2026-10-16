import type { ParityCheck } from './parity/check-helpers.ts'
import { dims } from './parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [

	{
		fixture: 'progress-group-two-items',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { group: 'parity-progress-group-root', meter: 'vx-meter' },
		equal: [
			'group.box.w',
			'group.box.h',
			'group.style.backgroundColor',
			'meter.box.w',
			'meter.box.h',
		],
		check: (m) => [dims(m('group'), 220, 88), dims(m('meter'), 24, 24)],
	}
]
