import type { ParityCheck } from './parity/check-helpers.ts'
import { dims } from './parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [
	{
		fixture: 'sheet-fixed-frame',
		elements: { frame: 'parity-portal--sheet-fixed-frame' },
		equal: ['frame.box.w', 'frame.style.backgroundColor'],
		// The iOS RootLayout extends a bottom-docked host through the device's
		// bottom safe area. Check that measured inset instead of treating it as
		// a platform mismatch or hard-coding one device's inset.
		check: (m, target, dump) => {
			const expectedHeight = 80
			if (target === 'ios') {
				const safeArea = dump.cells?.['safe-area-layout']?.find((node) =>
					node.classes?.includes('parity-safe-area-root'),
				)

				const bottomInset = Number(safeArea?.style?.paddingBottom)
				if (!Number.isFinite(bottomInset)) {
					return [
						[
							'iOS sheet includes measured bottom safe area',
							false,
							String(safeArea?.style?.paddingBottom),
						],
					]
				}

				return [dims(m('frame'), 96, expectedHeight + bottomInset)]
			}

			return [dims(m('frame'), 96, expectedHeight)]
		},
	},
]
