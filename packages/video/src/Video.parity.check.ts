import type { ParityCheck } from '@octane-xplat/ui/parity/check-helpers'
import { dims } from '@octane-xplat/ui/parity/check-helpers'

export const CHECKS: ParityCheck[] = [

	{
		fixture: 'video-hosted-frame',
		targets: ['web', 'ios', 'android'],
		elements: { video: 'parity-video-root', play: 'vx-video-centerbtn' },
		equal: [
			'video.box.w',
			'video.box.h',
			'video.style.backgroundColor',
			'play.box.w',
			'play.box.h',
			'play.style.backgroundColor',
		],
		check: (m) => [dims(m('video'), 220, 124), dims(m('play'), 56, 56)],
	}
]
