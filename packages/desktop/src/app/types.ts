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

/** Lifecycle for the native app host. */
export interface DesktopApp {
  /** Whether the current app host exposes this lifecycle. */
  readonly supported: boolean
  /** Whether the host has finished startup and the app can request quit. */
  isReady(): boolean
  /** Wait for startup. Rejects with UnavailabilityError on hosts without app lifecycle. */
  whenReady(): Promise<void>
  /** Request quit after readiness. App and managed window close listeners can cancel it. */
  quit(): void
  /** Register a synchronous guard that runs before managed windows receive close requests. */
  on(event: 'before-quit', listener: (event: DesktopBeforeQuitEvent) => void): this
  /** Remove the most recent registration of this listener. */
  off(event: 'before-quit', listener: (event: DesktopBeforeQuitEvent) => void): this
}
