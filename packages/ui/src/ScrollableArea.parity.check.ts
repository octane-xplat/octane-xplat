import type { ParityCheck } from './parity/check-helpers.ts'
import { near, dims } from './parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [
	{
		fixture: 'scroll-view-layout',
		elements: {
			scroll: 'parity-scroll-root',
			content: 'parity-scroll-content',
			first: 'parity-scroll-first',
			second: 'parity-scroll-second',
		},
		equal: ['content.style.flexDirection', 'content.style.alignItems'],
		check: (m) => {
			const scroll = m('scroll')
			const content = m('content')
			const first = m('first')
			const second = m('second')
			return [
				dims(scroll, 96, 32),
				dims(content, 96, 64),
				dims(first, 24, 12),
				dims(second, 24, 12),
				[
					'first content child starts at content origin',
					near(first.box.x - content.box.x, 0, 1) && near(first.box.y - content.box.y, 0, 1),
				],
				[
					'second content child follows with a 4-dip gap',
					near(second.box.y - first.box.y - first.box.h, 4, 1),
					second.box.y - first.box.y - first.box.h,
				],
			]
		},
	},

	{
		fixture: 'scroll-box-layout',
		elements: {
			root: 'parity-scrollbox-root',
			content: 'parity-scrollbox-content',
			first: 'parity-scrollbox-first',
			second: 'parity-scrollbox-second',
		},
		equal: [
			'root.box.w',
			'root.box.h',
			'root.style.backgroundColor',
			'content.box.w',
			'content.box.h',
			'first.box.w',
			'first.box.h',
			'second.box.w',
			'second.box.h',
		],
		check: (m) => {
			const root = m('root')
			const content = m('content')
			const first = m('first')
			const second = m('second')
			return [
				dims(root, 96, 48),
				dims(content, 96, 64),
				dims(first, 24, 12),
				dims(second, 24, 12),
				['content extends below the viewport', content.box.h > root.box.h],
				[
					'second child follows with a 4-dip gap',
					near(second.box.y - first.box.y - first.box.h, 4, 1),
				],
			]
		},
	},
]
