import type {
  Accelerator,
  AcceleratorPlatform,
  GlobalShortcutError,
  GlobalShortcutSupport,
} from './types.js'

/** One registration request handed to a platform backend. */
export interface BindRequest {
  /** Process-unique numeric key assigned by the registry (OS-side id). */
  key: number
  /** Caller-chosen string id. */
  id: string
  accelerator: Accelerator
  description: string
  /** App id hint from the owning instance; desktop portals key assignments on it. */
  appId?: string
}

/** Outcome of a backend bind attempt. */
export type BindOutcome =
  | {
      ok: true
      /** OS/desktop-reported trigger label; equals accelerator text for 'exact' hosts. */
      trigger: string
      /** Release the OS binding. May be called at most once by the registry. */
      release(): Promise<void>
    }
  | { ok: false; error: GlobalShortcutError }

/**
 * Platform mechanism behind the shared registry. `platform` is null for
 * unsupported entries, whose `bind` only ever returns `unsupported`.
 */
export interface HotkeyBackend {
  readonly platform: AcceleratorPlatform | null
  support(): Promise<GlobalShortcutSupport>
  /** Static-table supplement; returns a reason or null. */
  reserved?(accelerator: Accelerator): string | null
  bind(request: BindRequest, onPress: () => void): Promise<BindOutcome>
  /** Subscribe to host app exit; returns an unsubscribe function. */
  onExit(listener: () => void): () => void
}
