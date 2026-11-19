import { runGtkEvalFixture } from './gjs-ui-fixture.mts'
import assert from 'node:assert/strict'
import { spawn, execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { createInterface } from 'node:readline'
import test from 'node:test'
import { build } from 'vite'
import { linuxGtk } from '../../cli/src/linux-gtk/vite.ts'
import { gtkRuntimeReady, gtkOsInputReady } from './gjs-availability.mts'

const fixture = fileURLToPath(new URL('./fixtures/', import.meta.url))

function assertPointerEvents(size, events) {
  assert.ok(size.width >= 100 && size.height >= 80)
  assert.ok(
    events.some((e) => e.kind === 'in'),
    'pointer down reaches the Pressable',
  )

  assert.ok(
    events.some((e) => e.kind === 'out'),
    'pointer up/cancel releases the Pressable',
  )

  assert.ok(
    events.some((e) => e.kind === 'press'),
    'OS click reaches onPress',
  )

  assert.equal(
    events.filter((e) => e.kind === 'in').length,
    events.filter((e) => e.kind === 'out').length,
    'every pointer press is released after click or drag',
  )

  const pans = events.filter((e) => e.kind === 'pan')

  assert.equal(pans[0]?.state, 'began')
  assert.equal(pans.at(-1)?.state, 'ended')
  assert.ok(
    pans.some((e) => e.state === 'moved' && e.x >= 40 && e.y >= 20),
    JSON.stringify(events),
  )

  assert.ok(pans.every((e) => Number.isFinite(e.vx) && Number.isFinite(e.vy)))
}

test('GTK Pressable receives X11 pointer press and pan through OS hit-testing', async (t) => {
  if (process.env.LINUX_RUNTIME_EVAL_ENGINE) {
    const { fixture } = await runGtkEvalFixture(t, {
      stem: 'ui-input',
      title: 'Octane GTK input test',
      marker: 'GTK_UI_INPUT_RESULT',
      readyMarker: 'GTK_UI_INPUT_READY',
      minChecks: 0,
      input: true,
    })
    assertPointerEvents(fixture.size, fixture.events)
    return
  }

  if (!gtkOsInputReady() || !gtkRuntimeReady()) {
    t.skip('Requires Linux, X11 DISPLAY, GJS and xdotool')
    return
  }

  const outDir = join(fixture, 'dist-ui-input')

  await build({
    logLevel: 'error',
    ...(await linuxGtk('production', {
      root: fixture,
      entry: 'src/ui-input-main.ts',
      outDir,
    })),
  })

  const env = { ...process.env }

  const child = spawn('gjs', ['-m', join(outDir, 'app.js')], {
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  t.after(() => {
    if (child.exitCode === null) {
      child.kill('SIGTERM')
    }
  })

  let stderr = ''

  child.stderr.on('data', (b) => {
    stderr += b
  })

  const events = []
  let resolveReady, rejectReady
  const ready = new Promise((resolve, reject) => {
    resolveReady = resolve
    rejectReady = reject
  })

  const lines = createInterface({ input: child.stdout })

  lines.on('line', (line) => {
    if (line.startsWith('GTK_UI_INPUT_READY ')) {
      resolveReady(JSON.parse(line.slice(19)))
    }

    if (line.startsWith('GTK_UI_INPUT ')) {
      events.push(JSON.parse(line.slice(13)))
    }
  })

  const closed = new Promise((resolve, reject) => {
    child.once('error', reject)
    child.once('exit', (code) => {
      rejectReady(new Error(`GJS exited before ready: ${code}\n${stderr}`))
      resolve(code)
    })
  })

  const deadline = setTimeout(() => {
    rejectReady(new Error(`GTK input readiness timeout\n${stderr}`))
    child.kill('SIGTERM')
  }, 18000)

  t.after(() => {
    clearTimeout(deadline)
    lines.close()
  })

  const size = await ready

  const id = execFileSync(
    'xdotool',
    ['search', '--onlyvisible', '--name', '^Octane GTK input test$'],
    { env, encoding: 'utf8' },
  )
    .trim()
    .split('\n')[0]

  execFileSync(
    'xdotool',
    [
      'mousemove',
      '--sync',
      '--window',
      id,
      '20',
      '20',
      'click',
      '1',
      'sleep',
      '0.04',
      'mousedown',
      '1',
      'mousemove',
      '--sync',
      '--window',
      id,
      '45',
      '35',
      'sleep',
      '0.04',
      'mousemove',
      '--sync',
      '--window',
      id,
      '80',
      '60',
      'sleep',
      '0.04',
      'mouseup',
      '1',
    ],
    { env, timeout: 5000 },
  )

  assert.equal(await closed, 0, stderr)
  assertPointerEvents(size, events)
  t.diagnostic(
    'Linux Xvfb/X11; xdotool native widget transport. Shared gestures/onPan/onPinch remain unsupported on GTK; this is not public gesture API qualification. No images',
  )
}, 30000)
