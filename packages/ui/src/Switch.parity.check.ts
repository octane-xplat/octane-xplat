import type { ParityCheck } from './parity/check-helpers.ts'
import { near, dims, circular } from './parity/check-helpers.ts'

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
				dims(track, 48, 28),
				dims(thumb, 22, 22),
				circular(thumb),
				[
					'thumb parked left (3 pad)',
					near(thumb.box.x - track.box.x, 3),
					thumb.box.x - track.box.x,
				],
				[
					'thumb centered vertically',
					near(thumb.box.y - track.box.y, 3),
					thumb.box.y - track.box.y,
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
				dims(track, 48, 28),
				dims(thumb, 22, 22),
				circular(thumb),
				[
					'thumb parked right (3 pad)',
					near(track.box.w - (thumb.box.x - track.box.x) - thumb.box.w, 3),
				],
			]
		},
	}
]
