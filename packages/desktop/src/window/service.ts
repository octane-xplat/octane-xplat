import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type {
  DesktopWindow,
  DesktopWindowCloseEvent,
  DesktopWindowEvents,
  DesktopWindowOptions,
  DesktopWindowService,
} from './types.js'

export interface NativeWindowController<Window> {
  readonly window: Window
  readonly isClosed: boolean
  readonly closed: Promise<void>
  onCloseRequested: (() => boolean | void) | null
  close(): void
  setTitle(title: string): void
}

export type NativeWindowOpener<Window> = (
  options: DesktopWindowOptions & { kind: 'regular' },
) => NativeWindowController<Window>

interface NativeWindowActions<Window> {
  requestClose(window: Window): void
  present(window: Window): void
  hide(window: Window): void
  isVisible(window: Window): boolean
  minimize(window: Window): void
  restore(window: Window): void
}

interface DesktopWindowBinding<Window> {
  windows: DesktopWindowService
  getWindowOwner(parent: DesktopWindow): Window | undefined
}

export function createDesktopWindowService<Window>(
  getOpener: () => NativeWindowOpener<Window> | undefined,
  actions: NativeWindowActions<Window>,
): DesktopWindowBinding<Window> {
  const owners = new WeakMap<DesktopWindow, NativeWindowController<Window>>()
  const windows: DesktopWindowService = {
    get supported() {
      return getOpener() !== undefined
    },
    open(options = {}) {
      const open = getOpener()

      if (!open) {
        throw new UnavailabilityError('windows.open')
      }

      let native: NativeWindowController<Window> | null = open({
        data: options.data,
        title: options.title,
        size: options.size,
        kind: 'regular',
      })
      let previousCloseRequest = native.onCloseRequested
      const listeners: { [Event in keyof DesktopWindowEvents]: DesktopWindowEvents[Event][] } = {
        close: [],
        closed: [],
      }

      let dispatchingClose = false
      let destroyQueued = false

      function liveWindow(): Window {
        if (!native || native.isClosed) {
          throw new Error('Cannot change the visibility or focus of a closed window')
        }
        return native.window
      }

      function requestClose(): boolean {
        if (!native || native.isClosed || dispatchingClose) {
          return false
        }

        let prevented = false
        const event: DesktopWindowCloseEvent = {
          get defaultPrevented() {
            return prevented
          },
          preventDefault() {
            prevented = true
          },
        }

        dispatchingClose = true
        try {
          if (previousCloseRequest?.call(native) === false) {
            event.preventDefault()
          }

          for (const listener of listeners.close.slice()) {
            try {
              listener.call(handle, event)
            } catch (error) {
              event.preventDefault()
              console.error('[desktop] window close listener failed', error)
            }
          }

          return !prevented && !destroyQueued
        } catch (error) {
          console.error('[desktop] window close handler failed', error)
          return false
        } finally {
          dispatchingClose = false
        }
      }

      const handle: DesktopWindow = {
        get isClosed() {
          return native?.isClosed ?? true
        },
        closed: native.closed,
        close() {
          if (native && !native.isClosed && !dispatchingClose && !destroyQueued) {
            actions.requestClose(native.window)
          }
        },
        destroy() {
          if (!native || native.isClosed || destroyQueued) {
            return
          }

          if (dispatchingClose) {
            // Leave the native close callback before destroying its window.
            destroyQueued = true
            void Promise.resolve().then(() => {
              destroyQueued = false
              try {
                handle.destroy()
              } catch (error) {
                console.error('[desktop] window destruction failed', error)
              }
            })
            return
          }

          native.close()
        },
        show() {
          actions.present(liveWindow())
        },
        hide() {
          actions.hide(liveWindow())
        },
        focus() {
          const window = liveWindow()
          if (actions.isVisible(window)) {
            actions.present(window)
          }
        },
        isVisible() {
          return native !== null && !native.isClosed && actions.isVisible(native.window)
        },
        minimize() {
          actions.minimize(liveWindow())
        },
        restore() {
          actions.restore(liveWindow())
        },
        setTitle(title) {
          if (!native || native.isClosed) {
            throw new Error('Cannot set the title of a closed window')
          }

          native.setTitle(title)
        },
        on(event, listener) {
          if (native && !native.isClosed) {
            listeners[event].push(listener)
          }
          return this
        },
        off(event, listener) {
          const list = listeners[event]
          const index = list.lastIndexOf(listener)

          if (index >= 0) {
            list.splice(index, 1)
          }
          return this
        },
      }

      native.onCloseRequested = requestClose
      owners.set(handle, native)
      void native.closed.then(() => {
        owners.delete(handle)
        if (native?.onCloseRequested === requestClose) {
          native.onCloseRequested = null
        }
        native = null
        previousCloseRequest = null

        const closedListeners = listeners.closed.splice(0)

        listeners.close.length = 0
        for (const listener of closedListeners) {
          try {
            listener.call(handle)
          } catch (error) {
            console.error('[desktop] window closed listener failed', error)
          }
        }
      })

      return handle
    },
  }

  return {
    windows,
    getWindowOwner(parent) {
      const owner = owners.get(parent)
      return owner && !owner.isClosed ? owner.window : undefined
    },
  }
}
