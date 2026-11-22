import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdtemp, mkdir, rm } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { build } from 'vite'
import { nativeScriptDevImports } from '../src/nativescript-dev-imports.ts'
import { buildMacOSNative, writeNativeBootstrap } from '../../cli/src/macos/native.ts'
import { hostBundle, macOSHostArch, validateHostBundle } from '../../cli/src/macos/jsc-host/runtime.ts'
import { createCoreMacOSConfig } from '../../cli/src/macos/core-vite.ts'

const root = fileURLToPath(new URL('../', import.meta.url))
const scratch = join(homedir(), 'agent-scratch/octane-xplat/macos-core-provider')
const exec = promisify(execFile)

if (process.platform !== 'darwin') {
  throw new Error('The Core provider runtime check requires macOS')
}

await mkdir(scratch, { recursive: true })
const output = await mkdtemp(join(scratch, 'run-'))

try {
  const devEntry = join(root, 'test/fixtures/nativescript-dev-app.macos.tsx')
  for (const revision of ['before', 'after']) {
    const { config } = await createCoreMacOSConfig('production', {
      root,
      entry: devEntry,
      outDir: output,
      hmr: true,
      fileName: revision + '.cjs',
      external: nativeScriptDevImports,
    })
    await build({
      ...config,
      configFile: false,
      define: { ...config.define, __PROVIDER_DEV_REVISION__: JSON.stringify(revision) },
      build: { ...config.build, emptyOutDir: false },
    })
  }

  const { config: shell, coreRoot } = await createCoreMacOSConfig('production', {
    root,
    entry: join(root, 'test/fixtures/nativescript-provider.macos.tsx'),
    outDir: output,
  })
  await build({
    ...shell,
    configFile: false,
    plugins: [
      ...(shell.plugins ?? []),
      {
        name: 'verify-single-nativescript-core',
        generateBundle() {
          const ids = [...this.getModuleIds()]
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
    build: { ...shell.build, emptyOutDir: false },
  })

  const bundle = join(output, 'main.cjs')
  await validateHostBundle(bundle, root)
  const artifact = await buildMacOSNative(root)
  const bootstrap = join(output, 'bootstrap.js')
  await writeNativeBootstrap(artifact, bootstrap)
  const { stdout, stderr } = await exec(
    join(hostBundle, 'host'),
    [
      join(hostBundle, 'NativeScript.framework/Versions/A/NativeScript'),
      bundle,
      artifact.metadata[macOSHostArch()],
      bootstrap,
    ],
    {
      cwd: output,
      timeout: 30000,
      env: {
        ...process.env,
        OCTANE_MACOS_EXTERNAL_RUNLOOP: '1',
        OCTANE_MACOS_DEV_BUNDLE: join(output, 'before.cjs'),
        XPLAT_CORE_DEV_AFTER: join(output, 'after.cjs'),
      },
    },
  )
  const log = stdout + stderr
  assert.doesNotMatch(log, /CORE_PROVIDER_FAIL/)
  assert.match(log, /CORE_PROVIDER_OK/)
  assert.equal(log.match(/CORE_PROVIDER_CLEANUP/g)?.length, 1)
  console.log('NativeScript Core mounted and laid out an Octane root on AppKit.')
} finally {
  await rm(output, { recursive: true, force: true })
}
