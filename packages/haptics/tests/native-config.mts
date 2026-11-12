import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { isAbsolute, join } from 'node:path'
import { silenceAudioSimulator } from '../scripts/prepare-ios.mjs'

const require = createRequire(import.meta.url)
const { ProjectConfigService } = require('nativescript/lib/services/project-config-service')
const { IOSProjectService } = require('nativescript/lib/services/ios-project-service')

// Exercise NativeScript's actual config loader and plugin dependency collection.
// CocoaPods and Xcode are outside this packed-package contract test.
export async function verifyNativeConfig(pluginRoot, { offline = false } = {}) {
  const fs = {
    exists: existsSync,
    isRelativePath: (path) => !isAbsolute(path),
    readText: (path) => readFileSync(path, 'utf8'),
  }
  const configService = new ProjectConfigService(fs, { trace() {} }, {}, {})
  const config = configService.readConfig(pluginRoot)
  const cache = join(pluginRoot, '.xplat/pulsar-ios')

  assert.equal(existsSync(cache), false, 'loading config must not fetch or create a cache')
  assert.equal(config.android, undefined, 'Android needs no Swift preparation')

  if (offline) {
    const upstream = readFileSync(
      new URL('./fixtures/AudioSimulator-1.4.0.swift', import.meta.url),
      'utf8',
    )
    const patched = silenceAudioSimulator(upstream)

    mkdirSync(join(cache, 'Sources/Pulsar/Audio'), { recursive: true })
    writeFileSync(join(cache, 'Sources/Pulsar/Audio/AudioSimulator.swift'), patched)
    writeFileSync(
      join(cache, '.xplat-silent-pulsar.json'),
      JSON.stringify({
        revision: 'f65113a6f1fed7c9737ce85f5ae7ddc5caa5723d',
        patch: 1,
        audioHash: createHash('sha256').update(patched).digest('hex'),
      }),
    )
  }

  let packages
  const platformData = { platformNameLowerCase: 'ios', projectRoot: join(pluginRoot, 'unused-project') }
  const projectData = { projectDir: join(pluginRoot, 'unused-app') }
  const plugin = { name: '@octane-xplat/haptics', fullPath: pluginRoot }

  await IOSProjectService.prototype.handleNativeDependenciesChange.call(
    {
      $fs: fs,
      $projectConfigService: configService,
      $cocoapodsService: {
        async applyPodfileFromAppResources() {},
        async applyPodfileArchExclusions() {},
        async applyPodfileFromExtensions() {},
        getProjectPodfilePath: () => join(pluginRoot, 'unused-Podfile'),
      },
      $spmService: {
        async applySPMPackages(_platform, _project, discovered) {
          packages = discovered
        },
      },
      clearFrameworksCache() {},
      getPlatformData: () => platformData,
      getAllProductionPlugins: () => [plugin],
      setProductBundleIdentifier() {},
      async applyPluginsCocoaPods() {},
    },
    projectData,
    {},
  )

  assert.deepEqual(packages, [{ name: 'Pulsar', libs: ['Pulsar'], path: cache }])
  assert.deepEqual(config.ios.SPMPackages, packages, 'repeat reads reuse validated source')

  let nativeSource

  await IOSProjectService.prototype.preparePluginNativeCode.call(
    {
      async prepareNativeSourceCode(name, source) {
        nativeSource = { name, source }
      },
      async prepareResources() {},
      async prepareFrameworks() {},
      async prepareStaticLibs() {},
    },
    { ...plugin, pluginPlatformsFolderPath: () => join(pluginRoot, 'platforms/ios') },
    projectData,
  )

  assert.equal(nativeSource.name, plugin.name)
  assert.ok(
    existsSync(join(nativeSource.source, 'XplatPulsarBridge.swift')),
    'NativeScript must discover the packed bridge without app NativeSource config',
  )

  if (offline) {
    writeFileSync(join(cache, 'Sources/Pulsar/Audio/AudioSimulator.swift'), 'local work')
    assert.throws(() => config.ios.SPMPackages, /Command failed/)
    assert.equal(
      readFileSync(join(cache, 'Sources/Pulsar/Audio/AudioSimulator.swift'), 'utf8'),
      'local work',
    )
  }

  return cache
}
