import type { ParityCheck } from '../../parity/check-helpers.ts'
import { headingEqual, headingRows } from '../../parity/check-helpers.ts'

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
		check: (m) => headingRows(m, 28),
	},

	{
		fixture: 'heading-level-3',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { heading: 'parity-heading' },
		equal: headingEqual,
		check: (m) => headingRows(m, 24),
	},

	{
		fixture: 'heading-level-4',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { heading: 'parity-heading' },
		equal: headingEqual,
		check: (m) => headingRows(m, 20),
	},

	{
		fixture: 'heading-level-5',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { heading: 'parity-heading' },
		equal: headingEqual,
		check: (m) => headingRows(m, 20),
	},

	{
		fixture: 'heading-level-6',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { heading: 'parity-heading' },
		equal: headingEqual,
		check: (m) => headingRows(m, 16),
	},

	{
		// The level-1 scale resolves inline, so a text-xl class no longer sizes it —
		// the resolved h1 line box is 32px on every target.
		fixture: 'heading-custom-size',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { heading: 'parity-heading' },
		equal: headingEqual,
		check: (m) => headingRows(m, 32),
	},
]
