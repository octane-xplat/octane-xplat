import type { CheckRow, ParityCheck } from '../../parity/check-helpers.ts'
import { dims } from '../../parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [
	{
		fixture: 'badge-basic',
		targets: ['web', 'ios', 'android', 'macos', 'windows'],
		elements: { badge: 'parity-badge-root' },
		equal: ['badge.box.w', 'badge.box.h', 'badge.style.backgroundColor'],
		check: (m) => [dims(m('badge'), 120, 32)],
	},

	{
		fixture: 'badge-text',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { badge: 'parity-badge-text', label: 'vx-badge-text' },
		check: (m, target) => {
			const badge = m('badge')
			const rows: CheckRow[] = [
				[
					'badge has positive bounds',
					badge.box?.w > 0 && badge.box?.h > 0,
					`${badge.box?.w}×${badge.box?.h}`,
				],
			]

			// Web hosts the string as a DOM text child of the badge element;
			// native/AppKit route it through a vx-badge-text label.
			if (target === 'web') {
				rows.push(['raw string child renders', badge.text === '42', badge.text])
			} else {
				rows.push([
					'raw string child renders in a text host',
					m('label').text === '42',
					m('label').text,
				])
			}

			return rows
		},
	},
]
