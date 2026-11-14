import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
  cpSync,
  readdirSync,
  statSync,
  realpathSync,
} from 'node:fs'

import { createRequire } from 'node:module'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { assertProducerInputs } from './check-producer-inputs.mjs'

// Normal CLI/SPM owns compilation and metadata. Reserve native_builds only;
// the simulator runtime phase has a separate reservation.
const masonInput = process.env.XPLAT_PRERENDER_IOS_MASON_PACKAGE

if (!masonInput) {
  throw new Error(
    'Set XPLAT_PRERENDER_IOS_MASON_PACKAGE to a prepared Mason core package directory',
  )
}

const mason = realpathSync(masonInput)
const masonManifest = JSON.parse(readFileSync(join(mason, 'package.json')))

assert.equal(masonManifest.name, '@octane-xplat/nativescript-mason-core')

const fixture = process.env.XPLAT_PRERENDER_IOS_STARTUP_FIXTURE ?? 'home'
const mode = process.env.XPLAT_PRERENDER_IOS_STARTUP_MODE ?? 'adopt'

assert.ok(
  fixture === 'home' || fixture === 'keyed',
  'XPLAT_PRERENDER_IOS_STARTUP_FIXTURE must be home or keyed',
)
assert.ok(
  mode === 'adopt' || mode === 'seed-mismatch' || mode === 'attach-failure',
  'XPLAT_PRERENDER_IOS_STARTUP_MODE must be adopt, seed-mismatch or attach-failure',
)
assert.ok(
  mode === 'adopt' || fixture === 'keyed',
  'Recovery modes require the keyed fixture',
)

const source = import.meta.dirname
const repo = resolve(source, '../../..')
const parent = join(homedir(), 'agent-scratch/octane-xplat/native-prerender-sdk-startup-ios')

mkdirSync(parent, { recursive: true })

const work = mkdtempSync(join(parent, 'run-'))
const app = join(work, 'SDKStartupGate')
const id = 'org.octanexplat.prerender.sdkstartupios'

for (const directory of ['src', 'native', 'patches', 'App_Resources/iOS']) {
  mkdirSync(join(app, directory), { recursive: true })
}

writeFileSync(
  join(work, 'README.md'),
  'Everything in this folder is disposable.\nStock SDK startup IR/adoption control.\nSource: ' +
    repo +
    '\nRetain evidence in ~/dev/reports/octane-xplat before cleanup.\n',
)

console.log('SDK startup build: ' + work)

const hash = (file) => createHash('sha256').update(readFileSync(file)).digest('hex')
const sourceHashes = {}
function input(file) {
  const digest = hash(file)

  if (sourceHashes[file] && sourceHashes[file] !== digest) {
    throw new Error('SDK startup input changed: ' + file)
  }

  sourceHashes[file] = digest

  const snapshot = join(work, 'source-inputs', digest)

  mkdirSync(join(work, 'source-inputs'), { recursive: true })
  cpSync(file, snapshot)
}

function copy(from, to) {
  input(from)
  cpSync(from, to)
}

function json(file, value) {
  writeFileSync(file, JSON.stringify(value, null, 2) + '\n')
}

let commandIndex = 0
function run(program, args, cwd = app) {
  const result = spawnSync(program, args, {
    cwd,
    encoding: 'utf8',
    timeout: 1200000,
    maxBuffer: 64 * 1024 * 1024,
  })

  const log = join(work, ++commandIndex + '-command.log')

  writeFileSync(log, (result.stdout ?? '') + (result.stderr ?? '') + String(result.error ?? ''))
  if (result.status !== 0) {
    throw new Error(program + ' failed; see ' + log)
  }

  return result.stdout.trim()
}

input(import.meta.filename)
input(join(source, 'check-producer-inputs.mjs'))
cpSync(import.meta.filename, join(work, 'builder.mjs'))
assert.equal(run('bun', ['--version']), '1.4.4')

const overrides = {}
const packed = {}

for (const name of [
  'native-prerender-build',
  'native-prerender',
  'css-engine',
  'ui',
  'lib',
  'icons',
  'build',
  'mason-core',
]) {
  const directory = name === 'mason-core' ? mason : join(repo, 'packages', name)
  const manifest = JSON.parse(readFileSync(join(directory, 'package.json')))
  const archive = join(work, name + '.tgz')

  // Turbo prepared declarations/dists. This does not qualify release prepack.
  run('bun', ['pm', 'pack', '--ignore-scripts', '--filename', archive], directory)
  overrides[manifest.name] = 'file:' + archive
  packed[manifest.name] = { archive, sha256: hash(archive), version: manifest.version }
}

const patchedDependencies = {}

for (const [name, patch] of [
  ['octane@0.16.3', 'octane@0.16.3.patch'],
  ['@nativescript/core@9.1.3', '@nativescript__core@9.1.3.patch'],
  ['@nativescript-community/octane@0.2.5', '@nativescript-community__octane@0.2.5.patch'],
]) {
  copy(join(repo, 'packages/cli/patches', patch), join(app, 'patches', patch))
  patchedDependencies[name] = 'patches/' + patch
}

json(join(app, 'package.json'), {
  name: 'native-sdk-startup-gate',
  private: true,
  version: '1.0.0',
  type: 'module',
  main: 'src/main.js',
  dependencies: {
    ...overrides,
    '@nativescript/core': '9.1.3',
    '@nativescript-community/octane': '0.2.5',
    octane: '0.16.3',
  },
  devDependencies: {
    '@nativescript/ios': '9.1.0',
    '@nativescript/vite': '8.0.20',
    '@nativescript-community/vite-octane': '0.2.1',
    vite: '8.3.6',
    typescript: '5.9.3',
    '@tsrx/oxc': '0.20.0',
  },
  overrides: { ...overrides, regenerate: '1.5.0' },
  patchedDependencies,
})

writeFileSync(join(app, 'bunfig.toml'), '[install]\nlinker = "isolated"\n')
for (const name of ['write-native-diagnostic.ios.js']) {
  copy(join(source, name), join(app, 'src', name))
}

if (fixture === 'home') {
  for (const name of [
    'Home.tsrx',
    'home.css',
    'home-entry.ios.js',
    'home-adoption.ios.js',
    'home-fallback.ios.js',
    'home-lifetime.ios.js',
  ]) {
    copy(join(source, name), join(app, 'src', name))
  }
  writeFileSync(join(app, 'src/main.js'), "import './home-entry.ios.js'\n")
  writeFileSync(
    join(app, 'src/component.js'),
    "export { Home as StartupComponent } from './Home.tsrx'\n",
  )
} else {
  for (const name of [
    'KeyedStartup.tsrx',
    'KeyedStartup.ios.tsrx',
    'ConfiguredStartup.shared.tsrx',
    'keyed-startup.css',
  ]) {
    copy(join(source, 'producer/fixtures', name), join(app, 'src', name))
  }
  copy(
    join(source, 'ios-native/artifact-adoption.ios.js'),
    join(app, 'src/artifact-adoption.ios.js'),
  )
  writeFileSync(join(app, 'src/main.js'), "import './artifact-adoption.ios.js'\n")
  writeFileSync(
    join(app, 'src/component.js'),
    "export { KeyedStartup as StartupComponent } from './KeyedStartup.tsrx'\n",
  )
}
json(join(app, 'src/mode.json'), mode)

copy(join(source, 'sdk-startup-ios/vite.config.mts'), join(app, 'vite.config.mts'))
copy(join(source, 'sdk-startup-ios/StartupBridge.h'), join(app, 'native/StartupBridge.h'))

const backend = join(repo, 'packages/native-prerender/platforms/ios')

for (const name of [
  'StartupArtifact.swift',
  'MasonArtifact.swift',
  'FontLowering.h',
  'FontLowering.m',
  'MasonMount.h',
  'MasonMount.m',
]) {
  copy(join(backend, name), join(app, 'native', name))
}

for (const name of ['HomeMount.h', 'HomeMount.m', 'HomeStyleSnapshot.swift']) {
  copy(join(source, 'home-native', name), join(app, 'native', name))
}

for (const name of ['MountHost.h', 'MountHost.m']) {
  copy(join(source, 'ios-native', name), join(app, 'native', name))
}

// The metadata generator only scans header search paths that carry a Clang
// module map. Without this the control's ObjC helpers stay invisible to JS.
writeFileSync(
  join(app, 'native/module.modulemap'),
  `module XplatMasonMount { header "MasonMount.h" export * }
module PrerenderMountHost { header "MountHost.h" export * }
module PrerenderHomeMount { header "HomeMount.h" export * }
`,
)

writeFileSync(
  join(app, 'nativescript.config.ts'),
  `export default {
 id: '${id}', appPath: 'src', appResourcesPath: 'App_Resources',
 cli: { packageManager: 'bun' }, bundler: 'vite', bundlerConfigPath: 'vite.config.mts',
 ios: { NativeSource: [{name: 'StartupSDK', path: ${JSON.stringify(join(app, 'native'))}}] }
}\n`,
)

writeFileSync(
  join(app, 'App_Resources/iOS/build.xcconfig'),
  `NS_SWIFTUI_BOOT = 1
SWIFT_OBJC_BRIDGING_HEADER = ${join(app, 'native/StartupBridge.h')}
SWIFT_ACTIVE_COMPILATION_CONDITIONS = $(inherited) XPLAT_PRERENDER_STOCK_SDK
IPHONEOS_DEPLOYMENT_TARGET = 17.0
ARCHS = arm64
ONLY_ACTIVE_ARCH = YES
EXCLUDED_ARCHS[sdk=iphonesimulator*] = x86_64
// SPM's static FontManager target publishes its Clang module here.
SWIFT_INCLUDE_PATHS = $(inherited) "$(BUILT_PRODUCTS_DIR)/include"
// iOS27 metadata-generator compatibility, as in the UIKit-only SDK gate.
OTHER_CFLAGS = $(inherited) -Xclang -fmodule-feature -Xclang found_incompatible_headers__check_search_paths -D__STDC_WANT_LIB_EXT1__=0
`,
)

writeFileSync(
  join(app, 'App_Resources/iOS/Info.plist'),
  `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleDisplayName</key><string>SDK Startup Gate</string>
<key>CFBundleIdentifier</key><string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
<key>CFBundleExecutable</key><string>$(EXECUTABLE_NAME)</string>
<key>CFBundleName</key><string>$(PRODUCT_NAME)</string>
<key>CFBundlePackageType</key><string>APPL</string>
<key>CFBundleShortVersionString</key><string>1.0</string>
<key>CFBundleVersion</key><string>1</string>
<key>LSRequiresIPhoneOS</key><true/>
<key>UILaunchScreen</key><dict/>
<key>UIApplicationSceneManifest</key><dict><key>UIApplicationSupportsMultipleScenes</key><false/></dict>
<key>UISupportedInterfaceOrientations</key><array><string>UIInterfaceOrientationPortrait</string></array>
</dict></plist>\n`,
)

run('bun', ['install', '--ignore-scripts'])

const require = createRequire(join(app, 'package.json'))
const { produceNativeStartup } = await import(
  pathToFileURL(require.resolve('@octane-xplat/native-prerender-build')).href
)

if (fixture === 'home') {
  json(join(app, 'startup.config.json'), {
    version: 1,
    entry: './src/Home.tsrx',
    exportName: 'Home',
    seed: { name: 'Alex', initialCompleted: 3 },
    environment: { width: 402, height: 874, reducedMotion: false },
  })
} else {
  const keyed = JSON.parse(
    readFileSync(join(source, 'producer/fixtures/keyed-startup.json')),
  )
  copy(join(source, 'producer/fixtures/keyed-startup.json'), join(work, 'keyed-startup.json'))
  json(join(app, 'startup.config.json'), {
    ...keyed,
    entry: './src/KeyedStartup.tsrx',
  })
}

const producer = await produceNativeStartup({
  projectDir: app,
  configurationFile: 'startup.config.json',
  outputDir: join(work, 'producer'),
  platform: 'ios',
})

assert.ok(
  Object.keys(producer.manifest.inputs).every((path) => path.startsWith(app + '/')),
  'Producer read outside installed app',
)

for (const name of ['startup.json', 'resolved.json', 'sheets.json']) {
  cpSync(join(producer.directory, name), join(app, 'src', name))
}

cpSync(join(producer.directory, 'startup.bin'), join(app, 'src/startup.bin'))

const bootstrap =
  fixture === 'home'
    ? join(source, 'home-native/HomeBootstrap.swift')
    : join(source, 'ios-native/MountBootstrap.swift')

input(bootstrap)
writeFileSync(
  join(app, 'native/main.swift'),
  readFileSync(bootstrap, 'utf8').replace(
    '__XPLAT_PRERENDER_BUILD_HASH__',
    producer.manifest.buildHash,
  ),
)

assertProducerInputs(producer.manifest)

const ns = process.env.XPLAT_PRERENDER_NS_CLI ?? '/opt/homebrew/bin/ns'
const cliVersion = run(ns, ['--version']).split(/\r?\n/)[0]

assert.equal(cliVersion, '9.1.1')
run(ns, ['build', 'ios', '--release', '--path', app])
assertProducerInputs(producer.manifest)
for (const [path, expected] of Object.entries(sourceHashes)) {
  assert.equal(hash(path), expected, 'Source changed during compilation: ' + path)
}

const products = join(app, 'platforms/ios/build/Release-iphonesimulator')
const names = readdirSync(products).filter((name) => name.endsWith('.app'))

assert.equal(names.length, 1)

const built = join(products, names[0])
const executable = run('plutil', [
  '-extract',
  'CFBundleExecutable',
  'raw',
  join(built, 'Info.plist'),
])

const inventory = (directory) =>
  Object.fromEntries(
    readdirSync(directory, { recursive: true })
      .sort()
      .filter((name) => statSync(join(directory, name)).isFile())
      .map((name) => [name, hash(join(directory, name))]),
  )

assert.equal(hash(join(built, 'app/startup.bin')), producer.manifest.startupArtifactHash)
json(join(work, 'build.json'), {
  fixture: 'stock-sdk-startup',
  startupFixture: fixture,
  startupMode: mode,
  id,
  app: built,
  executable,
  cliVersion,
  executableHash: hash(join(built, executable)),
  runtimeHash: hash(join(built, 'Frameworks/NativeScript.framework/NativeScript')),
  buildHash: producer.manifest.buildHash,
  sourceHashes,
  packed,
  nativeSources: inventory(join(app, 'native')),
  bundleFiles: inventory(join(built, 'app')),
  builderHash: hash(import.meta.filename),
  metadataHash: hash(join(products, 'metadata-arm64.bin')),
  metadataDiagnosticsHash: hash(join(products, 'metadata-generation-stderr-arm64.txt')),
  scope:
    fixture === 'home'
      ? 'Normal SDK Home IR/adoption control with installed package sources and normal native Vite preset; four primitive exports; not app opt-in installation, OS input, presentation or performance qualification'
      : 'Variable-topology iOS XPI1 native mount, configured JSX wrapper adoption and keyed client updates (' +
        mode +
        '); bounded 320x640 canvas, no normal app/window handoff, OS input, compositor presentation or performance qualification',
})

console.log('SDK startup build complete: ' + work)
