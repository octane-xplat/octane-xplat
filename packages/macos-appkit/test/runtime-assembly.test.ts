import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { test } from 'node:test'

for (const scenario of [
  'active',
  'diagnostics',
  'optional',
  'required-class',
  'required-activation',
]) {
  test(`real runtime assembly: ${scenario}`, () => {
    const result = spawnSync(
      process.execPath,
      [
        '--experimental-strip-types',
        new URL('./runtime-assembly-process.ts', import.meta.url).pathname,
        scenario,
      ],
      { encoding: 'utf8', timeout: 30_000 },
    )
    assert.equal(result.status, 0, result.stdout + result.stderr)
  })
}
