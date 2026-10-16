import type { ParityCheck } from './parity/check-helpers.ts'
import { dims } from './parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [

	{
		fixture: 'alert-warning',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { alert: 'parity-alert-root', icon: 'vx-alert-icon' },
		equal: [
			'alert.box.w',
			'alert.box.h',
			'alert.style.backgroundColor',
			'alert.style.borderTopColor',
			'icon.box.w',
			'icon.box.h',
		],
		check: (m) => [dims(m('alert'), 220, 64), dims(m('icon'), 24, 24)],
	}
]
