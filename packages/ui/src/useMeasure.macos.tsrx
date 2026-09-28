/** @jsxImportSource @xplat/macos/renderer */
import { useState } from 'octane'
import type { MeasureBounds, UseMeasureOptions } from './props'

export function useMeasure(_options?: UseMeasureOptions) @{
	const [bounds, setBounds] = useState<MeasureBounds | null>(null)
	const bind = (view: any) => {
		const frame = view?.frame
		if (frame) {
			setBounds({ x: frame.origin.x, y: frame.origin.y, width: frame.size.width, height: frame.size.height })
		}
	}
	return { bind, bounds }
}
