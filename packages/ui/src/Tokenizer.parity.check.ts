import type { ParityCheck } from './parity/check-helpers.ts'
import { controlEqual, controlRows } from './parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [

	{
		fixture: 'tokenizer-values',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { control: 'parity-tokenizer-root' },
		equal: controlEqual,
		check: (m) => controlRows(m, 220, 44),
	}
]
