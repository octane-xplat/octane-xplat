import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

// Run under a native_builds reservation. No experimental runtime or metadata input.
const source = join(import.meta.dirname, 'sdk-ios')
const parent = join(homedir(), 'agent-scratch/octane-xplat/native-prerender-sdk-ios')
mkdirSync(parent, { recursive: true })
const root = mkdtempSync(join(parent, 'run-'))
const app = join(root, 'SDKStartupGate')
mkdirSync(join(app, 'src'), { recursive: true })
mkdirSync(join(app, 'App_Resources/iOS'), { recursive: true })
cpSync(join(source, 'native'), join(app, 'native'), { recursive: true })
cpSync(join(source, 'main.js'), join(app, 'src/main.js'))
cpSync(import.meta.filename, join(root, 'builder.mjs'))
let commandIndex = 0
function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: app,
    encoding: 'utf8',
    timeout: 1200000,
    maxBuffer: 64 * 1024 * 1024,
  })
  writeFileSync(
    join(root, ++commandIndex + '-command.log'),
    (result.stdout ?? '') + (result.stderr ?? ''),
  )
  if (result.status !== 0)
    throw new Error(
      command +
        ' failed; evidence: ' +
        root +
        '\n' +
        (result.error?.message ?? (result.stdout + result.stderr).slice(-16000)),
    )
  return result.stdout.trim()
}
const id = 'org.octanexplat.prerender.sdkios'
writeFileSync(
  join(app, 'package.json'),
  JSON.stringify(
    {
      name: 'xplat-native-sdk-startup-gate',
      private: true,
      version: '1.0.0',
      main: 'src/main.js',
      dependencies: { '@nativescript/core': '9.1.3' },
      devDependencies: {
        '@nativescript/ios': '9.1.0',
        '@nativescript/vite': '8.0.20',
        vite: '8.3.6',
        typescript: '5.9.3',
      },
    },
    null,
    2,
  ),
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
  join(app, 'vite.config.mts'),
  `import { defineConfig } from 'vite'
import { javascriptConfig } from '@nativescript/vite'
export default defineConfig(({mode}) => javascriptConfig({mode}))\n`,
)
writeFileSync(
  join(app, 'App_Resources/iOS/build.xcconfig'),
  `NS_SWIFTUI_BOOT = 1
SWIFT_OBJC_BRIDGING_HEADER = ${join(app, 'native/StartupBridge.h')}
IPHONEOS_DEPLOYMENT_TARGET = 17.0
ARCHS = arm64
ONLY_ACTIVE_ARCH = YES
// Installed iOS27 SDK compatibility for the SDK's Clang metadata generator.
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
<key>UIApplicationSceneManifest</key><dict>
<key>UIApplicationSupportsMultipleScenes</key><false/>
</dict>
<key>UISupportedInterfaceOrientations</key><array><string>UIInterfaceOrientationPortrait</string></array>
</dict></plist>\n`,
)
console.log('SDK startup build: ' + root)
if (run('bun', ['--version']) !== '1.4.4') throw new Error('Bun1.4.4 required')
run('bun', ['install', '--ignore-scripts', '--omit', 'peer'])
const ns = process.env.XPLAT_PRERENDER_NS_CLI ?? '/opt/homebrew/bin/ns'
// The CLI appends its update notice to version output.
const cliVersion = run(ns, ['--version']).split(/\r?\n/)[0]
if (cliVersion !== '9.1.1') throw new Error('This SDK control requires NativeScript CLI9.1.1')
run(ns, ['build', 'ios', '--release', '--path', app])
const products = join(app, 'platforms/ios/build/Release-iphonesimulator')
const names = readdirSync(products).filter((name) => name.endsWith('.app'))
if (names.length !== 1) throw new Error('Expected one SDK application: ' + names)
const built = join(products, names[0])
const executable = run('plutil', [
  '-extract',
  'CFBundleExecutable',
  'raw',
  join(built, 'Info.plist'),
])
const hash = (path) => createHash('sha256').update(readFileSync(path)).digest('hex')
writeFileSync(
  join(root, 'build.json'),
  JSON.stringify(
    {
      fixture: 'stock-sdk-late-js',
      id,
      cliVersion,
      app: built,
      sourceHashes: Object.fromEntries(
        ['native/StartupApp.swift', 'native/StartupBridge.h', 'main.js'].map((name) => [
          join(source, name),
          hash(join(source, name)),
        ]),
      ),
      builderHash: hash(import.meta.filename),
      executable,
      executableHash: hash(join(built, executable)),
      bundleHash: hash(join(built, 'app/bundle.mjs')),
      bundleFiles: Object.fromEntries(
        readdirSync(join(built, 'app'), { recursive: true })
          .sort()
          .filter((name) => statSync(join(built, 'app', name)).isFile())
          .map((name) => [name, hash(join(built, 'app', name))]),
      ),
      runtimeHash: hash(join(built, 'Frameworks/NativeScript.framework/NativeScript')),
      metadataHash: hash(join(products, 'metadata-arm64.bin')),
      metadataDiagnosticsHash: hash(join(products, 'metadata-generation-stderr-arm64.txt')),
    },
    null,
    2,
  ),
)
console.log('XPLAT_PRERENDER_IOS_SDK_BUILD=' + root)
