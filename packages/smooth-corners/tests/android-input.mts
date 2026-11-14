import { spawn, spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { setTimeout } from 'node:timers/promises'
import { caseIdentity } from '../../../tools/probe/project.ts'

const deviceIndex = process.argv.indexOf('--device')
const device = deviceIndex < 0 ? undefined : process.argv[deviceIndex + 1]

if (!device || device.startsWith('-')) {
  throw new Error('Pass --device with an existing Android device serial')
}

const root = fileURLToPath(new URL('../../../', import.meta.url))
const caseFile = join(root, 'packages/smooth-corners/tests/input.android.tsrx')
const projectDir = join(root, 'research/probes', caseIdentity('android', caseFile))
const adb = (args) => spawnSync('adb', ['-s', device, ...args], { encoding: 'utf8' })
const deviceStart = Number(adb(['shell', 'date', '+%s']).stdout.trim()) * 1000

if (!deviceStart) {
  throw new Error('Cannot read selected device clock')
}

const child = spawn(
  process.execPath,
  [
    'tools/probe/cli.ts',
    'run',
    caseFile,
    '--target',
    'android',
    '--device',
    device,
    '--timeout',
    '60000',
  ],
  { cwd: root, stdio: 'inherit' },
)

let done = false
let childCode = 1
const completion = new Promise((resolve, reject) => {
  child.once('error', reject)
  child.once('exit', (code) => {
    done = true
    childCode = code ?? 1
    resolve(code)
  })
})

const handled = new Set()
const deadline = Date.now() + 600000

try {
  while (!done && Date.now() < deadline) {
    if (adb(['get-state']).status !== 0) {
      throw new Error('Selected Android device disconnected during qualification')
    }

    if (existsSync(projectDir)) {
      const builds = readdirSync(projectDir)
        .filter((name) => name.startsWith('build-'))
        .sort(
          (a, b) => statSync(join(projectDir, b)).mtimeMs - statSync(join(projectDir, a)).mtimeMs,
        )

      for (const build of builds) {
        const config = join(projectDir, build, 'nativescript.config.ts')

        if (!existsSync(config)) {
          continue
        }

        const match = readFileSync(config, 'utf8').match(
          /"id":"(org\.octanexplat\.probe\.[a-z0-9.]+)"/,
        )

        if (!match) {
          continue
        }

        const app = match[1]
        const text = adb(['shell', 'run-as', app, 'cat', 'files/smooth-input.json']).stdout
        let state

        try {
          state = JSON.parse(text)
        } catch {
          continue
        }

        if (state.createdAt < deviceStart || !/^\d+$/.test(state.token)) {
          continue
        }

        const key = `${state.token}:${state.phase}`

        if (handled.has(key)) {
          continue
        }

        if (
          !['visible-corner', 'hidden-corner', 'hidden-center', 'visible-again'].includes(
            state.phase,
          )
        ) {
          throw new Error('Invalid input phase')
        }

        const coords = state.phase === 'hidden-center' ? state.center : state.corner

        if (
          !Array.isArray(coords) ||
          coords.length !== 2 ||
          !coords.every((n) => Number.isFinite(n) && n >= 0)
        ) {
          throw new Error('Invalid screen coordinates')
        }

        // Never send shared-device input while another app owns focus.
        // The windows-only dump omits mCurrentFocus on current Android releases.
        const windows = adb(['shell', 'dumpsys', 'window']).stdout

        if (
          !windows.split('\n').some((line) => line.includes('mCurrentFocus=') && line.includes(app))
        ) {
          continue
        }

        const tap = adb(['shell', 'input', 'tap', ...coords.map((n) => String(Math.round(n)))])

        if (tap.status !== 0) {
          throw new Error('Selected device rejected input tap')
        }

        if (state.phase === 'hidden-corner') {
          const ack = adb([
            'shell',
            'run-as',
            app,
            'touch',
            `files/smooth-input-${state.token}.ack`,
          ])

          if (ack.status !== 0) {
            throw new Error('Cannot acknowledge task-owned input phase')
          }
        }

        console.log(`SmoothCorners OS input: ${state.phase} at ${coords.map(Math.round).join(',')}`)
        handled.add(key)
      }
    }

    await setTimeout(200)
  }

  if (!done) {
    throw new Error('Android input qualification timed out')
  }

  await completion
  if (childCode !== 0 || handled.size !== 4) {
    throw new Error(
      `Android input qualification incomplete (${handled.size}/4 phases, exit ${childCode})`,
    )
  }
} finally {
  if (!done) {
    child.kill('SIGINT')
    await completion
  }
}
