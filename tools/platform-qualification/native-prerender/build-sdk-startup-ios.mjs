import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
  cpSync,
  existsSync,
  readdirSync,
  statSync,
  realpathSync,
} from 'node:fs'

import { createRequire } from 'node:module'
import { homedir } from 'node:os'
import { basename, join, resolve } from 'node:path'
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
assert.equal(
  masonManifest.version,
  '1.0.0-beta.10',
  'XPLAT_PRERENDER_IOS_MASON_PACKAGE must be the 1.0.0-beta.10 core package',
)

const fixture = process.env.XPLAT_PRERENDER_IOS_STARTUP_FIXTURE ?? 'home'
const mode = process.env.XPLAT_PRERENDER_IOS_STARTUP_MODE ?? 'adopt'
const customDir = process.env.XPLAT_PRERENDER_IOS_STARTUP_DIR
  ? resolve(process.env.XPLAT_PRERENDER_IOS_STARTUP_DIR)
  : null

assert.ok(
  fixture === 'home' || fixture === 'keyed' || fixture === 'custom',
  'XPLAT_PRERENDER_IOS_STARTUP_FIXTURE must be home, keyed or custom',
)
assert.ok(
  fixture !== 'custom' || customDir,
  'The custom fixture requires XPLAT_PRERENDER_IOS_STARTUP_DIR',
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
  cpSync(file, snapshot, { dereference: true, recursive: true })
}

function copy(from, to) {
  input(from)
  // Materialize symlinked fixture members (e.g. starter-template's App.tsrx
  // and style.css point at the real create-template sources) so the installed
  // app only reads files inside its own directory.
  cpSync(from, to, { dereference: true, recursive: true })
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
const bunVersion = run('bun', ['--version'])
const [bunMajor, bunMinor, bunPatch] = bunVersion.split('.').map(Number)
assert.ok(
  bunMajor > 1 || (bunMajor === 1 && (bunMinor > 4 || (bunMinor === 4 && bunPatch >= 4))),
  'Bun >=1.4.4 required, found ' + bunVersion,
)

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

  // Turbo prepared declarations/dists. This does not qualify release prepack.
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
  name: 'native-sdk-startup-gate',
  private: true,
  version: '1.0.0',
  type: 'module',
  main: 'src/main.js',
  dependencies: {
    ...overrides,
    '@nativescript/core': '9.1.3',
    octane: '0.17.0',
  },
  devDependencies: {
    '@nativescript/ios': '9.1.0',
    '@nativescript/vite': '8.0.20',
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
} else if (fixture === 'keyed') {
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

if (fixture === 'custom') {
  const configuration = JSON.parse(
    readFileSync(join(customDir, 'startup.config.json')),
  )
  for (const name of readdirSync(customDir)) {
    if (name === 'startup.config.json') continue
    const file = join(customDir, name)
    if (statSync(file).isFile()) copy(file, join(app, 'src', name))
  }
  copy(
    join(source, 'ios-native/custom-adoption.ios.js'),
    join(app, 'src/custom-adoption.ios.js'),
  )
  writeFileSync(join(app, 'src/main.js'), "import './custom-adoption.ios.js'\n")
  writeFileSync(
    join(app, 'src/component.js'),
    `export { ${configuration.exportName} as StartupComponent } from './${basename(configuration.entry)}'\n`,
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
  'MountHost.h',
  'MountHost.m',
]) {
  copy(join(backend, name), join(app, 'native', name))
}

for (const name of ['HomeMount.h', 'HomeMount.m', 'HomeStyleSnapshot.swift']) {
  copy(join(source, 'home-native', name), join(app, 'native', name))
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
} else if (fixture === 'keyed') {
  const keyed = JSON.parse(
    readFileSync(join(source, 'producer/fixtures/keyed-startup.json')),
  )
  copy(join(source, 'producer/fixtures/keyed-startup.json'), join(work, 'keyed-startup.json'))
  json(join(app, 'startup.config.json'), {
    ...keyed,
    entry: './src/KeyedStartup.tsrx',
  })
} else {
  const custom = JSON.parse(
    readFileSync(join(customDir, 'startup.config.json')),
  )
  json(join(app, 'startup.config.json'), {
    ...custom,
    entry: './src/' + basename(custom.entry),
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
  readFileSync(bootstrap, 'utf8')
    .replace('__XPLAT_PRERENDER_BUILD_HASH__', producer.manifest.buildHash)
    .replace(
      '__XPLAT_PRERENDER_CANVAS__',
      fixture === 'custom'
        ? 'window.bounds'
        : 'CGRect(x: 0, y: 0, width: 320, height: 640)',
    ),
)

assertProducerInputs(producer.manifest)

const ns = process.env.XPLAT_PRERENDER_NS_CLI ?? '/opt/homebrew/bin/ns'
const cliVersion = run(ns, ['--version']).split(/\r?\n/)[0]

assert.equal(cliVersion, '9.1.1')
run(ns, ['prepare', 'ios', '--release', '--path', app])

// Defer NativeScript.framework: it stays an SPM dependency and still embeds
// in .app/Frameworks, but no load command maps its 56MB image (V8) until
// NativeScriptStart.setup() dlopen()s it after the native mount is proven.
const internalStart = join(app, 'platforms/ios/internal/NativeScriptStart.m')
let start = readFileSync(internalStart, 'utf8')
assert.ok(
  start.includes('Config* config = [[Config alloc] init];'),
  'Unexpected generated NativeScriptStart.m contents',
)
start = start
  .replace('#import <NativeScriptStart.h>', '#import <NativeScriptStart.h>\n#include <dlfcn.h>')
  .replace(
    'NSString* baseDir = [[NSBundle mainBundle] resourcePath];',
    `if (NSClassFromString(@"NativeScript") == nil) {
             NSString* frameworkPath = [[[NSBundle mainBundle] privateFrameworksPath] stringByAppendingPathComponent:@"NativeScript.framework/NativeScript"];
             if (dlopen(frameworkPath.fileSystemRepresentation, RTLD_NOW | RTLD_GLOBAL) == NULL) {
                 NSLog(@"NativeScript deferred load failed: %s", dlerror());
             }
         }
         NSString* baseDir = [[NSBundle mainBundle] resourcePath];`,
  )
  .replace('[Config alloc]', '[NSClassFromString(@"Config") alloc]')
  .replace('[NativeScript alloc]', '[NSClassFromString(@"NativeScript") alloc]')
writeFileSync(internalStart, start)

// The SPM product stays a declared dependency so staging, header search
// paths, metadata generation and the automatic .app embed keep working; the
// custom linker wrapper strips the framework from the link itself so the
// executable carries no load command for it.
const nsldPath = join(app, 'platforms/ios/internal/nsld.sh')
let nsld = readFileSync(nsldPath, 'utf8')
assert.ok(
  /"\$NS_LD" "\$@"\s*$/.test(nsld),
  'Unexpected generated nsld.sh contents',
)
nsld = nsld.replace(
  /"\$NS_LD" "\$@"\s*$/,
  `# NativeScript.framework is dlopen()ed by NativeScriptStart.setup(); strip
# the auto-linked product so the executable maps it only on demand.
FILTERED_ARGS=()
for ((i=1; i<=$#; i++)); do
    arg="\${!i}"
    if [[ "$arg" == "-framework" ]]; then
        next=$((i+1))
        if [[ "\${!next}" == "NativeScript" ]]; then
            i=$next
            continue
        fi
    fi
    case "$arg" in
        *NativeScript.framework/NativeScript|*NativeScript.xcframework*)
            continue
            ;;
    esac
    FILTERED_ARGS+=("$arg")
done
"$NS_LD" "\${FILTERED_ARGS[@]}"
`,
)
writeFileSync(nsldPath, nsld)

run(ns, ['build', 'ios', '--release', '--path', app])
assertProducerInputs(producer.manifest)
for (const [path, expected] of Object.entries(sourceHashes)) {
  assert.equal(hash(path), expected, 'Source changed during compilation: ' + path)
}
assert.ok(
  readFileSync(internalStart, 'utf8').includes('dlopen'),
  'ns build regenerated NativeScriptStart.m during compile',
)

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

const embeddedFramework = join(built, 'Frameworks/NativeScript.framework')
if (!existsSync(embeddedFramework)) {
  const builtFramework = join(products, 'NativeScript.framework')
  assert.ok(
    existsSync(builtFramework),
    'Unlinked NativeScript.framework was not produced by the build',
  )
  cpSync(builtFramework, embeddedFramework, { recursive: true })
  run('codesign', ['--force', '--deep', '--sign', '-', embeddedFramework])
}

const loadCommands = run('otool', ['-L', join(built, executable)])
assert.ok(
  !loadCommands.includes('NativeScript.framework'),
  'NativeScript.framework is still a load command on the executable',
)

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
      : fixture === 'custom'
        ? 'Custom-screen iOS XPI1 native mount, configured JSX wrapper adoption and held presentation; real-window canvas, no normal app/window handoff, OS input, compositor presentation or performance qualification'
        : 'Variable-topology iOS XPI1 native mount, configured JSX wrapper adoption and keyed client updates (' +
          mode +
          '); bounded 320x640 canvas, no normal app/window handoff, OS input, compositor presentation or performance qualification',
})

console.log('SDK startup build complete: ' + work)
