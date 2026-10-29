import type { ParityCheck } from '../../parity/check-helpers.ts'
import { near, dims } from '../../parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [
	{
		fixture: 'popover-bottom-frame',
		targets: ['web', 'ios', 'android'],
		elements: { anchor: 'parity-popover-anchor', panel: 'vx-popover' },
		equal: ['panel.box.w', 'panel.box.h'],
		check: (m) => {
			const anchor = m('anchor')
			const panel = m('panel')
			return [
				dims(anchor, 24, 20),
				dims(panel, 48, 32),
				['panel aligns with anchor left edge', near(panel.box.x, anchor.box.x, 1)],
				[
					'panel follows anchor with an 8-dip gap',
					near(panel.box.y - anchor.box.y - anchor.box.h, 8, 1),
				],
			]
		},
	},
]
