import type { UserConfig } from 'vite'

export interface XplatLinuxGtkOptions {
  /** App directory used to resolve its toolchain and renderer. Defaults to cwd. */
  root?: string
  /** Enable Octane's universal component HMR. Defaults to false. */
  hmr?: boolean
  /** Override the application entry; defaults to src/main.ts. */
  entry?: string
  outDir?: string
  /** Output file name (without extension); defaults to 'app'. */
  fileName?: string
  /** GI schema from the NativeScript Linux runtime payload supplied by packaging. */
  nativeGiSchema?: string
  /** Sources the Octane compiler must not transform. */
  exclude?: string[]
  /** Override renderer rules; defaults to all reachable TSX/TSRX source. */
  rules?: unknown[]
}

/** Configure the experimental GTK4 renderer using the app's installed toolchain. */
export function linuxGtk(
  env: { mode: string } | string,
  options?: XplatLinuxGtkOptions,
): Promise<UserConfig>

/** @deprecated Use {@link linuxGtk}. */
export const xplatLinuxGtk: typeof linuxGtk


/** Check whether the installed renderer includes the runtime for the current architecture. */
export function hasGtkDevelopmentRuntime(root: string): boolean

/** Stage a checked runtime next to the development shell bundle. */
export function stageGtkDevelopmentRuntime(
  root: string,
  outDir: string,
  bundle: string,
): { executable: string; schema: string }
