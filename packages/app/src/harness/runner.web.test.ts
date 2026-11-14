import { expect, it } from 'vitest'
import { CORE_CASES } from './core-cases'
import { createHarnessRunner, waitUntil } from './runner'
import type { CaseResult, Driver } from './types'

function harness(overrides: Partial<Driver> = {}) {
  const events: string[] = []
  const results: CaseResult[] = []
  const driver: Driver = {
    target: 'test',
    build: 'test',
    evidence: 'dom-dispatch-and-inspection',
    async mount(spec) {
      events.push('mount:' + spec.id)
    },
    async perform(step) {
      events.push(step.name)
      return { name: step.name, expected: 'expected', observed: 'observed' }
    },
    async cleanup() {
      events.push('cleanup')
    },
    ...overrides,
  }

  return { runner: createHarnessRunner(driver, (result) => results.push(result)), events, results }
}

it('cleans up a failed case before the next mount and preserves the failed step', async () => {
  let fail = true
  const h = harness({
    async perform(step) {
      if (fail) {
        fail = false
        throw new Error('Wrong displayed value')
      }

      return { name: step.name, expected: 'expected', observed: 'observed' }
    },
  })

  await h.runner.run(CORE_CASES.slice(0, 2))
  expect(h.results.map((r) => r.status)).toEqual(['failed', 'passed'])
  expect(h.results[0].message).toContain('Initial state: Wrong displayed value')
  expect(h.events).toEqual([
    'mount:rendering.state',
    'cleanup',
    'mount:rendering.keyed-state',
    'cleanup',
  ])

  expect(h.results[0].runId).toBe(h.results[1].runId)
})

it('stops an active case, awaits cleanup and does not mount queued cases', async () => {
  let entered!: () => void
  const started = new Promise<void>((resolve) => {
    entered = resolve
  })

  let cleaned = false
  const h = harness({
    async perform(_step, signal) {
      entered()
      await waitUntil(() => undefined, signal)
      throw new Error('unreachable')
    },
    async cleanup() {
      await Promise.resolve()
      cleaned = true
    },
  })

  const running = h.runner.run(CORE_CASES.slice(0, 2))

  await started
  expect(h.runner.busy).toBe(true)
  await expect(h.runner.run(CORE_CASES.slice(0, 1))).rejects.toThrow('already active')
  h.runner.cancel()
  await running
  expect(cleaned).toBe(true)
  expect(h.runner.busy).toBe(false)
  expect(h.results.map((r) => r.status)).toEqual(['blocked', 'blocked'])
  expect(h.events).toEqual(['mount:rendering.state'])
  expect(h.results.map((r) => r.evidence)).toEqual([
    'dom-dispatch-and-inspection',
    'unavailable',
  ])
})

it('quarantines cleanup failure so later checks cannot pass in a polluted fixture', async () => {
  const h = harness({
    async cleanup() {
      throw new Error('Resource still attached')
    },
  })

  await h.runner.run(CORE_CASES.slice(0, 2))
  expect(h.results.map((r) => r.status)).toEqual(['failed', 'blocked'])
  expect(h.results[0].message).toContain('Resource still attached')
  expect(h.runner.quarantine).toContain('Reload this host')
  await h.runner.run(CORE_CASES.slice(0, 1))
  expect(h.results[2].status).toBe('blocked')
  expect(h.events.filter((e) => e.startsWith('mount:'))).toHaveLength(1)
})

it('keeps unavailable automation and manual cases out of passing totals', async () => {
  const h = harness({ evidence: 'unavailable', unavailable: 'No adapter for this host' })

  await h.runner.run([CORE_CASES[0], { ...CORE_CASES[1], suite: 'manual' }])
  expect(h.results.map((r) => r.status)).toEqual(['unsupported', 'blocked'])
  expect(h.events).toEqual([])
  expect(h.results.every((r) => r.evidence === 'unavailable')).toBe(true)
})

it('has stable, unique core contracts with bounded observable assertions', () => {
  expect(new Set(CORE_CASES.map((c) => c.id)).size).toBe(CORE_CASES.length)
  expect(CORE_CASES.every((c) => c.steps.some((s) => !['press', 'fill'].includes(s.action)))).toBe(
    true,
  )
})
