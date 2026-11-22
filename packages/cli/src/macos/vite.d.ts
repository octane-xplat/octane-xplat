import type { UserConfig } from 'vite'

import type { XplatMacOSOptions } from './vite-options.js'
export type { XplatMacOSOptions } from './vite-options.js'

/** Configure the experimental AppKit renderer using the app's installed toolchain. */
export function macos(
  env: { mode: string } | string,
  options?: XplatMacOSOptions,
): Promise<UserConfig>

/** @deprecated Use {@link macos}. */
export const xplatMacOS: typeof macos
