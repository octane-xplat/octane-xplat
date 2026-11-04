import type { TextElements } from './text-elements'
import type { BoxPaint } from './box-paint'
import { borderLength, borderRadiusPoints, borderNSColor } from './box-geometry'
import type { Roots } from './roots'
import { createParityMeasurements } from './parity'

interface Dependencies {
  textElements: Pick<TextElements, 'labelPaddings'>
  boxPaint: Pick<BoxPaint, 'borderSpecForNode'>
  roots: Pick<Roots, 'appKitContainers'>
}

export type Measurements = ReturnType<typeof createMeasurements>

export function createMeasurements(deps: Dependencies) {
  const { round, descendants, colorValue, measureParity } = createParityMeasurements({
    labelPaddings: deps.textElements.labelPaddings,
    borderLength: borderLength,
    borderRadiusPoints: borderRadiusPoints,
    borderNSColor: borderNSColor,
    borderSpecForNode: deps.boxPaint.borderSpecForNode,
    appKitContainers: deps.roots.appKitContainers,
  })
  return {
    round,
    descendants,
    colorValue,
    measureParity,
  }
}
