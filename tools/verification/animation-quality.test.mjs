import { test } from 'node:test'
import assert from 'node:assert/strict'
import { evaluate, scenarios } from './animation-quality/metrics.mjs'
import { recorderArguments } from './animation-quality/recorder-args.mjs'

const fixture = () => ({
  schema: 1,
  evidence: 'physical',
  device: 'test-device',
  os: 'test-os',
  refreshMode: 'adaptive',
  powerMode: 'normal',
  thermalState: 'nominal',
  buildMode: 'release',
  diagnostic: false,
  revision: 'test',
  trace: 'test.trace',
  results: scenarios.flatMap((scenario) =>
    Array.from({ length: 5 }, () => ({
      scenario,
      durationSeconds: 2,
      frameCount: 120,
      hitchMs: 0,
      worstHitchMs: 0,
    })),
  ),
})

test('rejects callback and simulator evidence, missing scenarios and mismatched baselines', () => {
  assert.throws(() => evaluate({ ...fixture(), evidence: 'simulator' }))
  assert.throws(() => evaluate({ ...fixture(), results: [] }))
  assert.throws(() => evaluate(fixture(), { ...fixture(), device: 'other' }))
  assert.ok(evaluate(fixture()).every((row) => row.pass))
})

test('isolated stalls fail even when diluted by a long duration', () => {
  const run = fixture()

  Object.assign(run.results[0], { durationSeconds: 100, hitchMs: 60, worstHitchMs: 60 })
  assert.equal(evaluate(run)[0].pass, false)
})

test('one bad iteration and relative regressions cannot hide in averages', () => {
  const run = fixture()

  Object.assign(run.results[0], { hitchMs: 10, worstHitchMs: 10 })
  assert.equal(evaluate(run)[0].pass, false)
  for (const row of run.results) {
    Object.assign(row, { hitchMs: 4, worstHitchMs: 4 })
  }

  assert.equal(evaluate(run, fixture())[0].pass, false)
})

test('zero or missing presentation frames cannot qualify zero-hitch output', () => {
  const run = fixture()

  run.results[0].frameCount = 0
  assert.throws(() => evaluate(run), /presentation frame count/)
  delete run.results[0].frameCount
  assert.throws(() => evaluate(run), /presentation frame count/)
})

test('Instruments launches the owned app and does not pass recorder options to it', () => {
  const args = recorderArguments({
    device: 'physical-device',
    bundle: 'org.octanexplat.animationquality',
    output: '/tmp/run.trace',
    recordingOptions: '/tmp/options.json',
    diagnosticCosts: false,
  })

  assert.equal(args[0], 'xctrace')
  assert.equal(args[args.indexOf('--template') + 1], 'Animation Hitches')
  assert.equal(args[args.indexOf('--launch') + 1], '--')
  assert.deepEqual(args.slice(-2), ['--', 'org.octanexplat.animationquality'])
  assert.equal(args.includes('--attach'), false)
  assert.equal(args.includes('180s'), true)
})

test('diagnostic Instruments launch keeps Time Profiler and os_signpost', () => {
  const args = recorderArguments({
    device: 'physical-device',
    bundle: 'org.octanexplat.animationquality',
    output: '/tmp/run.trace',
    recordingOptions: '/tmp/options.json',
    diagnosticCosts: true,
  })

  assert.equal(args[args.indexOf('--template') + 1], 'Time Profiler')
  assert.equal(args[args.indexOf('--instrument') + 1], 'os_signpost')
})
