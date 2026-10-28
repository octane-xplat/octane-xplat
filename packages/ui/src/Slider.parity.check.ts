import type { ParityCheck } from './parity/check-helpers.ts'
import { near, dims, circular } from './parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [
	{
		fixture: 'slider-0',
		targets: ['web', 'ios', 'android', 'macos'],
		equalTargets: ['web', 'ios', 'android', 'macos'],
		elements: {
			host: 'vx-slider',
			track: 'vx-slider-track',
			fill: 'vx-slider-fill',
			thumb: 'vx-slider-thumb',
		},
		equal: [
			'track.style.backgroundColor',
			'track.style.borderTopLeftRadius',
			'fill.style.backgroundColor',
			'fill.style.borderTopLeftRadius',
			'thumb.style.backgroundColor',
		],
		check: (m, target) => {
			const host = m('host')
			const track = m('track')
			const fill = m('fill')
			const thumb = m('thumb')
			return [
				dims(host, 220, 28, 1),
				dims(track, 220, 4, 1),
				dims(thumb, 20, 20),
				circular(thumb),
				[
					'track vertically centered',
					near(track.box.y - host.box.y, 12, 1),
					track.box.y - host.box.y,
				],
				[
					'thumb vertically centered',
					near(thumb.box.y - host.box.y, 4, 1),
					thumb.box.y - host.box.y,
				],
				['empty fill', near(fill.box.w, 0, 1), fill.box.w],
				// Web and macOS center the thumb on each end value; iOS and
				// Android keep it inside the track.
				[
					'thumb at min edge (web and macOS overhang −10, iOS and Android clamp flush)',
					near(thumb.box.x - track.box.x, target === 'web' || target === 'macos' ? -10 : 0, 1),
					thumb.box.x - track.box.x,
				],
			]
		},
	},

	{
		fixture: 'slider-50',
		targets: ['web', 'ios', 'android', 'macos'],
		equalTargets: ['web', 'ios', 'android', 'macos'],
		elements: {
			host: 'vx-slider',
			track: 'vx-slider-track',
			fill: 'vx-slider-fill',
			thumb: 'vx-slider-thumb',
		},
		equal: ['fill.style.backgroundColor'],
		check: (m) => {
			const track = m('track')
			const fill = m('fill')
			const thumb = m('thumb')
			return [
				dims(track, 220, 4, 1),
				['fill is half the track', near(fill.box.w, 110, 1), fill.box.w],
				['thumb centered at 50%', near(thumb.box.x + thumb.box.w / 2 - track.box.x, 110, 1)],
			]
		},
	},
]
