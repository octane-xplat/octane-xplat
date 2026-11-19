/** Release handle returned by {@link keepAppResident}. */
export interface AppResidency {
  /** End the residency hold and restore window flags. Idempotent. */
  release(): void
}

/** A synchronous request to quit the application. */
export interface DesktopBeforeQuitEvent {
  /** Whether a listener has canceled this quit attempt. */
  readonly defaultPrevented: boolean
  /** Keep the application and its windows open. */
  preventDefault(): void
}

/** A synchronous request to reopen a running application. */
export interface DesktopActivateEvent {
  readonly defaultPrevented: boolean
  /** Suppress the host's default window handling for this request. */
  preventDefault(): void
}

export interface DesktopSecondInstanceEvent {
  readonly type: 'second-instance'
}

/** Lifecycle for the native app host. */
export interface DesktopApp {
  /** Whether the current app host exposes this lifecycle. */
  readonly supported: boolean
  /** Whether this host delivers native reopen requests. */
  readonly supportsActivate: boolean
  /** Whether this app can receive arguments from a second launch. */
  readonly supportsSecondInstance: boolean
  /** Whether the host has finished startup and the app can request quit. */
  isReady(): boolean
  /** Wait for startup. Rejects with UnavailabilityError on hosts without app lifecycle. */
  whenReady(): Promise<void>
  /** Request quit after readiness. App and managed window close listeners can cancel it. */
  quit(): void
  /** Register a synchronous guard that runs before managed windows receive close requests. */
  on(event: 'before-quit', listener: (event: DesktopBeforeQuitEvent) => void): this
  /** Listen for requests to reopen an already running app on a supported host. */
  on(event: 'activate', listener: (event: DesktopActivateEvent, hasVisibleWindows: boolean) => void): this
  /** Receive arguments and working directory from a second launch of the app. */
  on(event: 'second-instance', listener: (
    event: DesktopSecondInstanceEvent,
    argv: readonly string[],
    workingDirectory: string | undefined,
  ) => void): this
  /** Remove the most recent registration of this listener. */
  off(event: 'before-quit', listener: (event: DesktopBeforeQuitEvent) => void): this
  off(event: 'activate', listener: (event: DesktopActivateEvent, hasVisibleWindows: boolean) => void): this
  off(event: 'second-instance', listener: (
    event: DesktopSecondInstanceEvent,
    argv: readonly string[],
    workingDirectory: string | undefined,
  ) => void): this
}
