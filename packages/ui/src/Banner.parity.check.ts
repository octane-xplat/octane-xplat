import type { ParityCheck } from './parity/check-helpers.ts'
import { dims } from './parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [

	{
		fixture: 'banner-dismissible',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: {
			banner: 'parity-banner-root',
			icon: 'vx-banner-icon',
			dismiss: 'vx-banner-dismiss',
		},
		equal: [
			'banner.box.w',
			'banner.box.h',
			'banner.style.backgroundColor',
			'icon.box.w',
			'icon.box.h',
			'dismiss.style.marginLeft',
		],
		check: (m) => {
			const dismiss = m('dismiss')
			return [
				dims(m('banner'), 220, 48),
				dims(m('icon'), 24, 24),
				['dismiss affordance has a visible frame', dismiss.box.w > 0 && dismiss.box.h > 0],
			]
		},
	}
]
