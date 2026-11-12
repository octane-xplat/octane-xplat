import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import { macos } from '../../cli/src/macos/vite.ts'
import { macOSExecutable } from '../../cli/src/macos/executables.ts'
import { buildMacOSNative, writeNativeBootstrap } from '../../cli/src/macos/native.ts'
import {
  macOSHostArch,
  hostBundle,
  validateHostBundle,
} from '../../cli/src/macos/jsc-host/runtime.ts'

const root = fileURLToPath(new URL('..', import.meta.url))
const appRoot = fileURLToPath(new URL('../../../apps/macos', import.meta.url))
const scratch = join(homedir(), 'agent-scratch/octane-xplat/appkit-display-link')

await mkdir(scratch, { recursive: true })

const directory = await mkdtemp(join(scratch, 'runtime-'))

try {
  const entry = join(directory, 'entry.ts')

  await writeFile(
    entry,
    `import { checkAnimationFrames } from ${JSON.stringify(join(root, 'test/fixtures/animation-frames.ts'))}
NSApplication.sharedApplication
checkAnimationFrames().then(() => console.log('APPKIT_DISPLAY_LINK_OK')).catch(error => console.error('APPKIT_DISPLAY_LINK_FAIL', error.message, error.stack)).finally(() => globalThis.__xplatStopHost())
`,
  )

  const config = await macos('development', {
    root: appRoot,
    entry,
    outDir: directory,
    packaged: true,
  })

  await build({
    ...config,
    configFile: false,
    logLevel: 'error',
    build: { ...config.build, emptyOutDir: false },
  })

  const bundle = join(directory, 'main.cjs')

  await validateHostBundle(bundle, appRoot)

  const artifact = await buildMacOSNative(root)
  const bootstrap = join(directory, 'bootstrap.js')

  await writeNativeBootstrap(artifact, bootstrap)

  const result = spawnSync(
    await macOSExecutable(appRoot, 'macos/host'),
    [
      join(hostBundle, 'NativeScript.framework/Versions/A/NativeScript'),
      bundle,
      artifact.metadata[macOSHostArch()],
      bootstrap,
    ],
    {
      cwd: directory,
      encoding: 'utf8',
      timeout: 30000,
      env: { ...process.env, OCTANE_MACOS_AUTOMATION: '1' },
    },
  )

  const output = result.stdout + result.stderr

  process.stdout.write(output)
  assert.equal(
    result.status,
    0,
    `signal=${result.signal} error=${result.error?.message}\n${output}`,
  )

  assert.doesNotMatch(output, /APPKIT_DISPLAY_LINK_FAIL|\[macos-animation-frame\] callback failed/)
  assert.match(output, /APPKIT_DISPLAY_LINK_OK/)
} finally {
  await rm(directory, { recursive: true, force: true })
}
