// Session core — DOM-free orchestration shared by every platform leaf. A
// leaf supplies a small SpeechEngine; this module owns the session
// lifecycle, single-active-session arbitration, the permission gate,
// transcript accumulation, and event fan-out. It must stay free of DOM and
// web-only runtime APIs so native leaves can share it verbatim.
import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { Permissioned, PermissionResponse } from '@octane-xplat/lib/capability'
import { SpeechRecognitionError } from './types'
import type {
  SpeechRecognitionAvailability,
  SpeechRecognitionErrorCode,
  SpeechRecognitionEvent,
  SpeechRecognitionImpl,
  SpeechRecognitionOptions,
  SpeechRecognitionResult,
  SpeechRecognitionSession,
  SpeechSessionEndReason,
  SpeechSessionState,
} from './types'

/** Callbacks an engine uses to report into the core. */
export interface SpeechEngineSink {
  /** Audio capture is live; the session leaves 'starting'. */
  listening(): void
  /**
   * One recognition update. `text` replaces the uncommitted hypothesis, or —
   * when `segmentFinal` is true — commits one finalized segment and clears
   * the hypothesis.
   */
  hypothesis(text: string, segmentFinal: boolean): void
  /** The recognizer finished normally; the core cancels the handle to
   *  release whatever the engine still holds. */
  finished(): void
  /** The recognizer failed; also the app-lifecycle interruption hook. */
  failed(error: SpeechRecognitionError): void
}

/** The engine-side control surface of a begun capture. */
export interface SpeechEngineHandle {
  /** Stop audio input and let the engine produce its final transcript. */
  finish(): void
  /** Release everything immediately. Must be idempotent. */
  cancel(): void
}

/** Fully resolved options handed to an engine's `begin`. */
export interface SpeechBeginOptions {
  lang: string
  interimResults: boolean
  continuous: boolean
}

/** The engine contract a platform leaf implements. */
export interface SpeechEngine {
  /** The engine exists on this host. Read live — leaves may answer lazily. */
  readonly supported: boolean
  /** The platform's BCP-47 default language. */
  defaultLang(): string
  /** Read permission state without prompting. */
  readPermission(): Promise<PermissionResponse>
  /** Request permission — may show the system prompt. */
  ensurePermission(): Promise<PermissionResponse>
  /** Probe availability for `lang` (the resolved default when omitted). */
  availability(lang?: string): Promise<SpeechRecognitionAvailability>
  /** Start capture. Returning throws land as an `'unknown'` session error. */
  begin(options: SpeechBeginOptions, sink: SpeechEngineSink): SpeechEngineHandle
  /**
   * Optional silence endpoint, in milliseconds: after a non-empty
   * hypothesis goes unchanged for this long in a non-continuous session,
   * the core calls `finish()` on the handle.
   */
  silenceEndpointMs?: number
}

const FEATURE = 'speech recognition'
const STOP_FALLBACK_MS = 5000

const UNSUPPORTED_PERMISSION: PermissionResponse = {
  status: 'unsupported',
  granted: false,
  canAskAgain: false,
}

const UNSUPPORTED_AVAILABILITY: SpeechRecognitionAvailability = {
  available: false,
  reason: 'unsupported',
  lang: '',
  networkUse: null,
  continuous: false,
}

// `reason` 'unsupported' reaches a session only when an engine reported
// supported but then declared the capability absent — 'service-unavailable'
// is the closest public code.
const AVAILABILITY_ERROR: Record<string, SpeechRecognitionErrorCode> = {
  unsupported: 'service-unavailable',
  'language-unsupported': 'language-unsupported',
  'service-unavailable': 'service-unavailable',
}

const asSpeechError = (cause: unknown): SpeechRecognitionError =>
  cause instanceof SpeechRecognitionError
    ? cause
    : new SpeechRecognitionError(
        'unknown',
        cause instanceof Error ? cause.message : 'Speech recognition failed',
        { cause },
      )

/**
 * Build the public `speechRecognition` service on top of a platform engine.
 * Pass `null` on platforms with no engine — the service reports
 * `supported: false` and `start()` throws `UnavailabilityError`.
 */
export function createSpeechService(
  engine: SpeechEngine | null,
): Permissioned<SpeechRecognitionImpl> {
  // Module-wide arbitration: one session per service instance.
  let active: Session | null = null

  interface Session {
    state: SpeechSessionState
    readonly lang: string
    readonly continuous: boolean
    readonly interimResults: boolean
    committed: string[]
    hypothesis: string
    lastEmitted: { transcript: string; isFinal: boolean } | null
    listeners: Set<(event: SpeechRecognitionEvent) => void>
    ended: boolean
    handle: SpeechEngineHandle | null
    // Set when the core asked the engine to finish — 'stopped' from stop(),
    // 'completed' from the silence endpoint. finished() resolves with it.
    finishRequested: 'stopped' | 'completed' | null
    fallbackTimer: ReturnType<typeof setTimeout> | null
    silenceTimer: ReturnType<typeof setTimeout> | null
    result: Promise<SpeechRecognitionResult>
    resolve: (result: SpeechRecognitionResult) => void
  }

  function start(options?: SpeechRecognitionOptions): SpeechRecognitionSession {
    if (engine === null || !engine.supported) {
      throw new UnavailabilityError(FEATURE)
    }

    const lang = options?.lang ?? engine.defaultLang()
    const continuous = options?.continuous ?? false
    const interimResults = options?.interimResults ?? true

    let resolveResult: (result: SpeechRecognitionResult) => void = () => {}
    const result = new Promise<SpeechRecognitionResult>((resolve) => {
      resolveResult = resolve
    })

    const session: Session = {
      state: 'starting',
      lang,
      continuous,
      interimResults,
      committed: [],
      hypothesis: '',
      lastEmitted: null,
      listeners: new Set(),
      ended: false,
      handle: null,
      finishRequested: null,
      fallbackTimer: null,
      silenceTimer: null,
      result,
      resolve: resolveResult,
    }

    const transcriptText = (): string => {
      const committed = session.committed.join(' ')
      return committed !== '' && session.hypothesis !== ''
        ? `${committed} ${session.hypothesis}`
        : committed || session.hypothesis
    }

    // Listener isolation: one throwing listener must not break the others
    // or the session.
    const emit = (event: SpeechRecognitionEvent): void => {
      for (const listener of session.listeners) {
        try {
          listener(event)
        } catch {
          // Swallowed — see above.
        }
      }
    }

    const setState = (state: SpeechSessionState): void => {
      if (session.ended) {
        return
      }

      session.state = state
      emit({ type: 'state', state })
    }

    const clearTimers = (): void => {
      if (session.fallbackTimer !== null) {
        clearTimeout(session.fallbackTimer)
        session.fallbackTimer = null
      }

      if (session.silenceTimer !== null) {
        clearTimeout(session.silenceTimer)
        session.silenceTimer = null
      }
    }

    const cancelEngine = (): void => {
      try {
        session.handle?.cancel()
      } catch {
        // Engine cancel is required to be idempotent; a throwing engine
        // must not block teardown.
      }
    }

    // First end wins — later engine callbacks are ignored.
    const end = (
      reason: SpeechSessionEndReason,
      error: SpeechRecognitionError | null,
      releaseEngine: boolean,
    ): void => {
      if (session.ended) {
        return
      }

      session.ended = true
      if (releaseEngine) {
        cancelEngine()
      }

      clearTimers()
      session.state = 'ended'
      emit({ type: 'state', state: 'ended' })
      const value: SpeechRecognitionResult = {
        transcript: transcriptText(),
        reason,
        error,
      }
      emit({ type: 'end', result: value })
      session.listeners.clear()
      if (active === session) {
        active = null
      }

      session.resolve(value)
    }

    const armFallback = (): void => {
      if (session.ended || session.fallbackTimer !== null) {
        return
      }

      session.fallbackTimer = setTimeout(() => {
        session.fallbackTimer = null
        // The engine did not finish in time — the fallback cancels it and
        // resolves with the requested reason.
        cancelEngine()
        end(session.finishRequested ?? 'stopped', null, false)
      }, STOP_FALLBACK_MS)
    }

    const requestFinish = (reason: 'stopped' | 'completed'): void => {
      if (session.ended || session.finishRequested !== null) {
        return
      }

      session.finishRequested = reason
      if (session.handle !== null) {
        try {
          session.handle.finish()
        } catch {
          cancelEngine()
          end(reason, null, false)
          return
        }
      }

      armFallback()
    }

    const emitTranscript = (isFinal: boolean): void => {
      if (!isFinal && !session.interimResults) {
        return
      }

      const transcript = transcriptText()
      const last = session.lastEmitted
      if (last !== null && last.transcript === transcript && last.isFinal === isFinal) {
        return
      }

      session.lastEmitted = { transcript, isFinal }
      emit({ type: 'transcript', transcript, isFinal })
    }

    const armSilenceEndpoint = (): void => {
      const ms = engine.silenceEndpointMs
      if (
        session.continuous ||
        ms === undefined ||
        session.ended ||
        session.finishRequested !== null ||
        session.hypothesis === ''
      ) {
        return
      }

      if (session.silenceTimer !== null) {
        clearTimeout(session.silenceTimer)
      }

      session.silenceTimer = setTimeout(() => {
        session.silenceTimer = null
        requestFinish('completed')
      }, ms)
    }

    const sink: SpeechEngineSink = {
      listening() {
        if (session.state === 'starting') {
          setState('listening')
        }
      },
      hypothesis(text, segmentFinal) {
        if (session.ended) {
          return
        }

        if (session.state === 'starting') {
          setState('listening')
        }

        if (segmentFinal) {
          const segment = text.trim()
          if (segment !== '') {
            session.committed.push(segment)
          }

          session.hypothesis = ''
        } else {
          // Trim so the committed + hypothesis join stays single-spaced —
          // engines like Web Speech lead continuation text with a space.
          session.hypothesis = text.trim()
        }

        emitTranscript(segmentFinal)
        // A committed segment completes a non-continuous session unless a
        // finish is already in flight — then finished() reports the reason.
        if (segmentFinal && !session.continuous && session.finishRequested === null) {
          end('completed', null, true)
          return
        }

        armSilenceEndpoint()
      },
      finished() {
        // Release the engine here too — the Apple facade's finished path
        // only stops capture (teardown); the instance keeps its task,
        // request, and engine references until cancel(). Web's handle is
        // already released by its own onend — the extra cancel is a no-op.
        end(session.finishRequested ?? 'completed', null, true)
      },
      failed(error) {
        end('error', asSpeechError(error), true)
      },
    }

    const beginCapture = async (): Promise<void> => {
      // Cheap gates run before the permission prompt so a session that
      // cannot run never asks for the microphone.
      let availability: SpeechRecognitionAvailability | null = null
      try {
        availability = await engine.availability(session.lang)
      } catch {
        // A failed probe must not block sessions — engines still enforce
        // their own limits and report them through failed().
      }

      if (session.ended) {
        return
      }

      if (availability !== null && !availability.available) {
        const code = availability.reason
          ? (AVAILABILITY_ERROR[availability.reason] ?? 'unknown')
          : 'unknown'
        end(
          'error',
          new SpeechRecognitionError(
            code,
            `Speech recognition is not available for ${session.lang}`,
          ),
          false,
        )
        return
      }

      if (
        session.continuous &&
        availability !== null &&
        availability.continuous === false
      ) {
        end(
          'error',
          new SpeechRecognitionError(
            'unsupported-option',
            'Continuous recognition is not supported on this platform',
          ),
          false,
        )
        return
      }

      let permission: PermissionResponse
      try {
        permission = await engine.readPermission()
      } catch {
        permission = { status: 'undetermined', granted: false, canAskAgain: true }
      }

      if (session.ended) {
        return
      }

      if (permission.status === 'undetermined') {
        permission = await engine.ensurePermission()
        if (session.ended) {
          return
        }
      }

      if (!permission.granted) {
        end(
          'error',
          new SpeechRecognitionError(
            'permission-denied',
            'Speech recognition permission was not granted',
          ),
          false,
        )
        return
      }

      try {
        session.handle = engine.begin(
          {
            lang: session.lang,
            interimResults: session.interimResults,
            continuous: session.continuous,
          },
          sink,
        )
      } catch (cause) {
        end('error', asSpeechError(cause), true)
        return
      }

      if (session.ended) {
        // abort() landed inside a synchronous begin callback — release the
        // handle that just came back.
        cancelEngine()
        return
      }

      // stop() may have landed while the engine spun up — finish at once.
      if (session.finishRequested !== null && session.handle !== null) {
        const requested = session.finishRequested
        session.finishRequested = null
        requestFinish(requested)
      }
    }

    const subscribe = (listener: (event: SpeechRecognitionEvent) => void): (() => void) => {
      if (session.ended) {
        return () => {}
      }

      session.listeners.add(listener)
      return () => {
        session.listeners.delete(listener)
      }
    }

    const stop = (): Promise<SpeechRecognitionResult> => {
      if (
        !session.ended &&
        session.finishRequested === null &&
        (session.state === 'listening' || session.state === 'starting')
      ) {
        setState('stopping')
      }

      requestFinish('stopped')
      return session.result
    }

    const abort = (): void => {
      if (session.ended) {
        return
      }

      cancelEngine()
      end('aborted', null, false)
    }

    const publicSession: SpeechRecognitionSession = {
      get state() {
        return session.state
      },
      get lang() {
        return session.lang
      },
      get transcript() {
        return transcriptText()
      },
      result,
      subscribe,
      stop,
      abort,
    }

    // A second concurrent session ends with 'busy', delivered asynchronously
    // so a listener attached right after start() still observes the end.
    if (active !== null) {
      void Promise.resolve().then(() => {
        end(
          'error',
          new SpeechRecognitionError(
            'busy',
            'Another speech recognition session is already active',
          ),
          false,
        )
      })
      return publicSession
    }

    active = session
    void beginCapture().catch((cause) => {
      end('error', asSpeechError(cause), true)
    })
    return publicSession
  }

  const unsupportedAvailability = (lang?: string): SpeechRecognitionAvailability => ({
    ...UNSUPPORTED_AVAILABILITY,
    lang: lang ?? '',
  })

  const service: Permissioned<SpeechRecognitionImpl> = {
    get supported() {
      return engine !== null && engine.supported
    },
    async isAvailable() {
      if (engine === null || !engine.supported) {
        return false
      }

      try {
        return (await engine.availability()).available
      } catch {
        return false
      }
    },
    getPermissions() {
      return engine === null || !engine.supported
        ? Promise.resolve(UNSUPPORTED_PERMISSION)
        : engine.readPermission()
    },
    requestPermissions() {
      return engine === null || !engine.supported
        ? Promise.resolve(UNSUPPORTED_PERMISSION)
        : engine.ensurePermission()
    },
    async getAvailability(options) {
      if (engine === null || !engine.supported) {
        return unsupportedAvailability(options?.lang)
      }

      try {
        return await engine.availability(options?.lang)
      } catch {
        return {
          available: false,
          reason: 'service-unavailable',
          lang: options?.lang ?? engine.defaultLang(),
          networkUse: null,
          continuous: false,
        }
      }
    },
    start,
  }

  return service
}
