import { pressOptions as mouseOptions, type SemanticPressProps } from './semantic-press'
import type { PressOptions } from './press'

/** UIKit has no public tap-slop getter. Use 10 points, also its default long-press movement allowance. */
export function pressOptions(props: SemanticPressProps): PressOptions {
  return { ...mouseOptions(props), slop: 10 }
}
