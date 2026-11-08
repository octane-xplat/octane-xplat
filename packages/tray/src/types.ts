/** Why a system tray cannot be created in the current host. */
export type TrayUnavailableReason =
  /** The host has no tray surface: browsers, iOS, Android and desktop WebView frontends. */
  | 'unsupported-platform'
  /** The host could expose a tray but this runtime cannot drive it (Windows preview FFI). */
  | 'unsupported-runtime'
  /** Linux: the process cannot connect to the D-Bus session bus. */
  | 'no-session-bus'
  /** Linux: no `org.kde.StatusNotifierWatcher` owner, or no registered status-notifier host. */
  | 'no-status-notifier-host'

/** Result of {@link getTrayAvailability}: whether this host can create a tray icon. */
export type TrayAvailability =
  | { available: true; platform: 'macos' | 'linux' | 'windows' }
  | { available: false; reason: TrayUnavailableReason; message: string }

/** An icon source for a tray item. */
export type TrayIcon =
  | {
      /** Image loaded from an absolute file path (PNG recommended). */
      type: 'file'
      /** Absolute path to the image file. */
      path: string
      /** Render as a macOS template image (monochrome, adapts to menu bar style). macOS only; ignored elsewhere. */
      isTemplate?: boolean
    }
  | {
      /** A system-resolved icon: an SF Symbol name on macOS, a freedesktop icon-theme name on Linux. */
      type: 'named'
      /** Icon name looked up in the platform namespace. */
      name: string
    }

/** Per-platform icon overrides for {@link TrayOptions.icon} and {@link TrayUpdate.icon}. */
export interface TrayPlatformIcons {
  /** Icon used on macOS. */
  macos?: TrayIcon
  /** Icon used on Linux. */
  linux?: TrayIcon
  /** Icon used on Windows. */
  windows?: TrayIcon
}

/** A clickable menu row that runs `onSelect` when chosen. */
export interface TrayActionItem {
  /** Action-row discriminant. */
  type: 'action'
  /** Stable key, unique among its sibling rows. */
  key: string
  /** Text shown for the row. */
  label: string
  /** Dims the row and blocks selection. */
  isDisabled?: boolean
  /** Fires when the row is chosen. */
  onSelect?: () => void
}

/** A toggleable menu row — caller-owned `value`, `onValueChange` requests the next state. */
export interface TrayCheckboxItem {
  /** Checkbox-row discriminant. */
  type: 'checkbox'
  /** Stable key, unique among its sibling rows. */
  key: string
  /** Text shown for the row. */
  label: string
  /** Controlled checked state; render the checkmark from this field. */
  value: boolean
  /** Dims the row and blocks selection. */
  isDisabled?: boolean
  /** Fires with the toggled value; the row redraws only after {@link Tray.update}. */
  onValueChange?: (value: boolean) => void
}

/** One choice inside a {@link TrayRadioGroupItem} — `value` falls back to `key`. */
export interface TrayRadioOption {
  /** Stable key, unique among the group's options. */
  key: string
  /** Text shown for the option. */
  label: string
  /** Selection identity contributed when the option is chosen; defaults to `key`. */
  value?: string
  /** Dims the option and blocks selection. */
  isDisabled?: boolean
}

/** A single-choice group rendered as a labeled run of radio rows. */
export interface TrayRadioGroupItem {
  /** Radio-group discriminant. */
  type: 'radio-group'
  /** Stable key, unique among its sibling rows. */
  key: string
  /** Optional group heading rendered as a disabled label row. */
  label?: string
  /** Controlled selected value — the `value` (or `key`) of the chosen option. */
  value?: string
  /** Dims the whole group and blocks selection. */
  isDisabled?: boolean
  /** Fires with the newly selected value; not fired for the already-selected option. */
  onValueChange?: (value: string) => void
  /** Options inside the group. */
  items: TrayRadioOption[]
}

/** A menu row that reveals nested rows in a submenu. */
export interface TraySubmenuItem {
  /** Submenu discriminant. */
  type: 'submenu'
  /** Stable key, unique among its sibling rows. */
  key: string
  /** Text shown for the row. */
  label: string
  /** Dims the row and blocks selection. */
  isDisabled?: boolean
  /** Nested menu rows. */
  items: readonly TrayMenuItem[]
}

/** A non-actionable group of nested rows under a section heading. */
export interface TraySectionItem {
  /** Section discriminant. */
  type: 'section'
  /** Stable key, unique among its sibling rows. */
  key: string
  /** Section heading text. */
  label: string
  /** Rows grouped under this section. */
  items: readonly TrayMenuItem[]
}

/** A semantic separator with no label or activation behavior. */
export interface TraySeparatorItem {
  /** Separator discriminant. */
  type: 'separator'
  /** Stable key, unique among its sibling rows. */
  key: string
}

/** One row in a tray menu. Field-compatible with the menu data rows accepted by
 * `@octane-xplat/ui` menu components, so one definition can drive both surfaces. */
export type TrayMenuItem =
  | TrayActionItem
  | TrayCheckboxItem
  | TrayRadioGroupItem
  | TraySubmenuItem
  | TraySectionItem
  | TraySeparatorItem

/** Options for {@link createTray}. */
export interface TrayOptions {
  /** Non-empty stable identifier: the macOS status item `autosaveName`, the Linux StatusNotifierItem `Id`. */
  id: string
  /** Item image — a single icon or per-platform overrides; a matching platform entry is required. */
  icon: TrayIcon | TrayPlatformIcons
  /** Hover text for the item. */
  tooltip?: string
  /** macOS: text beside the icon in the menu bar. Linux: the StatusNotifierItem `Title` and `XAyatanaLabel`. */
  title?: string
  /** Menu rows opened by secondary click (or any click when `onActivate` is not set). */
  menu?: readonly TrayMenuItem[]
  /** Primary-click handler. When set, secondary click (right click or Ctrl+click) opens the menu. */
  onActivate?: () => void
}

/** Partial changes for {@link Tray.update}: `undefined` leaves the field unchanged, `null` clears it. */
export interface TrayUpdate {
  /** Replacement icon or per-platform overrides. */
  icon?: TrayIcon | TrayPlatformIcons
  /** New tooltip; `null` clears. */
  tooltip?: string | null
  /** New title; `null` clears. */
  title?: string | null
  /** Replacement menu rows; `null` removes the menu. */
  menu?: readonly TrayMenuItem[] | null
  /** Replacement primary-click handler; `null` removes it. */
  onActivate?: (() => void) | null
}

/** A live tray item created by {@link createTray}. */
export interface Tray {
  /** The `id` passed to {@link createTray}. */
  readonly id: string
  /** Whether {@link Tray.destroy} has run. */
  readonly isDestroyed: boolean
  /** Apply partial changes. Throws `TrayError` with code `destroyed` after {@link Tray.destroy}. */
  update(changes: TrayUpdate): void
  /** Remove the item and release its native resources. Idempotent. */
  destroy(): void
}

/** Error codes thrown and rejected by the tray API. */
export type TrayErrorCode =
  | TrayUnavailableReason
  /** Options failed validation (empty id, malformed rows, missing application). */
  | 'invalid-options'
  /** The icon could not be resolved or decoded for the current platform. */
  | 'invalid-icon'
  /** A menu row failed validation (duplicate keys, wrong field types). */
  | 'invalid-menu'
  /** The tray item was used after {@link Tray.destroy}. */
  | 'destroyed'
  /** The platform rejected the item's registration (D-Bus name or watcher call failed). */
  | 'registration-failed'
  /** The app conflicts with residency — its delegate still ends the app when the last window closes. */
  | 'resident-conflict'

/** Release handle returned by {@link keepAppResident}. */
export interface AppResidency {
  /** End the residency hold and restore window flags. Idempotent. */
  release(): void
}
