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

export type FrozenGestureBasis = (point: Point) => Point

/** Copy an affine window-to-local basis now, independently of future host motion. */
export function freezeGestureBasis(
  convert: (point: Point) => Point | null,
): FrozenGestureBasis | null {
  const zero = convert({ x: 0, y: 0 }),
    x = convert({ x: 1, y: 0 }),
    y = convert({ x: 0, y: 1 })

  if (!zero || !x || !y) {
    return null
  }

  const a = x.x - zero.x,
    b = x.y - zero.y,
    c = y.x - zero.x,
    d = y.y - zero.y

  if (
    ![zero.x, zero.y, a, b, c, d, a * d - b * c].every(Number.isFinite) ||
    Math.abs(a * d - b * c) < 1e-10
  ) {
    return null
  }

  return (point) => ({
    x: zero.x + a * point.x + c * point.y,
    y: zero.y + b * point.x + d * point.y,
  })
}
