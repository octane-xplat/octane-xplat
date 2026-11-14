import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const [target, ...deviceArgs] = process.argv.slice(2)
if (!['web', 'ios', 'android', 'macos'].includes(target)) {
  throw new Error('Expected layout target: web, ios, android or macos')
}
if (target === 'ios' || target === 'android') {
  if (deviceArgs.length !== 2 || deviceArgs[0] !== '--device' || !deviceArgs[1]) {
    throw new Error('Mobile layout checks require --device <existing device ID or adb serial>')
  }
} else if (deviceArgs.length) {
  throw new Error('Device selection applies only to iOS and Android')
}

const root = fileURLToPath(new URL('../../..', import.meta.url))
const cli = fileURLToPath(new URL('../../../tools/probe/cli.ts', import.meta.url))
const startupArgs = target === 'ios' || target === 'android' ? ['--startup-timeout', '600000'] : []
const result = spawnSync(process.execPath, [
  cli, 'run', 'packages/ui/tests/fixtures/page-layout/suite.tsrx',
  '--target', target, ...deviceArgs, ...startupArgs, '--timeout', '120000',
], { cwd: root, stdio: 'inherit' })
if (result.error) {
  throw result.error
}
if (result.status !== 0) {
  process.exit(result.status ?? 1)
}
