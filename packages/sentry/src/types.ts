/** One breadcrumb attached to subsequent events — a trail of what happened
 *  before a crash or error. */
export interface SentryBreadcrumb {
  /** Human-readable description. */
  message?: string
  /** Dotted grouping such as 'ui.click' or 'navigation'. */
  category?: string
  /** Severity hint ('debug' | 'info' | 'warning' | 'error' | 'fatal'). */
  level?: string
  /** Unix timestamp in seconds, when the SDK attached one. */
  timestamp?: number
  /** Arbitrary structured context attached to the crumb. */
  data?: unknown
}

/** Identity attached to events for user-scoped search in Sentry. */
export interface SentryUser {
  /** Stable user id — the primary lookup key. */
  id?: string
  /** User email. */
  email?: string
  /** Display username. */
  username?: string
}

/** One stack frame inside a captured exception. */
export interface SentryFrame {
  /** Source file path or URL. */
  filename?: string
  /** Absolute path as reported. */
  abs_path?: string
  /** Function name at the frame. */
  function?: string
  lineno?: number
  colno?: number
  /** Whether the frame belongs to app code. */
  in_app?: boolean
  /** SDK- and platform-specific fields. */
  [key: string]: unknown
}

/** One exception in a captured chain. */
export interface SentryExceptionValue {
  type?: string
  value?: string
  stacktrace?: { frames?: SentryFrame[] }
  /** SDK- and platform-specific fields. */
  [key: string]: unknown
}

/** An error or message event passed to `beforeSend`. The portable envelope
 *  fields are typed; SDK- and platform-specific fields pass through the
 *  index signature so a redacting filter sees the full payload. */
export interface SentryEvent {
  /** Sentry-assigned event id. */
  event_id?: string
  /** Message-event text. */
  message?: string
  /** Severity ('debug' | 'info' | 'warning' | 'error' | 'fatal'). */
  level?: string
  /** Release identifier, when configured at init. */
  release?: string
  /** Build/distribution identifier, when configured at init. */
  dist?: string
  /** Deployment environment tag, when configured at init. */
  environment?: string
  /** Originating runtime tag ('javascript', 'cocoa', …). */
  platform?: string
  /** Unix event timestamp in seconds. */
  timestamp?: number
  /** Attached user identity. */
  user?: SentryUser | null
  /** Request/URL context the SDK captured. */
  request?: { url?: string; [key: string]: unknown }
  /** Named context objects (device, os, app, …). */
  contexts?: Record<string, unknown>
  /** Searchable tags. */
  tags?: Record<string, unknown>
  /** Free-form extra data passed at capture time. */
  extra?: Record<string, unknown>
  /** Buffered breadcrumbs attached to this event. */
  breadcrumbs?: SentryBreadcrumb[] | { values?: SentryBreadcrumb[] }
  /** Captured exception chain. */
  exception?: { values?: SentryExceptionValue[] }
  /** Debug-image metadata binding the event to uploaded source maps. */
  debug_meta?: unknown
  /** SDK- and platform-specific fields. */
  [key: string]: unknown
}

/** Metadata passed alongside an event to `beforeSend`. SDK-specific fields
 *  (capture context, original exception) pass through untyped. */
export interface SentryEventHint {
  /** Proposed event id. */
  event_id?: string
  /** The original captured error, when available. */
  originalException?: unknown
  /** SDK- and platform-specific fields. */
  [key: string]: unknown
}

/** Options for sentry.init(). The keys here are the portable contract;
 *  additional SDK-specific keys are forwarded to the platform SDK unchanged
 *  but are not part of the cross-platform surface. */
export interface SentryInitOptions {
  /** Project DSN from Sentry project settings. */
  dsn: string
  /** Deployment environment tag ('production', 'staging', …). */
  environment?: string
  /** Release identifier — pair with `dist` for source-map matching. */
  release?: string
  /** Build/distribution identifier. */
  dist?: string
  /** 0..1 error sampling. */
  sampleRate?: number
  /** 0..1 performance-traces sampling. */
  tracesSampleRate?: number
  /** Native session tracking (launch/close) where the SDK offers it. */
  enableAutoSessionTracking?: boolean
  /** Master switch for report collection. `false` still initializes the SDK
   *  but drops every event before delivery; forwarded to the native SDK, so
   *  it also disables native crash capture on iOS/Android. Use
   *  `setEnabled`/`close` for runtime consent changes. */
  enabled?: boolean
  /** Last-chance filter for error and message events. Return the event —
   *  possibly modified — to send it, or `null` to drop it.
   *
   *  The return value is honored for every JavaScript-level event on every
   *  platform. For a native crash report on iOS/Android the native SDK
   *  invokes the callback but ignores the result — returning `null` does not
   *  stop a crash report. Use `enabled`/`setEnabled`/`close` to stop native
   *  crash capture. */
  beforeSend?: (
    event: SentryEvent,
    hint: SentryEventHint,
  ) => SentryEvent | null | Promise<SentryEvent | null>
  /** Filter for breadcrumbs. Return the crumb — possibly modified — to keep
   *  it, or `null` to drop it. Honored for JavaScript-level and native
   *  breadcrumbs on iOS/Android. */
  beforeBreadcrumb?: (
    breadcrumb: SentryBreadcrumb,
    hint?: Record<string, unknown>,
  ) => SentryBreadcrumb | null
}

/** Sentry error-reporting façade. Calls before init() are dropped. */
export interface SentryService {
  /** Synchronous fast check — a Sentry backend exists. */
  readonly supported: boolean
  /** Initialize the SDK; call once at app startup. */
  init(options: SentryInitOptions): void
  /** Report an error/exception to Sentry. Returns the queued event id — not
   *  a delivery acknowledgement — or undefined when the event was dropped by
   *  policy. */
  captureException(error: unknown, context?: Record<string, unknown>): string | undefined
  /** Report a plain message at the given level. Returns the queued event id
   *  or undefined when the event was dropped by policy. */
  captureMessage(message: string, level?: 'info' | 'warning' | 'error'): string | undefined
  /** Append a breadcrumb to the trail sent with the next event. */
  addBreadcrumb(breadcrumb: SentryBreadcrumb): void
  /** Attach (or clear, with null) the user identity on future events. */
  setUser(user: SentryUser | null): void
  /** Set a searchable tag on future events. */
  setTag(key: string, value: string): void
  /** Set (or remove, with null) a named context object on future events. */
  setContext(key: string, context: Record<string, unknown> | null): void
  /** Enable or disable collection at runtime. When disabled, new exceptions,
   *  messages and breadcrumbs are dropped before reaching the SDK, and the
   *  SDK's own `enabled` flag is cleared so internally generated reports stop
   *  too. Re-enable by passing true; after close(), init() is required
   *  instead. */
  setEnabled(enabled: boolean): void
  /** Deliver queued events, resolving true when the queue drains within
   *  `timeout` milliseconds and false on timeout or failure. On Android the
   *  wrapped SDK flushes only the JavaScript queue. */
  flush(timeout?: number): Promise<boolean>
  /** Flush queued events, then stop collection until init() runs again;
   *  resolves like flush(). On iOS/Android the native SDK is closed too, so
   *  native crash capture stops with it. */
  close(timeout?: number): Promise<boolean>
}

export declare const sentry: SentryService
