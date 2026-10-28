import type { ParityCheck } from './parity/check-helpers.ts'
import { near, dims } from './parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [
	{
		fixture: 'tooltip-trigger',
		targets: ['web', 'ios', 'android'],
		elements: { anchor: 'parity-tooltip-anchor', trigger: 'parity-tooltip-trigger' },
		equal: [
			'anchor.box.w',
			'anchor.box.h',
			'anchor.style.backgroundColor',
			'trigger.box.x',
			'trigger.box.y',
			'trigger.box.w',
			'trigger.box.h',
			'trigger.style.backgroundColor',
		],
		check: (m) => {
			const anchor = m('anchor')
			const trigger = m('trigger')
			return [
				dims(anchor, 180, 48, 1),
				dims(trigger, 72, 24, 1),
				[
					'trigger starts at the anchor origin',
					near(trigger.box?.x, 0, 1) && near(trigger.box?.y, 0, 1),
					`${trigger.box?.x},${trigger.box?.y}`,
				],
				[
					'trigger stays inside the anchor',
					trigger.box?.x >= 0 &&
						trigger.box?.y >= 0 &&
						trigger.box.x + trigger.box.w <= anchor.box?.w + 1 &&
						trigger.box.y + trigger.box.h <= anchor.box?.h + 1,
				],
			]
		},
	},
]
