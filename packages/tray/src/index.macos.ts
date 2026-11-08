import {
  NativeClass,
  NSApp,
  NSCellImagePosition,
  NSEventMask,
  NSEventModifierFlags,
  NSEventType,
  NSImage,
  NSMenu,
  NSMenuItem,
  NSObject,
  NSProcessInfo,
  NSStatusBar,
  interop,
  type NSArray,
  type NSStatusBarButton,
  type NSStatusItem,
  type NSWindow,
} from '@octane-xplat/platform/macos'

import { TrayError } from './errors.js'
import {
  dispatchTraySelect,
  normalizeTrayOptions,
  normalizeTrayUpdate,
  resolvePlatformIcon,
  safeCall,
  type NormalizedTrayOptions,
} from './menu.js'

import type {
  AppResidency,
  Tray,
  TrayAvailability,
  TrayIcon,
  TrayMenuItem,
  TrayOptions,
  TrayUpdate,
} from './types.js'

export type * from './types.js'
export { TrayError } from './errors.js'

const NS_VARIABLE_STATUS_ITEM_LENGTH = -1
const STATUS_ITEM_IMAGE_HEIGHT = 18
const NS_CONTROL_STATE_ON = 1
const NS_CONTROL_STATE_OFF = 0

// The generated types mark statusItem.menu, toolTip and control.action as
// non-nullable even though AppKit accepts nil; one explicit assertion per
// cleared channel documents the runtime conversion TypeScript cannot express.
const NO_MENU = null as unknown as NSMenu
const NO_TEXT = null as unknown as string
const NO_SELECTOR = null as unknown as string

// sectionHeaderWithTitle is macOS 14+ and absent from the generated metadata;
// detect it once so older systems fall back to a disabled title row.
const NSMenuItemStatics = NSMenuItem as typeof NSMenuItem & {
  sectionHeaderWithTitle?: (title: string) => NSMenuItem
}

function statusBarAvailable(): boolean {
  try {
    return (
      NSStatusBar.systemStatusBar !== null &&
      typeof NSStatusBar.systemStatusBar.statusItemWithLength === 'function'
    )
  } catch {
    return false
  }
}

/** The JSC host's native property enumeration sees enumerable keys only; expose
 * the prototype methods before NativeClass registers the exposed selectors. */
function registerTrayClass(ctor: Function): void {
  for (const name of Object.getOwnPropertyNames(ctor.prototype)) {
    if (name === 'constructor') {
      continue
    }

    const descriptor = Object.getOwnPropertyDescriptor(ctor.prototype, name)!

    Object.defineProperty(ctor.prototype, name, { ...descriptor, enumerable: true })
  }

  NativeClass(ctor)
}

interface TrayTargetCallbacks {
  buttonClicked(): void
  menuItemSelected(item: NSMenuItem): void
}

// This toolchain's TypeScript cannot parse computed-name methods
// (['sel:'](arg: T)), so the selector members are assigned to the prototype
// inside the static block — before NativeClass runs — and typed through an
// interface merge.
class TrayTarget extends NSObject {
  static ObjCExposedMethods = {
    'trayButtonClicked:': { params: [NSObject], returns: interop.types.void },
    'trayMenuItemSelected:': { params: [NSObject], returns: interop.types.void },
  }
  callbacks: TrayTargetCallbacks | null = null
  static {
    const proto = TrayTarget.prototype

    proto['trayButtonClicked:'] = function (this: TrayTarget, _sender: NSObject) {
      try {
        this.callbacks?.buttonClicked()
      } catch (error) {
        console.error('[tray] button handler failed', error)
      }
    }

    proto['trayMenuItemSelected:'] = function (this: TrayTarget, sender: NSMenuItem) {
      try {
        this.callbacks?.menuItemSelected(sender)
      } catch (error) {
        console.error('[tray] menu handler failed', error)
      }
    }

    registerTrayClass(this)
  }
}

interface TrayTarget {
  'trayButtonClicked:'(sender: NSObject): void
  'trayMenuItemSelected:'(sender: NSMenuItem): void
}

function trayImage(icon: TrayIcon, label: string): NSImage {
  if (icon.type === 'file') {
    const image: NSImage | null = NSImage.alloc().initWithContentsOfFile(icon.path)

    if (!image) {
      throw new TrayError('invalid-icon', `tray icon file is not readable: ${icon.path}`)
    }

    image.template = icon.isTemplate ?? false

    const size = image.size

    if (size.height > 0) {
      image.size = {
        width: size.width * (STATUS_ITEM_IMAGE_HEIGHT / size.height),
        height: STATUS_ITEM_IMAGE_HEIGHT,
      }
    }

    return image
  }

  const image: NSImage | null = NSImage.imageWithSystemSymbolNameAccessibilityDescription(
    icon.name,
    label,
  )

  if (!image) {
    throw new TrayError('invalid-icon', `SF Symbol image not found: ${icon.name}`)
  }

  return image
}

function appWindows(): NSWindow[] {
  const windows: NSWindow[] = []
  const all: NSArray | null = NSApp.windows ?? null

  if (!all) {
    return windows
  }

  for (let i = 0; i < all.count; i++) {
    const window = all.objectAtIndex(i) as NSWindow

    try {
      // Status-bar windows and panels cannot become main; only real app windows qualify.
      if (window && window.canBecomeMainWindow) {
        windows.push(window)
      }
    } catch {
      // Skip windows that no longer answer.
    }
  }

  return windows
}

let hiddenWindows: NSWindow[] = []

/** Report whether this host can create a tray item. */
export function getTrayAvailability(): Promise<TrayAvailability> {
  if (statusBarAvailable()) {
    return Promise.resolve({ available: true, platform: 'macos' })
  }

  return Promise.resolve({
    available: false,
    reason: 'unsupported-runtime',
    message: 'NSStatusBar is unavailable in this host; the tray needs a macOS AppKit runtime.',
  })
}

class MacOSTray implements Tray {
  readonly id: string
  private item: NSStatusItem
  private button: NSStatusBarButton
  private target: TrayTarget
  private state: NormalizedTrayOptions
  private nsMenu: NSMenu | null = null
  private handlers = new Map<number, () => void>()
  private nextTag = 1
  private openingMenu = false
  private destroyed = false

  constructor(options: TrayOptions) {
    this.state = normalizeTrayOptions(options, 'macos')
    this.id = this.state.id
    if (!statusBarAvailable()) {
      throw new TrayError(
        'unsupported-runtime',
        'NSStatusBar is unavailable in this host; the tray needs a macOS AppKit runtime.',
      )
    }

    const item = NSStatusBar.systemStatusBar.statusItemWithLength(NS_VARIABLE_STATUS_ITEM_LENGTH)

    this.item = item
    item.autosaveName = this.state.id
    this.button = item.button
    this.target = TrayTarget.new()
    this.target.callbacks = {
      buttonClicked: () => this.onButtonClicked(),
      menuItemSelected: (menuItem) => this.onMenuItemSelected(menuItem),
    }

    this.applyIcon()
    this.applyTitle()
    this.applyTooltip()
    this.applyAccessibilityLabel()
    this.rebuildMenu()
    this.applyActivationMode()
  }

  get isDestroyed(): boolean {
    return this.destroyed
  }

  update(changes: TrayUpdate): void {
    if (this.destroyed) {
      throw new TrayError('destroyed', `tray "${this.id}" was destroyed`)
    }

    const normalized = normalizeTrayUpdate(changes, 'macos')

    if (normalized.icon !== undefined) {
      this.state.icon = resolvePlatformIcon(normalized.icon, 'macos')
      this.applyIcon()
    }

    if (normalized.title !== undefined) {
      this.state.title = normalized.title ?? undefined
      this.applyTitle()
      this.applyAccessibilityLabel()
    }

    if (normalized.tooltip !== undefined) {
      this.state.tooltip = normalized.tooltip ?? undefined
      this.applyTooltip()
      this.applyAccessibilityLabel()
    }

    if (normalized.menu !== undefined) {
      this.state.menu = normalized.menu ?? undefined
      this.rebuildMenu()
      this.applyActivationMode()
    }

    if (normalized.onActivate !== undefined) {
      this.state.onActivate = normalized.onActivate ?? undefined
      this.applyActivationMode()
    }
  }

  destroy(): void {
    if (this.destroyed) {
      return
    }

    this.destroyed = true
    this.target.callbacks = null
    this.handlers.clear()
    try {
      this.button.target = null
      this.button.action = NO_SELECTOR
    } catch {
      // Clearing a released target must not fail destroy.
    }

    try {
      this.item.menu = NO_MENU
    } catch {
      // The status item ignores menu clearing on torn-down hosts.
    }

    try {
      NSStatusBar.systemStatusBar.removeStatusItem(this.item)
    } catch (error) {
      console.error('[tray] removeStatusItem failed', error)
    }
  }

  private applyIcon() {
    this.button.image = trayImage(
      this.state.icon,
      this.state.title ?? this.state.tooltip ?? this.state.id,
    )

    this.applyImagePosition()
  }

  private applyTitle() {
    this.button.title = this.state.title ?? ''
    this.applyImagePosition()
  }

  private applyImagePosition() {
    const hasImage = Boolean(this.button.image)
    const hasTitle = Boolean(this.state.title)

    this.button.imagePosition = hasImage
      ? hasTitle
        ? NSCellImagePosition.ImageLeft
        : NSCellImagePosition.ImageOnly
      : NSCellImagePosition.NoImage
  }

  private applyTooltip() {
    this.item.toolTip = this.state.tooltip ?? NO_TEXT
    try {
      this.button.toolTip = this.state.tooltip ?? NO_TEXT
    } catch {
      // toolTip on the button is best-effort on older hosts.
    }
  }

  private applyAccessibilityLabel() {
    const label = this.state.title ?? this.state.tooltip ?? this.state.id

    try {
      this.button.accessibilityLabel = label
    } catch {
      // Accessibility labels are best-effort; never fail the update.
    }
  }

  /** With `onActivate` the button owns clicks and the menu opens on secondary
   * click; without it the status item menu owns all clicks natively. */
  private applyActivationMode() {
    if (this.state.onActivate) {
      this.item.menu = NO_MENU
      this.button.target = this.target
      this.button.action = 'trayButtonClicked:'
      this.button.sendActionOn(NSEventMask.LeftMouseUp | NSEventMask.RightMouseUp)
    } else {
      this.button.target = null
      this.button.action = NO_SELECTOR
      this.item.menu = this.nsMenu ?? NO_MENU
    }
  }

  private registerSelectHandler(handler: () => void): number {
    const tag = this.nextTag++

    this.handlers.set(tag, handler)
    return tag
  }

  private headerItem(label: string): NSMenuItem {
    const makeSectionHeader = NSMenuItemStatics.sectionHeaderWithTitle

    if (typeof makeSectionHeader === 'function') {
      return makeSectionHeader.call(NSMenuItem, label)
    }

    const item = NSMenuItem.alloc().initWithTitleActionKeyEquivalent(label, null, '')

    item.enabled = false
    return item
  }

  private selectableItem(label: string, handler: () => void, enabled: boolean): NSMenuItem {
    const item = NSMenuItem.alloc().initWithTitleActionKeyEquivalent(
      label,
      'trayMenuItemSelected:',
      '',
    )

    item.target = this.target
    item.tag = this.registerSelectHandler(handler)
    item.enabled = enabled
    return item
  }

  private buildItems(items: readonly TrayMenuItem[], menu: NSMenu, first: boolean): void {
    for (const [index, item] of items.entries()) {
      switch (item.type) {
        case 'separator':
          menu.addItem(NSMenuItem.separatorItem())
          break
        case 'action':
          menu.addItem(
            this.selectableItem(item.label, () => dispatchTraySelect(item), !item.isDisabled),
          )

          break
        case 'checkbox': {
          const row = this.selectableItem(
            item.label,
            () => dispatchTraySelect(item),
            !item.isDisabled,
          )

          row.state = item.value ? NS_CONTROL_STATE_ON : NS_CONTROL_STATE_OFF
          menu.addItem(row)
          break
        }
        case 'radio-group': {
          const hasLabel = typeof item.label === 'string' && item.label.length > 0

          if (hasLabel && (index > 0 || !first)) {
            menu.addItem(NSMenuItem.separatorItem())
          }

          if (hasLabel) {
            menu.addItem(this.headerItem(item.label!))
          }

          for (const option of item.items) {
            const row = this.selectableItem(
              option.label,
              () => dispatchTraySelect(item, option),
              !item.isDisabled && !option.isDisabled,
            )

            row.state =
              (option.value ?? option.key) === item.value
                ? NS_CONTROL_STATE_ON
                : NS_CONTROL_STATE_OFF

            menu.addItem(row)
          }

          break
        }
        case 'submenu': {
          const row = NSMenuItem.alloc().initWithTitleActionKeyEquivalent(item.label, null, '')

          row.enabled = !item.isDisabled

          const submenu = NSMenu.alloc().initWithTitle(item.label)

          submenu.autoenablesItems = false
          this.buildItems(item.items, submenu, true)
          menu.setSubmenuForItem(submenu, row)
          menu.addItem(row)
          break
        }
        case 'section': {
          if (index > 0 || !first) {
            menu.addItem(NSMenuItem.separatorItem())
          }

          menu.addItem(this.headerItem(item.label))
          this.buildItems(item.items, menu, false)
          break
        }
      }
    }
  }

  private rebuildMenu() {
    this.handlers.clear()
    this.nextTag = 1
    if (this.state.menu && this.state.menu.length > 0) {
      const menu = NSMenu.alloc().initWithTitle('')

      menu.autoenablesItems = false
      this.buildItems(this.state.menu, menu, true)
      this.nsMenu = menu
    } else {
      this.nsMenu = null
    }

    // Swap a live menu so rebuilds reach the visible item.
    if (!this.state.onActivate) {
      this.item.menu = this.nsMenu ?? NO_MENU
    }
  }

  private onMenuItemSelected(menuItem: NSMenuItem) {
    const handler = this.handlers.get(Number(menuItem.tag))

    handler?.()
  }

  private openMenu() {
    const menu = this.nsMenu

    if (!menu || this.openingMenu || this.destroyed) {
      return
    }

    this.openingMenu = true
    this.item.menu = menu
    try {
      this.button.performClick(null)
    } catch (error) {
      console.error('[tray] opening the tray menu failed', error)
    } finally {
      this.openingMenu = false
      if (!this.destroyed && this.state.onActivate) {
        this.item.menu = NO_MENU
      }
    }
  }

  private onButtonClicked() {
    if (this.destroyed || this.openingMenu) {
      return
    }

    let secondary = false

    try {
      const event = NSApp.currentEvent

      if (event) {
        const type = Number(event.type)
        const flags = Number(event.modifierFlags)

        secondary =
          type === NSEventType.RightMouseUp ||
          (type === NSEventType.LeftMouseUp && (flags & NSEventModifierFlags.Control) !== 0)
      }
    } catch {
      secondary = false
    }

    if (secondary) {
      if (this.nsMenu) {
        this.openMenu()
      }

      return
    }

    safeCall(this.state.onActivate)
  }
}

/** Create a tray item; rejects with `TrayError` on unsupported hosts or invalid options. */
export function createTray(options: TrayOptions): Promise<Tray> {
  try {
    return Promise.resolve(new MacOSTray(options))
  } catch (error) {
    return Promise.reject(error)
  }
}

/** Reveal and focus the app's windows; `false` when no app window exists to show. */
export function showAppWindows(): boolean {
  const windows = hiddenWindows.length ? hiddenWindows : appWindows()

  hiddenWindows = []
  if (!windows.length) {
    return false
  }

  try {
    NSApp.activateIgnoringOtherApps(true)
  } catch {
    // Activation is best-effort headless.
  }

  for (const window of windows) {
    try {
      if (window.isMiniaturized()) {
        window.deminiaturize(null)
      }

      window.makeKeyAndOrderFront(null)
    } catch (error) {
      console.error('[tray] showing an app window failed', error)
    }
  }

  return true
}

/** Hide the app's visible windows. */
export function hideAppWindows(): void {
  const visible = appWindows().filter((window) => {
    try {
      return window.isVisible() && !window.isMiniaturized()
    } catch {
      return false
    }
  })

  hiddenWindows = visible
  for (const window of visible) {
    try {
      window.orderOut(null)
    } catch (error) {
      console.error('[tray] hiding an app window failed', error)
    }
  }
}

/** Whether any app window is currently visible. */
export function areAppWindowsVisible(): boolean {
  return appWindows().some((window) => {
    try {
      return window.isVisible() && !window.isMiniaturized()
    } catch {
      return false
    }
  })
}

/** Toggle window visibility; returns the visibility after toggling. */
export function toggleAppWindows(): boolean {
  if (areAppWindowsVisible() && Boolean(NSApp.isActive())) {
    hideAppWindows()
    return false
  }

  return showAppWindows()
}

/** Keep the app running without visible windows until the returned residency releases. */
export function keepAppResident(options?: { hideWindowsOnClose?: boolean }): AppResidency {
  const delegate = NSApp.delegate

  if (delegate) {
    try {
      if (
        typeof delegate.respondsToSelector === 'function' &&
        delegate.respondsToSelector('applicationShouldTerminateAfterLastWindowClosed:') &&
        delegate.applicationShouldTerminateAfterLastWindowClosed?.(NSApp)
      ) {
        throw new TrayError(
          'resident-conflict',
          'keepAppResident cannot hold the app open: the application delegate still returns true from applicationShouldTerminateAfterLastWindowClosed. Return false while the app stays resident in the tray.',
        )
      }
    } catch (error) {
      if (error instanceof TrayError) {
        throw error
      }
      // A delegate without the optional method leaves residency allowed.
    }
  }

  const reason = 'octane-xplat tray residency'
  const processInfo = NSProcessInfo.processInfo

  processInfo.disableAutomaticTermination(reason)

  const hideOnClose = options?.hideWindowsOnClose === true
  const restored: { window: NSWindow; releasedWhenClosed: boolean }[] = []

  if (hideOnClose) {
    for (const window of appWindows()) {
      try {
        restored.push({ window, releasedWhenClosed: window.releasedWhenClosed })
        window.releasedWhenClosed = false
      } catch {
        // Ignore windows that reject the flag.
      }
    }
  }

  let released = false

  return {
    release() {
      if (released) {
        return
      }

      released = true
      try {
        processInfo.enableAutomaticTermination(reason)
      } catch {
        // Balancing the hold is best-effort on teardown.
      }

      for (const entry of restored) {
        try {
          entry.window.releasedWhenClosed = entry.releasedWhenClosed
        } catch {
          // A closed window may already be gone.
        }
      }

      restored.length = 0
    },
  }
}
