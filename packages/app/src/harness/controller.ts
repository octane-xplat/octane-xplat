import { createStore } from '@octane-xplat/ui/data'
import { CASES, CORE_CASES } from './catalog'
import { createHarnessDriver } from './driver'
import { createHarnessRunner } from './runner'
import { fixtureResources } from './resources'
import type { CaseResult, CaseSpec, MountedFixture, Outcome } from './types'

type ConsoleState = {
  view: 'overview' | 'cases' | 'results'
  selected: string | null
  mounted: MountedFixture | null
  busy: boolean
  preparing: boolean
  results: CaseResult[]
  notice: string
  fault: string | null
}

export const observationDrafts = createStore<Record<string, string>>({})

export const harnessState = createStore<ConsoleState>({
  view: 'overview',
  selected: null,
  mounted: null,
  busy: false,
  preparing: false,
  results: [],
  notice: 'No checks have run in this session.',
  fault: null,
})

let generation = 0
let manualSequence = 0
const driver = createHarnessDriver({
  mount(spec) {
    const next = ++generation

    harnessState.update((s) => ({
      ...s,
      selected: spec.id,
      mounted: { caseId: spec.id, generation: next },
    }))

    return next
  },
  clear() {
    harnessState.update((s) => ({ ...s, mounted: null }))
  },
  resources: () => fixtureResources.getSnapshot(),
})

export const harnessEnvironment = {
  target: driver.target,
  build: driver.build,
  evidence: driver.evidence,
  unavailable: driver.unavailable,
}

export const harnessRunner = createHarnessRunner(driver, (result) => {
  harnessState.update((s) => ({
    ...s,
    results: [result, ...s.results].slice(0, 200),
    notice: `${result.title}: ${result.status}`,
  }))
})

let currentRun: Promise<void> = Promise.resolve()
let hostEpoch = 0
let preparation: AbortController | null = null

export function attachHarnessHost() {
  const epoch = ++hostEpoch

  return () => {
    if (epoch !== hostEpoch) {
      return
    }

    hostEpoch++
    harnessRunner.cancel()
    preparation?.abort()
    harnessState.update((s) => ({ ...s, mounted: null, preparing: false }))
  }
}

export function runChecks(cases: readonly CaseSpec[] = CORE_CASES): Promise<void> {
  const state = harnessState.getSnapshot()

  if (state.busy || state.preparing || state.fault) {
    return Promise.resolve()
  }

  const epoch = hostEpoch

  harnessState.update((s) => ({
    ...s,
    busy: true,
    view: 'cases',
    notice: 'Running checks serially. Each case gets a fresh fixture.',
  }))

  currentRun = (async () => {
    try {
      await harnessRunner.run(cases)
    } catch (error) {
      if (epoch === hostEpoch) {
        harnessState.update((s) => ({
          ...s,
          notice: error instanceof Error ? error.message : String(error),
        }))
      }
    } finally {
      harnessState.update((s) => ({
        ...s,
        busy: false,
        view: epoch === hostEpoch ? 'results' : s.view,
        fault: harnessRunner.quarantine,
      }))
    }
  })()

  return currentRun
}

async function prepare(work: (signal: AbortSignal) => Promise<void>): Promise<boolean> {
  const state = harnessState.getSnapshot()

  if (state.busy || state.preparing || state.fault || harnessRunner.quarantine) {
    return false
  }

  const owner = new AbortController()
  const epoch = hostEpoch

  preparation = owner
  harnessState.update((s) => ({ ...s, preparing: true }))
  try {
    await work(owner.signal)
    return !owner.signal.aborted && epoch === hostEpoch
  } catch (error) {
    if (!owner.signal.aborted && epoch === hostEpoch) {
      const message =
        'Fixture preparation/cleanup failed. Reload this host. ' +
        (error instanceof Error ? error.message : String(error))

      harnessState.update((s) => ({ ...s, notice: message, fault: message }))
    }

    return false
  } finally {
    if (preparation === owner) {
      preparation = null
      if (epoch === hostEpoch) {
        harnessState.update((s) => ({ ...s, preparing: false }))
      }
    }
  }
}

export async function closeFixture() {
  return prepare(async () => {
    await driver.cleanup()
  })
}

export async function openFixture(spec: CaseSpec) {
  const ready = await prepare(async (signal) => {
    await driver.cleanup()
    if (signal.aborted) {
      return
    }

    await driver.mount(spec, signal)
  })

  if (ready) {
    harnessState.update((s) => ({
      ...s,
      notice: 'Fixture ready. Opening it does not establish a pass.',
    }))
  }
}

export function recordObservation(
  spec: CaseSpec,
  status: Extract<Outcome, 'passed' | 'failed' | 'blocked'>,
  note: string,
) {
  const state = harnessState.getSnapshot()

  if (state.busy || state.preparing || !note.trim()) {
    return
  }

  if (!spec.href && state.mounted?.caseId !== spec.id) {
    return
  }

  const result: CaseResult = {
    runId: 'manual-' + Date.now() + '-' + ++manualSequence,
    caseId: spec.id,
    title: spec.title,
    target: driver.target,
    build: driver.build,
    evidence: 'manual-observation',
    status,
    startedAt: new Date().toISOString(),
    durationMs: 0,
    steps: [],
    message: note.trim(),
  }

  harnessState.update((s) => ({
    ...s,
    results: [result, ...s.results].slice(0, 200),
    notice: 'Manual observation recorded; no automatic or OS-input qualification implied.',
  }))
}

export async function selectCase(id: string) {
  if (harnessState.getSnapshot().busy) {
    harnessRunner.cancel()
    await currentRun
  }

  if (harnessState.getSnapshot().preparing) {
    return
  }

  if (!(await closeFixture())) {
    return
  }

  if (harnessState.getSnapshot().fault) {
    return
  }

  harnessState.update((s) => ({
    ...s,
    view: 'cases',
    selected: id,
    notice: CASES.some((c) => c.id === id)
      ? 'Case selected. Open a fresh fixture or run its checks.'
      : 'Unknown case ID. Select a case from the catalog.',
  }))
}
