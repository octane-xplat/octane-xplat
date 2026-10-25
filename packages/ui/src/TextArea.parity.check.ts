import type { ParityCheck } from './parity/check-helpers.ts'
import { textAreaEqual, textAreaRows, textAreaRowsIntrinsic } from './parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [

	{
		fixture: 'text-area',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { field: 'parity-textarea' },
		equal: textAreaEqual,
		check: (m, target) => textAreaRows(m, target),
	},

	{
		fixture: 'text-area-filled',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { field: 'parity-textarea' },
		equal: textAreaEqual,
		check: (m, target) => textAreaRows(m, target),
	},

	{
		fixture: 'text-area-rows-2',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { field: 'parity-textarea' },
		equal: textAreaEqual,
		// Web: Astryx metrics — 2 rows × 20px leading + 8px block padding.
		check: (m, target) => textAreaRowsIntrinsic(m, target, target === 'web' ? 48 : 36),
	},

	{
		fixture: 'text-area-rows-default',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { field: 'parity-textarea' },
		equal: textAreaEqual,
		check: (m, target) => textAreaRowsIntrinsic(m, target, target === 'web' ? 68 : 54),
	}
]
