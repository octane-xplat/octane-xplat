export interface CaptureRect {
	x: number
	y: number
	width: number
	height: number
}

export interface SwitchGeometry {
	stage: CaptureRect
	/** Track and thumb positions are relative to the stage. */
	track: CaptureRect
	thumb: CaptureRect
}

/** Validate host layout before raster comparison; never align or round it. */
export function assertSwitchGeometry(
	actual: SwitchGeometry,
	checked: boolean,
	displacement = 0,
): void {
	if (displacement !== 0 && displacement !== 1) {
		throw new Error('Invalid Switch displacement: expected 0 or 1')
	}

	const expected: SwitchGeometry = {
		stage: { x: 0, y: 0, width: 96, height: 64 },
		track: { x: 24 + displacement, y: 18, width: 48, height: 28 },
		thumb: {
			x: (checked ? 47 : 27) + displacement,
			y: 21,
			width: 22,
			height: 22,
		},
	}

	for (const part of ['stage', 'track', 'thumb'] as const) {
		for (const axis of ['x', 'y', 'width', 'height'] as const) {
			if (actual[part][axis] !== expected[part][axis]) {
				throw new Error(
					`Invalid Switch geometry: ${part}.${axis}=${actual[part][axis]}, expected ${expected[part][axis]}`,
				)
			}
		}
	}
}
