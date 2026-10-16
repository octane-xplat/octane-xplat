import type { ParityCheck } from './parity/check-helpers.ts'
import { dims } from './parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [

	{
		fixture: 'list-item-row',
		targets: ['web', 'ios', 'android'],
		elements: { item: 'parity-list-item-root' },
		equal: ['item.box.w', 'item.box.h', 'item.style.backgroundColor'],
		check: (m) => [dims(m('item'), 220, 64)],
	},

	{
		fixture: 'list-item-standard',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: {
			row: 'vx-item',
			leading: 'vx-item-leading',
			content: 'vx-item-content',
			title: 'vx-item-title',
			supporting: 'vx-item-supporting',
			trailing: 'vx-item-trailing',
		},
		equal: [
			'row.box.w',
			'row.box.h',
			'row.style.backgroundColor',
			'leading.box.x',
			'leading.box.y',
			'leading.box.w',
			'leading.box.h',
			'content.box.x',
			'content.box.y',
			{ path: 'content.box.w', tolerance: 1 },
			{ path: 'content.box.h', tolerance: 1 },
			'title.box.x',
			'title.box.y',
			{ path: 'title.box.w', tolerance: 1 },
			'title.box.h',
			'supporting.box.x',
			'supporting.box.y',
			{ path: 'supporting.box.w', tolerance: 1 },
			'supporting.box.h',
			'trailing.box.x',
			'trailing.box.y',
			'trailing.box.w',
			'trailing.box.h',
		],
		check: (m) => {
			const row = m('row')
			const leading = m('leading')
			const content = m('content')
			const title = m('title')
			const supporting = m('supporting')
			const trailing = m('trailing')
			return [
				dims(row, 220, 64, 1),
				[
					'leading, content, and trailing slots have positive bounds',
					[leading, content, trailing].every((el) => el.box?.w > 0 && el.box?.h > 0),
				],
				[
					'ListItem slots flow from leading to content to trailing',
					leading.box.x < content.box.x && content.box.x < trailing.box.x,
				],
				['supporting text follows the title', title.box.y < supporting.box.y],
				[
					'ListItem renders both text values',
					title.text === 'Event title' && supporting.text === '6:30 PM / 2 tickets',
					`${title.text} / ${supporting.text}`,
				],
				[
					'trailing slot stays inside the row',
					trailing.box.x + trailing.box.w <= row.box.x + row.box.w + 1,
				],
			]
		},
	}
]
