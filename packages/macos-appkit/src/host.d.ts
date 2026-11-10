import type {
  NSApplication,
  NSApplicationDelegate,
  NSObject,
  NSView,
  NSWindow,
  NSWindowDelegate,
} from '@octane-xplat/platform/macos'

import type { MacOSRootOptions } from '@octane-xplat/macos-appkit'
import type { UniversalComponent, UniversalRoot } from 'octane/universal/native'

/** Presentation behavior of an AppKit window opened through `openWindow`. */
export type MacOSWindowKind = 'regular' | 'dialog' | 'popup'

/** A window or content size in points. */
export interface MacOSWindowSize {
  /** Horizontal extent in points. */
  width: number
  /** Vertical extent in points. */
  height: number
}

/** Options for `runMacOSApp`. */
export interface MacOSAppOptions {
  /** Main window title. @default 'Octane App' */
  title?: string
  /** Main window content size in points. @default { width: 640, height: 420 } */
  size?: MacOSWindowSize
  /** End the application when its last window closes. @default true */
  terminateAfterLastWindowClosed?: boolean
  /** Options for every root this host creates (main window and `openWindow`
   *  windows), e.g. `{ fontFamily: 'Acme Sans' }`. */
  rootOptions?: MacOSRootOptions
}

/** The mount target `runMacOSApp` hands to its `mount` callback. */
export interface MacOSAppMount {
  /** The shared `NSApplication`. */
  app: NSApplication
  /** The main window. */
  window: NSWindow
  /** The pinned content view `root` renders into. */
  contentView: NSView
  /** The universal root the host mounted in `contentView`. */
  root: UniversalRoot
}

/**
 * Create the main window, mount a universal root in its content view, call
 * `mount`, present the window, and run the AppKit event loop. `mount` may
 * return a cleanup function: the host calls it exactly once, synchronously,
 * when the application terminates (`applicationWillTerminate`) or the host
 * stops, before unmounting the roots it owns.
 *
 * @example
 * ```ts
 * import { runMacOSApp } from '@octane-xplat/macos-appkit/host'
 * import App from './App.macos'
 *
 * runMacOSApp({ title: 'Notes' }, ({ root, window }) => {
 *   root.render(App, { parentWindow: window })
 *   return () => console.log('app is closing')
 * })
 * ```
 */
export declare function runMacOSApp(
  options: MacOSAppOptions,
  mount: (target: MacOSAppMount) => void | (() => void),
): void

/** The shared AppKit application/window delegate the host installs. */
export interface AppKitHostDelegate extends NSObject {}

/** The application-level window resources `createAppKitWindow` returns — the
 *  shared `NSApplication`, the main window and its content view, the two
 *  lifecycle promises, and the shared delegate to detach on teardown. */
export interface AppKitWindow {
  /** The shared `NSApplication`. */
  app: NSApplication
  /** The main window this call created. */
  window: NSWindow
  /** The window's pinned content view — mount a root or hosted view here. */
  contentView: NSView
  /** Resolves once `applicationWillTerminate` runs. */
  applicationClosed: Promise<void>
  /** Resolves once `windowWillClose` runs for `window`. */
  windowClosed: Promise<void>
  /** The shared AppKit delegate installed on the app and host windows.
   *  Detach by assigning `null` during teardown. */
  delegate: AppKitHostDelegate | null
}

/** Options for `createAppKitWindow`. */
export interface CreateAppKitWindowOptions {
  /** Main window title. @default 'Octane App' */
  title?: string
  /** Main window content size in points. @default { width: 640, height: 420 } */
  size?: MacOSWindowSize
  /** End the application when its last window closes.
   *  @default false — AppKit's keep-running behavior */
  terminateAfterLastWindowClosed?: boolean
  /** Options for every Octane root `openWindow` creates (for example
   *  `{ fontFamily }`); `runMacOSApp` applies it to its main root too. */
  rootOptions?: MacOSRootOptions
}

/**
 * Create the application's main AppKit window, install the shared application
 * and window delegate, and return the mount target plus lifecycle promises.
 * Lower-level than `runMacOSApp` — use it for hosts that mount a non-Octane
 * view (for example a WKWebView) instead of a universal root.
 *
 * @example
 * ```ts
 * import { createAppKitWindow } from '@octane-xplat/macos-appkit/host'
 *
 * const host = createAppKitWindow({ title: 'Notes', terminateAfterLastWindowClosed: true })
 * // host.contentView is the NSView your content mounts into.
 * host.windowClosed.then(() => {
 *   host.window.delegate = null
 *   host.app.delegate = null
 * })
 * ```
 */
export declare function createAppKitWindow(options?: CreateAppKitWindowOptions): AppKitWindow

/**
 * Resize a window once to its content's fitting size — call after the first
 * render. Floored at the given size (scroll views report no intrinsic size,
 * so an unclamped fitting can collapse) and capped at the screen's visible
 * height. One-shot: the window stays resizable afterwards.
 *
 * @example
 * ```ts
 * root.render(App, {})
 * fitWindowToContent(window)
 * ```
 */
export declare function fitWindowToContent(
  nativeWindow: NSWindow | null | undefined,
  floor?: MacOSWindowSize,
): void

/**
 * Maps `openWindow({ data })` requests to the component a new window mounts.
 * Install it with `setWindowContentResolver` before calling `openWindow`
 * without an explicit `component`.
 *
 * @example
 * ```ts
 * setWindowContentResolver((data) => {
 *   if (data && typeof data === 'object' && 'docId' in data) return DocumentWindow
 *   return null
 * })
 * // openWindow({ data: { docId: 1 } }) now mounts DocumentWindow.
 * ```
 */
export type WindowContentResolver = (data: unknown, controller: AppKitWindowController) => unknown

/**
 * Install the app-owned resolver that maps `openWindow({ data })` requests to
 * the component each new window mounts. Pass `null` to remove it.
 *
 * @example
 * ```ts
 * import { setWindowContentResolver } from '@octane-xplat/macos-appkit/host'
 * import { openWindow } from '@octane-xplat/ui'
 *
 * setWindowContentResolver((data) =>
 *   data && typeof data === 'object' && 'kind' in data && data.kind === 'preview'
 *     ? PreviewWindow
 *     : null,
 * )
 * const win = openWindow({ data: { kind: 'preview' }, title: 'Preview' })
 * ```
 */
export declare function setWindowContentResolver(resolve: WindowContentResolver | null): void

/** Controller for a window `openWindow` created — the object `openWindow`
 *  callers and `WindowContentResolver`s receive. */
export interface AppKitWindowController {
  /** Behavior contract this window was opened with. */
  kind: MacOSWindowKind
  /** The backing AppKit window. */
  window: NSWindow
  /** The `data` option `openWindow` received, or `null`. */
  data: unknown
  /** The Octane root mounted in `window`'s content view; `null` after close. */
  root: UniversalRoot | null
  /** Read-only for callers; the host flips it when the window finishes closing. */
  isClosed: boolean
  /** Resolves when the window closes for any reason. */
  closed: Promise<void>
  /** App-assigned close veto — returning `false` cancels a user close request. */
  onCloseRequested?: (() => boolean | void) | null
  /** Retitle the window. */
  setTitle(title: string): void
  /** Resize the window's content area. */
  setSize(next: MacOSWindowSize): void
  /** Close the window now, skipping the `onCloseRequested` veto. */
  close(): void
}

/** Controller for a `createHostedWindow` window hosting a non-Octane native
 *  view (for example a WKWebView) instead of a universal root. */
export interface HostedWindowController {
  /** The backing AppKit window. */
  window: NSWindow
  /** The window's content view to install the hosted view into. */
  contentView: NSView
  /** Resolves when the window closes for any reason. */
  closed: Promise<void>
  /** Read-only for callers; the host flips it when the window finishes closing. */
  readonly isClosed: boolean
  /** Retitle the window. */
  setTitle(title: string): void
  /** Close the window now. */
  close(): void
}

/** Options accepted by the host's `openWindow` (the `__xplatAppKitOpenWindow`
 *  global `openWindow` from @octane-xplat/ui calls through). */
export interface MacOSOpenWindowOptions {
  /** Presentation behavior: `'regular'` independent window, `'dialog'` sheet
   *  on the parent, `'popup'` non-activating child panel. @default 'regular' */
  kind?: MacOSWindowKind
  /** Owning window for `'dialog'`/`'popup'` kinds — an `NSWindow` or a
   *  controller returned by `openWindow`/`createHostedWindow`.
   *  @default the key window */
  parent?: NSWindow | AppKitWindowController | HostedWindowController | null
  /** Requested window title. @default 'Octane window' */
  title?: string
  /** Requested content size in points. */
  size?: MacOSWindowSize
  /** Data handed to the installed `WindowContentResolver`. */
  data?: unknown
  /** Explicit component to mount, bypassing the resolver. */
  component?: UniversalComponent
  /** Props for `component`; defaults to `{ data, controller }` when omitted. */
  props?: unknown
  [key: string]: unknown
}

/**
 * Create a bare AppKit window for a non-Octane host view (for example a
 * desktop WKWebView). Unlike `openWindow`, this does not create a universal
 * root — callers install their own view into `contentView`.
 *
 * @example
 * ```ts
 * const controller = createHostedWindow({ title: 'Browser', size: { width: 800, height: 600 } })
 * const webView = createMacOSWebView(controller.contentView)
 * await controller.closed
 * ```
 */
export declare function createHostedWindow(options?: MacOSOpenWindowOptions): HostedWindowController

/**
 * Snapshot/press handles for every secondary window, used by dev automation.
 * Each entry carries the window title and its Octane root's `__macosDebug`
 * surface when the root exposes one.
 *
 * @example
 * ```ts
 * for (const entry of debugWindows()) {
 *   console.log(entry.title, entry.debug)
 * }
 * ```
 */
export declare function debugWindows(): {
  title: string
  debug: Record<string, unknown> | null
}[]
