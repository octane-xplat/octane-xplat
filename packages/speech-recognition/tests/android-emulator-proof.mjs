#!/usr/bin/env node
// Android emulator proof for @octane-xplat/speech-recognition — drives the
// real android.speech.SpeechRecognizer on the `elegant-fir-probe` AVD
// (Pixel 6, API 35, Google APIs, ARM64) with spoken audio injected through
// the host's BoomAudio loopback microphone (`say -a BoomAudio`).
//
// Reservations — run this script inside the device reservation (and the
// build reservation for the first `ns` build):
//   goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"speech-recognition Android build"}' -- <build command>
//   goddard-agent resource run --json '{"exclusive":["android:elegant-fir-probe"],"resident_devices":1},"purpose":"speech-recognition emulator proof"}' -- \
//     node packages/speech-recognition/tests/android-emulator-proof.mjs
//
// What it does:
//   1. Locates adb and the running emulator for elegant-fir-probe.
//   2. Verifies host-mic passthrough (hw.audioInput) in the AVD config.
//   3. Launches the repo probe runner on the device-side case
//      tests/fixtures/speech-probe-case.ts with the package wired as a dep.
//   4. Grants RECORD_AUDIO to the generated probe app as soon as it is
//      installed (fingerprinted id org.octanexplat.probe.*).
//   5. Watches logcat for SPEAK_NOW, then plays the phrase via
//      `say -a BoomAudio` until SPEECH_RESULT/DONE arrives.
//   6. Parses the runner's JSON, asserts a non-empty transcript, and writes
//      evidence to ~/agent-scratch/octane-xplat/speech-recognition/.
//
// Exit 0 = transcript captured; 1 = any step failed (details on stderr).
// The script never creates/erases AVDs and kills nothing it did not start.

import { spawn, spawnSync, execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = join(HERE, '..', '..', '..')
const CASE = join(HERE, 'fixtures', 'speech-probe-case.ts')
const AVD = 'elegant-fir-probe'
const PHRASE = process.env.SPEECH_PHRASE ?? 'hello octane speech recognition'
const ANDROID_HOME = process.env.ANDROID_HOME ?? join(homedir(), 'Library', 'Android', 'sdk')
const ADB = process.env.ADB ?? join(ANDROID_HOME, 'platform-tools', 'adb')
const SCRATCH = join(homedir(), 'agent-scratch', 'octane-xplat', 'speech-recognition')

const fail = (msg, code = 1) => {
  console.error(`[android-proof] FAIL: ${msg}`)
  process.exit(code)
}
const note = (msg) => console.log(`[android-proof] ${msg}`)

const run = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts })

const adb = (...args) => run(ADB, args)

if (!existsSync(ADB)) {
  fail(`adb not found at ${ADB} — set ANDROID_HOME/ADB`)
}

// --- device selection ------------------------------------------------------
const devicesOut = adb('devices', '-l')
const serials = devicesOut
  .split('\n')
  .filter((line) => /^emulator-\d+\s+device\b/.test(line.trim()))
  .map((line) => line.trim().split(/\s+/)[0])
const requested = process.argv.includes('--device')
  ? process.argv[process.argv.indexOf('--device') + 1]
  : undefined
const serial = requested ?? (serials.length === 1 ? serials[0] : undefined)
if (!serial) {
  fail(
    `expected exactly one running emulator for ${AVD}, found: ${serials.join(', ') || 'none'} — ` +
      `boot it first (emulator -avd ${AVD} -port 5556) or pass --device`,
  )
}
const booted = adb('-s', serial, 'shell', 'getprop', 'sys.boot_completed').trim()
if (booted !== '1') {
  fail(`${serial} is not done booting (sys.boot_completed=${booted})`)
}
note(`using device ${serial}`)

// --- audio passthrough check ------------------------------------------------
const configPath = join(homedir(), '.android', 'avd', `${AVD}.avd`, 'config.ini')
if (existsSync(configPath)) {
  const config = readFileSync(configPath, 'utf8')
  const audioIn = /^hw\.audioInput\s*=\s*yes/m.test(config)
  note(`AVD config hw.audioInput=${audioIn ? 'yes' : 'missing/other'} (${configPath})`)
  if (!audioIn) {
    note('WARNING: host mic may not be captured — restart the SAME AVD with audio enabled')
  }
}

// --- probe runner + logcat orchestration -----------------------------------
const logcat = spawn(ADB, ['-s', serial, 'logcat', '-v', 'brief'], {
  stdio: ['ignore', 'pipe', 'pipe'],
})
let logLines = ''
const marker = { speakNow: false, result: false, done: false }
logcat.stdout.on('data', (chunk) => {
  const text = String(chunk)
  logLines += text
  if (logLines.length > 512_000) {
    logLines = logLines.slice(-256_000)
  }
  if (text.includes('SPEAK_NOW')) {marker.speakNow = true}
  if (text.includes('SPEECH_RESULT')) {marker.result = true}
  if (text.includes('SPEECH_DONE')) {marker.done = true}
})

const grantPoll = setInterval(() => {
  try {
    const packages = adb('-s', serial, 'shell', 'pm', 'list', 'packages')
    for (const line of packages.split('\n')) {
      const name = line.trim().replace(/^package:/, '')
      if (name.startsWith('org.octanexplat.probe')) {
        adb('-s', serial, 'shell', 'pm', 'grant', name, 'android.permission.RECORD_AUDIO')
        note(`granted RECORD_AUDIO to ${name}`)
      }
    }
  } catch (e) {
    note(`grant poll: ${e.message}`)
  }
}, 2000)

const probeArgs = [
  'run',
  'probe',
  'run',
  CASE,
  '--target',
  'android',
  '--device',
  serial,
  '--deps',
  '@octane-xplat/speech-recognition',
  '--timeout',
  '300000',
  '--startup-timeout',
  '900000',
]
note(`probe: bun ${probeArgs.join(' ')}`)
const probe = spawn('bun', probeArgs, { cwd: REPO, stdio: ['ignore', 'pipe', 'inherit'] })
let probeOut = ''
probe.stdout.on('data', (chunk) => {
  probeOut += String(chunk)
  process.stdout.write(chunk)
})

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Speech loop — once the device announces the session, play the phrase into
// the BoomAudio loopback until the engine reports or the probe exits.
let said = 0
const speakLoop = (async () => {
  while (!marker.speakNow && probe.exitCode === null) {
    await sleep(500)
  }
  while (!marker.done && probe.exitCode === null && said < 8) {
    const res = spawnSync('say', ['-a', 'BoomAudio', PHRASE])
    said++
    if (res.status !== 0) {
      note(`say exited ${res.status} — BoomAudio device missing?`)
      break
    }
    note(`played phrase ${said}x via BoomAudio`)
    // Pause before repeating — give the recognizer room to endpoint.
    await sleep(6000)
    if (marker.result) {break}
  }
})()

const probeExit = await new Promise((resolve) => probe.on('exit', resolve))
clearInterval(grantPoll)
logcat.kill()
await speakLoop.catch(() => {})

// --- evidence ---------------------------------------------------------------
mkdirSync(SCRATCH, { recursive: true })
const evidencePath = join(SCRATCH, `android-proof-${Date.now()}.json`)
const jsonLine = probeOut
  .split('\n')
  .filter((line) => line.trim().startsWith('{'))
  .pop()
let report = { probeExit, said, markers: marker }
try {
  report.probe = JSON.parse(jsonLine ?? 'null')
} catch {
  report.probeParseError = 'no JSON result line found'
}
writeFileSync(
  evidencePath,
  JSON.stringify({ ...report, logcatTail: logLines.slice(-64_000) }, null, 2),
)
note(`evidence: ${evidencePath}`)

const results = report.probe?.results ?? []
const session = results.find((r) => r.name === 'session1.result')?.value
const transcript = session?.transcript ?? ''
note(`transcript: ${JSON.stringify(transcript)}`)
note(`session1 result: ${JSON.stringify(session)}`)
if (probeExit !== 0) {
  fail(`probe runner exited ${probeExit}`)
}
if (transcript.length === 0) {
  fail('no transcript captured — check audio path and evidence JSON', 2)
}
note('PASS')
