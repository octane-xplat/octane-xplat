import type { ParityCheck } from './parity/check-helpers.ts'
import { controlEqual, controlRows } from './parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [
	{
		fixture: 'select-value',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { control: 'parity-select-root' },
		equal: controlEqual,
		check: (m) => controlRows(m, 160, 40),
	},
]
