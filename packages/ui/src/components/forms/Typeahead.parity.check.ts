import type { ParityCheck } from '../../parity/check-helpers.ts'
import { controlEqual, controlRows } from '../../parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [
	{
		fixture: 'typeahead-value',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { control: 'parity-typeahead-root' },
		equal: controlEqual,
		check: (m) => controlRows(m, 220, 44),
	},
]
