import type { Label, ViewBase } from '@nativescript/core'
import type { View } from '@octane-xplat/nativescript-mason-core/view'
import type { NativeClaims } from '@octane-xplat/native-prerender'

export type IOSMasonBinding = {
  host: View
  wrappers: (View | Label)[]
  claims: NativeClaims<View | Label>
  commit(apply: () => undefined): void
  retire(): void
}

/** Internal platform source; native arguments have already passed backend preflight. */
export function bindIOSMasonTree(
  nodes: unknown,
  viewport: object,
  nativeViews: readonly object[],
  options?: { beforeAttach?(count: number): void },
): IOSMasonBinding

export function releaseIOSMasonOwners(host: View, wrappers: readonly ViewBase[]): void
export function releaseIOSMasonTree(host: View, wrappers: readonly ViewBase[]): void
