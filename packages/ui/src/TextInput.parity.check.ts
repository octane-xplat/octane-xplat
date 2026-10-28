import type { ParityCheck } from './parity/check-helpers.ts'
import {
	inputEqual,
	inputNaturalEqual,
	inputRows,
	inputNaturalRows,
} from './parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [
	{
		fixture: 'text-input',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { field: 'parity-textinput' },
		equal: inputEqual,
		check: (m) => inputRows(m),
	},

	{
		fixture: 'text-input-filled',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { field: 'parity-textinput' },
		equal: inputEqual,
		check: (m) => inputRows(m),
	},

	{
		fixture: 'text-input-natural',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { field: 'parity-textinput' },
		equal: inputNaturalEqual,
		check: (m, target) => inputNaturalRows(m, target),
	},
]
