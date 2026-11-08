/** Failures retain their original values; labels identify the failed release/stage. */
export interface PhaseFailure {
  phase: string
  error: unknown
}

export class PhaseErrors extends AggregateError {
  readonly failures: readonly PhaseFailure[]

  constructor(failures: readonly PhaseFailure[]) {
    super(
      failures.map((failure) => failure.error),
      failures.map((failure) => failure.phase).join(', '),
    )

    this.name = 'PhaseErrors'
    this.failures = failures
  }
}

/** Small owning-boundary collector, not a rollback or resource dependency graph. */
export class FailureCollector {
  private readonly failures: PhaseFailure[] = []

  get failed(): boolean {
    return this.failures.length !== 0
  }

  run(phase: string, release: () => void): void {
    try {
      release()
    } catch (error) {
      this.failures.push({ phase, error })
    }
  }

  throwIfFailed(): void {
    if (this.failures.length === 1) {
      throw this.failures[0]!.error
    }

    if (this.failed) {
      throw new PhaseErrors(this.failures)
    }
  }
}
