import type { NormalizedAppMenu } from './model.js'

export type AppMenuPlatform = 'macos' | 'linux' | 'windows' | null

/** Native → controller callback. `generation` is the generation of the tree
 *  the native item was built from; the controller ignores stale generations,
 *  disposed handles and unknown ids. Returns whether the item is still
 *  current — hosts use it to decide whether a role item may act. */
export type AppMenuDispatch = (id: number, generation: number) => boolean

/** One applied native menu. `update` swaps in a rebuilt tree; `dispose`
 *  tears down and restores whatever the platform had before install. */
export interface NativeAppMenu {
  update(tree: NormalizedAppMenu): void
  dispose(): void
}

/** Platform adapter owned by each index leaf. `install` is only reached when
 *  `supported()` is true. `defer` schedules the coalesced native
 *  update/dispose that follows a callback-triggered tree change. */
export interface AppMenuHost {
  readonly platform: AppMenuPlatform
  supported(): boolean
  defer(fn: () => void): void
  install(tree: NormalizedAppMenu, dispatch: AppMenuDispatch): NativeAppMenu
}
