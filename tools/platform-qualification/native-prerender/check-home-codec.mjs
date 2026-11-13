import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

// Run inside a native_builds reservation. No device or UI engine is started.
const root = join(homedir(), 'agent-scratch/octane-xplat/native-prerender-home-codec')
mkdirSync(root, { recursive: true })
const work = mkdtempSync(join(root, 'run-'))
const binary = join(work, 'home-artifact-check')
const source = import.meta.dirname
const producer = process.env.XPLAT_HOME_CODEC_PRODUCER
const inputs = [
  resolve(source, '../../../packages/native-prerender/platforms/ios/StartupArtifact.swift'),
  join(source, 'home-native/HomeArtifact.swift'),
  join(source, 'home-native/HomeArtifactCheck.swift'),
  join(source, 'home-backend.test.mjs'),
  import.meta.filename,
  ...(producer
    ? ['resolved.json', 'startup.bin', 'build.json'].map((name) => join(producer, name))
    : []),
]
const hash = (path) => createHash('sha256').update(readFileSync(path)).digest('hex')
const inputHashes = Object.fromEntries(inputs.map((path) => [path, hash(path)]))
const commands = []
function run(command, args, env = process.env, echo = true) {
  commands.push({ command, args })
  const result = spawnSync(command, args, {
    env,
    encoding: 'utf8',
    timeout: 180000,
    maxBuffer: 4 * 1024 * 1024,
  })
  writeFileSync(
    join(work, 'command-' + commands.length + '.log'),
    (result.stdout ?? '') + (result.stderr ?? ''),
  )
  if (result.status !== 0)
    throw new Error('iOS backend check failed: ' + (result.error?.message ?? result.stderr))
  if (echo && result.stdout) process.stdout.write(result.stdout)
  return result.stdout
}
run('xcrun', ['swiftc', ...inputs.slice(0, 3), '-o', binary])
run(process.execPath, ['--test', join(source, 'home-backend.test.mjs')], {
  ...process.env,
  XPLAT_HOME_CODEC_NATIVE: binary,
  XPLAT_HOME_CODEC_WORK: work,
  XPLAT_HOME_CODEC_PLATFORM: 'ios',
})
if (producer) {
  const build = JSON.parse(readFileSync(join(producer, 'build.json'), 'utf8'))
  assert.equal(build.platform, 'ios', 'Expected an iOS producer artifact')
  const expected = JSON.parse(readFileSync(join(producer, 'resolved.json'), 'utf8'))
  const decoded = run(binary, [join(producer, 'startup.bin'), build.buildHash], process.env, false)
  const { scope, ...projection } = expected
  for (const rows of Object.values(projection.variants))
    for (const row of rows) {
      row.cssKeys.sort()
      row.inheritedKeys.sort()
    }
  assert.deepEqual(JSON.parse(decoded), projection)
  console.log('Actual iOS producer binary matches its complete semantic projection')
}
for (const [path, expected] of Object.entries(inputHashes))
  if (hash(path) !== expected) throw new Error('Backend input changed during verification: ' + path)
writeFileSync(
  join(work, 'build.json'),
  JSON.stringify(
    {
      inputHashes,
      binaryHash: hash(binary),
      commands,
      scope: 'Host-native iOS backend checks only; no simulator or runtime hydration qualification',
    },
    null,
    2,
  ),
)
console.log('Native Home backend evidence: ' + work)
