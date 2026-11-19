import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { nativeLoader } from '../../../packages/cli/src/macos/native.ts'
import { hostRoot } from '../../../packages/cli/src/macos/jsc-host/runtime.ts'

const artifact = {
  prebuilt: [
    {
      file: 'libxplatmason.dylib',
      source: resolve(
        dirname(fileURLToPath(import.meta.url)),
        '../../../packages/macos-appkit/platforms/macos/prebuilt/libxplatmason.dylib',
      ),
    },
  ],
  libraries: [],
}

export async function writeHostBootstrap(directory: string) {
  const bootstrap = join(directory, 'bootstrap.js')
  await writeFile(
    bootstrap,
    nativeLoader(artifact) + (await readFile(join(hostRoot, 'shim.js'), 'utf8')),
  )
  return bootstrap
}
