#!/usr/bin/env node
// iOS simulator proof for @octane-xplat/speech-recognition — drives a real
// SFSpeechRecognizer session inside a probe app on the user's designated
// simulator (UDID 91D40099-A056-497D-A572-ADDDFD6A8F23, iPhone 18 Pro,
// iOS 27 — never create/clone/erase simulators) with spoken audio through
// the host's BoomAudio loopback (`say -a BoomAudio`), which the simulator
// captures as its microphone input.
//
// Reservations — run inside the device reservation (build reservation for
// the first `ns build ios`):
//   goddard-agent resource run --json '{"exclusive":["ios:91D40099-A056-497D-A572-ADDDFD6A8F23"],"resident_devices":1}' -- \
//     node packages/speech-recognition/tests/ios-simulator-proof.mjs
//
// What it does:
//   1. Verifies the designated simulator is booted.
//   2. Starts the repo probe runner on tests/fixtures/speech-probe-case.ts
//      with the package wired as a dep.
//   3. Polls `simctl listapps` for the generated org.octanexplat.probe.*
//      bundle id and `simctl privacy grant all`s it (mic + speech auth).
//   4. Watches `simctl spawn log stream` for SPEAK_NOW/SPEECH_* markers and
//      plays the phrase via `say -a BoomAudio` until SPEECH_DONE.
//   5. Parses the runner's JSON, asserts a non-empty transcript, and writes
//      evidence to ~/agent-scratch/octane-xplat/speech-recognition/.
//
// Exit 0 = transcript captured; 1 = any step failed (details on stderr).
// The script never creates/clones/erases simulators and kills nothing it
// did not start.

import { spawn, spawnSync, execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = join(HERE, '..', '..', '..')
const CASE = join(HERE, 'fixtures', 'speech-probe-case.ts')
const UDID = process.env.SPEECH_IOS_UDID ?? '91D40099-A056-497D-A572-ADDDFD6A8F23'
const PHRASE = process.env.SPEECH_PHRASE ?? 'hello octane speech recognition'
const SCRATCH = join(homedir(), 'agent-scratch', 'octane-xplat', 'speech-recognition')

const fail = (msg, code = 1) => {
  console.error(`[ios-proof] FAIL: ${msg}`)
  process.exit(code)
}

const note = (msg) => console.log(`[ios-proof] ${msg}`)

const run = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts })

// --- simulator check ---------------------------------------------------------
const booted = run('xcrun', ['simctl', 'list', 'devices', 'booted', '-j'])
const devices = JSON.parse(booted)?.devices ?? {}
const isBooted = Object.values(devices)
  .flat()
  .some((device) => device.udid === UDID && device.state === 'Booted')

if (!isBooted) {
  fail(`designated simulator ${UDID} is not booted — boot that device only`)
}

note(`using simulator ${UDID}`)

// --- log stream + permission orchestration -----------------------------------
const logStream = spawn('xcrun', ['simctl', 'spawn', UDID, 'log', 'stream', '--level', 'info'])
let logLines = ''
const marker = { speakNow: false, result: false, done: false }
const scan = (chunk) => {
  const text = String(chunk)
  logLines += text
  if (logLines.length > 512_000) {
    logLines = logLines.slice(-256_000)
  }
  if (text.includes('SPEAK_NOW')) {
    marker.speakNow = true
  }
  if (text.includes('SPEECH_RESULT')) {
    marker.result = true
  }
  if (text.includes('SPEECH_DONE')) {
    marker.done = true
  }
}

logStream.stdout.on('data', scan)
logStream.stderr.on('data', scan)

const granted = new Set()
const grantPoll = setInterval(() => {
  try {
    const apps = run('xcrun', ['simctl', 'listapps', UDID])
    for (const line of apps.split('\n')) {
      const match = /"(org\.octanexplat\.probe\.[^"]+)"/.exec(line)
      if (match && !granted.has(match[1])) {
        granted.add(match[1])
        try {
          run('xcrun', ['simctl', 'privacy', UDID, 'grant', 'all', match[1]])
          note(`simctl privacy grant all → ${match[1]}`)
        } catch (e) {
          note(`grant failed for ${match[1]}: ${e.message}`)
        }
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
  'ios',
  '--ios-device',
  UDID,
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
// the BoomAudio loopback until the case reports or the probe exits.
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
    await sleep(6000)
    if (marker.result) {
      break
    }
  }
})()

const probeExit = await new Promise((resolve) => probe.on('exit', resolve))
clearInterval(grantPoll)
logStream.kill()
await speakLoop.catch(() => {})

// --- evidence -----------------------------------------------------------------
mkdirSync(SCRATCH, { recursive: true })
const evidencePath = join(SCRATCH, `ios-proof-${Date.now()}.json`)
const jsonLine = probeOut
  .split('\n')
  .filter((line) => line.trim().startsWith('{'))
  .pop()

let report = { probeExit, said, markers: marker, granted: [...granted] }
try {
  report.probe = JSON.parse(jsonLine ?? 'null')
} catch {
  report.probeParseError = 'no JSON result line found'
}

writeFileSync(
  evidencePath,
  JSON.stringify({ ...report, logTail: logLines.slice(-64_000) }, null, 2),
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
