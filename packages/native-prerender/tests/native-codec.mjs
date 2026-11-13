import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

// Run under a native_builds reservation; no device or JS app runtime is started.
const javaHome = process.env.XPLAT_PRERENDER_JAVA_HOME
assert.ok(javaHome, 'Set XPLAT_PRERENDER_JAVA_HOME to the installed JDK17')
const owner = resolve(import.meta.dirname, '..')
const scratch = join(homedir(), 'agent-scratch/octane-xplat/native-prerender-codec')
mkdirSync(scratch, { recursive: true })
const work = mkdtempSync(join(scratch, 'run-')),
  classes = join(work, 'classes')
mkdirSync(classes)
const sources = [
  join(owner, 'platforms/android/java/org/octanexplat/prerender/StartupArtifact.java'),
  join(owner, 'tests/native/StartupArtifactCheck.java'),
  join(owner, 'tests/native/interop.test.mjs'),
  join(owner, 'tests/fixture.mjs'),
  join(owner, 'platforms/ios/StartupArtifact.swift'),
  join(owner, 'tests/native/StartupArtifactCheck.swift'),
  import.meta.filename,
  ...['schema.ts', 'project.ts', 'environment.ts', 'codec.ts'].map((name) =>
    join(owner, 'src', name),
  ),
]
const hash = (file) => createHash('sha256').update(readFileSync(file)).digest('hex')
const inputs = Object.fromEntries(sources.map((path) => [path, hash(path)]))
const commands = []
function run(program, args, env = process.env) {
  commands.push({ program, args })
  const result = spawnSync(program, args, {
    env,
    encoding: 'utf8',
    timeout: 180000,
    maxBuffer: 8 * 1024 * 1024,
  })
  writeFileSync(
    join(work, 'command-' + commands.length + '.log'),
    (result.stdout ?? '') + (result.stderr ?? ''),
  )
  assert.equal(result.status, 0, String(result.error ?? result.stderr) + (result.stdout ?? ''))
  if (result.stdout) process.stdout.write(result.stdout)
}
run(join(javaHome, 'bin/javac'), ['--release', '8', '-d', classes, sources[0], sources[1]])
const swift = join(work, 'startup-artifact-swift')
run('xcrun', [
  'swiftc',
  join(owner, 'platforms/ios/StartupArtifact.swift'),
  join(owner, 'tests/native/StartupArtifactCheck.swift'),
  '-o',
  swift,
])
const readers = [
  {
    name: 'Java',
    program: join(javaHome, 'bin/java'),
    args: ['-cp', classes, 'org.octanexplat.prerender.StartupArtifactCheck'],
  },
  { name: 'Swift', program: swift, args: [] },
]
run(process.execPath, ['--test', join(owner, 'tests/native/interop.test.mjs')], {
  ...process.env,
  XPLAT_PRERENDER_NATIVE_READERS: JSON.stringify(readers),
  XPLAT_PRERENDER_NATIVE_WORK: work,
})
for (const [path, digest] of Object.entries(inputs))
  assert.equal(hash(path), digest, 'Native codec input changed: ' + path)
writeFileSync(
  join(work, 'result.json'),
  JSON.stringify(
    {
      passed: true,
      inputs,
      commands,
      readers: readers.map((reader) => reader.name),
      binaries: {
        swift: hash(swift),
        java: Object.fromEntries(
          readdirSync(classes, { recursive: true })
            .filter((file) => file.endsWith('.class'))
            .map((file) => [file, hash(join(classes, file))]),
        ),
      },
      scope:
        'Host-native Java/Swift XPI1 decoding/projection/preflight; no mobile device or UI claim',
    },
    null,
    2,
  ),
)
console.log('Native startup codec evidence: ' + work)
