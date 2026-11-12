import { resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFile, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import assert from 'node:assert/strict'
import { buildMacOSNative, writeNativeBootstrap } from '../../../packages/cli/src/macos/native.ts'
import { macOSExecutable } from '../../../packages/cli/src/macos/executables.ts'
import { createMacOSDevBundle } from '../../../packages/cli/src/macos/dev-bundle.ts'
import {
  hostBundle,
  macOSHostArch,
  validateHostBundle,
} from '../../../packages/cli/src/macos/jsc-host/runtime.ts'

const [phase, directory] = process.argv.slice(2)

if (!['build', 'input'].includes(phase) || !directory) {
  throw new Error('Usage: macos-host.mts build|input /absolute/packed/consumer')
}

const app = resolve(directory)

if (phase === 'build') {
  const client = spawnSync(
    'clang',
    [
      '-framework',
      'Foundation',
      '-framework',
      'ApplicationServices',
      fileURLToPath(new URL('./ax-client.m', import.meta.url)),
      '-o',
      join(app, 'ax-client'),
    ],
    { encoding: 'utf8' },
  )

  assert.equal(client.status, 0, client.stdout + client.stderr)

  const artifact = await buildMacOSNative(app)

  await writeNativeBootstrap(artifact, join(app, 'bootstrap.js'))
  await writeFile(join(app, 'native.json'), JSON.stringify(artifact))
  await validateHostBundle(join(app, 'dist/main.cjs'), app)
  await macOSExecutable(app, 'macos/host')

  // Match the normal CLI dev host: AppKit requires a main bundle identity,
  // and the NativeScript runtime must yield run-loop ownership to this host.
  const signing = process.env.XPLAT_MACOS_DEV_SIGNING_IDENTITY

  process.env.XPLAT_MACOS_DEV_SIGNING_IDENTITY = '-'
  try {
    const manifest = JSON.parse(await readFile(join(app, 'package.json'), 'utf8'))

    manifest.xplat = {
      targets: {
        macos: {
          dev: { viteConfig: 'vite.config.mts', bundleFile: 'dist/main.cjs' },
          package: {
            productName: 'Octane Packed Gestures',
            bundleIdentifier: 'org.octanexplat.qualification.gestures',
            viteConfig: 'vite.config.mts',
            bundleFile: 'dist/main.cjs',
          },
        },
      },
    }

    await writeFile(join(app, 'package.json'), JSON.stringify(manifest, null, 2))
    await writeFile(
      join(app, 'vite.config.mts'),
      "import { macos } from '@octane-xplat/cli/macos/vite'\nexport default macos('production', { root: import.meta.dirname, entry: 'components.macos.ts', outDir: 'dist', packaged: true })\n",
    )

    const devHost = await createMacOSDevBundle(app, manifest)

    await writeFile(join(app, 'dev-host.json'), JSON.stringify({ executable: devHost.executable }))
  } finally {
    if (signing === undefined) {
      delete process.env.XPLAT_MACOS_DEV_SIGNING_IDENTITY
    } else {
      process.env.XPLAT_MACOS_DEV_SIGNING_IDENTITY = signing
    }
  }

  console.log('PACKED_MACOS_HOST_BUILT')
} else {
  const artifact = JSON.parse(await readFile(join(app, 'native.json'), 'utf8'))
  const devHost = JSON.parse(await readFile(join(app, 'dev-host.json'), 'utf8'))
  const result = spawnSync(
    devHost.executable,
    [
      join(hostBundle, 'NativeScript.framework/Versions/A/NativeScript'),
      join(app, 'dist/main.cjs'),
      artifact.metadata[macOSHostArch()],
      join(app, 'bootstrap.js'),
    ],
    {
      cwd: app,
      encoding: 'utf8',
      timeout: 35000,
      env: {
        ...process.env,
        OCTANE_MACOS_AUTOMATION: '1',
        OCTANE_MACOS_EXTERNAL_RUNLOOP: '1',
        XPLAT_DESKTOP_AX_CLIENT: join(app, 'ax-client'),
      },
    },
  )

  const output = (result.stdout ?? '') + (result.stderr ?? '')

  console.log(output)
  assert.equal(result.status, 0, result.error?.message ?? `signal=${result.signal}`)

  const records = output
    .split('\n')
    .filter((line) => line.startsWith('DESKTOP '))
    .map((line) => JSON.parse(line.slice(8)))

  assert.deepEqual(
    records.filter((record) => record.kind === 'failure'),
    [],
  )

  assert.equal(
    records.filter((record) => record.kind === 'complete').length,
    1,
    'native assertions reached completion',
  )

  assert.deepEqual(records.find((record) => record.kind === 'retired')?.detail, {
    motion: null,
    button: null,
    scroll: null,
    field: null,
  })

  console.log('PACKED_MACOS_COMPONENTS_OK')
}
