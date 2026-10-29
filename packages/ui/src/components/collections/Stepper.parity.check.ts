import type { ParityCheck } from '../../parity/check-helpers.ts'
import { dims } from '../../parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [
	{
		fixture: 'stepper-middle-active',
		targets: ['web', 'ios', 'android', 'macos'],
		equalTargets: ['web', 'ios', 'android'],
		elements: { root: 'parity-stepper-root', active: 'vx-step--on' },
		equal: [
			'root.box.w',
			'root.box.h',
			'root.style.backgroundColor',
			'active.box.w',
			'active.box.h',
		],
		check: (m) => {
			const active = m('active')
			return [
				dims(m('root'), 220, 40),
				['active step has a visible frame', active.box.w > 0 && active.box.h > 0],
			]
		},
	},
]
