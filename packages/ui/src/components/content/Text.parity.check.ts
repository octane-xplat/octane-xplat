import type { ParityCheck } from '../../parity/check-helpers.ts'
import {
	textEqual,
	textLongEqual,
	textClassRows,
	textRows,
	textLongRows,
} from '../../parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [
	{
		fixture: 'text-class-sm',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { text: 'parity-text' },
		equal: textEqual,
		check: (m) => textClassRows(m, 13, 20),
	},

	{
		fixture: 'text-class-lg',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { text: 'parity-text' },
		equal: textEqual,
		check: (m) => textClassRows(m, 18, 28),
	},

	{
		fixture: 'text-class-xl',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { text: 'parity-text' },
		equal: textEqual,
		check: (m) => textClassRows(m, 20, 28),
	},

	{
		fixture: 'text-class-2xl',
		targets: ['web', 'ios', 'android', 'macos', 'windows'],
		equal: textEqual,
		elements: { text: 'parity-text' },
		check: (m) => textClassRows(m, 28, 36),
	},

	{
		fixture: 'text-basic',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { text: 'parity-text' },
		equal: textEqual,
		check: (m) => textRows(m, 20, 84.17),
	},

	{
		fixture: 'text-bold',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { text: 'parity-text' },
		equal: textEqual,
		check: (m) => textRows(m, 20),
	},

	{
		fixture: 'text-regular',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { text: 'parity-text' },
		equal: textEqual,
		check: (m) => textRows(m, 20),
	},

	{
		fixture: 'text-small',
		targets: ['web', 'ios', 'android', 'macos', 'windows'],
		elements: { text: 'parity-text' },
		equal: textEqual,
		check: (m) => textRows(m, 16),
	},

	{
		fixture: 'text-display',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { text: 'parity-text' },
		equal: textEqual,
		check: (m) => textRows(m, 24),
	},

	{
		fixture: 'text-long',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { text: 'parity-text' },
		equal: textLongEqual,
		check: textLongRows,
	},

	{
		fixture: 'text-advance',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { text: 'parity-text' },
		equal: textEqual,
		check: (m) => textRows(m, 20),
	},
]
