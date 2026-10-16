import type { ParityCheck } from './parity/check-helpers.ts'
import { dims } from './parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [

	{
		fixture: 'badge-basic',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { badge: 'parity-badge-root' },
		equal: ['badge.box.w', 'badge.box.h', 'badge.style.backgroundColor'],
		check: (m) => [dims(m('badge'), 120, 32)],
	}
]
