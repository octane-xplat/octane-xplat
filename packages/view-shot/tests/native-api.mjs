import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { join } from 'node:path'

const platform = process.argv[2]

assert.ok(['ios', 'macos'].includes(platform))

const root = fileURLToPath(new URL('..', import.meta.url))
const repo = fileURLToPath(new URL('../../..', import.meta.url))

if (platform === 'macos') {
  // The macOS check runs the shipped TypeScript backend inside the real
  // node-api ObjC runtime; Bun supplies extensionless TS resolution.
  const result = spawnSync('bun', [join(root, 'tests/macos-capture.mjs')], {
    encoding: 'utf8',
    timeout: 120000,
  })

  assert.equal(result.status, 0, result.stdout + result.stderr)
  console.log(result.stdout.trim())
} else {
  // Real capture dispatch inside a NativeScript iOS app on a task-owned
  // simulator, mirroring the maintained ios-runtime checks.
  const device = process.env.XPLAT_IOS_DEVICE

  assert.ok(
    repo && device,
    'Select the repository checkout and a task-owned simulator via XPLAT_IOS_DEVICE',
  )

  const caseFile = join(root, 'tests/runtime.ios.ts')
  const { prepare } = await import(pathToFileURL(join(repo, 'tools/probe/project.ts')).href)

  await prepare('ios', caseFile, ['@octane-xplat/lib'])

  const result = spawnSync(
    'bun',
    [
      'run',
      'probe',
      'run',
      caseFile,
      '--target',
      'ios',
      '--device',
      device,
      '--deps',
      '@octane-xplat/lib',
      '--timeout',
      '45000',
      '--startup-timeout',
      '300000',
    ],
    { cwd: repo, encoding: 'utf8', timeout: 320000 },
  )

  assert.equal(result.status, 0, result.stdout + result.stderr)

  const report = JSON.parse(result.stdout.slice(result.stdout.indexOf('{')))

  assert.equal(report.results.length, 1)
  assert.equal(report.results[0].status, 'pass', JSON.stringify(report.results[0]))
  console.log(
    `iOS runtime capture: ${report.results[0].assertions.length} runtime assertions passed on ${device}.`,
  )
}
