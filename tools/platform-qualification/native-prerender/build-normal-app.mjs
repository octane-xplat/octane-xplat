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
  realpathSync,
  writeFileSync,
} from 'node:fs'
import { createRequire } from 'node:module'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { assertProducerInputs } from './check-producer-inputs.mjs'

// Builds a REAL opt-in app: stock create-template layout, installed packages,
// the package's own installable mount units, and a real main.ts calling
// renderWithStartup. Reserve native_builds; device runs are a separate phase.
const platform = process.env.XPLAT_PRERENDER_PLATFORM ?? 'ios'
assert.ok(platform === 'ios' || platform === 'android', 'XPLAT_PRERENDER_PLATFORM must be ios or android')

const masonInput =
  process.env.XPLAT_PRERENDER_MASON_PACKAGE ?? process.env.XPLAT_PRERENDER_IOS_MASON_PACKAGE
if (!masonInput)
  throw new Error('Set XPLAT_PRERENDER_MASON_PACKAGE to a prepared Mason core package directory')
const mason = realpathSync(masonInput)
const masonManifest = JSON.parse(readFileSync(join(mason, 'package.json')))
assert.equal(masonManifest.name, '@octane-xplat/nativescript-mason-core')
assert.equal(masonManifest.version, '1.0.0-beta.10')

const source = import.meta.dirname
const fixture = join(source, 'normal-app')
const repo = resolve(source, '../../..')
const parent = join(homedir(), 'agent-scratch/octane-xplat/native-prerender-normal-app-' + platform)
mkdirSync(parent, { recursive: true })
const work = mkdtempSync(join(parent, 'run-'))
const app = join(work, 'StartupApp')
const id = 'org.octanexplat.prerender.normalapp.' + platform

for (const directory of ['src', 'native', 'patches', 'App_Resources']) {
  mkdirSync(join(app, directory), { recursive: true })
}
writeFileSync(
  join(work, 'README.md'),
  'Everything in this folder is disposable.\nNormal-app native prerender control.\nSource: ' +
    repo +
    '\nRetain evidence in ~/dev/reports/octane-xplat before cleanup.\n',
)
console.log('Normal-app build: ' + work)

const hash = (file) => {
  const h = createHash('sha256')
  const st = statSync(file)
  if (st.isDirectory()) {
    for (const name of readdirSync(file).sort()) h.update(name + ':' + hash(join(file, name)))
    return h.digest('hex')
  }
  return h.update(readFileSync(file)).digest('hex')
}
const sourceHashes = {}
function input(file) {
  const digest = hash(file)
  if (sourceHashes[file] && sourceHashes[file] !== digest)
    throw new Error('Normal-app input changed: ' + file)
  sourceHashes[file] = digest
  const snapshot = join(work, 'source-inputs', digest)
  mkdirSync(join(work, 'source-inputs'), { recursive: true })
  cpSync(file, snapshot, { dereference: true, recursive: true })
}
function copy(from, to) {
  input(from)
  cpSync(from, to, { dereference: true, recursive: true })
}
function json(file, value) {
  writeFileSync(file, JSON.stringify(value, null, 2) + '\n')
}
let commandIndex = 0
function run(program, args, cwd = app, env = {}) {
  const result = spawnSync(program, args, {
    cwd,
    encoding: 'utf8',
    timeout: 2400000,
    maxBuffer: 64 * 1024 * 1024,
    env: { ...process.env, ...env },
  })
  const log = join(work, ++commandIndex + '-command.log')
  writeFileSync(log, (result.stdout ?? '') + (result.stderr ?? '') + String(result.error ?? ''))
  if (result.status !== 0) throw new Error(program + ' ' + args.join(' ') + ' failed; see ' + log)
  return result.stdout.trim()
}

input(import.meta.filename)
input(join(source, 'check-producer-inputs.mjs'))
cpSync(import.meta.filename, join(work, 'builder.mjs'))
assert.equal(run('bun', ['--version']), '1.4.5')

const overrides = {}
const packed = {}
for (const name of [
  'native-prerender-build',
  'native-prerender',
  'css-engine',
  'ui',
  'motion',
  'platform',
  'lib',
  'icons',
  'jsx',
  'nativescript-octane',
  'vite-octane',
  'build',
  'mason-core',
]) {
  const directory = name === 'mason-core' ? mason : join(repo, 'packages', name)
  const manifest = JSON.parse(readFileSync(join(directory, 'package.json')))
  const archive = join(work, name + '.tgz')
  run('bun', ['pm', 'pack', '--ignore-scripts', '--filename', archive], directory)
  overrides[manifest.name] = 'file:' + archive
  packed[manifest.name] = { archive, sha256: hash(archive), version: manifest.version }
}

const patchedDependencies = {}
for (const [name, patch] of [
  ['octane@0.17.0', 'octane@0.17.0.patch'],
  ['@nativescript/core@9.1.3', '@nativescript__core@9.1.3.patch'],
  [
    '@octane-xplat/nativescript-mason-core@1.0.0-beta.10',
    '@octane-xplat__nativescript-mason-core@1.0.0-beta.10.patch',
  ],
]) {
  copy(join(repo, 'packages/cli/patches', patch), join(app, 'patches', patch))
  patchedDependencies[name] = 'patches/' + patch
}

json(join(app, 'package.json'), {
  name: 'xplat-native-startup-normal-app',
  private: true,
  version: '1.0.0',
  type: 'module',
  main: 'src/main.ts',
  dependencies: {
    ...overrides,
    '@nativescript/core': '9.1.3',
    octane: '0.17.0',
  },
  devDependencies: {
    '@nativescript/ios': '9.1.0',
    '@nativescript/android': '9.1.1',
    '@nativescript/vite': '8.0.20',
    vite: '8.3.6',
    typescript: '5.9.3',
    '@tsrx/oxc': '0.20.0',
  },
  overrides: { ...overrides, regenerate: '1.5.0' },
  patchedDependencies,
})
writeFileSync(join(app, 'bunfig.toml'), '[install]\nlinker = "isolated"\n')

// The starter screen files: the fixture keeps them as symlinks into the real
// create-template sources; copy materializes the real content.
const starter = join(source, 'starter-template')
for (const name of ['App.tsrx', 'style.css', 'Screen.tsrx']) {
  copy(join(starter, name), join(app, 'src', name))
}
for (const name of ['main.ts', 'startup-outcome.js']) {
  copy(join(fixture, name), join(app, 'src', name))
}
copy(join(fixture, 'vite.config.mts'), join(app, 'vite.config.mts'))

// Stock App_Resources from the real template.
copy(join(repo, 'packages/create/template/App_Resources'), join(app, 'App_Resources'))

writeFileSync(
  join(app, 'nativescript.config.ts'),
  `export default {
 id: '${id}', appPath: 'src', appResourcesPath: 'App_Resources',
 cli: { packageManager: 'bun' }, bundler: 'vite', bundlerConfigPath: 'vite.config.mts',
 android: { v8Flags: '--expose_gc', markingMode: 'none' },
 ios: { NativeSource: [{name: 'StartupApp', path: ${JSON.stringify(join(app, 'native'))}}] }
}\n`,
)

run('bun', ['install', '--ignore-scripts'])

const require = createRequire(join(app, 'package.json'))
const { produceNativeStartup } = await import(
  pathToFileURL(require.resolve('@octane-xplat/native-prerender-build')).href
)

const configuration = JSON.parse(
  readFileSync(join(fixture, 'startup.config.' + platform + '.json')),
)
configuration.entry = './src/Screen.tsrx'
json(join(app, 'startup.config.json'), configuration)

const producer = await produceNativeStartup({
  projectDir: app,
  configurationFile: 'startup.config.json',
  outputDir: join(work, 'producer'),
  platform,
})
assert.ok(
  Object.keys(producer.manifest.inputs).every((path) => path.startsWith(app + '/')),
  'Producer read outside installed app',
)
assertProducerInputs(producer.manifest)

for (const name of ['startup.json', 'sheets.json']) {
  cpSync(join(producer.directory, name), join(app, 'src', name))
}
cpSync(join(producer.directory, 'startup.bin'), join(app, 'src/startup.bin'))

if (platform === 'ios') {
  const backend = join(repo, 'packages/native-prerender/platforms/ios')
  for (const name of [
    'StartupArtifact.swift',
    'MasonArtifact.swift',
    'FontLowering.h',
    'FontLowering.m',
    'MasonMount.h',
    'MasonMount.m',
    'MountHost.h',
    'MountHost.m',
  ]) {
    copy(join(backend, name), join(app, 'native', name))
  }
  // The installable bootstrap compiles as the app's main.swift entry — the
  // only Swift file where top-level expressions are legal.
  copy(
    join(backend, 'StartupBootstrap.swift'),
    join(app, 'native/main.swift'),
  )
  copy(join(fixture, 'StartupBridge.h'), join(app, 'native/StartupBridge.h'))
  writeFileSync(
    join(app, 'native/module.modulemap'),
    `module XplatMasonMount { header "MasonMount.h" export * }
module PrerenderMountHost { header "MountHost.h" export * }
`,
  )
  writeFileSync(
    join(app, 'App_Resources/iOS/build.xcconfig'),
    `NS_SWIFTUI_BOOT = 1
SWIFT_OBJC_BRIDGING_HEADER = ${join(app, 'native/StartupBridge.h')}
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
  // Inject the expected artifact identity: the producer's build hash rides in
  // the app bundle so the native mount can reject a mismatched artifact.
  writeFileSync(
    join(app, 'App_Resources/iOS/Info.plist'),
    `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleDisplayName</key><string>StartupApp</string>
<key>CFBundleIdentifier</key><string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
<key>CFBundleExecutable</key><string>$(EXECUTABLE_NAME)</string>
<key>CFBundleName</key><string>$(PRODUCT_NAME)</string>
<key>CFBundlePackageType</key><string>APPL</string>
<key>CFBundleShortVersionString</key><string>1.0</string>
<key>CFBundleVersion</key><string>1</string>
<key>LSRequiresIPhoneOS</key><true/>
<key>XplatStartupBuildHash</key><string>${producer.manifest.buildHash}</string>
<key>UILaunchScreen</key><dict/>
<key>UIApplicationSceneManifest</key><dict><key>UIApplicationSupportsMultipleScenes</key><false/></dict>
<key>UISupportedInterfaceOrientations</key><array><string>UIInterfaceOrientationPortrait</string></array>
</dict></plist>\n`,
  )
} else {
  const backend = join(repo, 'packages/native-prerender/platforms/android/java/org/octanexplat/prerender')
  const java = join(app, 'App_Resources/Android/src/main/java/org/octanexplat/prerender')
  mkdirSync(java, { recursive: true })
  for (const name of [
    'MasonArtifact.java',
    'MasonMount.java',
    'StartupArtifact.java',
    'StartupApplication.java',
    'StartupMountActivity.java',
  ]) {
    copy(join(backend, name), join(java, name))
  }
  copy(
    join(fixture, 'AndroidManifest.xml'),
    join(app, 'App_Resources/Android/src/main/AndroidManifest.xml'),
  )
  const values = join(app, 'App_Resources/Android/src/main/res/values')
  mkdirSync(values, { recursive: true })
  writeFileSync(
    join(values, 'startup.xml'),
    `<?xml version="1.0" encoding="utf-8"?>\n<resources><string name="xplat_startup_build">${producer.manifest.buildHash}</string></resources>\n`,
  )
}

const ns = process.env.XPLAT_PRERENDER_NS_CLI ?? '/opt/homebrew/bin/ns'
const cliVersion = run(ns, ['--version']).split(/\r?\n/)[0]
assert.equal(cliVersion, '9.1.1')

const javaHome = process.env.XPLAT_PRERENDER_JAVA_HOME
if (platform === 'android' && !javaHome)
  throw new Error('Set XPLAT_PRERENDER_JAVA_HOME to the Android build JDK')
const buildEnv = platform === 'android' ? { JAVA_HOME: javaHome } : {}

run(ns, ['build', platform, platform === 'ios' ? '--release' : '', '--path', app].filter(Boolean), app, buildEnv)
assertProducerInputs(producer.manifest)
for (const [path, expected] of Object.entries(sourceHashes)) {
  assert.equal(hash(path), expected, 'Source changed during compilation: ' + path)
}

const inventory = (directory) =>
  existsSync(directory)
    ? Object.fromEntries(
        readdirSync(directory, { recursive: true })
          .sort()
          .filter((name) => statSync(join(directory, name)).isFile())
          .map((name) => [name, hash(join(directory, name))]),
      )
    : {}

let built, executable, bundleDir
if (platform === 'ios') {
  const products = join(app, 'platforms/ios/build/Release-iphonesimulator')
  const names = readdirSync(products).filter((name) => name.endsWith('.app'))
  assert.equal(names.length, 1)
  built = join(products, names[0])
  executable = run('plutil', ['-extract', 'CFBundleExecutable', 'raw', join(built, 'Info.plist')])
  bundleDir = join(built, 'app')
  assert.equal(hash(join(built, 'app/startup.bin')), producer.manifest.startupArtifactHash)
} else {
  const products = join(app, 'platforms/android/app/build/outputs/apk/debug')
  const names = readdirSync(products).filter((name) => name.endsWith('.apk'))
  assert.equal(names.length, 1)
  built = join(products, names[0])
  executable = null
  bundleDir = null
}

json(join(work, 'build.json'), {
  fixture: 'normal-app-startup',
  platform,
  id,
  app: built,
  executable,
  cliVersion,
  buildHash: producer.manifest.buildHash,
  startupArtifactHash: producer.manifest.startupArtifactHash,
  sourceHashes,
  packed,
  bundleFiles: inventory(bundleDir),
  nativeSources: inventory(join(app, 'native')),
  builderHash: hash(import.meta.filename),
  scope:
    'Normal-app native prerender control: real main.ts entry calling renderWithStartup, installable mount units, stock CLI build; mount->adopt->hydrate through Application.run/Page; no OS input, compositor presentation or performance qualification',
})
console.log('XPLAT_PRERENDER_NORMAL_BUILD=' + work)
