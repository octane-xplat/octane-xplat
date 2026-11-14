import type { CaseResult, CaseSpec, Driver } from './types'

/** One serialized owner for fixture setup, execution, cancellation and teardown. */
export function createHarnessRunner(driver: Driver, publish: (result: CaseResult) => void) {
  let active: AbortController | null = null
  let quarantine: string | null = null
  let sequence = 0

  return {
    get busy() {
      return active !== null
    },
    get quarantine() {
      return quarantine
    },
    cancel() {
      active?.abort()
    },
    async run(cases: readonly CaseSpec[]) {
      if (active) {
        throw new Error('A harness run is already active.')
      }

      const owner = new AbortController()

      active = owner

      const runId = `${Date.now()}-${++sequence}`

      try {
        for (const spec of cases) {
          const started = Date.now()
          const result: CaseResult = {
            runId,
            caseId: spec.id,
            title: spec.title,
            target: driver.target,
            build: driver.build,
            evidence: driver.evidence,
            status: 'blocked',
            startedAt: new Date(started).toISOString(),
            durationMs: 0,
            steps: [],
            message: '',
          }

          if (quarantine || owner.signal.aborted) {
            result.message = quarantine ?? 'Run stopped before this case started.'
            result.evidence = 'unavailable'
          } else if (spec.suite === 'manual') {
            result.message =
              'Requires manual or external-input qualification. Open the fixture and follow its checklist.'

            result.evidence = 'unavailable'
          } else if (driver.unavailable) {
            result.status = 'unsupported'
            result.message = driver.unavailable
          } else {
            let stepName = 'Mount fresh fixture'

            try {
              await driver.mount(spec, owner.signal)
              for (const step of spec.steps) {
                if (owner.signal.aborted) {
                  throw new Error('Run stopped.')
                }

                stepName = step.name
                result.steps.push(await driver.perform(step, owner.signal))
              }

              if (owner.signal.aborted) {
                throw new Error('Run stopped.')
              }

              result.status = 'passed'
            } catch (error) {
              result.status = owner.signal.aborted ? 'blocked' : 'failed'
              result.message = `${stepName}: ${error instanceof Error ? error.message : String(error)}`
            } finally {
              try {
                // Cleanup is required even after cancellation; it has its own bounded wait.
                await driver.cleanup()
                if (result.status === 'passed') {
                  result.message = 'All assertions and fixture cleanup passed.'
                }
              } catch (error) {
                quarantine = `Fixture cleanup failed: ${error instanceof Error ? error.message : String(error)}. Reload this host before running again.`
                result.status = 'failed'
                result.message += ` ${quarantine}`
              }
            }
          }

          result.durationMs = Date.now() - started
          publish(result)
        }
      } finally {
        active = null
      }
    },
  }
}

export type HarnessRunner = ReturnType<typeof createHarnessRunner>

export async function waitUntil(
  check: () => string | undefined,
  signal: AbortSignal,
  timeoutMs = 2500,
): Promise<string> {
  const deadline = Date.now() + timeoutMs

  while (true) {
    if (signal.aborted) {
      throw new Error('Run stopped.')
    }

    const observed = check()

    if (observed !== undefined) {
      return observed
    }

    if (Date.now() >= deadline) {
      throw new Error('Expected state was not observed before the deadline.')
    }

    await new Promise<void>((resolve) => setTimeout(resolve, 16))
  }
}
