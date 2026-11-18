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
}

/** A secondary native window created by the desktop package. */
export interface DesktopWindow {
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

/** Native secondary windows for the running desktop host. */
export interface DesktopWindowService {
  /** Whether the current host exposes native secondary windows. */
  readonly supported: boolean
  /** Open a regular native window. Throws UnavailabilityError on unsupported hosts. */
  open(options?: DesktopWindowOptions): DesktopWindow
}
