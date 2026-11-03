import type { createNativeStyle } from './native-style'
import type { createTextElements } from './text-elements'
import type { createBorderPaint } from './border-paint'
import type { createRoots } from './roots'
import { createParityMeasurements } from './parity'

interface Dependencies {
  nativeStyle: Pick<ReturnType<typeof createNativeStyle>, 'normalizeClass' | 'effectiveStyle'>
  textElements: Pick<ReturnType<typeof createTextElements>, 'labelPaddings'>
  borderPaint: Pick<
    ReturnType<typeof createBorderPaint>,
    'borderLength' | 'borderRadiusPoints' | 'borderNSColor'
  >
  roots: Pick<ReturnType<typeof createRoots>, 'appKitContainers'>
}

export function createMeasurements(deps: Dependencies) {
  const { round, nodeClasses, descendants, colorValue, measureParity } = createParityMeasurements({
    normalizeClass: deps.nativeStyle.normalizeClass,
    effectiveStyle: deps.nativeStyle.effectiveStyle,
    labelPaddings: deps.textElements.labelPaddings,
    borderLength: deps.borderPaint.borderLength,
    borderRadiusPoints: deps.borderPaint.borderRadiusPoints,
    borderNSColor: deps.borderPaint.borderNSColor,
    appKitContainers: deps.roots.appKitContainers,
  })
  return {
    round,
    nodeClasses,
    descendants,
    colorValue,
    measureParity,
  }
}
