/** Each stroke shares the same leading edge. Longer, softer strokes form the tail. */
export const beamStrokes = [
  { length: 0.22, width: 4, color: '#8d6aff', opacity: 0.14 },
  { length: 0.16, width: 3, color: '#8d6aff', opacity: 0.44 },
  { length: 0.1, width: 1.5, color: '#a79aff', opacity: 0.9 },
  { length: 0.036, width: 1.5, color: '#b5ebff', opacity: 1 },
] as const

export const beamDuration = 2800
export const beamInset = 2

export function beamChannels(hex: string): [number, number, number] {
  const color = Number.parseInt(hex.slice(1), 16)

  return [((color >> 16) & 255) / 255, ((color >> 8) & 255) / 255, (color & 255) / 255]
}

export function beamRadius(radius = 12): number {
  return Number.isFinite(radius) ? Math.max(0, radius) : 12
}

export interface BeamTrack {
  width: number
  height: number
  radius: number
  perimeter: number
}

/** The native path follows the same inset and radius as the web SVG. */
export function beamTrack(width: number, height: number, radius: number): BeamTrack | null {
  const pathWidth = width - 2 * beamInset
  const pathHeight = height - 2 * beamInset

  if (pathWidth <= 0 || pathHeight <= 0) {
    return null
  }

  const pathRadius = Math.min(Math.max(0, radius - beamInset), pathWidth / 2, pathHeight / 2)
  const perimeter = 2 * (pathWidth + pathHeight) + (2 * Math.PI - 8) * pathRadius

  return { width: pathWidth, height: pathHeight, radius: pathRadius, perimeter }
}
