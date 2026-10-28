import type { ParityCheck } from './parity/check-helpers.ts'
import { controlEqual, controlRows } from './parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [
	{
		fixture: 'input-number-value',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { control: 'parity-inputnumber-root' },
		equal: controlEqual,
		check: (m) => controlRows(m, 160, 40),
	},
]
