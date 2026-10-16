import type { ParityCheck } from './parity/check-helpers.ts'
import { near, dims } from './parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [

	{
		fixture: 'hoverable-anchor',
		targets: ['web', 'ios', 'android'],
		// Position + interaction anchor on the first element child — the
		// web trigger wrapper is display:contents and has no box.
		elements: { anchor: 'parity-hoverable-child' },
		equal: [
			'anchor.box.x',
			'anchor.box.y',
			'anchor.box.w',
			'anchor.box.h',
			'anchor.style.backgroundColor',
		],
		check: (m) => {
			const anchor = m('anchor')
			return [
				dims(anchor, 72, 24, 1),
				[
					'anchor starts at the fixture origin',
					near(anchor.box?.x, 0, 1) && near(anchor.box?.y, 0, 1),
					`${anchor.box?.x},${anchor.box?.y}`,
				],
			]
		},
	}
]
