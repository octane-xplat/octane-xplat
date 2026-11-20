import { Application } from '@nativescript/core/application/application.windows'
import type { NativeWindow } from '@nativescript/core/native-window'
import { lookupGlobal, UnavailabilityError } from '@octane-xplat/lib/capability'
import type { DesktopRectangle } from './screen/types.js'
import { createWindowsSingleInstance } from './app/second-instance.windows.js'
import type { AppLifecycleHost } from './app/lifecycle.js'
import type { NativeWindowController, NativeWindowOpener } from './window/service.js'

interface ClosingArgs {
  Cancel: boolean
}

interface AppWindowChangedArgs {
  DidPositionChange?: boolean
  DidSizeChange?: boolean
  DidPresenterChange?: boolean
}

interface WindowSurface {
  Activate(): void
  Close(): void
  Title: string
  Content?: { XamlRoot?: { RasterizationScale: number } | null; Loaded: object | null } | null
  AppWindow: {
    Id: { Value: number | bigint }
    Closing: object | null
    Changed?: object | null
    IsVisible: boolean
    Presenter?: {
      State?: number
      Minimize?(): void
      Maximize?(): void
      Restore?(): void
    }
    Show(): void
    Hide(): void
    Position?: { X: number; Y: number }
    Size?: { Width: number; Height: number }
    MoveAndResize?(bounds: { X: number; Y: number; Width: number; Height: number }): void
    ResizeClient(size: { Width: number; Height: number }): void
  }
}

interface WinRtDelegates {
  asDelegate(callback: (sender: unknown, args: ClosingArgs) => void): object
  asDelegate(callback: (sender: unknown, args: AppWindowChangedArgs) => void): object
  asDelegate(type: string, callback: () => void): object
}

interface WindowsInput {
  InputActivationState?: { Activated?: unknown }
  InputActivationListener?: {
    GetForWindowId?(windowId: unknown): { State?: unknown } | null
  }
}

export interface WindowsWindow {
  readonly id: string
  requestClose(): void
  present(): void
  hide(): void
  isVisible(): boolean
  minimize(): void
  restore(): void
  maximize(): void
  unmaximize(): void
  isMaximized(): boolean
  supportsMinimizedState(): boolean
  isMinimized(): boolean
  isFocused(): boolean
  observe(onChange: (change: { moved: boolean; resized: boolean }) => void): () => void
  supportsBounds(): boolean
  getBounds(): DesktopRectangle
  setBounds(bounds: DesktopRectangle): void
}

type WindowController = NativeWindowController<WindowsWindow> & {
  /** Internal teardown hooks the native close event drains once. */
  __cleanups: Set<() => void>
}

const managed = new Map<NativeWindow, WindowController>()
const quitGuards = new Set<() => boolean>()
let quitPhase: 'idle' | 'checking' | 'approved' = 'idle'
let primaryController: WindowController | undefined

function projection(): WinRtDelegates | undefined {
  const rt = lookupGlobal(['NSWinRT'])

  if (typeof rt === 'object' && rt !== null && 'asDelegate' in rt && typeof rt.asDelegate === 'function') {
    // The Windows runtime projects JS callbacks as native WinRT delegates.
    return rt as WinRtDelegates
  }
}

function windowsInput(): WindowsInput | undefined {
  const input = lookupGlobal(['Microsoft', 'UI', 'Input'])

  if (typeof input === 'object' && input !== null) {
    // The Windows runtime projects WinRT namespaces as plain host objects.
    return input as WindowsInput
  }
}

function nativeSurface(window: NativeWindow | undefined): WindowSurface | undefined {
  // Core's Window type needs the consumer's WinUI ambient declarations.
  // Bound this native projection to the members used by this adapter.
  return window?.windows?.window as WindowSurface | undefined
}

function supported(): boolean {
  return (
    projection() !== undefined &&
    typeof Application.openWindow === 'function' &&
    typeof Application.getWindows === 'function' &&
    typeof Application.getWindowContentResolver === 'function'
  )
}

function adoptController(
  native: NativeWindow,
  surface: WindowSurface,
  rt: WinRtDelegates,
): WindowController {
  let closed = false
  let bypass = false
  let finish!: () => void
  const closedPromise = new Promise<void>((resolveClosed) => {
    finish = resolveClosed
  })

  const controller: WindowController = {
    __cleanups: new Set(),
    window: {
      get id() {
        return String(surface.AppWindow.Id.Value)
      },
      requestClose() {
        // Window.Close may take a different native route from the title
        // bar. Run the JS guard exactly once before closing either way.
        if (!closed && controller.onCloseRequested?.() !== false) {
          controller.close()
        }
      },
      present() {
        if (surface.AppWindow.IsVisible) {
          surface.Activate()
        } else {
          surface.AppWindow.Show()
        }
      },
      hide: () => surface.AppWindow.Hide(),
      isVisible: () => surface.AppWindow.IsVisible,
      minimize() {
        const presenter = surface.AppWindow.Presenter
        if (typeof presenter?.Minimize !== 'function') {
          throw new UnavailabilityError('DesktopWindow.minimize')
        }
        presenter.Minimize()
      },
      maximize() {
        const presenter = surface.AppWindow.Presenter
        if (typeof presenter?.Maximize !== 'function') {
          throw new UnavailabilityError('DesktopWindow.maximize')
        }
        presenter.Maximize()
      },
      unmaximize() {
        const presenter = surface.AppWindow.Presenter
        if (typeof presenter?.State !== 'number' || typeof presenter.Restore !== 'function') {
          throw new UnavailabilityError('DesktopWindow.unmaximize')
        }
        // Microsoft.UI.Windowing.OverlappedPresenterState.Maximized
        if (presenter.State === 0) {
          presenter.Restore()
        }
      },
      isMaximized() {
        const presenter = surface.AppWindow.Presenter
        if (typeof presenter?.State !== 'number') {
          throw new UnavailabilityError('DesktopWindow.isMaximized')
        }
        // Microsoft.UI.Windowing.OverlappedPresenterState.Maximized
        return presenter.State === 0
      },
      supportsMinimizedState() {
        return typeof surface.AppWindow.Presenter?.State === 'number'
      },
      isMinimized() {
        const presenter = surface.AppWindow.Presenter
        if (typeof presenter?.State !== 'number') {
          throw new UnavailabilityError('DesktopWindow.isMinimized')
        }
        // Microsoft.UI.Windowing.OverlappedPresenterState.Minimized
        return presenter.State === 1
      },
      isFocused() {
        const input = windowsInput()
        const activated = input?.InputActivationState?.Activated
        const getListener = input?.InputActivationListener?.GetForWindowId

        if (activated === undefined || typeof getListener !== 'function') {
          throw new UnavailabilityError('windows.getFocusedWindow')
        }

        return (
          getListener.call(input?.InputActivationListener, surface.AppWindow.Id)?.State ===
          activated
        )
      },
      observe(onChange) {
        let active = true
        const delegate = rt.asDelegate((_sender, event: AppWindowChangedArgs) => {
          if (!active) {
            return
          }

          // DidPresenterChange carries maximize/minimize/restore transitions —
          // the service re-reads the presenter state on every notification.
          if (event?.DidPositionChange || event?.DidSizeChange || event?.DidPresenterChange) {
            onChange({
              moved: event.DidPositionChange === true,
              resized: event.DidSizeChange === true,
            })
          }
        })

        surface.AppWindow.Changed = delegate

        return () => {
          active = false
          try {
            surface.AppWindow.Changed = null
          } catch {
            // Removing a projected event handler is best effort.
          }
        }
      },
      supportsBounds() {
        const appWindow = surface.AppWindow
        return typeof appWindow.MoveAndResize === 'function' && appWindow.Position != null && appWindow.Size != null
      },
      getBounds() {
        const { Position: position, Size: size } = surface.AppWindow
        if (!position || !size) throw new UnavailabilityError('DesktopWindow.getBounds')
        return { x: position.X, y: position.Y, width: size.Width, height: size.Height }
      },
      setBounds({ x, y, width, height }) {
        if (![x, y, width, height].every((value) =>
          Number.isInteger(value) && value >= -2147483648 && value <= 2147483647)) {
          throw new RangeError('Windows bounds require whole physical pixels in the signed 32-bit range')
        }
        const appWindow = surface.AppWindow
        if (!appWindow.MoveAndResize) throw new UnavailabilityError('DesktopWindow.setBounds')
        appWindow.MoveAndResize({ X: x, Y: y, Width: width, Height: height })
      },
      restore() {
        const presenter = surface.AppWindow.Presenter
        if (typeof presenter?.State !== 'number' || typeof presenter.Restore !== 'function') {
          throw new UnavailabilityError('DesktopWindow.restore')
        }
        // Microsoft.UI.Windowing.OverlappedPresenterState.Minimized
        if (presenter.State === 1) {
          presenter.Restore()
        }
      },
    },
    get isClosed() {
      return closed
    },
    closed: closedPromise,
    onCloseRequested: null,
    close() {
      if (!closed && !bypass) {
        bypass = true
        try {
          surface.Close()
        } finally {
          bypass = false
        }
      }
    },
    setTitle(title) {
      surface.Title = title
    },
  }

  surface.AppWindow.Closing = rt.asDelegate((_sender, event) => {
    if (!bypass && controller.onCloseRequested?.() === false) {
      event.Cancel = true
    }
  })
  native.on('close', () => {
    closed = true
    managed.delete(native)
    for (const cleanup of Array.from(controller.__cleanups)) {
      try {
        cleanup()
      } catch (error) {
        console.error('[desktop] failed to clean up a closing Windows window', error)
      }
    }
    // Core unregisters and unloads the root before the promise reactions run.
    finish()
  })
  return controller
}

export function getWindowsOpener(): NativeWindowOpener<WindowsWindow> | undefined {
  const rt = projection()

  if (!rt || !supported()) {
    return
  }

  return (options) => {
    if (quitPhase === 'approved') {
      throw new Error('Cannot open a Windows window while the application is quitting')
    }
    if (!isReady()) {
      throw new Error('Wait for app.whenReady() before opening a Windows window')
    }

    const size = options.size
    if (size && (!Number.isFinite(size.width) || !Number.isFinite(size.height) || size.width <= 0 || size.height <= 0)) {
      throw new TypeError('Window size must have positive finite width and height')
    }

    const original = Application.getWindowContentResolver()
    let created: NativeWindow | undefined

    // Core invokes the resolver inline on Windows. A per-call data object
    // identifies this request even when the resolver opens another window.
    const requestData = { ...options.data }
    const resolve: NonNullable<typeof original> = (request) => {
      if (request.data === requestData && !request.isPrimary) {
        created = request.window
        return original?.({ ...request, data: options.data })
      }
      return original?.(request)
    }

    Application.setWindowContentResolver(resolve)
    try {
      Application.openWindow({ data: requestData })
      const surface = nativeSurface(created)

      if (!created || created.state === 'closed' || !surface?.AppWindow) {
        throw new Error('NativeScript did not create a live WinUI window for this request')
      }

      const native = created
      const controller = adoptController(native, surface, rt)
      managed.set(native, controller)

      if (options.title !== undefined) {
        controller.setTitle(options.title)
      }
      if (size) {
        const content = surface.Content
        const resize = () => {
          const scale = content?.XamlRoot?.RasterizationScale ?? 1
          surface.AppWindow.ResizeClient({
            Width: Math.max(1, Math.round(size.width * scale)),
            Height: Math.max(1, Math.round(size.height * scale)),
          })
        }

        if (content && !content.XamlRoot) {
          // Core can return before WinUI loads the content and provides its monitor scale.
          const clearPendingResize = () => {
            content.Loaded = null
          }
          controller.__cleanups.add(clearPendingResize)
          content.Loaded = rt.asDelegate('Microsoft.UI.Xaml.RoutedEventHandler', () => {
            try {
              controller.__cleanups.delete(clearPendingResize)
              clearPendingResize()
              if (!controller.isClosed) {
                resize()
              }
            } catch (error) {
              console.error('[desktop] failed to set the Windows window size', error)
            }
          })
        } else {
          resize()
        }
      }

      return controller
    } catch (error) {
      if (created && created.state !== 'closed') {
        try {
          nativeSurface(created)?.Close()
        } catch (cleanupError) {
          console.error('[desktop] failed to close a partially opened Windows window', cleanupError)
        }
      }
      throw error
    } finally {
      if (Application.getWindowContentResolver() === resolve) {
        Application.setWindowContentResolver(original)
      }
    }
  }
}

/** Controller for `Application.primaryWindow`, adopted lazily so importing
 *  this module never touches WinUI before the host app exists. Not in
 *  `managed` — the quit path keeps the primary alive until secondary closes
 *  drain, since the packaged host exits on the last WinUI window. */
export function getWindowsPrimary(): WindowController | undefined {
  if (primaryController && !primaryController.isClosed) {
    return primaryController
  }

  const rt = projection()
  if (!rt || !supported() || !isReady()) {
    return undefined
  }

  const native = Application.primaryWindow
  const surface = nativeSurface(native)

  if (!native || native.state === 'closed' || !surface?.AppWindow) {
    return undefined
  }

  primaryController = adoptController(native, surface, rt)
  return primaryController
}

function isReady(): boolean {
  return Boolean(Application.primaryWindow?.rootView?.isLoaded)
}

let startup: Promise<void> | undefined

function whenReady(): Promise<void> {
  if (isReady()) {
    return Promise.resolve()
  }

  return (startup ??= new Promise<void>((resolve) => {
    let primary: NativeWindow | undefined

    const finish = () => {
      // Core sets isLoaded after emitting contentLoaded.
      void Promise.resolve().then(() => {
        if (isReady()) {
          Application.off('windowOpen', opened)
          primary?.off('contentLoaded', finish)
          resolve()
        }
      })
    }
    const opened = ({ window }: { window: NativeWindow }) => {
      if (window.isPrimary) {
        primary = window
        primary.on('contentLoaded', finish)
        finish()
      }
    }

    Application.on('windowOpen', opened)
    if (Application.primaryWindow) {
      opened({ window: Application.primaryWindow })
    }
  }))
}

function unmanagedWindows(): boolean {
  return Application.getWindows().some((window) => !window.isPrimary && !managed.has(window))
}

function quit(): void {
  if (quitPhase !== 'idle') {
    return
  }
  if (!isReady()) {
    throw new Error('Wait for app.whenReady() before requesting quit')
  }

  quitPhase = 'checking'
  try {
    for (const guard of Array.from(quitGuards)) {
      if (!guard()) {
        return
      }
    }
    for (const controller of [getWindowsPrimary(), ...managed.values()]) {
      if (controller && controller.onCloseRequested?.() === false) {
        return
      }
    }

    if (unmanagedWindows()) {
      throw new Error('Windows app.quit() requires secondary windows opened by @octane-xplat/desktop')
    }

    quitPhase = 'approved'
  } finally {
    if (quitPhase === 'checking') {
      quitPhase = 'idle'
    }
  }

  const closing = Array.from(managed.values())
  try {
    for (const window of closing) {
      window.close()
    }
  } catch (error) {
    quitPhase = 'idle'
    throw error
  }

  void Promise.all(closing.map((window) => window.closed)).then(() => {
    // Keep the primary alive until close callbacks have drained. Core exits
    // the process after the final WinUI window closes on the packaged host.
    setTimeout(() => {
      try {
        const primary = nativeSurface(Application.primaryWindow)
        if (unmanagedWindows() || !primary) {
          throw new Error('The Windows window registry changed during quit')
        }
        primary.Close()
      } catch (error) {
        quitPhase = 'idle'
        console.error('[desktop] could not finish Windows quit', error)
      }
    }, 0)
  })
}

const lifecycle: AppLifecycleHost = {
  ...createWindowsSingleInstance(isReady),
  isReady,
  whenReady,
  quit,
  addQuitGuard(guard) {
    quitGuards.add(guard)
    return () => quitGuards.delete(guard)
  },
}

export function getWindowsLifecycle(): AppLifecycleHost | undefined {
  return supported() ? lifecycle : undefined
}
