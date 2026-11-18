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
  resolve(source, '../../../packages/native-prerender/platforms/ios/MasonArtifact.swift'),
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
  const sortRows = (projection) => {
    for (const rows of Object.values(projection.variants))
      for (const row of rows) {
        row.cssKeys.sort()
        row.inheritedKeys.sort()
      }
    return projection
  }
  if (expected.trees) {
    // Each bind's resolver arguments are its non-null launch-input values; a
    // null bind resolves through the absent-key declaration default.
    for (const tree of expected.trees) {
      const pairs = Object.entries(tree.bind)
        .filter(([, value]) => value !== null)
        .map(([name, value]) => name + '=' + value)
      const decoded = run(
        binary,
        [join(producer, 'startup.bin'), build.buildHash, ...pairs],
        process.env,
        false,
      )
      const { bind, placeholders, ...projection } = tree
      assert.deepEqual(
        JSON.parse(decoded),
        sortRows({ seed: expected.seed, ...projection }),
        'Bind ' + JSON.stringify(bind),
      )
    }
    // A persisted value outside the declared domain must select nothing.
    const outside = spawnSync(
      binary,
      [
        join(producer, 'startup.bin'),
        build.buildHash,
        build.configuration.launchInputs[0].name + '=__outside_domain__',
      ],
      { encoding: 'utf8', timeout: 15000 },
    )
    assert.equal(outside.status, 1, 'Out-of-domain value selected a tree')
    assert.match(outside.stderr, /outside declared domain/)
    console.log('Actual iOS producer binary matches every bind projection')
  } else {
    const decoded = run(binary, [join(producer, 'startup.bin'), build.buildHash], process.env, false)
    const { scope, ...projection } = expected
    assert.deepEqual(JSON.parse(decoded), sortRows(projection))
    console.log('Actual iOS producer binary matches its complete semantic projection')
  }
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
