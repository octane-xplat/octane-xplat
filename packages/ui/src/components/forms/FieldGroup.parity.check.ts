import type { ParityCheck } from '../../parity/check-helpers.ts'
import { controlEqual, controlRows } from '../../parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [
	{
		fixture: 'field-group-basic',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { control: 'parity-fieldgroup-root' },
		equal: controlEqual,
		check: (m) => controlRows(m, 180, 64),
	},
]
