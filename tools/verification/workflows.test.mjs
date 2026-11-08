import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const repository = fileURLToPath(new URL('../../', import.meta.url))
function execute(t, script, args = [], env = {}) {
  const directory = mkdtempSync(join(tmpdir(), 'xplat-verification-'))

  t.after(() => rmSync(directory, { recursive: true, force: true }))

  const log = join(directory, 'commands.jsonl')
  const bun = join(directory, 'bun')

  writeFileSync(
    bun,
    `#!${process.execPath}
import { appendFileSync } from 'node:fs'
const args = process.argv.slice(2)
appendFileSync(process.env.COMMAND_LOG, JSON.stringify({ args, cwd: process.cwd(), browser: process.env.XPLAT_WEB_BROWSER, browsers: process.env.XPLAT_WEB_BROWSERS }) + '\\n')
if (args.includes(process.env.FAIL_TASK)) { process.exit(7) }
`,
  )

  chmodSync(bun, 0o755)

  const result = spawnSync(
    process.execPath,
    [fileURLToPath(new URL(script, import.meta.url)), ...args],
    {
      cwd: directory,
      env: { ...process.env, PATH: directory, COMMAND_LOG: log, ...env },
      encoding: 'utf8',
    },
  )

  return { result, commands: readFileSync(log, 'utf8').trim().split('\n').map(JSON.parse) }
}

test('browser matrix selects each engine and dispatches owning Turbo tasks from the repository', (t) => {
  const { result, commands } = execute(t, './test-e2e.ts')

  assert.equal(result.status, 0, result.stderr)
  assert.ok(commands.every((command) => command.cwd === repository.replace(/\/$/, '')))
  assert.deepEqual(commands[0].args, [
    'run',
    '--cwd',
    'apps/web',
    'playwright',
    'install',
    'chromium',
    'firefox',
    'webkit',
  ])

  for (const browser of ['chromium', 'firefox', 'webkit']) {
    const tasks = commands.filter((command) => command.browser === browser)

    assert.equal(tasks.length, 6)
    assert.deepEqual(
      tasks.map(({ args }) => args[3]),
      ['input:readiness', 'test:id', 'sqlite:readiness', 'sheet:readiness', 'smoke', 'test:e2e'],
    )

    assert.ok(tasks.slice(0, 5).every(({ args }) => args.includes('--filter=@xplat/web')))
    assert.ok(tasks[5].args.includes('--filter=@octane-xplat/lightbox'))
  }

  assert.equal(commands.at(-1).browsers, 'chromium,firefox,webkit')
})

test('browser failures stop the matrix and preserve the exit status', (t) => {
  const { result, commands } = execute(t, './test-e2e.ts', [], { FAIL_TASK: 'test:id' })

  assert.equal(result.status, 7)
  assert.equal(commands.at(-1).browser, 'chromium')
  assert.equal(commands.at(-1).args[3], 'test:id')
})

test('macOS parity orders coverage, both measurements, then comparison', (t) => {
  const { result, commands } = execute(t, './qualify.ts', ['parity:macos'])

  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(
    commands.map(({ args }) => args),
    [
      ['run', '--filter', '@xplat/verification', 'parity:coverage'],
      ['run', 'turbo', 'run', 'parity', '--filter=@xplat/web'],
      ['run', 'turbo', 'run', 'parity', '--filter=@xplat/macos'],
      ['run', 'node', 'tools/verification/parity-check.ts', '--targets=web,macos'],
    ],
  )
})

test('macOS smoke retains harness checks and isolated probes', (t) => {
  const { result, commands } = execute(t, './qualify.ts', ['smoke:macos'])

  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(
    commands.slice(0, 3).map(({ args }) => args[3]),
    ['smoke', 'test:animation', 'test:layout-placement'],
  )

  assert.deepEqual(
    commands.slice(3).map(({ args }) => args[3]),
    [
      'examples/probes/signals.ts',
      'examples/probes/counter.tsrx',
      'examples/probes/lottie.macos.tsrx',
    ],
  )

  assert.deepEqual(commands.at(-1).args.slice(-2), ['--deps', '@octane-xplat/lottie'])
})
