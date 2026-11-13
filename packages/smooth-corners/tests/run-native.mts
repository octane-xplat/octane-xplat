import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const target = process.argv[2]
const cases = {
  android: 'clipping.android.tsrx',
  ios: 'clipping.ios.tsrx',
  macos: 'surface.macos.tsrx',
}

if (!(target in cases)) {
  throw new Error('Select android, ios or macos')
}

const args = process.argv.slice(3)

if (target !== 'macos' && !args.includes('--device')) {
  throw new Error(
    'Pass --device with an existing device ID; this task never selects or creates a device',
  )
}

const result = spawnSync(
  process.execPath,
  [
    'tools/probe/cli.ts',
    'run',
    `packages/smooth-corners/tests/${cases[target]}`,
    '--target',
    target,
    '--timeout',
    '60000',
    ...args,
  ],
  {
    cwd: fileURLToPath(new URL('../../../', import.meta.url)),
    stdio: 'inherit',
    env: process.env,
  },
)

if (result.error) {
  throw result.error
}

process.exitCode = result.status ?? 1
