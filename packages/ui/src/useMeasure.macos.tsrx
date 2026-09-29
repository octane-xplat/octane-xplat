/** @jsxImportSource @xplat/macos/renderer */
import { useState } from 'octane'
import type { MeasureBounds, UseMeasureOptions } from './props'

export function useMeasure(_options?: UseMeasureOptions) @{
	const [bounds, setBounds] = useState<MeasureBounds | null>(null)
	const bind = (view: any) => {
		const frame = view?.frame
		if (frame) {
			// Fresh object each read — skip the setState when nothing moved
			// or the re-render → ref → bind loop never ends.
			setBounds((prev: MeasureBounds | null) =>
				prev &&
				prev.x === frame.origin.x && prev.y === frame.origin.y &&
				prev.width === frame.size.width && prev.height === frame.size.height
					? prev
					: { x: frame.origin.x, y: frame.origin.y, width: frame.size.width, height: frame.size.height },
			)
		}
	}

	return { bind, bounds }
}
