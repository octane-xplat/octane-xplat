import type { TextElements } from './text-elements'
import type { BorderPaint } from './border-paint'
import type { Roots } from './roots'
import { createParityMeasurements } from './parity'

interface Dependencies {
  textElements: Pick<TextElements, 'labelPaddings'>
  borderPaint: Pick<BorderPaint, 'borderLength' | 'borderRadiusPoints' | 'borderNSColor'>
  roots: Pick<Roots, 'appKitContainers'>
}

export type Measurements = ReturnType<typeof createMeasurements>

export function createMeasurements(deps: Dependencies) {
  const { round, descendants, colorValue, measureParity } = createParityMeasurements({
    labelPaddings: deps.textElements.labelPaddings,
    borderLength: deps.borderPaint.borderLength,
    borderRadiusPoints: deps.borderPaint.borderRadiusPoints,
    borderNSColor: deps.borderPaint.borderNSColor,
    appKitContainers: deps.roots.appKitContainers,
  })
  return {
    round,
    descendants,
    colorValue,
    measureParity,
  }
}
