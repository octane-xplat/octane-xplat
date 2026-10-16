import type { ParityCheck } from './parity/check-helpers.ts'
import { near, dims } from './parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [

	{
		fixture: 'grid-layout',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: {
			root: 'parity-grid-root',
			fixed: 'parity-grid-fixed',
			weighted: 'parity-grid-weighted',
			auto: 'parity-grid-auto',
			fill: 'parity-grid-fill',
			automatic: 'parity-grid-automatic',
			colSpan: 'parity-grid-col-span',
			rowSpan: 'parity-grid-row-span',
		},
		equal: [
			'root.box.w',
			'root.box.h',
			'fixed.box.x',
			'fixed.box.y',
			'fixed.box.w',
			'fixed.box.h',
			'weighted.box.x',
			'weighted.box.y',
			'weighted.box.w',
			'weighted.box.h',
			'auto.box.x',
			'auto.box.y',
			'auto.box.w',
			'auto.box.h',
			'fill.box.x',
			'fill.box.y',
			'fill.box.w',
			'fill.box.h',
			'automatic.box.x',
			'automatic.box.y',
			'automatic.box.w',
			'automatic.box.h',
			'colSpan.box.x',
			'colSpan.box.y',
			'colSpan.box.w',
			'colSpan.box.h',
			'rowSpan.box.x',
			'rowSpan.box.y',
			'rowSpan.box.w',
			'rowSpan.box.h',
		],
		check: (m) => {
			const root = m('root')
			const fixed = m('fixed')
			const weighted = m('weighted')
			const auto = m('auto')
			const fill = m('fill')
			const automatic = m('automatic')
			const colSpan = m('colSpan')
			const rowSpan = m('rowSpan')
			return [
				dims(root, 96, 48, 1),
				dims(fixed, 30, 12, 1),
				['fixed cell starts at grid origin', near(fixed.box.x, 0, 1) && near(fixed.box.y, 0, 1)],
				dims(weighted, 44, 12, 1),
				['weighted column starts after the fixed 30-dip column', near(weighted.box.x, 30, 1)],
				dims(auto, 30, 10, 1),
				['auto row follows the fixed 12-dip row', near(auto.box.y, 12, 1)],
				dims(fill, 22, 13, 1),
				['second fraction row follows the first', near(fill.box.y, 35, 1)],
				['fill cell starts at the final column', near(fill.box.x, 74, 1)],
				dims(automatic, 22, 12, 1),
				[
					'unplaced child flows to the first free cell',
					near(automatic.box.x, 74, 1) && near(automatic.box.y, 0, 1),
				],
				dims(colSpan, 66, 10, 1),
				[
					'column span starts at the weighted columns',
					near(colSpan.box.x, 30, 1) && near(colSpan.box.y, 12, 1),
				],
				dims(rowSpan, 30, 26, 1),
				['row span covers both fraction rows', near(rowSpan.box.y, 22, 1)],
			]
		},
	}
]
