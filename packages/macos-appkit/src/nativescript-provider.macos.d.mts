import type { UserConfig } from 'vite'

export interface NativeScriptProvider {
  readonly config: UserConfig
  readonly coreRoot: string
}

/** @internal Resolve the consuming app's patched NativeScript toolchain. */
export function createNativeScriptProvider(project: string): Promise<NativeScriptProvider>
