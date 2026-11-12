// Host-boundary check: the compiled XplatSpeechRecognizer facade must load
// inside the macOS JSC host, expose its selectors, and report unsupported
// from an unconfigured command-line host (no usage strings). Mirrors
// packages/geolocation/tests/verify-host.ts. No OS speech permission is
// requested.
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { writeNativeBootstrap } from '../../cli/src/macos/native.ts'
import { hostBundle } from '../../cli/src/macos/jsc-host/runtime.ts'
import { buildMacOSSpeechArm64 } from './macos-build.mts'

const leaf = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const app = await mkdtemp(join(tmpdir(), 'xplat-speech-host-'))
let artifactDir = null

try {
  await mkdir(join(app, 'node_modules/@octane-xplat'), { recursive: true })
  await symlink(leaf, join(app, 'node_modules/@octane-xplat/speech-recognition'))
  await writeFile(
    join(app, 'package.json'),
    JSON.stringify({
      name: 'speech-fixture',
      dependencies: { '@octane-xplat/speech-recognition': '0.20.0' },
    }),
  )

  const artifact = await buildMacOSSpeechArm64(app)

  artifactDir = artifact.directory
  assert.equal(artifact.leaves.length, 1)

  const bootstrap = join(app, 'bootstrap.js')

  await writeNativeBootstrap(artifact, bootstrap)

  const script = join(app, 'fixture.cjs')

  await writeFile(
    script,
    `
if (typeof XplatSpeechRecognizer === 'undefined') throw Error('Speech facade metadata missing');
for (const selector of ['defaultLanguage','isConfigured','permissionStatus','requestPermission','availabilityJSON','startWithLanguageInterimResultsContinuousOnEvent']) {
  if (typeof XplatSpeechRecognizer[selector] !== 'function') throw Error('Selector missing: ' + selector);
}
if (XplatSpeechRecognizer.isConfigured()) throw Error('Unconfigured command-line host must report unconfigured');
var raw = XplatSpeechRecognizer.availabilityJSON('en-US');
console.log('SPEECH_AVAIL_RAW type=' + typeof raw + ' value=' + JSON.stringify(raw));
var availability = JSON.parse(raw);
if (typeof availability.available !== 'boolean' || typeof availability.onDevice !== 'boolean') throw Error('Availability payload malformed');
console.log('MACOS_SPEECH_HOST_BOUNDARY_OK');
`,
  )

  // Instantiating SFSpeechRecognizer keeps a speechd XPC connection (and the
  // host runloop) alive, so the marker — not the exit status — is the pass
  // condition; the child is killed once it prints.
  const run = spawn(
    join(hostBundle, 'host'),
    [
      join(hostBundle, 'NativeScript.framework/Versions/A/NativeScript'),
      script,
      artifact.metadata.arm64,
      bootstrap,
    ],
    { encoding: 'utf8' },
  )

  let output = ''
  let resolveDone = () => {}
  const done = new Promise((resolve) => {
    resolveDone = resolve
    run.stdout.on('data', (chunk) => {
      output += chunk
      if (output.includes('MACOS_SPEECH_HOST_BOUNDARY_OK') || output.includes('Error')) {
        resolveDone()
      }
    })

    run.stderr.on('data', (chunk) => {
      output += chunk
    })

    run.on('exit', resolveDone)
  })

  const timeout = setTimeout(() => resolveDone(), 30000)

  await done
  clearTimeout(timeout)
  run.kill('SIGTERM')

  assert.match(output, /MACOS_SPEECH_HOST_BOUNDARY_OK/)
  console.log(
    'MACOS_SPEECH_HOST_BOUNDARY_OK: compiled facade and selectors loaded; unconfigured host unconfigured',
  )
} finally {
  await rm(app, { recursive: true, force: true })
  if (artifactDir) {
    await rm(artifactDir, { recursive: true, force: true })
  }
}
