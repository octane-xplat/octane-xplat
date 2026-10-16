import type { ParityCheck } from './parity/check-helpers.ts'
import { dims } from './parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [

	{
		fixture: 'skeleton-basic',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { skeleton: 'parity-skeleton-root' },
		equal: ['skeleton.box.w', 'skeleton.box.h', 'skeleton.style.backgroundColor'],
		check: (m) => [dims(m('skeleton'), 140, 18)],
	}
]
