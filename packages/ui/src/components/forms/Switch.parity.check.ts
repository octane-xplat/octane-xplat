import type { ParityCheck } from '../../parity/check-helpers.ts'
import { near, dims, circular } from '../../parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [
	{
		fixture: 'switch-off',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { track: 'vx-switch', thumb: 'vx-switch-thumb' },
		equal: [
			'track.style.backgroundColor',
			'thumb.style.backgroundColor',
			'track.style.borderTopLeftRadius',
		],
		check: (m) => {
			const track = m('track')
			const thumb = m('thumb')
			return [
				dims(track, 40, 24),
				dims(thumb, 16, 16),
				circular(thumb),
				[
					'thumb parked left (4 inset)',
					near(thumb.box.x - track.box.x, 4),
					thumb.box.x - track.box.x,
				],
				[
					'thumb centered vertically',
					near(thumb.box.y + thumb.box.h / 2 - track.box.y, 12, 1),
					thumb.box.y + thumb.box.h / 2 - track.box.y,
				],
			]
		},
	},

	{
		fixture: 'switch-on',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { track: 'vx-switch', thumb: 'vx-switch-thumb' },
		equal: ['track.style.backgroundColor', 'thumb.style.backgroundColor'],
		check: (m) => {
			const track = m('track')
			const thumb = m('thumb')
			return [
				dims(track, 40, 24),
				// Astryx grows the thumb 16→20 when on rather than translating it.
				dims(thumb, 20, 20),
				circular(thumb),
				[
					'thumb parked right (2 inset)',
					near(track.box.w - (thumb.box.x - track.box.x) - thumb.box.w, 2),
					track.box.w - (thumb.box.x - track.box.x) - thumb.box.w,
				],
			]
		},
	},
]
