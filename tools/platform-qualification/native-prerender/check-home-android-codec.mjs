import { spawnSync } from 'node:child_process'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

const javaHome = process.env.XPLAT_PRERENDER_JAVA_HOME
if (!javaHome) throw new Error('Set XPLAT_PRERENDER_JAVA_HOME to the installed JDK17')
const root = join(homedir(), 'agent-scratch/octane-xplat/native-prerender-android-codec')
mkdirSync(root, { recursive: true })
const work = mkdtempSync(join(root, 'run-'))
const source = import.meta.dirname
const producer = process.env.XPLAT_HOME_CODEC_PRODUCER
const inputs = [
  join(source, 'android-native/HomeArtifact.java'),
  join(source, 'android-codec/HomeArtifactCheck.java'),
  import.meta.filename,
  join(source, 'home-backend.test.mjs'),
  resolve(
    source,
    '../../../packages/native-prerender/platforms/android/java/org/octanexplat/prerender/StartupArtifact.java',
  ),
  ...(producer
    ? ['resolved.json', 'startup.bin', 'build.json'].map((name) => join(producer, name))
    : []),
]
const hash = (path) => createHash('sha256').update(readFileSync(path)).digest('hex')
const inputHashes = Object.fromEntries(inputs.map((path) => [path, hash(path)]))
const classes = join(work, 'classes')
mkdirSync(classes)
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
    throw new Error('Android codec check failed: ' + (result.error?.message ?? result.stderr))
  if (echo && result.stdout) process.stdout.write(result.stdout)
  return result.stdout
}
run(join(resolve(javaHome), 'bin/java'), ['-version'])
run(join(resolve(javaHome), 'bin/javac'), [
  '--release',
  '8',
  '-d',
  classes,
  inputs[0],
  inputs[1],
  inputs[4],
])
const quote = (value) => "'" + value.replaceAll("'", "'\\''") + "'"
const launcher = join(work, 'check-reader')
writeFileSync(
  launcher,
  '#!/bin/sh\nexec ' +
    quote(join(resolve(javaHome), 'bin/java')) +
    ' -cp ' +
    quote(classes) +
    ' org.octanexplat.prerenderandroid.HomeArtifactCheck "$@"\n',
  { mode: 0o755 },
)
run(process.execPath, ['--test', join(source, 'home-backend.test.mjs')], {
  ...process.env,
  XPLAT_HOME_CODEC_NATIVE: launcher,
  XPLAT_HOME_CODEC_PLATFORM: 'android',
  XPLAT_HOME_CODEC_WORK: work,
})
if (producer) {
  const build = JSON.parse(readFileSync(join(producer, 'build.json'), 'utf8'))
  assert.equal(build.platform, 'android', 'Expected an Android producer artifact')
  const expected = JSON.parse(readFileSync(join(producer, 'resolved.json'), 'utf8'))
  const decoded = run(
    join(resolve(javaHome), 'bin/java'),
    [
      '-cp',
      classes,
      'org.octanexplat.prerenderandroid.HomeArtifactCheck',
      join(producer, 'startup.bin'),
      build.buildHash,
    ],
    process.env,
    false,
  )
  const { scope, ...projection } = expected
  for (const rows of Object.values(projection.variants))
    for (const row of rows) {
      row.cssKeys.sort()
      row.inheritedKeys.sort()
    }
  assert.deepEqual(JSON.parse(decoded), projection)
  console.log('Actual Android producer binary matches its complete semantic projection')
}
for (const [path, digest] of Object.entries(inputHashes))
  if (hash(path) !== digest) throw new Error('Codec source changed during checks: ' + path)
writeFileSync(
  join(work, 'build.json'),
  JSON.stringify(
    {
      inputHashes,
      commands,
      classHashes: Object.fromEntries(
        readdirSync(classes, { recursive: true })
          .filter((file) => file.endsWith('.class'))
          .map((file) => [file, hash(join(classes, file))]),
      ),
      scope:
        'JDK-host Android Java reader checks only; no Android device, UI or hydration qualification',
    },
    null,
    2,
  ),
)
console.log('Android Home codec evidence: ' + work)
