import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

function required(name) {
  if (!process.env[name]) throw new Error('Set ' + name)
  return realpathSync(process.env[name])
}
const mason = required('XPLAT_PRERENDER_MASON_SDK')
const core = required('XPLAT_PRERENDER_CORE_ROOT')
const source = join(import.meta.dirname, 'home-native')
const iosNative = join(import.meta.dirname, 'ios-native')
const backend = resolve(import.meta.dirname, '../../../packages/native-prerender/platforms/ios')
const root = resolve(homedir(), 'agent-scratch/octane-xplat/native-prerender-home-helpers')
mkdirSync(root, { recursive: true })
const work = mkdtempSync(join(root, 'run-'))
function run(command, args) {
  const result = spawnSync(command, args, { cwd: work, encoding: 'utf8', timeout: 180000 })
  if (result.status !== 0)
    throw new Error(command + ': ' + (result.error?.message ?? result.stderr))
  return result.stdout.trim()
}
const sdk = run('xcrun', ['--sdk', 'iphonesimulator', '--show-sdk-path'])
const widgets = join(core, 'platforms/ios/TNSWidgets.xcframework/ios-arm64_x86_64-simulator')
const hash = (file) => createHash('sha256').update(readFileSync(file)).digest('hex')
const inputs = [
  import.meta.filename,
  ...['FontLowering.h', 'FontLowering.m', 'MasonMount.h', 'MasonMount.m'].map((name) => join(backend, name)),
  ...['HomeMount.h', 'HomeMount.m', 'HomeStyleSnapshot.swift'].map((name) => join(source, name)),
  ...['MountHost.h', 'MountHost.m'].map((name) => join(backend, name)),
  ...['StartupArtifact.swift', 'MasonArtifact.swift'].map((name) => join(backend, name)),
  join(source, 'HomeBootstrap.swift'),
  join(import.meta.dirname, 'Runtime.h'),
  ...[
    'NativeScriptUtils.h',
    'NativeScriptUtils.m',
    'UIView+NativeScript.h',
    'UIView+NativeScript.m',
  ].map((name) => join(core, 'platforms/ios/src', name)),
  join(mason, 'MasonCore.framework/Headers/MasonCore-Swift.h'),
  join(mason, 'MasonCore.framework/MasonCore'),
  join(
    mason,
    'MasonCore.framework/Modules/MasonCore.swiftmodule/arm64-apple-ios-simulator.swiftmodule',
  ),
  join(
    mason,
    'MasonCore.framework/Modules/MasonCore.swiftmodule/arm64-apple-ios-simulator.swiftinterface',
  ),
  join(widgets, 'TNSWidgets.framework/TNSWidgets'),
  join(core, 'package.json'),
  resolve(import.meta.dirname, '../../../packages/cli/patches/@nativescript__core@9.1.3.patch'),
]
const inputHashes = Object.fromEntries(inputs.map((file) => [file, hash(file)]))
const objects = []
for (const [name, directory] of [['FontLowering', backend], ['MasonMount', backend], ['HomeMount', source], ['MountHost', backend]]) {
  const object = join(work, name + '.o')
  const args = [
    'clang',
    '-target',
    'arm64-apple-ios15.6-simulator',
    '-isysroot',
    sdk,
    '-fobjc-arc',
    '-fmodules',
    '-F',
    mason,
    '-F',
    widgets,
    '-I',
    join(core, 'platforms/ios/src'),
    '-I',
    backend,
    '-I',
    source,
    '-I',
    iosNative,
    '-c',
    join(directory, name + '.m'),
    '-o',
    object,
  ]
  writeFileSync(
    join(work, name + '-command.json'),
    JSON.stringify({ command: 'xcrun', args }, null, 2),
  )
  run('xcrun', args)
  objects.push({ path: object, sha256: hash(object) })
}
const snapshotObject = join(work, 'HomeStyleSnapshot.o')
const snapshotArgs = [
  'swiftc',
  '-parse-as-library',
  '-emit-object',
  '-sdk',
  sdk,
  '-target',
  'arm64-apple-ios15.6-simulator',
  '-module-name',
  'XplatPrerenderHomeHelpers',
  '-F',
  mason,
  '-I',
  join(mason, 'include'),
  join(source, 'HomeStyleSnapshot.swift'),
  '-o',
  snapshotObject,
]
writeFileSync(
  join(work, 'HomeStyleSnapshot-command.json'),
  JSON.stringify({ command: 'xcrun', args: snapshotArgs }, null, 2),
)
run('xcrun', snapshotArgs)
objects.push({ path: snapshotObject, sha256: hash(snapshotObject) })
// Compile the actual host/adapter interface too. Object compilation alone
// cannot catch a missing Swift import after moving an Objective-C helper.
const header = join(work, 'HomeBridge.h')
writeFileSync(header, ['Runtime.h', 'MasonMount.h', 'MountHost.h', 'HomeMount.h'].map((name) => '#import "' + name + '"').join('\n') + '\n')
const main = join(work, 'main.swift')
writeFileSync(main, readFileSync(join(source, 'HomeBootstrap.swift'), 'utf8').replace('__XPLAT_PRERENDER_BUILD_HASH__', 'ab'.repeat(32)))
const typecheckArgs = [
  'swiftc', '-typecheck', '-sdk', sdk, '-target', 'arm64-apple-ios15.6-simulator',
  '-F', mason, '-F', widgets, '-I', join(mason, 'include'),
  '-I', backend, '-I', source, '-I', iosNative, '-I', import.meta.dirname,
  '-import-objc-header', header,
  join(backend, 'StartupArtifact.swift'), join(backend, 'MasonArtifact.swift'), main,
]
writeFileSync(join(work, 'HomeBootstrap-command.json'), JSON.stringify({ command: 'xcrun', args: typecheckArgs }, null, 2))
run('xcrun', typecheckArgs)
run('xcrun', [...typecheckArgs, '-D', 'XPLAT_PRERENDER_STALE_THEME'])
for (const [file, expected] of Object.entries(inputHashes)) {
  if (hash(file) !== expected) throw new Error('Input changed during compilation: ' + file)
}
const manifest = {
  scope:
    'Compile-only arm64 iOS simulator helpers for the fixed Home experiment; no app linkage or runtime qualification',
  sdk,
  compiler: run('xcrun', ['clang', '--version']),
  coreVersion: JSON.parse(readFileSync(join(core, 'package.json'), 'utf8')).version,
  inputHashes,
  objects,
  bootstrapTypechecked: true,
  bootstrapInputs: { [header]: hash(header), [main]: hash(main) },
  linked: false,
  runtimeQualified: false,
}
writeFileSync(join(work, 'build.json'), JSON.stringify(manifest, null, 2))
console.log(JSON.stringify({ work, objects, linked: false, runtimeQualified: false }, null, 2))
