import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { parse } from 'yaml'

const workflow = parse(readFileSync('.github/workflows/release.yml', 'utf8'))

for (const job of ['lockstep', 'nightly']) {
  test(`${job} builds every native payload through Turbo and stops on failure`, (t) => {
    const directory = mkdtempSync(join(tmpdir(), 'release-native-'))

    t.after(() => rmSync(directory, { recursive: true, force: true }))

    const log = join(directory, 'commands.jsonl')
    const bun = join(directory, 'bun')

    writeFileSync(
      bun,
      `#!${process.execPath}
import { appendFileSync } from 'node:fs'
appendFileSync(process.env.COMMAND_LOG, JSON.stringify({
  args: process.argv.slice(2),
  target: process.env.GOOS + '-' + process.env.GOARCH,
  version: process.env.XPLAT_GO_VERSION,
}) + '\\n')
if (process.env.GOOS === process.env.FAIL_OS) process.exit(7)
`,
    )

    chmodSync(bun, 0o755)

    const step = workflow.jobs[job].steps.find((step) => step.name === 'Build native CLI payloads')
    const run = (failOS = '') =>
      spawnSync('/bin/bash', ['-c', step.run], {
        env: {
          ...process.env,
          PATH: directory,
          COMMAND_LOG: log,
          VERSION: '0.0.0-nightly.g1234567',
          FAIL_OS: failOS,
        },
        encoding: 'utf8',
      })

    const success = run()

    assert.equal(success.status, 0, success.stderr)

    const commands = readFileSync(log, 'utf8').trim().split('\n').map(JSON.parse)

    assert.deepEqual(
      commands.map(({ target }) => target),
      ['darwin-arm64', 'darwin-amd64', 'linux-amd64', 'linux-arm64', 'windows-amd64'],
    )

    for (const command of commands) {
      assert.deepEqual(command.args, [
        'run',
        'turbo',
        'run',
        'build:go',
        '--filter=@octane-xplat/cli',
      ])

      assert.equal(command.version, '0.0.0-nightly.g1234567')
    }

    writeFileSync(log, '')
    assert.equal(run('linux').status, 7)
    assert.equal(readFileSync(log, 'utf8').trim().split('\n').length, 3)
  })
}
