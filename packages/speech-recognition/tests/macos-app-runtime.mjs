// Real macOS runtime proof (opt-in, NOT part of `test`): assembles a minimal
// packaged .app around the prebuilt JSC host with both usage strings in
// Info.plist — the same Contents/ layout packageMacOS produces — then runs a
// speech session through the compiled facade while `say -a BoomAudio` plays
// a phrase into the virtual loopback that is this host's default input.
//
// TCC will prompt for Microphone and Speech Recognition on first run for the
// fixture bundle id (org.xplat.speech-fixture); grant both.
//
//   node tests/macos-app-runtime.mjs [--phrase "the quick brown fox"]
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { cp, mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { chmodSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { writeNativeBootstrap } from '../../cli/src/macos/native.ts'
import { buildMacOSSpeechArm64 } from './macos-build.mjs'
import { hostBundle } from '../../cli/src/macos/jsc-host/runtime.ts'
import { writeInfoPlist } from '../../cli/src/macos/info-plist.ts'

const leaf = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const phrase =
  process.argv.find((a) => a.startsWith('--phrase='))?.slice('--phrase='.length) ??
  'the quick brown fox jumps over the lazy dog'
const scratch = join(homedir(), 'agent-scratch/octane-xplat/speech-recognition')
const work = await mkdtemp(join(tmpdir(), 'xplat-speech-app-'))
let artifactDir = null

const main = `
var keepalive = setInterval(function () {}, 500)
console.log('SPEECH_FIXTURE configured=' + XplatSpeechRecognizer.isConfigured()
  + ' perm=' + XplatSpeechRecognizer.permissionStatus()
  + ' avail=' + XplatSpeechRecognizer.availabilityJSON('en-US'))
XplatSpeechRecognizer.requestPermission(function (status) {
  console.log('SPEECH_FIXTURE permission=' + status)
  var rec = XplatSpeechRecognizer.startWithLanguageInterimResultsContinuousOnEvent(
    'en-US', true, true,
    function (type, text, segmentFinal, domain, code, message) {
      console.log('SPEECH_EVENT ' + type
        + ' final=' + segmentFinal
        + ' code=' + domain + ':' + code
        + ' text=' + JSON.stringify(text)
        + ' msg=' + JSON.stringify(message))
      if (type === 'finished' || type === 'error' || type === 'interrupted') {
        clearInterval(keepalive)
      }
    })
  if (rec === null) {
    console.log('SPEECH_FIXTURE start=null')
    clearInterval(keepalive)
    return
  }
  setTimeout(function () { console.log('SPEECH_FIXTURE finishing'); rec.finish() }, 14000)
  setTimeout(function () { console.log('SPEECH_FIXTURE deadline-cancel'); rec.cancel(); clearInterval(keepalive) }, 60000)
})
`

try {
  await mkdir(join(work, 'node_modules/@octane-xplat'), { recursive: true })
  await symlink(leaf, join(work, 'node_modules/@octane-xplat/speech-recognition'))
  await writeFile(
    join(work, 'package.json'),
    JSON.stringify({
      name: 'speech-fixture',
      dependencies: { '@octane-xplat/speech-recognition': '0.20.0' },
    }),
  )

  const artifact = await buildMacOSSpeechArm64(work)
  artifactDir = artifact.directory
  assert.equal(artifact.leaves.length, 1)

  const appPath = join(work, 'SpeechFixture.app')
  const contents = join(appPath, 'Contents')
  const exe = join(contents, 'MacOS', 'speechfixture')
  await mkdir(dirname(exe), { recursive: true })
  await mkdir(join(contents, 'Frameworks'), { recursive: true })
  await mkdir(join(contents, 'Resources'), { recursive: true })
  await cp(join(hostBundle, 'host'), exe)
  chmodSync(exe, 0o755)
  await symlink(
    join(hostBundle, 'NativeScript.framework'),
    join(contents, 'Frameworks', 'NativeScript.framework'),
    'dir',
  )
  for (const library of artifact.libraries) {
    await cp(join(artifact.directory, library.file), join(contents, 'Frameworks', library.file))
  }
  for (const lib of artifact.prebuilt ?? []) {
    await cp(lib.source, join(contents, 'Frameworks', lib.file))
  }
  await writeFile(
    join(contents, 'Info.plist'),
    writeInfoPlist({
      productName: 'Speech Fixture',
      executableName: 'speechfixture',
      bundleIdentifier: 'org.xplat.speech-fixture',
      version: '1.0.0',
      minimumSystemVersion: '14.0',
      infoPlist: {
        NSSpeechRecognitionUsageDescription: 'Speech fixture transcribes spoken phrases for tests.',
        NSMicrophoneUsageDescription: 'Speech fixture captures the microphone for dictation tests.',
      },
    }),
  )

  const bootstrap = join(work, 'bootstrap.js')
  await writeNativeBootstrap(artifact, bootstrap, { packaged: true })
  const script = join(work, 'main.cjs')
  await writeFile(script, main)

  const framework = join(
    contents,
    'Frameworks/NativeScript.framework/Versions/A/NativeScript',
  )
  const run = spawn(exe, [framework, script, artifact.metadata.arm64, bootstrap], {
    encoding: 'utf8',
  })
  let output = ''
  let said = false
  const done = new Promise((resolveDone) => {
    run.stdout.on('data', (chunk) => {
      output += chunk
      if (!said && output.includes('SPEECH_FIXTURE permission=granted')) {
        said = true
        spawn('say', ['-a', 'BoomAudio', phrase])
      }
      if (output.includes('SPEECH_EVENT finished') || output.includes('SPEECH_EVENT error')) {
        resolveDone()
      }
    })
    run.stderr.on('data', (chunk) => {
      output += chunk
    })
    run.on('exit', resolveDone)
  })
  const timeout = setTimeout(() => {
    run.kill('SIGTERM')
    resolveDone()
  }, 90000)
  await done
  clearTimeout(timeout)

  await mkdir(scratch, { recursive: true })
  const logPath = join(scratch, `macos-app-${Date.now()}.log`)
  await writeFile(logPath, output)
  console.log(output)
  console.log(`log written to ${logPath}`)

  assert.match(output, /SPEECH_FIXTURE permission=granted/, 'permission not granted')
  assert.match(output, /SPEECH_EVENT listening/, 'engine never started listening')
  const final = [...output.matchAll(/SPEECH_EVENT hypothesis final=true[^\n]*text=("[^"]*")/g)]
  assert.ok(final.length, 'no final hypothesis received')
  const transcript = JSON.parse(final.at(-1)[1]).toLowerCase()
  assert.ok(
    ['quick', 'brown', 'fox'].filter((w) => transcript.includes(w)).length >= 2,
    `final transcript missing phrase words: ${JSON.stringify(transcript)}`,
  )
  console.log(`MACOS_SPEECH_APP_OK transcript=${JSON.stringify(transcript)}`)
} finally {
  await rm(work, { recursive: true, force: true })
  if (artifactDir) {await rm(artifactDir, { recursive: true, force: true })}
}
