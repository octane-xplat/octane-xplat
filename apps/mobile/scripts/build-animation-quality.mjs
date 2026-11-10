import { spawnSync } from 'node:child_process'
const [kind, device] = process.argv.slice(2)
const simulator = '91D40099-A056-497D-A572-ADDDFD6A8F23'
if (
  !['simulator', 'physical'].includes(kind) ||
  !device ||
  (kind === 'simulator' && device !== simulator)
) {
  throw new Error(`Usage: bench:animation:ios simulator ${simulator} | physical AUTHORIZED_UDID`)
}
// Build only. Installation and device execution require a separate reservation.
const result = spawnSync(
  'goddard-agent',
  [
    'resource',
    'run',
    '--json',
    JSON.stringify({
      resources: { native_builds: 1 },
      purpose: 'iOS animation benchmark release build',
    }),
    '--',
    'bun',
    'x',
    'ns',
    'build',
    'ios',
    '--release',
    '--device',
    device,
    ...(kind === 'physical' ? ['--for-device'] : ['--emulator']),
  ],
  {
    stdio: 'inherit',
    cwd: new URL('..', import.meta.url),
    env: { ...process.env, XPLAT_ANIMATION_QUALITY: '1' },
  },
)
process.exit(result.status ?? 1)
