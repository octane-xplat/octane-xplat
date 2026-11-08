/**
 * Whether a recognition engine needs the network for a given language.
 * `'required'` means audio leaves the device; `'possible'` means an
 * on-device path exists and the engine may still choose the network.
 */
export type SpeechNetworkUse = 'required' | 'possible'

/** Options for {@link SpeechRecognitionImpl.start}. All values are requests. */
export interface SpeechRecognitionOptions {
  /**
   * BCP-47 language tag to recognize (e.g. `'en-US'`). Defaults to the
   * platform's UI language.
   */
  lang?: string
  /**
   * Emit interim `transcript` events while the speaker is still talking.
   * Default `true`. When `false`, only `isFinal: true` events are emitted.
   */
  interimResults?: boolean
  /**
   * Keep listening across utterances until {@link SpeechRecognitionSession.stop}
   * or `abort` is called. Default `false` — the session completes after the
   * first committed segment or the engine's silence endpoint.
   */
  continuous?: boolean
}

/** What the host's recognition engine can do right now — check before showing dictation UI. */
export interface SpeechRecognitionAvailability {
  /** A session can plausibly start. */
  available: boolean
  /**
   * Why `available` is `false`, when known: `'unsupported'` — no engine on
   * this platform; `'language-unsupported'` — the engine exists but not for
   * the requested language; `'service-unavailable'` — the engine's backing
   * service is unreachable. `null` when `available` is `true`.
   */
  reason: 'unsupported' | 'language-unsupported' | 'service-unavailable' | null
  /**
   * The BCP-47 language the availability answer applies to — the requested
   * language or the resolved platform default. `''` when the capability is
   * unsupported and no language was requested.
   */
  lang: string
  /**
   * Whether recognition for `lang` requires the network. `null` when the
   * capability is unsupported.
   */
  networkUse: SpeechNetworkUse | null
  /** The engine can honor `continuous: true`. */
  continuous: boolean
}

/** Machine-readable failure classification for {@link SpeechRecognitionResult.error}. */
export type SpeechRecognitionErrorCode =
  /** Microphone or speech-recognition permission was refused. */
  | 'permission-denied'
  /** The engine cannot recognize the requested language. */
  | 'language-unsupported'
  /** The recognition service is unreachable or disabled. */
  | 'service-unavailable'
  /** A network-dependent engine could not reach its service. */
  | 'network'
  /** No usable audio input device, or the capture path failed. */
  | 'audio-capture'
  /** The engine heard silence or unintelligible audio for the whole session. */
  | 'no-speech'
  /** The OS or browser interrupted the session — a phone call, app
   *  backgrounding, or a competing recognizer. */
  | 'interrupted'
  /** Another recognition session was already active. */
  | 'busy'
  /** A requested {@link SpeechRecognitionOptions} value is unsupported. */
  | 'unsupported-option'
  /** Anything else; inspect {@link SpeechRecognitionError.nativeCode}. */
  | 'unknown'

/**
 * A failed session's classified error. `code` is stable across platforms;
 * `nativeCode` preserves the platform's own value (a Web Speech error
 * string, an `android.speech.SpeechRecognizer` `ERROR_*` int, an
 * `SFSpeechRecognizerErrorCode`) for logging.
 */
export class SpeechRecognitionError extends Error {
  /** Platform-neutral classification. */
  readonly code: SpeechRecognitionErrorCode
  /** The platform's original error value, `null` when the core raised it. */
  readonly nativeCode: string | number | null

  constructor(
    code: SpeechRecognitionErrorCode,
    message?: string,
    options?: { nativeCode?: string | number | null; cause?: unknown },
  ) {
    super(message ?? code, options?.cause === undefined ? undefined : { cause: options.cause })
    this.name = 'SpeechRecognitionError'
    this.code = code
    this.nativeCode = options?.nativeCode ?? null
  }
}

/**
 * Lifecycle of one dictation session. `'starting'` covers permission and
 * engine spin-up before audio flows; `'stopping'` covers the drain after
 * {@link SpeechRecognitionSession.stop} while the engine produces its final
 * transcript.
 */
export type SpeechSessionState = 'starting' | 'listening' | 'stopping' | 'ended'

/** Why a session ended. */
export type SpeechSessionEndReason =
  /** The engine finished on its own — a committed segment in a
   *  non-continuous session, or the engine's endpoint. */
  | 'completed'
  /** `stop()` drained the session (possibly via the fallback timeout). */
  | 'stopped'
  /** `abort()` released the session. */
  | 'aborted'
  /** The session failed; `error` carries the classified cause. */
  | 'error'

/** The resolved value of {@link SpeechRecognitionSession.result}. */
export interface SpeechRecognitionResult {
  /** The last cumulative transcript the session produced. */
  transcript: string
  /** Why the session ended. */
  reason: SpeechSessionEndReason
  /** The classified failure when `reason` is `'error'`, otherwise `null`. */
  error: SpeechRecognitionError | null
}

/** Events delivered to {@link SpeechRecognitionSession.subscribe} listeners. */
export type SpeechRecognitionEvent =
  /** The session changed lifecycle state. */
  | { type: 'state'; state: SpeechSessionState }
  /**
   * The cumulative transcript changed. `isFinal: true` commits everything
   * in `transcript`; interim events are suppressed when the session was
   * started with `interimResults: false`.
   */
  | { type: 'transcript'; transcript: string; isFinal: boolean }
  /** Terminal event — `result` is resolved and listeners are released. */
  | { type: 'end'; result: SpeechRecognitionResult }

/**
 * One dictation session, created synchronously by
 * {@link SpeechRecognitionImpl.start}. Events are delivered from engine
 * callbacks; subscribing immediately after `start()` catches every event.
 */
export interface SpeechRecognitionSession {
  /** Current lifecycle state. */
  readonly state: SpeechSessionState
  /** The BCP-47 language the session is recognizing. */
  readonly lang: string
  /** Committed segments plus the current hypothesis — the last emitted text. */
  readonly transcript: string
  /** Resolves once, when the session ends; never rejects. */
  readonly result: Promise<SpeechRecognitionResult>
  /**
   * Add an event listener; returns an unsubscribe function. Subscribing
   * after the session ended is a no-op. A throwing listener does not
   * affect other listeners or the session.
   */
  subscribe(listener: (event: SpeechRecognitionEvent) => void): () => void
  /**
   * Stop capturing audio and wait for the final transcript (a short
   * fallback guarantees resolution). Resolves with the session result;
   * calling after the session ended returns that same result.
   */
  stop(): Promise<SpeechRecognitionResult>
  /** Release the engine immediately without awaiting a final transcript. */
  abort(): void
}

/** The speech-recognition capability surface. */
export interface SpeechRecognitionImpl {
  /**
   * Probe the engine for `lang` — availability, network use, and whether
   * `continuous` can be honored. Resolves to an unsupported shape when the
   * capability is absent.
   */
  getAvailability(options?: { lang?: string }): Promise<SpeechRecognitionAvailability>
  /**
   * Begin a dictation session synchronously — subscribing on the returned
   * session catches every event. Throws `UnavailabilityError` when
   * `supported` is `false`; ends a new session with a `'busy'` error when
   * another session is already active.
   */
  start(options?: SpeechRecognitionOptions): SpeechRecognitionSession
}
