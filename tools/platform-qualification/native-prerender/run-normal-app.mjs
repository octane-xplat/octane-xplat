import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

// Runtime phase for the normal-app control. Requires the matching
// XPLAT_PRERENDER_NORMAL_BUILD directory plus the device reservation.
const directory = process.env.XPLAT_PRERENDER_NORMAL_BUILD
if (!directory) throw new Error('Set XPLAT_PRERENDER_NORMAL_BUILD to the normal-app build directory')
const root = resolve(directory)
const build = JSON.parse(readFileSync(join(root, 'build.json'), 'utf8'))
assert.equal(build.fixture, 'normal-app-startup')
const platform = build.platform
assert.ok(platform === 'ios' || platform === 'android')

const scenario = process.env.XPLAT_PRERENDER_SCENARIO ?? 'adopt-dark'
const SEEDED = {
  'adopt-dark': 'dark',
  'adopt-light': 'light',
  'adopt-absent': null,
  'reject-domain': 'neon',
  'reject-corrupt': 'dark',
  'no-artifact': 'dark',
}
assert.ok(Object.hasOwn(SEEDED, scenario), 'Unknown XPLAT_PRERENDER_SCENARIO ' + scenario)
const seeded = SEEDED[scenario]
const expectAdopt = scenario.startsWith('adopt')
const expectBind = expectAdopt ? seeded : null

// Same directory-aware digest build-normal-app.mjs records in sourceHashes.
const hash = (path) => {
  const h = createHash('sha256')
  if (statSync(path).isDirectory()) {
    for (const name of readdirSync(path).sort()) h.update(name + ':' + hash(join(path, name)))
    return h.digest('hex')
  }
  return h.update(readFileSync(path)).digest('hex')
}
for (const [path, expected] of Object.entries(build.sourceHashes))
  assert.equal(hash(path), expected, 'Source changed; rebuild: ' + path)

const parent = join(homedir(), 'dev/reports/octane-xplat/native-prerender-normal-app-' + platform)
mkdirSync(parent, { recursive: true })
const report = mkdtempSync(join(parent, 'run-'))
cpSync(join(root, 'build.json'), join(report, 'build.json'))
cpSync(import.meta.filename, join(report, 'runner.mjs'))
for (const name of readdirSync(root).filter((name) => name.endsWith('-command.log')))
  cpSync(join(root, name), join(report, name))

const udid = '91D40099-A056-497D-A572-ADDDFD6A8F23'
let interrupted
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => { interrupted = signal })

function run(command, args, fail = true, cwd) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    timeout: 180000,
    maxBuffer: 32 * 1024 * 1024,
    cwd,
  })
  if (fail && result.status !== 0)
    throw new Error(command + ' ' + args.join(' ') + ': ' + (result.error?.message ?? result.stderr))
  return result
}

// Build the launch product for this scenario. Corrupt/no-artifact modify a
// copy of the app so every scenario runs the same installed base.
const staged = join(report, 'staged')
mkdirSync(staged)
let product = build.app
if (platform === 'ios' && (scenario === 'reject-corrupt' || scenario === 'no-artifact')) {
  const copy = join(staged, 'StartupApp.app')
  cpSync(build.app, copy, { recursive: true })
  const bin = join(copy, 'app/startup.bin')
  if (scenario === 'reject-corrupt') {
    const data = readFileSync(bin)
    data[64] ^= 0xff
    writeFileSync(bin, data)
  } else {
    unlinkSync(bin)
  }
  run('codesign', ['--force', '--deep', '--sign', '-', copy])
  product = copy
}
if (platform === 'android' && (scenario === 'reject-corrupt' || scenario === 'no-artifact')) {
  const copy = join(staged, 'startup.apk')
  cpSync(build.app, copy)
  const entry = 'assets/app/startup.bin'
  if (scenario === 'reject-corrupt') {
    run('unzip', ['-o', copy, entry, '-d', staged])
    const extracted = join(staged, entry)
    const data = readFileSync(extracted)
    data[64] ^= 0xff
    writeFileSync(extracted, data)
    // Store the corrupted bytes at the same archive path.
    run('zip', [copy, entry], true, staged)
  } else {
    run('zip', ['-d', copy, entry])
  }
  const sdkRoot = process.env.XPLAT_PRERENDER_ANDROID_SDK ?? process.env.ANDROID_HOME ?? join(homedir(), 'Library/Android/sdk')
  const tools = join(sdkRoot, 'build-tools')
  const apksigner = join(tools, readdirSync(tools).sort().reverse()[0], 'apksigner')
  run(apksigner, [
    'sign',
    '--ks', join(homedir(), '.android/debug.keystore'),
    '--ks-pass', 'pass:android',
    copy,
  ])
  product = copy
}

let passed = false
const evidence = {}
try {
  if (platform === 'ios') {
    run('xcrun', ['simctl', 'bootstatus', udid, '-b'])
    run('xcrun', ['simctl', 'install', udid, product])
    const container = run('xcrun', ['simctl', 'get_app_container', udid, build.id, 'data']).stdout.trim()
    const docs = join(container, 'Documents')
    for (const name of ['result.json', 'native-mount.json', 'startup-outcome.json']) {
      const path = join(docs, name)
      if (existsSync(path)) unlinkSync(path)
    }
    const args = ['simctl', 'launch', udid, build.id]
    if (seeded !== null) args.push('-theme-preference', seeded)
    run('xcrun', args)
    let outcome, events, mount
    for (let i = 0; i < 90; i++) {
      if (interrupted) throw new Error('Interrupted: ' + interrupted)
      await new Promise((resolve) => setTimeout(resolve, 500))
      const outcomePath = join(docs, 'startup-outcome.json')
      const eventsPath = join(docs, 'result.json')
      const mountPath = join(docs, 'native-mount.json')
      if (existsSync(outcomePath)) outcome = JSON.parse(readFileSync(outcomePath, 'utf8'))
      if (existsSync(eventsPath)) events = JSON.parse(readFileSync(eventsPath, 'utf8'))
      if (existsSync(mountPath)) mount = JSON.parse(readFileSync(mountPath, 'utf8'))
      if (outcome) break
    }
    assert.ok(outcome, 'No startup outcome receipt')
    evidence.events = events
    evidence.mount = mount
    evidence.outcome = outcome
    const names = (events ?? []).map((event) => event.event)
    assert.ok(names.includes('engine-init-begin'), 'Engine init never ran')
    if (expectAdopt) {
      assert.equal(names.indexOf('native-mounted') >= 0, true, 'Native mount missing')
      assert.ok(names.indexOf('native-mounted') < names.indexOf('engine-init-begin'), 'Mount was not before engine init')
      assert.equal(events.find((event) => event.event === 'native-mounted').beforeEngineInit, true)
      assert.equal(mount.artifactRejected ?? false, false)
      assert.equal(mount.bind?.['theme-preference'] ?? null, expectBind)
      assert.equal(outcome.adopted, true, 'Expected adoption: ' + JSON.stringify(outcome))
      assert.ok(outcome.claims?.claimedCount > 0, 'No native claims consumed')
      assert.equal(outcome.claims.phase, 'live')
      assert.equal(outcome.visualNatives, mount.rows.length)
    } else {
      assert.equal(outcome.adopted, false, 'Expected fallback: ' + JSON.stringify(outcome))
      assert.ok(mount?.artifactRejected === true || !mount?.rows?.length, 'Expected native rejection receipt')
      if (scenario === 'reject-domain')
        assert.equal(mount.reason, 'launch inputs outside declared domain')
      if (scenario === 'no-artifact') assert.equal(mount.reason, 'missing artifact')
    }
    evidence.container = container
  } else {
    // Android phase: the reservation boots elegant-fir-probe.
    const devices = run('adb', ['devices']).stdout
    const serial = devices
      .split('\n')
      .slice(1)
      .map((line) => line.split('\t')[0])
      .find((name) => name.startsWith('emulator-'))
    assert.ok(serial, 'No Android emulator connected')
    run('adb', ['-s', serial, 'install', '-r', product])
    const file = (name) =>
      run('adb', ['-s', serial, 'shell', 'run-as', build.id, 'cat', 'files/' + name], false)
    run('adb', ['-s', serial, 'shell', 'run-as', build.id, 'rm', '-f', 'files/startup-outcome.json', 'files/startup-mount.json'], false)
    if (seeded !== null) {
      const prefs =
        `<?xml version='1.0' encoding='utf-8' standalone='yes' ?>\n<map><string name="theme-preference">${seeded}</string></map>\n`
      // Pipe through run-as so the app's own uid owns the persisted store
      // ApplicationSettings (prefs.db) and the native resolver both read.
      run('adb', ['-s', serial, 'shell', 'run-as', build.id, 'mkdir', '-p', 'shared_prefs'])
      // tee, not a shell redirect: adb joins argv into one command string, so
      // `>` inside a sh -c argument would be consumed by the outer shell.
      const seed = spawnSync(
        'adb',
        ['-s', serial, 'shell', 'run-as', build.id, 'tee', 'shared_prefs/prefs.db.xml'],
        { input: prefs, encoding: 'utf8' },
      )
      if (seed.status !== 0) throw new Error('prefs.db seeding failed: ' + seed.stderr)
    }
    run('adb', ['-s', serial, 'shell', 'am', 'start', '-W', '-n',
      build.id + '/org.octanexplat.prerender.StartupMountActivity'])
    let outcome, mount
    for (let i = 0; i < 90; i++) {
      if (interrupted) throw new Error('Interrupted: ' + interrupted)
      await new Promise((resolve) => setTimeout(resolve, 500))
      const read = file('startup-outcome.json')
      if (read.status === 0 && read.stdout.trim()) outcome = JSON.parse(read.stdout)
      const mountRead = file('startup-mount.json')
      if (mountRead.status === 0 && mountRead.stdout.trim()) mount = JSON.parse(mountRead.stdout)
      if (outcome) break
    }
    assert.ok(outcome, 'No startup outcome receipt')
    evidence.mount = mount
    evidence.outcome = outcome
    if (expectAdopt) {
      assert.equal(mount.mounted, true)
      assert.equal(mount.beforeEngineInit, true)
      assert.equal(mount.bind?.['theme-preference'] ?? null, expectBind)
      assert.equal(outcome.adopted, true, 'Expected adoption: ' + JSON.stringify(outcome))
      assert.ok(outcome.claims?.claimedCount > 0, 'No native claims consumed')
      assert.equal(outcome.claims.phase, 'live')
      assert.equal(outcome.visualNatives, mount.visualNodes)
    } else {
      assert.equal(outcome.adopted, false, 'Expected fallback: ' + JSON.stringify(outcome))
      assert.equal(mount.mounted, false)
    }
  }
  passed = true
} finally {
  writeFileSync(join(report, 'evidence.json'), JSON.stringify(evidence, null, 2))
  writeFileSync(
    join(report, 'status.json'),
    JSON.stringify(
      {
        passed,
        scenario,
        platform,
        osInputQualified: false,
        presentationQualified: false,
        performanceQualified: false,
      },
      null,
      2,
    ),
  )
  console.log('Normal-app report: ' + report)
}
if (!passed) process.exitCode = 1
