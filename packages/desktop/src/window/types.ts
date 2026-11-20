import type { DesktopRectangle } from '../screen/types.js'

/** Options for opening a regular native window. Install the host's window content resolver first. */
export interface DesktopWindowOptions {
  /** Data passed to the host's window content resolver. */
  data?: Record<string, unknown>
  /** Title in the window's title bar. */
  title?: string
  /** Initial content size in logical pixels. */
  size?: { width: number; height: number }
}

/** A synchronous close request. Call preventDefault before the listener returns to keep the window open. */
export interface DesktopWindowCloseEvent {
  /** Whether a listener has canceled this request. */
  readonly defaultPrevented: boolean
  /** Cancel this request. */
  preventDefault(): void
}

/** Listener signatures for native window lifecycle events. */
export interface DesktopWindowEvents {
  /** A programmatic or native close request. */
  close: (event: DesktopWindowCloseEvent) => void
  /** The window has closed and its content has been unmounted. */
  closed: () => void
  /** The outer frame position changed (native or programmatic). Requires supportsBounds. */
  move: () => void
  /** The outer frame size changed (native or programmatic). Requires supportsBounds. */
  resize: () => void
  /** The host now reports the window as maximized. */
  maximize: () => void
  /** The host no longer reports the window as maximized. */
  unmaximize: () => void
}

/** A native window of the running desktop app — the host's main window or a
 *  secondary window created through `windows.open()`. */
export interface DesktopWindow {
  /** Whether the live window supports reading and setting its outer frame. */
  readonly supportsBounds: boolean
  /** Read the outer frame in the same units and coordinates as the desktop screen. */
  getBounds(): DesktopRectangle
  /** Request an outer frame in desktop screen coordinates. Omitted fields keep their current values. */
  setBounds(bounds: Partial<DesktopRectangle>): void
  /** True once the host has closed the window. */
  readonly isClosed: boolean
  /** Resolves after the host closes the window and unmounts its content. */
  readonly closed: Promise<void>
  /** Request a close, honoring synchronous cancellation from close listeners. */
  close(): void
  /** Force the window closed without emitting a close request. */
  destroy(): void
  /** Show the window and request keyboard focus. Throws after the window closes. */
  show(): void
  /** Hide the window while keeping its content mounted. Throws after the window closes. */
  hide(): void
  /** Request keyboard focus for a shown window. Throws after the window closes. */
  focus(): void
  /** Whether the host reports the window as shown. Closed windows return false. */
  isVisible(): boolean
  /** Request that the desktop minimize this window. Throws after close. */
  minimize(): void
  /** Request that the desktop bring a minimized window back. Throws after close. */
  restore(): void
  /** Request that the host maximize this window. Throws after close. */
  maximize(): void
  /** Request that the host restore a maximized window. Throws after close. */
  unmaximize(): void
  /** Whether the host reports the window as maximized. Throws after close. */
  isMaximized(): boolean
  /** Whether the host reports the window as minimized. Throws after close;
   *  throws UnavailabilityError on hosts that cannot report minimized state (GTK). */
  isMinimized(): boolean
  /** Set the title of a live window. */
  setTitle(title: string): void
  /** Add a listener and return this window. */
  on<Event extends keyof DesktopWindowEvents>(
    event: Event,
    listener: DesktopWindowEvents[Event],
  ): this
  /** Remove the most recent registration of this listener and return this window. */
  off<Event extends keyof DesktopWindowEvents>(
    event: Event,
    listener: DesktopWindowEvents[Event],
  ): this
}

/** Native windows for the running desktop host. */
export interface DesktopWindowService {
  /** Whether the current host exposes native windows. */
  readonly supported: boolean
  /** Open a regular native window. Throws UnavailabilityError on unsupported hosts. */
  open(options?: DesktopWindowOptions): DesktopWindow
  /** The main window (when the host has one open) followed by windows from
   *  `open()` in creation order. Closed windows drop out; `[]` on unsupported hosts. */
  getAllWindows(): DesktopWindow[]
  /** The `getAllWindows()` handle that holds keyboard focus, or `null`. */
  getFocusedWindow(): DesktopWindow | null
}
