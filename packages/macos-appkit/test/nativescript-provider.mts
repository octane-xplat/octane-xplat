import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdtemp, mkdir, rm } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { build } from 'vite'
import { octane } from 'octane/compiler/vite'
import { nativeScriptRenderer } from '@octane-xplat/nativescript-octane/config'
import { createNativeScriptProvider } from '../src/nativescript-provider.macos.ts'
import { buildMacOSNative, writeNativeBootstrap } from '../../cli/src/macos/native.ts'
import { hostBundle, macOSHostArch, validateHostBundle } from '../../cli/src/macos/jsc-host/runtime.ts'

const root = fileURLToPath(new URL('../', import.meta.url))
const scratch = join(homedir(), 'agent-scratch/octane-xplat/macos-core-provider')
const exec = promisify(execFile)

if (process.platform !== 'darwin') {
  throw new Error('The Core provider runtime check requires macOS')
}

await mkdir(scratch, { recursive: true })
const output = await mkdtemp(join(scratch, 'run-'))

try {
  const { config, coreRoot } = createNativeScriptProvider(root)
  await build({
    ...config,
    configFile: false,
    root,
    define: {
      ...config.define,
      __DEV__: 'false',
      'process.env.NODE_ENV': '"production"',
    },
    resolve: {
      conditions: ['macos', 'native'],
      dedupe: ['octane'],
      alias: [
        ...config.resolve.alias,
        { find: /^octane$/, replacement: 'octane/universal/native' },
      ],
    },
    plugins: [
      ...config.plugins,
      octane({
        renderers: {
          registry: { nativescript: { ...nativeScriptRenderer, intrinsics: '@octane-xplat/jsx' } },
          rules: [{ include: '**/*.tsx', renderer: 'nativescript' }],
        },
      }),
      {
        name: 'verify-single-nativescript-core',
        generateBundle() {
          const core = [...this.getModuleIds()].filter((id) => id.includes('/@nativescript/core/'))
          assert.ok(core.length > 0)
          assert.ok(core.every((id) => id.startsWith(coreRoot + '/')), 'Core must load once')
        },
      },
    ],
    build: {
      minify: false,
      outDir: output,
      lib: {
        entry: join(root, 'test/fixtures/nativescript-provider.macos.tsx'),
        formats: ['cjs'],
        fileName: () => 'main.cjs',
      },
      rollupOptions: {
        external: ['@nativescript/macos-node-api', /^node:/],
        output: { ...config.build.rollupOptions.output, codeSplitting: false },
      },
    },
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
    { cwd: output, timeout: 30000, env: { ...process.env, OCTANE_MACOS_EXTERNAL_RUNLOOP: '1' } },
  )
  const log = stdout + stderr
  assert.doesNotMatch(log, /CORE_PROVIDER_FAIL/)
  assert.match(log, /CORE_PROVIDER_OK/)
  console.log('NativeScript Core mounted and laid out an Octane root on AppKit.')
} finally {
  await rm(output, { recursive: true, force: true })
}
