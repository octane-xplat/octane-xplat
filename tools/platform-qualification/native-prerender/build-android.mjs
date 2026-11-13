import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  writeFileSync,
} from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

// Invoke inside a native_builds reservation. This phase starts no device.
const source = join(import.meta.dirname, 'android-native')
const required = (name) => {
  if (!process.env[name]) throw new Error('Set ' + name)
  return resolve(process.env[name])
}
const runtime = required('XPLAT_PRERENDER_ANDROID_RUNTIME_ROOT')
const core = realpathSync(required('XPLAT_PRERENDER_CORE_ROOT'))
const mason = required('XPLAT_PRERENDER_ANDROID_MASON_SDK')
const sdk = required('XPLAT_PRERENDER_ANDROID_SDK')
const javaHome = required('XPLAT_PRERENDER_JAVA_HOME')
const labelWrappers = process.env.XPLAT_PRERENDER_ANDROID_LABEL_WRAPPERS === '1'
const masonParent = process.env.XPLAT_PRERENDER_ANDROID_MASON_PARENT === '1'
const masonAdopt = process.env.XPLAT_PRERENDER_ANDROID_MASON_ADOPT === '1'
if (masonParent && !labelWrappers) throw new Error('Mason parent control requires Label wrappers')
if (masonAdopt && !masonParent) throw new Error('Mason adoption requires parent control')
const framework = join(runtime, 'framework')
if (
  JSON.parse(readFileSync(join(runtime, 'package.json'))).version !== '9.1.1' ||
  JSON.parse(readFileSync(join(core, 'package.json'))).version !== '9.1.3'
)
  throw new Error('This mechanism fixture requires qualified Android9.1.1/Core9.1.3 inputs')
if (!existsSync(join(sdk, 'platforms/android-36/android.jar')))
  throw new Error('Existing Android SDK platform36 is required; this fixture does not install SDKs')
const scratch = join(homedir(), 'agent-scratch/octane-xplat/native-prerender-android')
mkdirSync(scratch, { recursive: true })
const work = mkdtempSync(join(scratch, 'run-'))
writeFileSync(
  join(work, 'README.md'),
  'Everything in this folder is disposable.\nNative Android bootstrap qualification.\nSource: ' +
    source +
    '\nResults: ~/dev/reports/octane-xplat/native-prerender-android-bootstrap/\n',
)
const hash = (path) => createHash('sha256').update(readFileSync(path)).digest('hex')
const inputs = {}
const sourceHashes = {}
function snapshot(from, to, registry) {
  const data = readFileSync(from)
  mkdirSync(resolve(to, '..'), { recursive: true })
  writeFileSync(to, data, { mode: 0o644 })
  registry[from] = { copy: to, sha256: createHash('sha256').update(data).digest('hex') }
}
function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? files(join(dir, entry.name)) : [join(dir, entry.name)],
  )
}
function snapshotDir(from, to) {
  for (const path of files(from)) snapshot(path, join(to, path.slice(from.length + 1)), inputs)
}
for (const [from, name] of [
  [join(runtime, 'package.json'), 'runtime-package.json'],
  [join(core, 'package.json'), 'core-package.json'],
  [join(framework, 'app/libs/runtime-libs/nativescript-regular.aar'), 'nativescript-runtime.aar'],
  [join(core, 'platforms/android/widgets-release.aar'), 'nativescript-widgets.aar'],
  [join(mason, 'MasonCore.aar'), 'MasonCore.aar'],
  [join(mason, 'manifest.json'), 'mason-manifest.json'],
  [join(framework, 'build-tools/android-metadata-generator.jar'), 'android-metadata-generator.jar'],
])
  snapshot(from, join(work, 'inputs', name), inputs)
const masonManifest = JSON.parse(readFileSync(join(work, 'inputs/mason-manifest.json')))
if (hash(join(work, 'inputs/MasonCore.aar')) !== masonManifest.aarSha256)
  throw new Error('Mason AAR differs from its manifest')
snapshotDir(join(framework, 'app/src/main/java'), join(work, 'app/src/main/java'))
snapshotDir(
  join(framework, 'app/src/main/assets/internal'),
  join(work, 'app/src/main/assets/internal'),
)
snapshotDir(join(framework, 'gradle'), join(work, 'gradle'))
snapshot(join(framework, 'gradlew'), join(work, 'gradlew'), inputs)
for (const [name, destination] of [
  ['ProbeActivity.java', 'app/src/main/java/org/octanexplat/prerenderandroid/ProbeActivity.java'],
  [
    'ProbeApplication.java',
    'app/src/main/java/org/octanexplat/prerenderandroid/ProbeApplication.java',
  ],
  ['ProbeBridge.java', 'app/src/main/java/org/octanexplat/prerenderandroid/ProbeBridge.java'],
  ['AndroidManifest.xml', 'app/src/main/AndroidManifest.xml'],
  ['entry.js', labelWrappers ? 'raw-bridge-entry.js' : 'app/src/main/assets/app/main.js'],
  ['app.gradle', 'app/build.gradle'],
  ['settings.gradle', 'settings.gradle'],
])
  snapshot(join(source, name), join(work, destination), sourceHashes)
sourceHashes[import.meta.filename] = {
  copy: import.meta.filename,
  sha256: hash(import.meta.filename),
}
writeFileSync(
  join(work, 'build.gradle'),
  "plugins { id 'com.android.application' version '8.12.1' apply false }\n",
)
writeFileSync(
  join(work, 'gradle.properties'),
  'android.useAndroidX=true\nandroid.builder.sdkDownload=false\norg.gradle.jvmargs=-Xmx3g\norg.gradle.workers.max=2\n',
)
writeFileSync(join(work, 'local.properties'), 'sdk.dir=' + sdk.replaceAll('\\', '\\\\') + '\n')
mkdirSync(join(work, 'app/src/main/assets/app'), { recursive: true })
writeFileSync(
  join(work, 'app/src/main/assets/app/package.json'),
  JSON.stringify({ main: 'main.js', profiling: 'timeline' }),
)
const labels = ['Native home screen', 'JavaScript starts later']
writeFileSync(
  join(work, 'app/src/main/assets/screen.bin'),
  Buffer.concat([
    Buffer.from('XPR0'),
    Buffer.from([labels.length]),
    ...labels.flatMap((value) => [Buffer.from([Buffer.byteLength(value)]), Buffer.from(value)]),
  ]),
)
if (labelWrappers) {
  const bundler = join(import.meta.dirname, 'bundle-android-label.mjs')
  sourceHashes[bundler] = { copy: bundler, sha256: hash(bundler) }
  const bundleArgs = [
    bundler,
    core,
    work,
    join(source, masonParent ? 'mason-parent-entry.js' : 'label-entry.js'),
  ]
  if (masonParent)
    bundleArgs.push(
      realpathSync(required('XPLAT_PRERENDER_ANDROID_MASON_RUNTIME_ROOT')),
      masonAdopt ? 'adopt' : 'ordinary',
    )
  const bundled = spawnSync('bun', bundleArgs, {
    encoding: 'utf8',
    timeout: 60000,
    maxBuffer: 8 * 1024 * 1024,
  })
  writeFileSync(join(work, 'label-bundle.log'), (bundled.stdout ?? '') + (bundled.stderr ?? ''))
  if (bundled.status !== 0)
    throw new Error('Label bundle failed; see ' + join(work, 'label-bundle.log'))
  Object.assign(sourceHashes, JSON.parse(readFileSync(join(work, 'label-js-inputs.json'))))
}
const java = join(javaHome, 'bin/java')
// Freeze the external SDK snapshot before compilation. Later SDK rebuilds by
// another task do not affect the inputs used by this isolated project.
for (const [path, input] of Object.entries(inputs))
  if (hash(path) !== input.sha256) throw new Error('SDK changed while being copied: ' + path)
const commands = []
function run(program, args, cwd, log) {
  commands.push({ program, args, cwd })
  const result = spawnSync(program, args, {
    cwd,
    env: { ...process.env, JAVA_HOME: javaHome },
    encoding: 'utf8',
    timeout: 300000,
    maxBuffer: 16 * 1024 * 1024,
  })
  writeFileSync(
    join(work, log),
    (result.stdout ?? '') + (result.stderr ?? '') + (result.error?.message ?? ''),
  )
  if (result.status !== 0) throw new Error('Android build failed; see ' + join(work, log))
}
// Use sh so the copied wrapper need not receive an executable permission change.
run('sh', [join(work, 'gradlew'), '--no-daemon', ':app:prepareProbeMetadata'], work, 'compile.log')
run(
  java,
  ['-jar', join(work, 'inputs/android-metadata-generator.jar')],
  join(work, 'metadata-work'),
  'metadata.log',
)
run('sh', [join(work, 'gradlew'), '--no-daemon', ':app:assembleDebug'], work, 'assemble.log')
for (const [path, input] of Object.entries({ ...inputs, ...sourceHashes }))
  if (
    hash(input.copy) !== input.sha256 ||
    (Object.hasOwn(sourceHashes, path) && hash(path) !== input.sha256)
  )
    throw new Error('Android build input changed during compilation: ' + path)
const generatedHashes = Object.fromEntries(
  files(join(work, 'app/src')).map((path) => [path, hash(path)]),
)
const apk = join(work, 'app/build/outputs/apk/debug/app-debug.apk')
if (
  JSON.parse(readFileSync(join(work, 'app/build/outputs/apk/debug/output-metadata.json')))
    .applicationId !== 'org.octanexplat.prerenderbootstrap.android'
)
  throw new Error('Compiled Android application ID differs from this fixture')
writeFileSync(
  join(work, 'build.json'),
  JSON.stringify(
    {
      apk,
      apkHash: hash(apk),
      sdk,
      sourceHashes,
      generatedHashes,
      inputs,
      commands,
      id: 'org.octanexplat.prerenderbootstrap.android',
      labelWrappers,
      masonParent,
      masonAdopt,
      scope: masonParent
        ? 'Real Mason/Label wrapper parent adoption control, child identity/order, normal reorder/insert/remove and Activity rebinding; no Octane, Home IR, Core Application handoff, general CSS parity, viewport, presentation, deallocation or performance qualification'
        : labelWrappers
          ? 'Native bootstrap with two real Core Label wrappers, per-Activity release/rebind and text remeasurement; no logical Mason parent, Octane hydration, Core Application handoff, Home IR, viewport/CSS parity, presentation or performance qualification'
          : 'Native Application/Activity bootstrap mechanism and binary two-label fixture; no Octane/wrapper hydration, Home IR, full viewport, CSS parity, compositor presentation or release performance qualification',
    },
    null,
    2,
  ),
)
console.log('Android bootstrap build: ' + work)
