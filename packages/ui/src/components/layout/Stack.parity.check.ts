import type { ParityCheck } from '../../parity/check-helpers.ts'
import { near, dims } from '../../parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [
	{
		fixture: 'stack-overlay-layout',
		targets: ['web', 'ios', 'android', 'macos', 'windows'],
		elements: {
			root: 'parity-stack-root',
			base: 'parity-stack-base',
			overlay: 'parity-stack-overlay',
		},
		equal: [
			'root.box.w',
			'root.box.h',
			'base.box.x',
			'base.box.y',
			'base.box.w',
			'base.box.h',
			'overlay.box.x',
			'overlay.box.y',
			'overlay.box.w',
			'overlay.box.h',
		],
		check: (m) => {
			const root = m('root')
			const base = m('base')
			const overlay = m('overlay')
			return [
				dims(root, 96, 48, 1),
				dims(base, 48, 32, 1),
				dims(overlay, 20, 10, 1),
				[
					'children share the Stack origin',
					near(base.box.x - root.box.x, 0, 1) &&
						near(base.box.y - root.box.y, 0, 1) &&
						near(overlay.box.x - root.box.x, 0, 1) &&
						near(overlay.box.y - root.box.y, 0, 1),
				],
			]
		},
	},
	{
		fixture: 'stack-overlay-offset',
		targets: ['web', 'windows'],
		elements: {
			root: 'parity-stack-root',
			base: 'parity-stack-base',
			overlay: 'parity-stack-offset',
		},
		equal: [
			'root.box.w',
			'root.box.h',
			'base.box.x',
			'base.box.y',
			'overlay.box.x',
			'overlay.box.y',
			'overlay.box.w',
			'overlay.box.h',
		],
		check: (m) => {
			const root = m('root')
			const base = m('base')
			const overlay = m('overlay')
			return [
				dims(overlay, 20, 10, 1),
				[
					'offset child keeps its authored insets',
					near(overlay.box.x - root.box.x, 10, 1) && near(overlay.box.y - root.box.y, 5, 1),
				],
				[
					'base still shares the Stack origin',
					near(base.box.x - root.box.x, 0, 1) && near(base.box.y - root.box.y, 0, 1),
				],
			]
		},
	},
]
