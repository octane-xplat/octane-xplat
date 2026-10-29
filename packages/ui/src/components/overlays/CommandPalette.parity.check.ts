import type { ParityCheck, CheckRow } from '../../parity/check-helpers.ts'
import { near, dims } from '../../parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [
	{
		fixture: 'command-palette-open',
		targets: ['web', 'ios', 'android', 'macos'],
		equalTargets: ['web', 'ios', 'android'],
		elements: { panel: 'parity-portal--command-palette-open', list: 'vx-cmdk-list' },
		// The list fills the panel content box; native and DOM border/padding boxes measure it differently.
		equal: ['panel.box.w', 'panel.box.h', 'panel.style.backgroundColor'],
		check: (m, target) => {
			const list = m('list')
			const expectedWidth = ({ web: 182, ios: 184, android: 181.71 } as Record<string, number>)[
				target
			]
			const rows: CheckRow[] = [
				dims(m('panel'), 200, 96),
				['command list has a visible frame', list.box.w > 0 && list.box.h > 0],
			]

			if (expectedWidth !== undefined) {
				rows.push([
					'command list width matches target content box',
					near(list.box.w, expectedWidth, 1),
					`${list.box.w}px; expected ${expectedWidth}px`,
				])
			}

			return rows
		},
	},
]
