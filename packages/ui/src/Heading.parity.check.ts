import type { ParityCheck } from './parity/check-helpers.ts'
import { headingEqual, headingRows } from './parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [

	{
		fixture: 'heading-level-1',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { heading: 'parity-heading' },
		equal: headingEqual,
		check: (m) => headingRows(m, 32),
	},

	{
		fixture: 'heading-level-2',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { heading: 'parity-heading' },
		equal: headingEqual,
		check: (m) => headingRows(m, 24),
	},

	{
		fixture: 'heading-level-3',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { heading: 'parity-heading' },
		equal: headingEqual,
		check: (m) => headingRows(m, 18.72),
	},

	{
		fixture: 'heading-level-4',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { heading: 'parity-heading' },
		equal: headingEqual,
		check: (m) => headingRows(m, 16),
	},

	{
		fixture: 'heading-level-5',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { heading: 'parity-heading' },
		equal: headingEqual,
		check: (m) => headingRows(m, 13.28),
	},

	{
		fixture: 'heading-level-6',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { heading: 'parity-heading' },
		equal: headingEqual,
		check: (m) => headingRows(m, 10.72),
	},

	{
		fixture: 'heading-custom-size',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { heading: 'parity-heading' },
		equal: headingEqual,
		check: (m) => headingRows(m, 20),
	}
]
