import type { Point } from './types'

/** Logical affine transform, mapping the host's border box to its owning window. */
export interface GestureTransform {
  a: number
  b: number
  c: number
  d: number
  x: number
  y: number
}

export function inverseGestureTransform(
  matrix: GestureTransform,
): ((point: Point) => Point) | null {
  const { a, b, c, d, x, y } = matrix
  const determinant = a * d - b * c

  if (![a, b, c, d, x, y, determinant].every(Number.isFinite) || Math.abs(determinant) < 1e-12) {
    return null
  }

  return (p) => ({
    x: (d * (p.x - x) - c * (p.y - y)) / determinant,
    y: (-b * (p.x - x) + a * (p.y - y)) / determinant,
  })
}
