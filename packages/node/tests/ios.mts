import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const device = '91D40099-A056-497D-A572-ADDDFD6A8F23'
const repo = fileURLToPath(new URL('../../..', import.meta.url))
const boot = spawnSync('xcrun', ['simctl', 'boot', device], { encoding: 'utf8' })

try {
  const ready = spawnSync('xcrun', ['simctl', 'bootstatus', device, '-b'], {
    encoding: 'utf8',
    timeout: 90000,
  })

  assert.equal(ready.status, 0, ready.stdout + ready.stderr)

  const result = spawnSync(
    'bun',
    [
      'run',
      'probe',
      'run',
      'packages/node/tests/mobile.ts',
      '--target',
      'ios',
      '--device',
      device,
      '--deps',
      '@octane-xplat/node',
      '--timeout',
      '30000',
      '--startup-timeout',
      '300000',
    ],
    { cwd: repo, encoding: 'utf8', timeout: 360000, maxBuffer: 4 * 1024 * 1024 },
  )

  process.stdout.write(result.stdout)
  process.stderr.write(result.stderr)
  assert.equal(result.status, 0, result.stdout + result.stderr)
} finally {
  // Only stop a simulator this invocation booted; never erase or create one.
  if (boot.status === 0) {
    spawnSync('xcrun', ['simctl', 'shutdown', device], { encoding: 'utf8' })
  }
}
