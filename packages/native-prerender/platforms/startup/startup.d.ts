import type { ViewBase } from '@nativescript/core'
import type { NativeClaims, SelectedLaunchTree } from '@octane-xplat/native-prerender'

/**
 * The produced startup artifact plus the stylesheets the producer emitted.
 * `artifact` is the decoded `startup.json` contents; it is validated again at
 * the render entry so a caller cannot bypass schema checks.
 */
export type StartupScreen = {
  artifact: unknown
  /** Producer-emitted stylesheet text (strings or `{ css }` records). */
  sheets?: readonly (string | { css: string })[]
  /** Optional sink called once the startup decision settles. */
  onOutcome?(outcome: StartupOutcome): void
}

export type StartupAdopted = {
  adopted: true
  root: unknown
  /** The installable mount's cold native objects, in visual order. */
  natives: readonly unknown[]
  /** The live wrappers bound to those natives. */
  wrappers: readonly unknown[]
  /** The native mount/activity handle the platform bridge exposed. */
  mount: unknown
  /** The artifact tree selected by launch-input resolution. */
  tree: SelectedLaunchTree
  claims: NativeClaims<unknown>
}

export type StartupFallback = {
  adopted: false
  /** Why the startup path was rejected; ordinary rendering ran instead. */
  reason: string
  root: unknown
}

export type StartupOutcome = StartupAdopted | StartupFallback

export type StartupRender = {
  /** The root rendering the screen now. On a late fallback (commit failure
   *  after load) this is the abandoned adoption root; read `outcome`'s `root`
   *  for the root that actually survived. */
  root: unknown
  /** Resolves once the startup decision settles. */
  outcome: Promise<StartupOutcome>
}

/**
 * Drop-in replacement for `renderNativeScriptApp` in an opted-in app's real
 * entry. `host` is the entry `Page` (a `ContentView`).
 *
 * When the installable native mount (iOS `StartupBootstrap.swift` /
 * Android `StartupMountActivity`) mounted a cold tree from the packaged
 * `startup.bin` artifact and every check passes — artifact schema and
 * identity, launch constraints, launch-input selection, bind equality between
 * native and JavaScript resolution, prepared-tree match and claim commit —
 * the live tree claims the already-mounted natives and `outcome` resolves
 * `adopted: true`.
 *
 * ANY rejection falls back completely to `renderNativeScriptApp`; the cold
 * mount is detached and `outcome` resolves `adopted: false` with the reason.
 * Calling without `startup` (or without a mounted artifact) is ordinary
 * rendering with zero startup cost.
 */
export function renderWithStartup<P extends object>(
  host: ViewBase,
  component: (props: P) => unknown,
  props?: P,
  startup?: StartupScreen | null,
): StartupRender
