import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdtemp, writeFile, readFile, rm, chmod } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import test from 'node:test'

const launcher = new URL('../../../tools/probe/mobile-launch.ts', import.meta.url)
async function fixture(run) {
  const work = await mkdtemp(resolve(tmpdir(), 'camera-probe-launch-'))
  try {
    const artifact = resolve(work, 'probe.ipa')
    const trace = resolve(work, 'calls.jsonl')
    await writeFile(artifact, '')
    await writeFile(resolve(work, '.artifact-device.json'), JSON.stringify(artifact))
    const mock = resolve(work, 'xcrun')
    await writeFile(
      mock,
      `#!${process.execPath}
const fs = require('node:fs')
fs.appendFileSync(process.env.CAMERA_TEST_TRACE, JSON.stringify(process.argv.slice(2)) + '\\n')
if (process.argv.includes('launch')) process.stdout.write(JSON.stringify({result:{process:{processIdentifier:4242}}}))
`,
    )

    await chmod(mock, 0o755)
    await run(work, trace)
  } finally {
    await rm(work, { recursive: true, force: true })
  }
}

function launch(work, trace, mode) {
  const child = spawn(
    process.execPath,
    [
      launcher.pathname,
      'ios',
      'fake-device',
      work,
      'owned.probe',
      'http://localhost:1',
      '2000',
      mode,
    ],
    {
      env: { ...process.env, PATH: work + ':' + process.env.PATH, CAMERA_TEST_TRACE: trace },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  )
  let output = ''
  const done = new Promise((resolve, reject) => {
    child.on('error', reject)
    child.on('exit', (code) => resolve(code))
  })
  child.stdout.on('data', (chunk) => {
    output += chunk
  })
  const timer = setTimeout(() => child.kill('SIGKILL'), 5000)
  done.finally(() => clearTimeout(timer))
  return { child, done, output: () => output }
}

test('signed build-only probe phase never installs or launches a device app', async () =>
  fixture(async (work, trace) => {
    const h = launch(work, trace, 'physical-build')
    assert.equal(await h.done, 0)
    await assert.rejects(readFile(trace), { code: 'ENOENT' })
    assert.equal(h.output(), '')
  }))

test('physical probe requests CoreDevice JSON and terminates the exact launched PID', async () =>
  fixture(async (work, trace) => {
    const h = launch(work, trace, 'physical')
    try {
      while (!h.output().includes('[xplat-probe-host-ready]')) {
        if (h.child.exitCode !== null || h.child.signalCode !== null) {
          assert.fail('Launcher exited before readiness')
        }

        await new Promise((resolve) => setTimeout(resolve, 10))
      }

      assert.match(h.output(), /\[xplat-probe-ios-app\] owned.probe/)
    } finally {
      h.child.kill('SIGTERM')
    }
    assert.equal(await h.done, 0)
    const calls = (await readFile(trace, 'utf8')).trim().split('\n').map(JSON.parse)
    const command = calls.find((args) => args.includes('launch'))
    assert.deepEqual(
      command.slice(command.indexOf('--json-output'), command.indexOf('--json-output') + 2),
      ['--json-output', '-'],
    )
    const terminate = calls.find((args) => args.includes('terminate'))
    assert.deepEqual(terminate.slice(terminate.indexOf('--pid')), ['--pid', '4242'])
  }))
