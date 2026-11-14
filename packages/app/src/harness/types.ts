export type Area =
  | 'Rendering'
  | 'Layout'
  | 'Input'
  | 'Navigation'
  | 'Async state'
  | 'Collections & motion'
  | 'Media & services'
  | 'Diagnostics'

export type Fixture =
  | 'counter'
  | 'keys'
  | 'lifecycle'
  | 'visibility'
  | 'table'
  | 'controls'
  | 'async'
  | 'navigation'
  | 'overlay'
  | 'demo'

export type Step =
  | { name: string; action: 'press'; id: string }
  | { name: string; action: 'fill'; id: string; value: string }
  | { name: string; action: 'text' | 'value'; id: string; expected: string }
  | { name: string; action: 'checked'; id: string; expected: boolean }
  | { name: string; action: 'absent'; id: string }
  | { name: string; action: 'alignment' | 'visibility'; id: string }

export type CaseSpec = {
  id: string
  title: string
  area: Area
  owner: string
  expected: string
  suite: 'core' | 'manual'
  fixture: Fixture
  demo?: string
  href?: string
  tags: readonly string[]
  instructions: readonly string[]
  steps: readonly Step[]
}

export type Outcome = 'passed' | 'failed' | 'blocked' | 'unsupported'
export type Evidence = 'dom-dispatch-and-inspection' | 'manual-observation' | 'unavailable'
export type StepResult = { name: string; expected: string; observed: string }
export type CaseResult = {
  runId: string
  caseId: string
  title: string
  target: string
  build: string
  evidence: Evidence
  status: Outcome
  startedAt: string
  durationMs: number
  steps: StepResult[]
  message: string
}

export type MountedFixture = { caseId: string; generation: number }
export type Driver = {
  target: string
  build: string
  evidence: Evidence
  unavailable?: string
  mount(spec: CaseSpec, signal: AbortSignal): Promise<void>
  perform(step: Step, signal: AbortSignal): Promise<StepResult>
  cleanup(): Promise<void>
}
