import type { ParityCheck } from './parity/check-helpers.ts'
import { controlEqual, controlRows } from './parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [

	{
		fixture: 'pin-input-filled',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { control: 'parity-pininput-root' },
		equal: controlEqual,
		check: (m) => controlRows(m, 200, 44),
	}
]
