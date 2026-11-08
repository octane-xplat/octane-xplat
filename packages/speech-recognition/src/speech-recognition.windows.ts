// Windows leaf — WinRT `Windows.Media.SpeechRecognition.SpeechRecognizer`
// with a dictation topic constraint, driven through the NativeScript
// Windows preview's `Windows`/`NSWinRT` projections. Feasibility evidence:
// tests/windows-feasibility.md (API projected, constraint compile succeeds,
// RecognizeAsync gated only by the interactive mic-consent prompt).
//
// Every projection touch is inside a function so this module loads in any
// environment for typegen and bundled leaves.
import { createSpeechService } from './session-core'
import type {
  SpeechBeginOptions,
  SpeechEngine,
  SpeechEngineHandle,
  SpeechEngineSink,
} from './session-core'

import { SpeechRecognitionError } from './types'
import type {
  SpeechRecognitionAvailability,
  SpeechRecognitionErrorCode,
  SpeechRecognitionImpl,
} from './types'

import type { Permissioned, PermissionResponse } from '@octane-xplat/lib/capability'

const projection = (): any => (globalThis as any).Windows
const NSWinRT = (): any => (globalThis as any).NSWinRT

const speechApi = () => projection()?.Media?.SpeechRecognition

const toPromise = (op: any): Promise<any> => {
  const bridge = NSWinRT()

  if (bridge?.toPromise && op != null) {
    return bridge.toPromise(op)
  }

  if (op?.done) {
    return new Promise((resolve, reject) => {
      try {
        op.done(resolve, reject)
      } catch (cause) {
        reject(cause)
      }
    })
  }

  return Promise.resolve(op)
}

// AppCapabilityAccessStatus — enums have no enumerable members in the
// projection, so values are literal (probe-verified).
const ACCESS_DENIED_BY_SYSTEM = 0
const ACCESS_NOT_DECLARED = 1
const ACCESS_DENIED_BY_USER = 2
const ACCESS_PROMPT_REQUIRED = 3
const ACCESS_ALLOWED = 4

const micCapability = (): any =>
  projection()?.Security?.Authorization?.AppCapabilityAccess?.AppCapability?.Create?.('microphone')

// SpeechRecognitionResultStatus literals (enum members are not enumerable).
const STATUS_SUCCESS = 0
const STATUS_INTERRUPTED = 1
const STATUS_GRAMMAR_COMPILATION_FAILURE = 2
const STATUS_GRAMMAR_LANGUAGE_MISMATCH = 3
const STATUS_MUTED = 4
const STATUS_CANCELED = 5
const STATUS_LANGUAGE_NOT_SUPPORTED = 6
const STATUS_USER_LANGUAGE_MISMATCH = 7
const STATUS_PAUSE_LIMIT = 8
const STATUS_TIMEOUT = 9
const STATUS_NETWORK = 10
const STATUS_MIC_UNAVAILABLE = 11
const STATUS_AUDIO_QUALITY = 13
const STATUS_TOPIC_LANGUAGE_NOT_SUPPORTED = 14

// Non-fatal per-utterance results — in a continuous dictation loop these
// mean "that utterance ended without text"; keep listening.
const RETRYABLE_STATUS: ReadonlySet<number> = new Set([STATUS_PAUSE_LIMIT, STATUS_TIMEOUT])

// 0x80045509 as a signed int32 — SPERR_SPEECH_PRIVACY_POLICY_NOT_ACCEPTED,
// thrown when the "online speech recognition" privacy consent is declined.
const HR_PRIVACY_NOT_ACCEPTED = 0x80045509 | 0

/** Classify a SpeechRecognitionResultStatus or thrown WinRT hresult. */
export function mapWindowsSpeechError(
  statusOrHresult: number,
  message?: string,
): SpeechRecognitionError {
  let code: SpeechRecognitionErrorCode

  switch (statusOrHresult) {
    case HR_PRIVACY_NOT_ACCEPTED:
      code = 'permission-denied'
      break
    case STATUS_INTERRUPTED:
    case STATUS_CANCELED:
      code = 'interrupted'
      break
    case STATUS_NETWORK:
      code = 'network'
      break
    case STATUS_MIC_UNAVAILABLE:
    case STATUS_MUTED:
    case STATUS_AUDIO_QUALITY:
      code = 'audio-capture'
      break
    case STATUS_PAUSE_LIMIT:
    case STATUS_TIMEOUT:
      code = 'no-speech'
      break
    case STATUS_LANGUAGE_NOT_SUPPORTED:
    case STATUS_TOPIC_LANGUAGE_NOT_SUPPORTED:
    case STATUS_USER_LANGUAGE_MISMATCH:
    case STATUS_GRAMMAR_LANGUAGE_MISMATCH:
      code = 'language-unsupported'
      break
    case STATUS_GRAMMAR_COMPILATION_FAILURE:
      code = 'service-unavailable'
      break
    default:
      code = 'unknown'
  }

  return new SpeechRecognitionError(
    code,
    message ?? `Speech recognition failed: ${statusOrHresult}`,
    {
      nativeCode: statusOrHresult,
    },
  )
}

const hresultOf = (cause: unknown): number | null => {
  const value = (cause as any)?.number ?? (cause as any)?.hresult

  if (typeof value === 'number') {
    return value | 0
  }

  const match = /0x[0-9a-fA-F]+/.exec(String((cause as any)?.message ?? ''))

  return match ? Number(match[0]) | 0 : null
}

const accessToPermission = (status: number | undefined): PermissionResponse => {
  switch (status) {
    case ACCESS_ALLOWED:
      return { status: 'granted', granted: true, canAskAgain: true }
    case ACCESS_PROMPT_REQUIRED:
      return { status: 'undetermined', granted: false, canAskAgain: true }
    case ACCESS_DENIED_BY_USER:
    case ACCESS_DENIED_BY_SYSTEM:
      return { status: 'denied', granted: false, canAskAgain: false }
    case ACCESS_NOT_DECLARED:
      // Host manifest lacks the microphone DeviceCapability — nothing can
      // prompt; the capability is unavailable to this app until repackaged.
      return { status: 'unsupported', granted: false, canAskAgain: false }
    default:
      return { status: 'undetermined', granted: false, canAskAgain: true }
  }
}

function readPermission(): Promise<PermissionResponse> {
  try {
    const capability = micCapability()

    return Promise.resolve(accessToPermission(capability?.CheckAccess?.()))
  } catch {
    return Promise.resolve({ status: 'undetermined', granted: false, canAskAgain: true })
  }
}

async function ensurePermission(): Promise<PermissionResponse> {
  try {
    const capability = micCapability()

    if (!capability) {
      return { status: 'undetermined', granted: false, canAskAgain: true }
    }

    const current = accessToPermission(capability.CheckAccess())

    if (current.status !== 'undetermined') {
      return current
    }

    return accessToPermission(await toPromise(capability.RequestAccessAsync()))
  } catch {
    return { status: 'denied', granted: false, canAskAgain: false }
  }
}

const defaultLang = (): string => {
  const api = speechApi()

  try {
    return String(api?.SpeechRecognizer?.SystemSpeechLanguage?.LanguageTag ?? 'en-US')
  } catch {
    return 'en-US'
  }
}

function availability(lang?: string): Promise<SpeechRecognitionAvailability> {
  const api = speechApi()
  const resolved = lang ?? defaultLang()
  const unsupported: SpeechRecognitionAvailability = {
    available: false,
    reason: 'unsupported',
    lang: resolved,
    networkUse: null,
    continuous: false,
  }

  if (!api?.SpeechRecognizer) {
    return Promise.resolve(unsupported)
  }

  try {
    // Constructing a recognizer for an unsupported language throws — this is
    // the only language probe; SupportedTopicLanguages items resolve as
    // "undefined" in the projection and cannot be enumerated.
    const Language = projection()?.Globalization?.Language
    const recognizer = Language
      ? new api.SpeechRecognizer(new Language(resolved))
      : new api.SpeechRecognizer()

    recognizer?.Dispose?.()
    return Promise.resolve({
      available: true,
      reason: null,
      lang: resolved,
      // Dictation goes through the online speech service — it needs the
      // "online speech recognition" privacy consent (0x80045509 when declined).
      networkUse: 'required',
      continuous: true,
    })
  } catch {
    return Promise.resolve({
      available: false,
      reason: 'language-unsupported',
      lang: resolved,
      networkUse: null,
      continuous: true,
    })
  }
}

const HYPOTHESIS_DELEGATE =
  'Windows.Foundation.TypedEventHandler`2<Windows.Media.SpeechRecognition.SpeechRecognizer,Windows.Media.SpeechRecognition.SpeechRecognitionHypothesisGeneratedEventArgs>'

const STATE_DELEGATE =
  'Windows.Foundation.TypedEventHandler`2<Windows.Media.SpeechRecognition.SpeechRecognizer,Windows.Media.SpeechRecognition.SpeechRecognizerStateChangedEventArgs>'

function begin(options: SpeechBeginOptions, sink: SpeechEngineSink): SpeechEngineHandle {
  const api = speechApi()
  const Language = projection()?.Globalization?.Language
  const recognizer = Language
    ? new api.SpeechRecognizer(new Language(options.lang))
    : new api.SpeechRecognizer()

  let closed = false
  let finishing = false
  let listeningSent = false
  const bridge = NSWinRT()
  const asDelegate = (type: string, handler: (sender: any, args: any) => void) =>
    bridge?.asDelegate ? bridge.asDelegate(type, handler) : handler

  if (options.interimResults) {
    // HypothesisGenerated partial text is per-utterance — each RecognizeAsync
    // result is one segment the core commits.
    recognizer.HypothesisGenerated = asDelegate(HYPOTHESIS_DELEGATE, (_sender, args) => {
      const text = String(args?.Hypothesis?.Text ?? '')

      if (text !== '') {
        sink.hypothesis(text, false)
      }
    })
  }

  recognizer.StateChanged = asDelegate(STATE_DELEGATE, (_sender, args) => {
    // SpeechRecognizerState: 1 Capturing, 3 SoundStarted — the first
    // non-idle state means capture is live.
    if (!listeningSent && (args?.State === 1 || args?.State === 3)) {
      listeningSent = true
      sink.listening()
    }
  })

  const release = () => {
    try {
      recognizer.HypothesisGenerated = null
      recognizer.StateChanged = null
    } catch {
      // The projection may not support delegate removal — Dispose covers it.
    }

    try {
      // IClosable — the projection may expose Dispose, Close, or close.
      const close = recognizer.Dispose ?? recognizer.Close ?? recognizer.close

      close?.call(recognizer)
    } catch {
      // Already disposed.
    }
  }

  const loop = async () => {
    const constraint = new api.SpeechRecognitionTopicConstraint(
      api.SpeechRecognitionScenario?.Dictation ?? 0,
      'dictation',
    )

    try {
      recognizer.Constraints.Append(constraint)

      const compiled = await toPromise(recognizer.CompileConstraintsAsync())
      const compileStatus = compiled?.Status ?? STATUS_SUCCESS

      if (compileStatus !== STATUS_SUCCESS) {
        sink.failed(mapWindowsSpeechError(compileStatus, 'Dictation constraint compilation failed'))
        return
      }
    } catch (cause) {
      if (!closed) {
        sink.failed(
          mapWindowsSpeechError(
            hresultOf(cause) ?? STATUS_GRAMMAR_COMPILATION_FAILURE,
            cause instanceof Error ? cause.message : 'Dictation constraint compilation failed',
          ),
        )
      }

      return
    }

    while (!closed) {
      try {
        if (!listeningSent) {
          listeningSent = true
          sink.listening()
        }

        const result = await toPromise(recognizer.RecognizeAsync())

        if (closed) {
          return
        }

        const status = result?.Status ?? 12 /* Unknown */

        if (status === STATUS_SUCCESS) {
          const text = String(result?.Text ?? '')

          if (text !== '') {
            sink.hypothesis(text, true)
          }

          if (finishing || !options.continuous) {
            sink.finished()
            return
          }

          continue
        }

        if (RETRYABLE_STATUS.has(status)) {
          if (finishing) {
            sink.finished()
            return
          }

          // A silence timeout with no committed segment is a genuine
          // 'no-speech' outcome for non-continuous sessions — continuous
          // dictation just keeps listening.
          if (!options.continuous) {
            sink.failed(mapWindowsSpeechError(status, `Recognition ended with status ${status}`))
            return
          }

          continue
        }

        sink.failed(mapWindowsSpeechError(status, `Recognition ended with status ${status}`))
        return
      } catch (cause) {
        if (!closed) {
          sink.failed(
            mapWindowsSpeechError(
              hresultOf(cause) ?? 12 /* Unknown */,
              cause instanceof Error ? cause.message : 'Speech recognition failed',
            ),
          )
        }

        return
      }
    }
  }

  void loop()

  return {
    finish: () => {
      finishing = true
    },
    cancel: () => {
      closed = true
      release()
    },
  }
}

const engine: SpeechEngine = {
  get supported() {
    return speechApi()?.SpeechRecognizer != null
  },
  defaultLang,
  readPermission,
  ensurePermission,
  availability,
  begin,
  // RecognizeAsync ends each utterance on its own silence timeout; the loop
  // does not need an extra engine-requested endpoint.
}

/** Speech recognition service — WinRT dictation engine. */
export const speechRecognition: Permissioned<SpeechRecognitionImpl> = createSpeechService(engine)
