import type { TextElements } from './text-elements'
import type { BoxPaint } from './box-paint'
import { borderLength, borderRadiusPoints, borderNSColor } from './box-geometry'
import type { RootDirectoryReader } from './root-directory'
import { createParityMeasurements } from './parity'

interface Dependencies {
  textElements: Pick<TextElements, 'labelPaddings'>
  boxPaint: Pick<BoxPaint, 'borderSpecForNode'>
  directory: Pick<RootDirectoryReader, 'containers'>
}

export type Measurements = ReturnType<typeof createMeasurements>

export function createMeasurements(deps: Dependencies) {
  const { round, descendants, colorValue, measureParity } = createParityMeasurements({
    labelPaddings: deps.textElements.labelPaddings,
    borderLength: borderLength,
    borderRadiusPoints: borderRadiusPoints,
    borderNSColor: borderNSColor,
    borderSpecForNode: deps.boxPaint.borderSpecForNode,
    containers: deps.directory.containers,
  })

  return {
    round,
    descendants,
    colorValue,
    measureParity,
  }
}
