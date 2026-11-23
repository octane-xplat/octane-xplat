import type { UserConfig } from 'vite'
import { createCoreMacOSConfig } from './core-vite.ts'
import type { XplatMacOSOptions } from './vite-options.ts'

/** Compile the macOS app for the NativeScript Core provider on AppKit. */
export async function macos(
  env: string | { mode: string },
  options: XplatMacOSOptions = {},
): Promise<UserConfig> {
  const rules = options.rules?.map((rule) =>
    rule && typeof rule === 'object' && 'renderer' in rule && rule.renderer === 'macos'
      ? { ...rule, renderer: 'nativescript' }
      : rule,
  )
  const { config } = await createCoreMacOSConfig(typeof env === 'string' ? env : env.mode, {
    ...options,
    rules,
  })
  const library = config.build?.lib
  if (options.packaged === false && library) {
    library.formats = ['es']
    library.fileName = 'app'
  }
  return config
}

/** @deprecated Use {@link macos}. */
export const xplatMacOS = macos
