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
    track: { x: 28 + displacement, y: 20, width: 40, height: 24 },
    thumb: checked
      ? { x: 46 + displacement, y: 22, width: 20, height: 20 }
      : { x: 32 + displacement, y: 24, width: 16, height: 16 },
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
