/**
 * Native desktop application menu bar API — the top-level menu owned by the
 * application (NSApp.mainMenu on macOS, the GApplication menubar on GTK4,
 * native buttons and MenuFlyouts above Windows window content).
 * Distinct from in-window DropdownMenu/ContextMenu surfaces and from
 * tray/status-bar icons.
 *
 * @example
 * ```ts
 * import { appMenu } from '@octane-xplat/app-menu'
 *
 * const handle = appMenu.install([
 *   { type: 'submenu', key: 'file', label: 'File', items: [
 *     { type: 'action', key: 'new', label: 'New', accelerator: 'Mod+N', onSelect: newDocument },
 *     { type: 'separator', key: 'after-new' },
 *     { type: 'role', key: 'quit', role: 'quit' },
 *   ]},
 * ])
 * // Later: handle.update(nextMenus) or handle.dispose()
 * ```
 */

/** Standard item behavior the platform menu engine already owns — no
 *  callback, no custom accelerator. `quit` only appears inside the automatic
 *  macOS application menu; GTK supplies its application action. Windows
 *  explicitly rejects every role; use action callbacks on that host. */
export type AppMenuRole =
  | 'undo'
  | 'redo'
  | 'cut'
  | 'copy'
  | 'paste'
  | 'selectAll'
  | 'minimize'
  | 'close'
  | 'quit'

/** A plain menu item that runs `onSelect` when activated.
 * @example
 * ```ts
 * const open: AppMenuAction = {
 *   type: 'action', key: 'open', label: 'Open…',
 *   accelerator: 'Mod+O', onSelect: () => openFile(),
 * }
 * ``` */
export interface AppMenuAction {
  type: 'action'
  /** Stable identity among sibling entries; unique per parent menu. */
  key: string
  label: string
  /** `'Mod+Shift+Z'`-style accelerator — see the package accelerator grammar. */
  accelerator?: string
  isDisabled?: boolean
  onSelect(): void
}

/** A checkable menu item. Controlled: activation reports the *next* value via
 *  `onValueChange(!value)`; the native check mark only moves when the app
 *  installs a new `value` through `update()`.
 * @example
 * ```ts
 * const sidebar: AppMenuCheckbox = {
 *   type: 'checkbox', key: 'sidebar', label: 'Sidebar',
 *   value: showSidebar, accelerator: 'Mod+Shift+S',
 *   onValueChange: (next) => setSidebar(next),
 * }
 * ``` */
export interface AppMenuCheckbox {
  type: 'checkbox'
  key: string
  label: string
  value: boolean
  accelerator?: string
  isDisabled?: boolean
  onValueChange(value: boolean): void
}

/** A separator row. Leading, trailing and repeated separators collapse on
 *  every platform (GTK sections require it). */
export interface AppMenuSeparator {
  type: 'separator'
  key: string
}

/** A nested menu. Menu-bar entries are always submenus; nested submenus are
 *  allowed inside them. Submenus cannot be disabled — GMenu has no such
 *  concept. */
export interface AppMenuSubmenu {
  type: 'submenu'
  key: string
  label: string
  items: readonly AppMenuEntry[]
}

/** A standard item the platform owns: fixed default label (overridable via
 *  `label`), fixed accelerator, native behavior. See the package role matrix
 *  for per-platform behavior.
 * @example
 * ```ts
 * const copy: AppMenuRoleItem = { type: 'role', key: 'copy', role: 'copy' }
 * ``` */
export interface AppMenuRoleItem {
  type: 'role'
  key: string
  role: AppMenuRole
  /** Overrides the default English label. */
  label?: string
}

/** One menu entry — action, checkbox, separator, submenu or platform role. */
export type AppMenuEntry =
  | AppMenuAction
  | AppMenuCheckbox
  | AppMenuSeparator
  | AppMenuSubmenu
  | AppMenuRoleItem

/** Per-platform install options. Namespaced: other platforms ignore
 *  `options.macos` rather than erroring. */
export interface AppMenuOptions {
  macos?: {
    /** Extra entries inserted into the automatic application menu, between
     *  the About item and the Hide/Show All group. */
    applicationItems?: readonly AppMenuEntry[]
  }
}

/** Handle for the installed menu. `update` replaces the whole tree
 *  (validated synchronously before any native write); `dispose` restores the
 *  previous menu bar and is idempotent. */
export interface AppMenu {
  update(menus: readonly AppMenuSubmenu[], options?: AppMenuOptions): void
  dispose(): void
  readonly isDisposed: boolean
}

/** The flat capability service. `supported` is a cheap sync check evaluated
 *  on each read; `isAvailable()` is the authoritative async probe. `install`
 *  throws `UnavailabilityError('appMenu')` on absent platforms and
 *  `Error('An app menu is already installed; update or dispose it first')`
 *  while another handle is live — one owner per process.
 * @example
 * ```ts
 * import { appMenu } from '@octane-xplat/app-menu'
 * if (appMenu.supported) {
 *   const handle = appMenu.install(menus)
 * }
 * ``` */
export interface AppMenuService {
  readonly supported: boolean
  isAvailable(): Promise<boolean>
  install(menus: readonly AppMenuSubmenu[], options?: AppMenuOptions): AppMenu
}
