import type { ParityCheck } from './parity/check-helpers.ts'
import { buttonEqual, buttonRows } from './parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [
	{
		fixture: 'pressable-basic',
		elements: { btn: 'parity-pressable', label: 'parity-txt' },
		equal: buttonEqual,
		check: (m) => buttonRows(m, 220, 32),
	},
]
