// Speech recognition — web leaf over the W3C Web Speech API
// (`SpeechRecognition`/`webkitSpeechRecognition`). Chrome drives a
// network-backed recognizer; Chrome 139+ exposes the `available()` static
// probe used for per-language availability and on-device detection.
import type {
  Permissioned,
  PermissionResponse,
  PermissionStatus,
} from '@octane-xplat/lib/capability'

import { lookupGlobal } from '@octane-xplat/lib/capability'
import { mapWebSpeechError } from './error-map'
import { createSpeechService } from './session-core'
import type {
  SpeechBeginOptions,
  SpeechEngine,
  SpeechEngineHandle,
  SpeechEngineSink,
} from './session-core'

import { SpeechRecognitionError } from './types'
import type { SpeechRecognitionAvailability, SpeechRecognitionImpl } from './types'

interface WebSpeechAlternative {
  transcript: string
}

interface WebSpeechResult {
  isFinal: boolean
  0: WebSpeechAlternative | undefined
}

interface WebSpeechResultEvent {
  resultIndex: number
  results: { length: number; [index: number]: WebSpeechResult | undefined }
}

interface WebSpeechErrorEvent {
  error: string
  message?: string
}

interface WebSpeechRecognition {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
  onstart: (() => void) | null
  onend: (() => void) | null
  onresult: ((event: WebSpeechResultEvent) => void) | null
  onerror: ((event: WebSpeechErrorEvent) => void) | null
}

interface WebSpeechRecognitionConstructor {
  new (): WebSpeechRecognition
  available?(options: { langs: string[]; processLocally: boolean }): Promise<string>
}

function resolveCtor(): WebSpeechRecognitionConstructor | null {
  // Vendor-prefixed/unprefixed constructors are ambient host capabilities —
  // read through real property checks, not a claimed global shape.
  const ctor = lookupGlobal(['SpeechRecognition']) ?? lookupGlobal(['webkitSpeechRecognition'])
  // A runtime check cannot prove the constructor's call shape — this is the
  // one documented assertion at the capability boundary.
  return typeof ctor === 'function' ? (ctor as WebSpeechRecognitionConstructor) : null
}

const respond = (
  status: PermissionStatus,
  canAskAgain = status !== 'denied' && status !== 'unsupported',
): PermissionResponse => ({
  status,
  granted: status === 'granted',
  canAskAgain,
})

async function readPermission(): Promise<PermissionResponse> {
  if (typeof navigator === 'undefined' || !navigator.permissions?.query) {
    return respond('undetermined')
  }

  try {
    // 'microphone' is in the Permissions registry but missing from TS's
    // PermissionName union — one documented assertion at the boundary.
    // Keep the call on its receiver: Permissions methods require it.
    const status = await navigator.permissions.query({
      name: 'microphone' as PermissionName,
    })

    return respond(status.state === 'prompt' ? 'undetermined' : status.state)
  } catch {
    // Some browsers expose Permissions but cannot query microphone.
    return respond('undetermined')
  }
}

async function ensurePermission(): Promise<PermissionResponse> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return respond('undetermined')
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    for (const track of stream.getTracks()) {
      track.stop()
    }

    return respond('granted')
  } catch (cause) {
    const name =
      typeof cause === 'object' && cause !== null && 'name' in cause ? cause.name : undefined

    if (name === 'NotAllowedError' || name === 'SecurityError') {
      return respond('denied', false)
    }

    // NotFoundError/NotReadableError mean the input device is missing or
    // busy — microphone permission itself is unaffected. Keep the queried
    // state and let the recognizer surface 'audio-capture' if capture
    // really cannot start.
    return readPermission()
  }
}

function defaultLang(): string {
  return typeof navigator === 'undefined' ? '' : navigator.language
}

async function availability(lang?: string): Promise<SpeechRecognitionAvailability> {
  const Ctor = resolveCtor()
  const resolved = lang ?? defaultLang()
  if (Ctor === null) {
    return {
      available: false,
      reason: 'unsupported',
      lang: resolved,
      networkUse: null,
      continuous: false,
    }
  }

  if (typeof Ctor.available !== 'function') {
    // Pre-Chrome-139 engines expose no probe — the service exists and its
    // network path is merely possible.
    return {
      available: true,
      reason: null,
      lang: resolved,
      networkUse: 'possible',
      continuous: true,
    }
  }

  try {
    const remote = await Ctor.available({ langs: [resolved], processLocally: false })
    if (remote === 'unavailable') {
      return {
        available: false,
        reason: 'language-unsupported',
        lang: resolved,
        networkUse: null,
        continuous: true,
      }
    }

    const local = await Ctor.available({ langs: [resolved], processLocally: true })
    return {
      available: true,
      reason: null,
      lang: resolved,
      networkUse: local === 'available' ? 'possible' : 'required',
      continuous: true,
    }
  } catch {
    // A probing failure must not mark a working engine unavailable.
    return {
      available: true,
      reason: null,
      lang: resolved,
      networkUse: 'possible',
      continuous: true,
    }
  }
}

function begin(options: SpeechBeginOptions, sink: SpeechEngineSink): SpeechEngineHandle {
  const Ctor = resolveCtor()
  if (Ctor === null) {
    throw new SpeechRecognitionError('service-unavailable', 'Web Speech API is not available')
  }

  const recognition = new Ctor()
  if (options.lang !== '') {
    recognition.lang = options.lang
  }

  recognition.continuous = options.continuous
  recognition.interimResults = options.interimResults
  recognition.maxAlternatives = 1

  let released = false
  let started = false

  const onVisibilityChange = (): void => {
    if (started && !released && document.visibilityState === 'hidden') {
      // Dictation is a foreground interaction — hide the page and the
      // session ends as interrupted rather than silently capturing.
      release()
      sink.failed(new SpeechRecognitionError('interrupted', 'The page was hidden during dictation'))
    }
  }

  const release = (): void => {
    if (released) {
      return
    }

    released = true
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }

    // Detach before abort() so the engine's 'aborted' callback cannot be
    // misread as an external interruption.
    recognition.onstart = null
    recognition.onend = null
    recognition.onresult = null
    recognition.onerror = null
    try {
      recognition.abort()
    } catch {
      // InvalidStateError when the recognizer never started.
    }
  }

  recognition.onstart = () => {
    started = true
    sink.listening()
  }

  recognition.onresult = (event) => {
    // results is cumulative: entries before resultIndex were already
    // delivered. Finals never change, so each commits exactly once; the
    // trailing non-final entries form the current hypothesis.
    let interim = ''
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const item = event.results[i]
      if (item === undefined) {
        continue
      }

      const transcript = item[0]?.transcript ?? ''
      if (item.isFinal) {
        sink.hypothesis(transcript, true)
      } else {
        interim += transcript
      }
    }

    if (interim !== '') {
      sink.hypothesis(interim, false)
    }
  }

  recognition.onerror = (event) => {
    sink.failed(mapWebSpeechError(event.error))
  }

  recognition.onend = () => {
    release()
    sink.finished()
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisibilityChange)
  }

  recognition.start()

  return {
    finish() {
      if (released) {
        return
      }

      try {
        recognition.stop()
      } catch {
        // InvalidStateError when the recognizer never started.
      }
    },
    cancel() {
      release()
    },
  }
}

const engine: SpeechEngine = {
  get supported() {
    return resolveCtor() !== null
  },
  defaultLang,
  readPermission,
  ensurePermission,
  availability,
  begin,
}

/** Speech recognition service — dictation sessions via the Web Speech API. */
export const speechRecognition: Permissioned<SpeechRecognitionImpl> = createSpeechService(engine)
