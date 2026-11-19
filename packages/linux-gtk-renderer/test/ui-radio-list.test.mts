import { runGtkEvalFixture } from './gjs-ui-fixture.mts'
import assert from 'node:assert/strict'
import { execFileSync, spawn, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { createInterface } from 'node:readline'
import test from 'node:test'
import { build } from 'vite'
import { linuxGtk } from '../../cli/src/linux-gtk/vite.ts'
import { gtkRuntimeReady, gtkRuntimeUnavailableReason } from './gjs-availability.mts'

test(
  'GTK radio lists preserve fields and grouped keyboard navigation under Mason',
  { timeout: 120000 },
  async (t) => {
    if (process.env.LINUX_RUNTIME_EVAL_ENGINE) {
      return runGtkEvalFixture(t, {
        stem: 'ui-radio-list',
        title: 'Octane GTK radio test',
        marker: 'GTK_RADIO',
        minChecks: { os: 100, properties: 50 },
        input: true,
      })
    }

    const fixture = fileURLToPath(new URL('./fixtures/', import.meta.url))
    const outDir = join(fixture, 'dist-ui-radio-list')

    if (!gtkRuntimeReady()) {
      t.skip(gtkRuntimeUnavailableReason())
      return
    }

      await build({
        logLevel: 'error',
        ...(await linuxGtk('production', {
          root: fixture,
          entry: 'src/ui-radio-list-main.ts',
          outDir,
        })),
      })

      const osInput =
        process.platform === 'linux' &&
        !!process.env.DISPLAY &&
        spawnSync('xdotool', ['version']).status === 0

      const env = {
        ...process.env,
        GTK_A11Y: 'test',
        GTK_RADIO_OS: osInput ? '1' : '0',
      }

      const child = spawn('gjs', ['-m', join(outDir, 'app.js')], {
        env,
        stdio: ['ignore', 'pipe', 'pipe'],
      })

      let stdout = '',
        stderr = '',
        inputError

      child.stderr.on('data', (data) => {
        stderr += data
      })

      const lines = createInterface({ input: child.stdout })

      lines.on('line', (line) => {
        stdout += line + '\n'
        if (!line.startsWith('GTK_RADIO_READY ')) {
          return
        }

        try {
          const phase = JSON.parse(line.slice('GTK_RADIO_READY '.length))
          const id = execFileSync(
            'xdotool',
            ['search', '--onlyvisible', '--name', '^Octane GTK radio test$'],
            { env, encoding: 'utf8' },
          )
            .trim()
            .split('\n')[0]

          const send = (...args) => execFileSync('xdotool', args, { env, timeout: 7000 })

          send('windowfocus', id)
          if (phase.point) {
            send('mousemove', '--window', id, String(phase.point.x), String(phase.point.y))
            send('click', '1')
          } else {
            send('key', phase.key)
          }

          send('key', 'F12')
        } catch (error) {
          inputError = error
          child.kill()
        }
      })

      const timer = setTimeout(() => child.kill(), 45000)

      t.after(() => {
        clearTimeout(timer)
        lines.close()
        if (child.exitCode === null) {
          child.kill()
        }
      })

      const code = await new Promise((resolve, reject) => {
        child.once('error', reject)
        child.once('close', resolve)
      })

      assert.equal(code, 0, stdout + '\n' + stderr + '\n' + (inputError ?? ''))
      assert.doesNotMatch(stderr, /Gtk-CRITICAL|Gjs-(?:Console-)?CRITICAL|event handler failed/)

      const line = stdout.split('\n').find((line) => line.startsWith('GTK_RADIO '))

      assert.ok(line, stdout)

      const result = JSON.parse(line.slice('GTK_RADIO '.length))

      assert.ok(
        result.checks >= (osInput ? 100 : 50),
        JSON.stringify(result),
      )

      assert.equal(result.osInput, osInput)
      t.diagnostic(
        process.platform +
          '; GTK ' +
          result.gtk +
          '; ' +
          result.checks +
          ' assertions; Mason; typed native-value comparisons' +
          '; actual OS radio keys: ' +
          osInput +
          '; no images or AT-client proof',
      )
  },
)
