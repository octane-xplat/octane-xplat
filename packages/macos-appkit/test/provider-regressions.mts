import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { build } from 'vite'
import { coreMacOSUI } from '../../cli/src/macos/core-ui.ts'
import { createCoreMacOSConfig } from '../../cli/src/macos/core-vite.ts'
import { hostBundle, macOSHostArch, validateHostBundle } from '../../cli/src/macos/jsc-host/runtime.ts'
import { buildMacOSNative, writeNativeBootstrap } from '../../cli/src/macos/native.ts'

export async function verifyProviderRegressions(packageRoot: string, directory: string) {
  const output = join(directory, 'provider-regressions')
  await mkdir(output)
  const { config, coreRoot } = await createCoreMacOSConfig('production', {
    root: packageRoot,
    entry: join(packageRoot, 'test/fixtures/nativescript-provider.macos.tsx'),
    outDir: output,
  })
  // The app's workspace dependencies supply the shared UI and desktop services.
  const ui = coreMacOSUI(resolve(packageRoot, '../../apps/macos'))
  await build({
    ...config,
    configFile: false,
    plugins: [
      ...ui.plugins,
      ...(config.plugins ?? []),
      {
        name: 'verify-single-nativescript-core',
        generateBundle() {
          const ids = [...this.getModuleIds()]
          assert.ok(ids.some((id) => id.endsWith('/components/forms/text-area-fit.macos.ts')))
          assert.ok(
            !ids.some((id) => id.endsWith('/macos-appkit/src/runtime.ts')),
            'Core must be the only macOS renderer in the bundle',
          )
          const core = ids.filter((id) => id.includes('/@nativescript/core/'))
          assert.ok(core.length > 0)
          assert.ok(core.every((id) => id.startsWith(coreRoot + '/')), 'Core must load once')
        },
      },
    ],
  })

  const bundle = join(output, 'main.cjs')
  await validateHostBundle(bundle, packageRoot)
  const artifact = await buildMacOSNative(packageRoot)
  const bootstrap = join(output, 'bootstrap.js')
  await writeNativeBootstrap(artifact, bootstrap)

  const result = spawnSync(
    join(hostBundle, 'host'),
    [
      join(hostBundle, 'NativeScript.framework/Versions/A/NativeScript'),
      bundle,
      artifact.metadata[macOSHostArch()],
      bootstrap,
    ],
    {
      cwd: output,
      encoding: 'utf8',
      timeout: 30_000,
      env: {
        ...process.env,
        OCTANE_MACOS_AUTOMATION: '1',
        OCTANE_MACOS_EXTERNAL_RUNLOOP: '1',
      },
    },
  )
  const log = (result.stdout ?? '') + (result.stderr ?? '')
  await writeFile(join(output, 'runtime.log'), log)
  assert.ifError(result.error)
  assert.equal(result.status, 0, log)
  assert.doesNotMatch(log, /CORE_PROVIDER_FAIL/)
  assert.match(log, /CORE_PROVIDER_OK/)
  assert.equal(log.match(/CORE_PROVIDER_CLEANUP/g)?.length, 1)
  console.log('[packed renderer] workspace Core and desktop service regressions pass')
}
