// Runs the maintained material fixture and sends actual simulator HID touches.
// Reserve the selected device and native-build capacity around this command.
import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'

const device = process.argv[2]

assert.ok(device, 'Pass the reserved simulator UDID')

const root = fileURLToPath(new URL('../../', import.meta.url))
function command(executable, args) {
  const result = spawnSync(executable, args, {
    cwd: root,
    encoding: 'utf8',
    timeout: 30000,
    maxBuffer: 4 * 1024 * 1024,
  })

  if (result.error) {
    throw result.error
  }

  assert.equal(result.status, 0, `${executable} ${args.join(' ')}: ${result.stderr}`)
  return result.stdout
}

const devices = JSON.parse(command('xcrun', ['simctl', 'list', 'devices', device, '--json']))
const selected = Object.values(devices.devices)
  .flat()
  .find((entry) => entry.udid === device)

assert.ok(selected?.isAvailable, 'The explicitly selected simulator is unavailable')

const bootedHere = selected.state !== 'Booted'

if (bootedHere) {
  command('xcrun', ['simctl', 'boot', device])
}

command('xcrun', ['simctl', 'bootstatus', device, '-b'])

const probe = spawn(
  'bun',
  [
    'run',
    'turbo',
    'run',
    'test:liquid-glass:ios',
    '--filter=@octane-xplat/ui',
    '--',
    '--device',
    device,
    '--verbose',
  ],
  { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] },
)

probe.stdout.pipe(process.stdout)
probe.stderr.pipe(process.stderr)

let hostReady = false
let hostTail = ''
for (const stream of [probe.stdout, probe.stderr]) {
  stream.on('data', (chunk) => {
    hostTail = (hostTail + String(chunk)).slice(-2000)
    if (hostTail.includes('[xplat-probe-host-ready]')) {
      hostReady = true
    }
  })
}
let finished = false
const completed = new Promise((resolve, reject) => {
  probe.once('error', reject)
  probe.once('exit', (code, signal) => {
    finished = true
    resolve({ code, signal })
  })
})

function rows(output) {
  try {
    const parsed = JSON.parse(output)

    return Array.isArray(parsed) ? parsed : [parsed]
  } catch {
    return output
      .split('\n')
      .filter((line) => line.trim().startsWith('{'))
      .map((line) => JSON.parse(line))
  }
}

async function find(label, timeout = 600000) {
  const deadline = Date.now() + timeout

  while (Date.now() < deadline) {
    assert.ok(!finished, `Probe ended before ${label}`)
    try {
      const result = rows(
        command('idb', [
          'ui',
          'describe-all',
          '--udid',
          device,
          '--json',
          '--match',
          label,
          '--match-key',
          'AXLabel',
          '--reason',
          'Find the LiquidGlass child for nonvisual HID verification',
        ]),
      )

      const found = result.find((entry) => entry.AXLabel === label)

      if (found) {
        return found
      }
    } catch (error) {
      if (Date.now() + 1000 >= deadline) {
        throw error
      }
    }

    await delay(1000)
  }

  throw new Error(`Timed out waiting for ${label}`)
}

try {
  // Let installation and launch finish before attaching accessibility tooling.
  const startupDeadline = Date.now() + 600000
  while (!hostReady) {
    assert.ok(!finished, 'Probe ended before its native host was ready')
    assert.ok(Date.now() < startupDeadline, 'Native probe host did not become ready')
    await delay(1000)
  }
  for (const kind of ['Default', 'Interactive']) {
    for (let count = 0; count < 2; count++) {
      const label = `${kind} glass child ${count}`
      const element = await find(label)
      const frame = element.frame

      assert.ok(frame?.width > 0 && frame?.height > 0, `Missing native bounds for ${label}`)

      const x = Math.round(frame.x + frame.width / 2)
      const y = Math.round(frame.y + frame.height / 2)

      command('idb', [
        'ui',
        'tap',
        '--udid',
        device,
        '--api',
        'hid',
        String(x),
        String(y),
        '--reason',
        `Verify real child input through ${kind.toLowerCase()} LiquidGlass`,
      ])

      if (kind === 'Interactive' && count === 1) {
        const result = await completed
        assert.equal(result.code, 0, `Probe failed: ${JSON.stringify(result)}`)
      } else {
        await find(`${kind} glass child ${count + 1}`, 15000)
      }

      console.log(JSON.stringify({ mechanism: 'OS-HID-touch', kind, count: count + 1, x, y }))
    }
  }

  const result = await completed

  assert.equal(result.code, 0, `Probe failed: ${JSON.stringify(result)}`)
} finally {
  if (!finished) {
    probe.kill('SIGINT')
    await Promise.race([completed, delay(10000)])
    if (!finished) {
      probe.kill('SIGTERM')
    }
  }

  if (bootedHere) {
    command('xcrun', ['simctl', 'shutdown', device])
  }
}
