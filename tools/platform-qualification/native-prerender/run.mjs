import { spawnSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync, cpSync, existsSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { homedir } from 'node:os'
import { createHash } from 'node:crypto'
const mode = process.argv[2]
if (!['build', 'run'].includes(mode)) throw new Error('Usage: run.mjs build|run')
const source = import.meta.dirname
const scratch = resolve(homedir(), 'agent-scratch/octane-xplat/native-prerender-bootstrap')
const app = join(scratch, 'PrerenderProbe.app')
const id = 'org.octanexplat.prerenderbootstrap'
const udid = '91D40099-A056-497D-A572-ADDDFD6A8F23'
function run(cmd, args) {
  const result = spawnSync(cmd, args, {
    timeout: 120000,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  })
  if (result.status !== 0) throw new Error(`${cmd} failed: ${result.stderr}\n${result.stdout}`)
  return result.stdout.trim()
}
if (mode === 'build') {
  const mason = process.env.XPLAT_PRERENDER_MASON_SDK
  const runtime = process.env.XPLAT_PRERENDER_RUNTIME_PRODUCTS
  if (!mason || !runtime)
    throw new Error(
      'Set XPLAT_PRERENDER_MASON_SDK and XPLAT_PRERENDER_RUNTIME_PRODUCTS to prebuilt simulator artifacts',
    )
  mkdirSync(app, { recursive: true })
  writeFileSync(
    join(scratch, 'README.md'),
    'Everything in this folder is disposable.\nNative pre-render bootstrap probe. Source: ' +
      source +
      '\nRetained evidence: ~/dev/reports/octane-xplat/native-prerender-bootstrap/\n',
  )
  const sdk = run('xcrun', ['--sdk', 'iphonesimulator', '--show-sdk-path'])
  const common = ['-target', 'arm64-apple-ios15.6-simulator', '-isysroot', sdk, '-F', runtime]
  run('xcrun', [
    'clang',
    ...common,
    '-fobjc-arc',
    '-fmodules',
    '-c',
    join(source, 'Runtime.m'),
    '-o',
    join(scratch, 'Runtime.o'),
  ])
  run('xcrun', [
    'swiftc',
    '-sdk',
    sdk,
    '-target',
    'arm64-apple-ios15.6-simulator',
    '-F',
    mason,
    '-F',
    runtime,
    '-I',
    join(mason, 'include'),
    '-import-objc-header',
    join(source, 'Runtime.h'),
    join(source, 'main.swift'),
    join(scratch, 'Runtime.o'),
    '-framework',
    'MasonCore',
    '-framework',
    'NativeScript',
    '-L',
    join(mason, 'dependencies/FontManager'),
    '-lFontManager',
    '-liconv',
    '-lresolv',
    '-Xlinker',
    '-rpath',
    '-Xlinker',
    '@executable_path/Frameworks',
    '-Xlinker',
    '-sectcreate',
    '-Xlinker',
    '__DATA',
    '-Xlinker',
    '__TNSMetadata',
    '-Xlinker',
    join(runtime, 'metadata-arm64.bin'),
    '-o',
    join(app, 'PrerenderProbe'),
  ])
  mkdirSync(join(app, 'Frameworks'), { recursive: true })
  cpSync(join(runtime, 'NativeScript.framework'), join(app, 'Frameworks/NativeScript.framework'), {
    recursive: true,
  })
  const text = ['Native home screen', 'JavaScript starts later']
  writeFileSync(
    join(app, 'screen.bin'),
    Buffer.concat([
      Buffer.from('XPR0'),
      Buffer.from([text.length]),
      ...text.flatMap((t) => [Buffer.from([Buffer.byteLength(t)]), Buffer.from(t)]),
    ]),
  )
  writeFileSync(
    join(app, 'Info.plist'),
    `<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd"><plist version="1.0"><dict><key>CFBundleIdentifier</key><string>${id}</string><key>CFBundleExecutable</key><string>PrerenderProbe</string><key>CFBundlePackageType</key><string>APPL</string><key>CFBundleName</key><string>PrerenderProbe</string><key>CFBundleVersion</key><string>1</string><key>CFBundleShortVersionString</key><string>1.0</string><key>LSRequiresIPhoneOS</key><true/><key>UILaunchScreen</key><dict/></dict></plist>`,
  )
  for (const path of [join(app, 'Frameworks/NativeScript.framework'), app])
    run('codesign', ['--force', '--sign', '-', path])
  const hash = (path) => createHash('sha256').update(readFileSync(path)).digest('hex')
  writeFileSync(
    join(scratch, 'build.json'),
    JSON.stringify(
      {
        mason,
        runtime,
        sourceHashes: Object.fromEntries(
          ['main.swift', 'Runtime.m', 'Runtime.h'].map((n) => [n, hash(join(source, n))]),
        ),
        masonHash: hash(join(mason, 'MasonCore.framework/MasonCore')),
        runtimeHash: hash(join(app, 'Frameworks/NativeScript.framework/NativeScript')),
        executableHash: hash(join(app, 'PrerenderProbe')),
        metadataHash: hash(join(runtime, 'metadata-arm64.bin')),
      },
      null,
      2,
    ),
  )
  console.log(app)
} else {
  if (!existsSync(app)) throw new Error('Build first')
  const build = JSON.parse(readFileSync(join(scratch, 'build.json'), 'utf8'))
  for (const [name, expected] of Object.entries(build.sourceHashes)) {
    const actual = createHash('sha256')
      .update(readFileSync(join(source, name)))
      .digest('hex')
    if (actual !== expected) throw new Error('Source changed; rebuild before running: ' + name)
  }
  for (const [path, expected] of [
    [join(app, 'PrerenderProbe'), build.executableHash],
    [join(app, 'Frameworks/NativeScript.framework/NativeScript'), build.runtimeHash],
  ]) {
    if (createHash('sha256').update(readFileSync(path)).digest('hex') !== expected)
      throw new Error('Built artifact changed; rebuild before running: ' + path)
  }
  try {
    run('xcrun', ['simctl', 'bootstatus', udid, '-b'])
    run('xcrun', ['simctl', 'install', udid, app])
    const installed = run('xcrun', ['simctl', 'get_app_container', udid, id, 'data'])
    const prior = join(installed, 'Documents/result.json')
    if (existsSync(prior)) {
      const { unlinkSync } = await import('node:fs')
      unlinkSync(prior)
    }
    run('xcrun', ['simctl', 'launch', udid, id])
    let result
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 500))
      const container = run('xcrun', ['simctl', 'get_app_container', udid, id, 'data'])
      const file = join(container, 'Documents/result.json')
      if (existsSync(file)) {
        result = JSON.parse(readFileSync(file, 'utf8'))
        if (result.some((e) => e.event === 'passed')) break
      }
    }
    if (!result?.some((e) => e.event === 'passed'))
      throw new Error('Probe did not finish: ' + JSON.stringify(result))
    const report = resolve(homedir(), 'dev/reports/octane-xplat/native-prerender-bootstrap')
    mkdirSync(report, { recursive: true })
    cpSync(join(scratch, 'build.json'), join(report, 'build.json'))
    writeFileSync(join(report, 'result.json'), JSON.stringify(result, null, 2))
    console.log(JSON.stringify({ report, events: result }, null, 2))
  } finally {
    spawnSync('xcrun', ['simctl', 'terminate', udid, id])
    run('xcrun', ['simctl', 'shutdown', udid])
  }
}
