import type { ParityCheck } from './parity/check-helpers.ts'
import { dims } from './parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [

	{
		fixture: 'timeline-two-events',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { timeline: 'parity-timeline-root', dot: 'vx-timeline-dot' },
		equal: [
			'timeline.box.w',
			'timeline.box.h',
			'timeline.style.backgroundColor',
			'dot.box.w',
			'dot.box.h',
		],
		check: (m) => [dims(m('timeline'), 200, 112), dims(m('dot'), 10, 10)],
	}
]
