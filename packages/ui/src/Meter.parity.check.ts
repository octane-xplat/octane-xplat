import type { ParityCheck } from './parity/check-helpers.ts'
import { dims } from './parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [
	{
		fixture: 'meter-progress',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { meter: 'parity-meter-root' },
		equal: ['meter.box.w', 'meter.box.h', 'meter.style.backgroundColor'],
		check: (m) => [dims(m('meter'), 48, 48)],
	},
]
