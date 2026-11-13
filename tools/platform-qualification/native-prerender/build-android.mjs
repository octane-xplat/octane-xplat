import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { decodeStartupArtifact, encodeStartupArtifact } from '@octane-xplat/native-prerender/codec'

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
const variant = process.env.XPLAT_PRERENDER_ANDROID_VARIANT ?? 'debug'
if (!['debug', 'release'].includes(variant))
  throw new Error('Android fixture variant must be debug or release')
const labelWrappers = process.env.XPLAT_PRERENDER_ANDROID_LABEL_WRAPPERS === '1'
const masonParent = process.env.XPLAT_PRERENDER_ANDROID_MASON_PARENT === '1'
const masonAdopt = process.env.XPLAT_PRERENDER_ANDROID_MASON_ADOPT === '1'
const applicationHandoff = process.env.XPLAT_PRERENDER_ANDROID_APPLICATION === '1'
const applicationEntry = process.env.XPLAT_PRERENDER_ANDROID_APPLICATION_ENTRY === '1'
if (masonParent && !labelWrappers) throw new Error('Mason parent control requires Label wrappers')
if (masonAdopt && !masonParent) throw new Error('Mason adoption requires parent control')
if (applicationHandoff && !masonAdopt)
  throw new Error('Application handoff requires Mason adoption')
if (applicationEntry && !applicationHandoff)
  throw new Error('Application entry requires application handoff')
const homeProducer = process.env.XPLAT_PRERENDER_ANDROID_HOME_PRODUCER
  ? required('XPLAT_PRERENDER_ANDROID_HOME_PRODUCER')
  : null
if (
  homeProducer &&
  (labelWrappers || masonParent || masonAdopt || applicationHandoff || applicationEntry)
)
  throw new Error('Home mount control cannot combine with two-label wrapper modes')
const homeAdopt = process.env.XPLAT_PRERENDER_ANDROID_HOME_ADOPT === '1'
if (variant === 'release' && !homeProducer)
  throw new Error('Release qualification requires Home inputs')
if (homeAdopt && !homeProducer) throw new Error('Home adoption requires an Android Home producer')
const homeParity = process.env.XPLAT_PRERENDER_ANDROID_HOME_PARITY === '1'
if (homeParity && !homeAdopt) throw new Error('Home parity requires Home adoption')
const homeRecreate = process.env.XPLAT_PRERENDER_ANDROID_HOME_RECREATE === '1'
if (homeRecreate && !homeParity) throw new Error('Home recreation control requires Home parity')
const homeRecreateCount = Number(process.env.XPLAT_PRERENDER_ANDROID_HOME_RECREATE_COUNT ?? 1)
if (
  !Number.isInteger(homeRecreateCount) ||
  homeRecreateCount < 1 ||
  homeRecreateCount > 8 ||
  (process.env.XPLAT_PRERENDER_ANDROID_HOME_RECREATE_COUNT && !homeRecreate)
)
  throw new Error('Home recreation count must be1..8 and requires forced recreation')
const homeInput = process.env.XPLAT_PRERENDER_ANDROID_HOME_INPUT === '1'
if (homeInput && !homeParity) throw new Error('Home OS input control requires Home parity')
const homeApplication = process.env.XPLAT_PRERENDER_ANDROID_HOME_APPLICATION === '1'
const homeEntry = process.env.XPLAT_PRERENDER_ANDROID_HOME_ENTRY === '1'
const homeRestore = process.env.XPLAT_PRERENDER_ANDROID_HOME_RESTORE === '1'
const homeStartup = process.env.XPLAT_PRERENDER_ANDROID_HOME_STARTUP === '1'
if (
  homeStartup &&
  (variant !== 'release' ||
    !homeEntry ||
    !homeApplication ||
    homeParity ||
    homeRecreate ||
    homeInput ||
    homeRestore)
)
  throw new Error(
    'Startup comparison requires release Home adoption/Application/main entry without qualification-only parity/recreation/input/restore controls',
  )
if (homeApplication && !homeAdopt)
  throw new Error('Home Application handoff requires Home adoption')
const homeFallback = process.env.XPLAT_PRERENDER_ANDROID_HOME_FALLBACK ?? ''
if (homeStartup && homeFallback) throw new Error('Startup comparison cannot inject fallback faults')
if (homeEntry && (!homeApplication || homeRecreate || homeFallback))
  throw new Error(
    'Cold Home entry requires Home Application/adoption without recreation or fault injection',
  )
if (homeRestore && (!homeEntry || !homeInput || !homeParity))
  throw new Error('Home retained-state restoration requires cold entry, parity and OS input')
const homeLifetime = process.env.XPLAT_PRERENDER_ANDROID_HOME_LIFETIME === '1'
if (homeLifetime && (!homeApplication || !homeRecreate || !homeParity))
  throw new Error(
    'Retired Home lifetime control requires Application, forced recreation and parity',
  )
if (
  homeFallback &&
  (!['build', 'seed', 'attach', 'theme', 'font-scale'].includes(homeFallback) ||
    !homeApplication ||
    homeParity ||
    homeRecreate ||
    homeInput)
)
  throw new Error(
    'Home fallback control requires build/seed/attach/theme/font-scale mode and Home Application/adoption, without parity/recreation/input',
  )
const id = homeProducer
  ? 'org.octanexplat.prerenderhome.android'
  : 'org.octanexplat.prerenderbootstrap.android'
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
  ['theme.xml', 'app/src/main/res/values/theme.xml'],
  [
    'entry.js',
    labelWrappers || homeAdopt ? 'raw-bridge-entry.js' : 'app/src/main/assets/app/main.js',
  ],
  ['app.gradle', 'app/build.gradle'],
  ['settings.gradle', 'settings.gradle'],
]) {
  const selected = homeProducer
    ? ({
        'ProbeActivity.java': 'HomeActivity.java',
        'ProbeApplication.java': 'HomeApplication.java',
        'ProbeBridge.java': 'HomeBridge.java',
        'entry.js': 'home-entry.js',
      }[name] ?? name)
    : name
  const target = homeProducer
    ? destination
        .replace('ProbeActivity.java', 'HomeActivity.java')
        .replace('ProbeApplication.java', 'HomeApplication.java')
        .replace('ProbeBridge.java', 'HomeBridge.java')
    : destination
  const template =
    homeProducer &&
    (['AndroidManifest.xml', 'app.gradle'].includes(name) ||
      (homeAdopt && name === 'settings.gradle'))
  snapshot(
    join(source, selected),
    join(work, template ? 'templates/' + name : target),
    sourceHashes,
  )
  if (template)
    writeFileSync(
      join(work, target),
      readFileSync(join(work, 'templates/' + name), 'utf8')
        .replaceAll('ProbeApplication', 'HomeApplication')
        .replaceAll('ProbeActivity', 'HomeActivity')
        .replaceAll('org.octanexplat.prerenderbootstrap.android', id)
        .replaceAll(
          'FAIL_ON_PROJECT_REPOS',
          homeAdopt ? 'PREFER_SETTINGS' : 'FAIL_ON_PROJECT_REPOS',
        )
        .replace(
          'android:exported="true">',
          homeStartup
            ? 'android:configChanges="keyboardHidden|orientation|screenSize" android:exported="true">'
            : 'android:exported="true">',
        )
        .replace(
          '</application>',
          homeProducer
            ? '<provider android:name="org.octanexplat.prerenderandroid.HomeReceiptProvider" android:authorities="' +
                id +
                '.receipts" android:exported="true" android:enabled="${receiptProviderEnabled}" />\n' +
                (homeStartup
                  ? '<profileable android:shell="true" />\n<activity android:name="org.octanexplat.prerenderandroid.HomeOrdinaryActivity" android:process=":ordinary" android:configChanges="keyboardHidden|orientation|screenSize" android:exported="true" />\n<provider android:name="org.octanexplat.prerenderandroid.HomeOrdinaryReceiptProvider" android:authorities="' +
                    id +
                    '.receipts.ordinary" android:process=":ordinary" android:exported="true" />\n'
                  : '') +
                '    </application>'
            : '</application>',
        ),
    )
}
if (homeProducer)
  for (const name of [
    'HomeArtifact.java',
    'HomeScene.java',
    'HomeComparison.java',
    'HomeViewport.java',
    'HomeReceiptProvider.java',
    ...(homeStartup ? ['HomeOrdinaryActivity.java', 'HomeOrdinaryReceiptProvider.java'] : []),
  ])
    snapshot(
      join(source, name),
      join(work, 'app/src/main/java/org/octanexplat/prerenderandroid', name),
      sourceHashes,
    )
if (homeProducer)
  snapshot(
    resolve(
      import.meta.dirname,
      '../../../packages/native-prerender/platforms/android/java/org/octanexplat/prerender/StartupArtifact.java',
    ),
    join(work, 'app/src/main/java/org/octanexplat/prerender/StartupArtifact.java'),
    sourceHashes,
  )
snapshot(import.meta.filename, join(work, 'sources/build-android.mjs'), sourceHashes)
writeFileSync(
  join(work, 'build.gradle'),
  "plugins { id 'com.android.application' version '8.12.1' apply false }\n",
)
writeFileSync(
  join(work, 'gradle.properties'),
  'android.useAndroidX=true\nandroid.builder.sdkDownload=false\norg.gradle.jvmargs=-Xmx3g\norg.gradle.workers.max=2\nprobeVariant=' +
    variant +
    '\n',
)
writeFileSync(join(work, 'local.properties'), 'sdk.dir=' + sdk.replaceAll('\\', '\\\\') + '\n')
mkdirSync(join(work, 'app/src/main/assets/app'), { recursive: true })
writeFileSync(
  join(work, 'app/src/main/assets/app/package.json'),
  JSON.stringify({ main: 'main.js', ...(homeStartup ? {} : { profiling: 'timeline' }) }),
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
      applicationHandoff ? 'application' : 'wrappers',
      applicationEntry ? 'entry' : 'explicit',
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
let home = null
if (homeProducer) {
  for (const name of [
    'build.json',
    'startup.bin',
    'startup.json',
    'resolved.json',
    ...(homeAdopt ? ['sheets.json'] : []),
  ])
    snapshot(join(homeProducer, name), join(work, 'producer', name), sourceHashes)
  if (homeAdopt) {
    snapshot(
      join(import.meta.dirname, '../../../packages/ui/platforms/android/include.gradle'),
      join(work, 'inputs/ui-native.gradle'),
      sourceHashes,
    )
    writeFileSync(
      join(work, 'app/build.gradle'),
      readFileSync(join(work, 'app/build.gradle'), 'utf8') +
        "\napply from: '../inputs/ui-native.gradle'\n",
    )
    const bundler = join(import.meta.dirname, 'bundle-android-home.mjs')
    const result = spawnSync(
      'bun',
      [
        bundler,
        core,
        work,
        realpathSync(required('XPLAT_PRERENDER_ANDROID_MASON_RUNTIME_ROOT')),
        realpathSync(required('XPLAT_PRERENDER_ANDROID_HOME_DRIVER_ROOT')),
      ],
      {
        encoding: 'utf8',
        timeout: 60000,
        maxBuffer: 8 * 1024 * 1024,
      },
    )
    writeFileSync(
      join(work, 'home-bundle.log'),
      (result.stdout ?? '') + (result.stderr ?? '') + (result.error?.message ?? ''),
    )
    if (result.status !== 0)
      throw new Error('Home bundle failed; see ' + join(work, 'home-bundle.log'))
    Object.assign(sourceHashes, JSON.parse(readFileSync(join(work, 'home-js-inputs.json'))))
  }
  const producer = JSON.parse(readFileSync(join(work, 'producer/build.json')))
  const inputArtifact = readFileSync(join(work, 'producer/startup.bin'))
  if (
    producer.platform !== 'android' ||
    !/^[a-f0-9]{64}$/.test(producer.buildHash) ||
    hash(join(work, 'producer/startup.bin')) !== producer.startupArtifactHash ||
    inputArtifact.length < 80
  )
    throw new Error('Expected intact Android Home producer output')
  const startup = decodeStartupArtifact(inputArtifact, {
    build: producer.buildHash,
    platform: 'android',
  })
  // Bind the installed JS/native host and update both identity locations.
  // The payload checksum is regenerated by the canonical encoder.
  const buildHash = createHash('sha256')
    .update(
      JSON.stringify({
        producer: producer.buildHash,
        options: {
          homeAdopt,
          variant,
          homeParity,
          homeRecreate,
          homeRecreateCount,
          homeInput,
          homeApplication,
          homeEntry,
          homeRestore,
          homeStartup,
          homeFallback,
          homeLifetime,
        },
        javascript: hash(join(work, 'app/src/main/assets/app/main.js')),
        native: Object.fromEntries(
          Object.entries(sourceHashes).map(([path, value]) => [path, value.sha256]),
        ),
        sdk: Object.fromEntries(
          Object.entries(inputs).map(([path, value]) => [path, value.sha256]),
        ),
      }),
    )
    .digest('hex')
  const artifact = Buffer.from(encodeStartupArtifact({ ...startup, build: buildHash }))
  if (homeFallback === 'build') artifact[16] ^= 1
  writeFileSync(join(work, 'app/src/main/assets/home.bin'), artifact)
  writeFileSync(
    join(work, 'app/src/main/java/org/octanexplat/prerenderandroid/HomeBuild.java'),
    'package org.octanexplat.prerenderandroid; public final class HomeBuild { public static final String HASH = "' +
      buildHash +
      '"; public static final boolean RECREATE = ' +
      homeRecreate +
      '; public static final boolean STALE_THEME = ' +
      (homeFallback === 'theme') +
      '; public static final boolean RESTORE = ' +
      homeRestore +
      '; public static final boolean STARTUP = ' +
      homeStartup +
      '; public static final boolean UNSUPPORTED_FONT_SCALE = ' +
      (homeFallback === 'font-scale') +
      '; public static final int RECREATIONS = ' +
      homeRecreateCount +
      '; }\n',
  )
  home = {
    adopt: homeAdopt,
    parity: homeParity,
    recreate: homeRecreate,
    recreateCount: homeRecreateCount,
    input: homeInput,
    application: homeApplication,
    entry: homeEntry,
    restore: homeRestore,
    startup: homeStartup,
    fallback: homeFallback,
    lifetime: homeLifetime,
    buildHash,
    producerBuildHash: producer.buildHash,
    producerArtifactHash: producer.startupArtifactHash,
    artifactFormat: 'XPI1',
    artifactHash: hash(join(work, 'app/src/main/assets/home.bin')),
  }
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
run(
  'sh',
  [
    join(work, 'gradlew'),
    '--no-daemon',
    variant === 'release' ? ':app:assembleRelease' : ':app:assembleDebug',
  ],
  work,
  'assemble.log',
)
for (const [path, input] of Object.entries({ ...inputs, ...sourceHashes }))
  if (
    hash(input.copy) !== input.sha256 ||
    (Object.hasOwn(sourceHashes, path) && hash(path) !== input.sha256)
  )
    throw new Error('Android build input changed during compilation: ' + path)
const generatedHashes = Object.fromEntries(
  files(join(work, 'app/src')).map((path) => [path, hash(path)]),
)
const apk = join(work, 'app/build/outputs/apk', variant, 'app-' + variant + '.apk')
if (
  JSON.parse(readFileSync(join(work, 'app/build/outputs/apk', variant, 'output-metadata.json')))
    .applicationId !== id
)
  throw new Error('Compiled Android application ID differs from this fixture')
writeFileSync(
  join(work, 'build.json'),
  JSON.stringify(
    {
      apk,
      variant,
      apkHash: hash(apk),
      sdk,
      sourceHashes,
      generatedHashes,
      inputs,
      commands,
      id,
      home,
      labelWrappers,
      masonParent,
      masonAdopt,
      applicationHandoff,
      applicationEntry,
      scope: home
        ? (homeFallback
            ? 'Android Home IR rejection and ordinary nineteen-view Core/Octane fallback control (' +
              homeFallback +
              ')'
            : 'Actual nineteen-view Android Home native-first XPI1 mount') +
          (homeAdopt && !homeFallback ? '; real Octane prepare/commit wrapper adoption' : '') +
          (homeApplication
            ? homeEntry
              ? '; Core normal cold main-entry control'
              : '; Core Application/window explicit-content control'
            : '') +
          (homeParity ? '; fixed-environment independent style/layout parity control' : '') +
          (homeInput ? '; Android OS tap control' : '') +
          (homeLifetime ? '; retired Java object weak-reference control' : '') +
          (homeRestore ? '; retained Home owner/state Activity restoration control' : '') +
          '; no process-death restoration, full environment/CSS coverage, compositor/pixel presentation, deallocation or performance qualification'
        : applicationHandoff
          ? 'Native-first two-label Core Application/NativeWindow handoff, targeted cold lifecycle catch-up, one window/runtime across Activity recreation, retained root attachment and ordinary wrapper mutations; no Octane/Home, full Activity callbacks, arbitrary plugins, process-death/state restoration, CSS/viewport parity, presentation, deallocation or performance qualification'
          : masonParent
            ? 'Real Mason/Label wrapper parent adoption control, child identity/order, normal reorder/insert/remove and Activity rebinding; no Octane, Home IR, Core Application handoff, general CSS parity, viewport, presentation, deallocation or performance qualification'
            : labelWrappers
              ? 'Native bootstrap with two real Core Label wrappers, per-Activity release/rebind and text remeasurement; no logical Mason parent, Octane hydration, Core Application handoff, Home IR, viewport/CSS parity, presentation or performance qualification'
              : 'Native Application/Activity bootstrap mechanism and binary two-label fixture; no Octane/wrapper hydration, Home IR, full viewport, CSS parity, compositor presentation or release performance qualification',
    },
    null,
    2,
  ),
)
// Retain the APK, frozen inputs, generated sources and logs. This fresh run's
// compiler intermediates are reproducible and otherwise accumulate per build.
rmSync(join(work, 'app/build/intermediates'), { recursive: true, force: true })
console.log('Android bootstrap build: ' + work)
