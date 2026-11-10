// Input is a transcription/export of Apple's presentation metrics, never JS RAF.
export const scenarios = [
  'tween',
  'spring',
  'drag',
  'retarget',
  'layout',
  'shared',
  'sheet',
  'scroll',
]
const identity = [
  'device',
  'os',
  'refreshMode',
  'powerMode',
  'thermalState',
  'buildMode',
  'diagnostic',
]
export function evaluate(run, baseline) {
  if (
    run.schema !== 1 ||
    run.evidence !== 'physical' ||
    run.buildMode !== 'release' ||
    run.diagnostic !== false
  ) {
    throw new Error(
      'Requires schema 1 physical release presentation evidence without diagnostic spans',
    )
  }
  for (const key of identity) {
    if (run[key] === undefined || (baseline && run[key] !== baseline[key])) {
      throw new Error(`Missing or mismatched ${key}`)
    }
  }
  if (!run.revision || !run.trace || !Array.isArray(run.results)) {
    throw new Error('Missing revision, trace or results')
  }
  return scenarios.map((scenario) => {
    const rows = run.results.filter((row) => row.scenario === scenario)
    if (rows.length !== 5) {
      throw new Error(`${scenario}: requires five measured iterations`)
    }
    for (const row of rows) {
      if (!Number.isInteger(row.frameCount) || row.frameCount <= 0) {
        throw new Error(
          `${scenario}: presentation frame count must be positive; missing/zero telemetry is not a hitch pass`,
        )
      }
      for (const key of ['durationSeconds', 'hitchMs', 'worstHitchMs']) {
        if (!Number.isFinite(row[key]) || row[key] < 0) {
          throw new Error(`${scenario}: invalid ${key}`)
        }
      }
      if (row.durationSeconds === 0 || row.worstHitchMs > row.hitchMs) {
        throw new Error(`${scenario}: inconsistent presentation metrics`)
      }
    }
    const ratio =
      rows.reduce((n, row) => n + row.hitchMs, 0) /
      rows.reduce((n, row) => n + row.durationSeconds, 0)
    const worst = Math.max(...rows.map((row) => row.worstHitchMs))
    const peakRatio = Math.max(...rows.map((row) => row.hitchMs / row.durationSeconds))
    const previous = baseline?.results.filter((row) => row.scenario === scenario)
    if (baseline && previous.length !== 5) {
      throw new Error(`${scenario}: incomplete baseline`)
    }
    const baseRatio =
      previous &&
      previous.reduce((n, row) => n + row.hitchMs, 0) /
        previous.reduce((n, row) => n + row.durationSeconds, 0)
    const baseWorst = previous && Math.max(...previous.map((row) => row.worstHitchMs))
    return {
      scenario,
      hitchMsPerSecond: ratio,
      worstHitchMs: worst,
      pass:
        peakRatio < 5 &&
        worst <= 50 &&
        (!baseline ||
          (ratio <= baseRatio + Math.max(1, baseRatio * 0.2) && worst <= baseWorst + 8.34)),
    }
  })
}
