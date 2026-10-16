import type { ParityCheck } from './parity/check-helpers.ts'
import { controlEqual, controlRows } from './parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [

	{
		fixture: 'form-field-basic',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { control: 'parity-formfield-root' },
		equal: controlEqual,
		check: (m) => controlRows(m, 180, 64),
	}
]
