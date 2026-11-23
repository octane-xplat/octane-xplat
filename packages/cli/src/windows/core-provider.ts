import { existsSync, realpathSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'

export type WindowsCoreProvider = typeof import('@nativescript/vite/framework')

/** Load the app's Windows-capable Vite provider for both bundle and HTTP Core. */
export async function loadWindowsCoreProvider(
  require: NodeJS.Require,
): Promise<WindowsCoreProvider> {
  const coreRoot = dirname(realpathSync(require.resolve('@nativescript/core/package.json')))
  if (!existsSync(join(coreRoot, 'application/index.windows.js'))) {
    throw new Error(
      `Windows requires a Windows-capable @nativescript/core. The installed Core at ${coreRoot} has no Windows application provider.`,
    )
  }
  const viteFramework = realpathSync(require.resolve('@nativescript/vite/framework'))
  return import(pathToFileURL(viteFramework).href)
}
