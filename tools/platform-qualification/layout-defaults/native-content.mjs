import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { prepare } from '../../probe/project.ts'

const [target, flag, device] = process.argv.slice(2)
assert.ok(['ios', 'android'].includes(target) && flag === '--device' && device,
  'Pass ios|android --device <owned booted device ID>')
const root = fileURLToPath(new URL('../../../', import.meta.url))
const fixture = join(root, 'tools/platform-qualification/layout-defaults/native-slots.mobile.tsrx')
const dependencies = ['@octane-xplat/effects', '@octane-xplat/context-menu', '@octane-xplat/sheet']
const project = await prepare(target, fixture, dependencies)
const started = Date.now()
const child = spawn(process.execPath, [join(root, 'tools/probe/cli.ts'), 'run', fixture,
  '--target', target, '--device', device, '--deps', dependencies.join(','),
  '--startup-timeout', '600000', '--timeout', '60000'],
  { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] })
let stdout = '', stderr = '', ended = false
child.stdout.on('data', (chunk) => { stdout += chunk })
child.stderr.on('data', (chunk) => { stderr += chunk })
const completion = new Promise((resolve, reject) => {
  child.once('error', reject)
  child.once('close', (code) => { ended = true; resolve(code) })
})
const run = (command, args, required = true) => {
  const result = spawnSync(command, args, { encoding: 'utf8', timeout: 10000 })
  if (required) assert.equal(result.status, 0, result.stderr || result.error?.message)
  return result.status === 0 ? result.stdout.trim() : null
}
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
let container
async function waitStage(stage) {
  const deadline = started + 650000
  while (!ended && Date.now() < deadline) {
    container ??= run('xcrun', ['simctl', 'get_app_container', device, project.appId, 'data'], false)
    if (container) {
      try {
        const value = JSON.parse(await readFile(join(container, 'Documents/layout-preview-targets.json'), 'utf8'))
        if (value.createdAt >= started && value.stage === stage) return value
      } catch {}
    }
    await pause(100)
  }
  throw new Error(`No fresh ${stage} phase from owned probe app\n${stderr}${stdout}`)
}
try {
  if (target === 'ios') {
    const { point } = await waitStage('open-preview')
    assert.ok(Number.isFinite(point?.x) && Number.isFinite(point?.y) && point.x > 0 && point.y > 0)
    run('idb', ['ui', 'tap', String(point.x), String(point.y), '--duration', '1',
      '--udid', device, '--api', 'hid', '--reason', 'Qualify native context-menu preview content'])
    await waitStage('dismiss-preview')
    run('idb', ['ui', 'tap', '1', '100', '--udid', device, '--api', 'hid',
      '--reason', 'Dismiss owned context menu before sheet qualification'])
  }
  const code = await completion
  process.stdout.write(stdout)
  process.stderr.write(stderr)
  assert.equal(code, 0, 'Native callback-content probe failed')
} finally {
  if (!ended) { child.kill('SIGINT'); await completion }
}
