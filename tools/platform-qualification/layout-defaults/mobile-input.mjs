import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { prepare } from '../../probe/project.ts'

const [target, deviceFlag, device] = process.argv.slice(2)
assert.ok(['ios', 'android'].includes(target) && deviceFlag === '--device' && device,
  'Pass ios|android --device <owned booted device ID>')
const root = fileURLToPath(new URL('../../../', import.meta.url))
const fixture = resolve(root, 'tools/platform-qualification/layout-defaults/mobile-input.mobile.tsrx')
const project = await prepare(target, fixture)
const started = Date.now()
const run = (command, args, required = true) => {
  const result = spawnSync(command, args, { encoding: 'utf8', timeout: 10000 })
  if (required) assert.equal(result.status, 0, result.stderr || result.error?.message)
  return result.status === 0 ? result.stdout.trim() : null
}
const cli = spawn(process.execPath, [join(root, 'tools/probe/cli.ts'), 'run', fixture,
  '--target', target, '--device', device, '--startup-timeout', '600000', '--timeout', '60000'],
  { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] })
let stdout = '', stderr = '', ended = false
cli.stdout.on('data', (chunk) => { stdout += chunk })
cli.stderr.on('data', (chunk) => { stderr += chunk })
const completion = new Promise((resolve, reject) => {
  cli.once('error', reject)
  cli.once('close', (code) => { ended = true; resolve(code) })
})
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
let container
try {
  const deadline = started + 650000
  let ready
  while (!ended && Date.now() < deadline) {
    let text
    if (target === 'android') {
      text = run('adb', ['-s', device, 'shell', 'run-as', project.appId,
        'cat', 'files/layout-os-targets.json'], false)
    } else {
      container ??= run('xcrun', ['simctl', 'get_app_container', device, project.appId, 'data'], false)
      if (container) {
        try { text = await readFile(join(container, 'Documents/layout-os-targets.json'), 'utf8') } catch {}
      }
    }
    if (text) {
      try {
        const value = JSON.parse(text)
        if (value.createdAt >= started && Array.isArray(value.targets)) { ready = value; break }
      } catch {}
    }
    await pause(500)
  }
  assert.ok(ready, 'No fresh OS-input targets from owned probe app\n' + stderr + stdout)
  assert.ok(Number.isFinite(ready.scale) && ready.scale > 0)
  for (const point of ready.targets) {
    assert.ok(['button', 'pressable', 'card'].includes(point.name))
    assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y) && point.x > 0 && point.y > 0)
    if (target === 'android') {
      run('adb', ['-s', device, 'shell', 'input', 'tap',
        String(Math.round(point.x * ready.scale)), String(Math.round(point.y * ready.scale))])
    } else {
      run('idb', ['ui', 'tap', String(point.x), String(point.y), '--udid', device,
        '--api', 'hid', '--reason', 'Verify block-layout control activation'])
    }
    await pause(150)
  }
  const code = await completion
  process.stdout.write(stdout)
  process.stderr.write(stderr)
  assert.equal(code, 0, 'Native OS-input probe failed')
  console.log(`${target}: adb/HID OS taps activated Button, Pressable and ClickableCard; no image capture`)
} finally {
  if (!ended) { cli.kill('SIGINT'); await completion }
}
