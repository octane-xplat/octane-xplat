import assert from 'node:assert/strict'
import { spawn, execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

test(
  'GTK shared owner cancels nested press, permits a fresh click and preserves keyboard activation',
  { timeout: 25000 },
  async (t) => {
    if (process.platform !== 'linux' || !process.env.DISPLAY) {
      t.skip('Requires existing Linux GJS/X11 environment and xdotool; run outside PR CI')
      return
    }

    const bundle =
      process.env.XPLAT_GTK_GESTURE_BUNDLE ??
      fileURLToPath(new URL('./fixtures/dist-shared-gestures/app.js', import.meta.url))

    const child = spawn('gjs', ['-m', bundle], { stdio: ['ignore', 'pipe', 'pipe'] })

    t.after(() => {
      if (child.exitCode === null) {
        child.kill('SIGTERM')
      }
    })

    let output = '',
      errors = '',
      driven = false

    child.stderr.on('data', (value) => {
      errors += value
    })

    child.stdout.on('data', (value) => {
      output += value

      const ready = output.split('\n').find((line) => line.startsWith('SHARED_READY '))

      if (!ready || driven) {
        return
      }

      driven = true

      const { x, y } = JSON.parse(ready.slice('SHARED_READY '.length))
      const id = execFileSync('xdotool', ['search', '--name', 'solid-birch-shared-gestures'], {
        encoding: 'utf8',
      })
        .trim()
        .split('\n')[0]

      const other = execFileSync(
        'xdotool',
        ['search', '--name', 'solid-birch-gesture-interruption'],
        { encoding: 'utf8' },
      )
        .trim()
        .split('\n')[0]

      const move = (px) => ['mousemove', '--window', id, String(px), String(y)]

      execFileSync('xdotool', [
        'windowraise',
        id,
        'windowfocus',
        id,
        ...move(x),
        'click',
        '1',
        ...move(x),
        'mousedown',
        '1',
        ...move(x + 100),
        'sleep',
        '0.2',
        'mouseup',
        '1',
        'sleep',
        '0.2',
        ...move(x + 100),
        'click',
        '1',
        'windowfocus',
        id,
        'key',
        'space',
        ...move(x + 100),
        'mousedown',
        '1',
        ...move(x + 200),
        'sleep',
        '0.2',
        'windowfocus',
        other,
        'sleep',
        '0.2',
        'mouseup',
        '1',
        'windowraise',
        id,
        'windowfocus',
        id,
        ...move(x + 100),
        'click',
        '1',
      ])
    })

    const code = await new Promise((resolve, reject) => {
      child.on('error', reject)
      child.on('exit', resolve)
    })

    assert.equal(code, 0, errors)
    assert.equal(driven, true, output + errors)
    assert.doesNotMatch(errors, /GESTURE_ERROR|JS ERROR/)

    const events = output
      .split('\n')
      .filter((line) => line.startsWith('SHARED_GESTURE '))
      .map((line) => JSON.parse(line.slice('SHARED_GESTURE '.length)))

    assert.deepEqual(
      events.filter((event) => event.kind !== 'move').map((event) => [event.kind, event.detail]),
      [
        ['press', 'pointer'],
        ['start', undefined],
        ['finish', 'ended'],
        ['press', 'pointer'],
        ['press', 'keyboard'],
        ['start', undefined],
        ['finish', 'cancelled'],
        ['press', 'pointer'],
      ],
      output + errors,
    )

    assert(events.some((event) => event.kind === 'move' && Math.abs(event.detail.x - 100) < 1))
  },
)
