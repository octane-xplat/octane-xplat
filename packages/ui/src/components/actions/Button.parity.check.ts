import type { ParityCheck } from '../../parity/check-helpers.ts'
import {
	buttonEqual,
	buttonNaturalEqual,
	buttonRows,
	buttonNaturalRows,
} from '../../parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [
	{
		fixture: 'button-basic',
		elements: { btn: 'vx-button', label: 'parity-txt' },
		equal: buttonEqual,
		check: (m) => buttonRows(m, 220, 32),
	},

	{
		fixture: 'button-compact',
		elements: { btn: 'vx-button', label: 'parity-txt' },
		equal: buttonEqual,
		check: (m) => buttonRows(m, 96, 28),
	},

	{
		fixture: 'button-long-label',
		elements: { btn: 'vx-button', label: 'parity-txt' },
		equal: buttonEqual,
		check: (m) => buttonRows(m, 160, 36),
	},

	{
		fixture: 'button-natural',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { btn: 'parity-button-natural', label: 'parity-txt' },
		equal: buttonNaturalEqual,
		check: (m) => buttonNaturalRows(m),
	},
]
