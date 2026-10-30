import type { ParityCheck } from '../../parity/check-helpers.ts'
import {
	textEqual,
	textLongEqual,
	textClassRows,
	textRows,
	textLongRows,
} from '../../parity/check-helpers.ts'

const textWrapCheck: ParityCheck['check'] = (m) => {
	const root = m('root').box
	const text = m('text').box
	return [
		['text wraps into multiple lines', text.h > 30, text.h],
		['text uses the constrained width', Math.abs(text.w - root.w) <= 1, { root, text }],
		[
			'text fits within the available width',
			text.w > 0 && text.x >= root.x - 1 && text.x + text.w <= root.x + root.w + 1,
			{ root, text },
		],
	]
}

export const CHECKS: ParityCheck[] = [
	{
		fixture: 'text-wrap-start',
		targets: ['web', 'ios', 'android', 'macos', 'windows'],
		elements: { root: 'parity-text-wrap-root', text: 'parity-text-wrap-content' },
		check: textWrapCheck,
	},
	{
		fixture: 'text-wrap-center',
		targets: ['web', 'ios', 'android', 'macos', 'windows'],
		elements: { root: 'parity-text-wrap-root', text: 'parity-text-wrap-content' },
		check: textWrapCheck,
	},
	{
		fixture: 'text-wrap-row',
		targets: ['web', 'ios', 'android', 'macos', 'windows'],
		elements: { root: 'parity-text-wrap-root', text: 'parity-text-wrap-content' },
		check: textWrapCheck,
	},
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
