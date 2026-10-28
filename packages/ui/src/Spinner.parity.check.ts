import type { ParityCheck } from './parity/check-helpers.ts'
import { dims } from './parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [
	{
		fixture: 'activity-indicator-busy',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { spinner: 'parity-activity-indicator-root' },
		equal: [
			'spinner.box.w',
			'spinner.box.h',
			'spinner.style.borderTopWidth',
			'spinner.style.borderTopColor',
		],
		check: (m) => [dims(m('spinner'), 24, 24)],
	},
]
