import { Application } from '@nativescript/core/application/application.windows'
import type { NativeWindow } from '@nativescript/core/native-window'
import { lookupGlobal } from '@octane-xplat/lib/capability'
import type { AppLifecycleHost } from './app/lifecycle.js'
import type { NativeWindowController, NativeWindowOpener } from './window/service.js'

interface ClosingArgs {
  Cancel: boolean
}

interface WindowSurface {
  Close(): void
  Title: string
  Content?: { XamlRoot?: { RasterizationScale: number } | null; Loaded: object | null } | null
  AppWindow: {
    Closing: object
    ResizeClient(size: { Width: number; Height: number }): void
  }
}

interface WinRtDelegates {
  asDelegate(callback: (sender: unknown, args: ClosingArgs) => void): object
  asDelegate(type: string, callback: () => void): object
}

interface WindowsCloseRequest {
  requestClose(): void
}

type WindowController = NativeWindowController<WindowsCloseRequest>

const managed = new Map<NativeWindow, WindowController>()
const quitGuards = new Set<() => boolean>()
let quitPhase: 'idle' | 'checking' | 'approved' = 'idle'

function projection(): WinRtDelegates | undefined {
  const rt = lookupGlobal(['NSWinRT'])

  if (typeof rt === 'object' && rt !== null && 'asDelegate' in rt && typeof rt.asDelegate === 'function') {
    // The Windows runtime projects JS callbacks as native WinRT delegates.
    return rt as WinRtDelegates
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

export function getWindowsOpener(): NativeWindowOpener<WindowsCloseRequest> | undefined {
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
      let closed = false
      let bypass = false
      let clearPendingResize: (() => void) | undefined
      let finish!: () => void
      const closedPromise = new Promise<void>((resolveClosed) => {
        finish = resolveClosed
      })

      const controller: WindowController = {
        window: {
          requestClose() {
            // Window.Close may take a different native route from the title
            // bar. Run the JS guard exactly once before closing either way.
            if (!closed && controller.onCloseRequested?.() !== false) {
              controller.close()
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
        try {
          clearPendingResize?.()
        } catch (error) {
          console.error('[desktop] failed to remove the Windows window size listener', error)
        }
        // Core unregisters and unloads the root before the promise reactions run.
        finish()
      })
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
          clearPendingResize = () => {
            clearPendingResize = undefined
            content.Loaded = null
          }
          content.Loaded = rt.asDelegate('Microsoft.UI.Xaml.RoutedEventHandler', () => {
            try {
              clearPendingResize?.()
              if (!closed) {
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
    for (const controller of managed.values()) {
      if (controller.onCloseRequested?.() === false) {
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
