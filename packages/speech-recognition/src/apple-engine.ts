// Apple speech engine — shared by the iOS and macOS leaves over the
// XplatSpeechRecognizer ObjC facade (platforms/{ios,macos}). The facade is
// a bridge global like XplatGeolocation: present only inside a native
// bundle that compiled the platform sources, so `supported` requires both
// the global and a configured host bundle.
import type { Permissioned, PermissionResponse } from '@octane-xplat/lib/capability'
import { mapAppleSpeechError } from './error-map'
import { createSpeechService } from './session-core'
import type {
  SpeechBeginOptions,
  SpeechEngine,
  SpeechEngineHandle,
  SpeechEngineSink,
} from './session-core'
import { SpeechRecognitionError } from './types'
import type { SpeechRecognitionAvailability, SpeechRecognitionImpl } from './types'

interface XplatSpeechRecognizerInstance {
  finish(): void
  cancel(): void
}

declare const XplatSpeechRecognizer: {
  defaultLanguage(): string
  isConfigured(): boolean
  permissionStatus(): string
  requestPermission(completion: (status: string) => void): void
  availabilityJSON(lang: string): string
  startWithLanguageInterimResultsContinuousOnEvent(
    lang: string,
    interimResults: boolean,
    continuous: boolean,
    onEvent: (
      type: string,
      text: string,
      segmentFinal: boolean,
      errorDomain: string,
      errorCode: number,
      message: string,
    ) => void,
  ): XplatSpeechRecognizerInstance | null
}

const present = (): boolean =>
  typeof XplatSpeechRecognizer !== 'undefined' && XplatSpeechRecognizer.isConfigured()

interface AppleAvailabilityPayload {
  available: boolean
  reason: 'language-unsupported' | 'service-unavailable' | null
  lang: string
  onDevice: boolean
}

// The bridge carries JSON — validate once at ingress into the named type.
// The single `Record` assertion is the documented bound on untrusted data.
function parseAvailability(json: string): AppleAvailabilityPayload | null {
  try {
    const value = JSON.parse(json) as Record<string, unknown> | null
    if (typeof value !== 'object' || value === null) {
      return null
    }

    const { available, reason, lang, onDevice } = value
    if (typeof available !== 'boolean' || typeof lang !== 'string' || typeof onDevice !== 'boolean') {
      return null
    }
    if (reason === null || reason === 'language-unsupported' || reason === 'service-unavailable') {
      return { available, reason, lang, onDevice }
    }

    return null
  } catch {
    return null
  }
}

const mapPermission = (status: string): PermissionResponse =>
  status === 'granted'
    ? { status: 'granted', granted: true, canAskAgain: true }
    : status === 'undetermined'
      ? { status: 'undetermined', granted: false, canAskAgain: true }
      : status === 'denied'
        ? { status: 'denied', granted: false, canAskAgain: false }
        : { status: 'unsupported', granted: false, canAskAgain: false }

function availability(lang?: string): Promise<SpeechRecognitionAvailability> {
  if (!present()) {
    return Promise.resolve({
      available: false,
      reason: 'unsupported',
      lang: lang ?? '',
      networkUse: null,
      continuous: false,
    })
  }

  const resolved = lang ?? XplatSpeechRecognizer.defaultLanguage()
  const payload = parseAvailability(XplatSpeechRecognizer.availabilityJSON(resolved))
  if (payload === null) {
    return Promise.resolve({
      available: false,
      reason: 'service-unavailable',
      lang: resolved,
      networkUse: null,
      continuous: false,
    })
  }

  return Promise.resolve({
    available: payload.available,
    reason: payload.reason,
    lang: payload.lang,
    networkUse: payload.available ? (payload.onDevice ? 'possible' : 'required') : null,
    continuous: true,
  })
}

function begin(options: SpeechBeginOptions, sink: SpeechEngineSink): SpeechEngineHandle {
  const instance = XplatSpeechRecognizer.startWithLanguageInterimResultsContinuousOnEvent(
    options.lang,
    options.interimResults,
    options.continuous,
    (type, text, segmentFinal, errorDomain, errorCode, message) => {
      switch (type) {
        case 'listening':
          sink.listening()
          break
        case 'hypothesis':
          sink.hypothesis(text, segmentFinal)
          break
        case 'finished':
          sink.finished()
          break
        case 'interrupted':
          sink.failed(new SpeechRecognitionError('interrupted', message))
          break
        case 'error':
          sink.failed(mapAppleSpeechError(errorDomain, errorCode, message))
          break
      }
    },
  )

  if (instance === null) {
    throw new SpeechRecognitionError('service-unavailable', 'The speech recognizer failed to start')
  }

  return {
    finish: () => instance.finish(),
    cancel: () => instance.cancel(),
  }
}

const engine: SpeechEngine = {
  get supported() {
    return present()
  },
  defaultLang: () => XplatSpeechRecognizer.defaultLanguage(),
  readPermission: () =>
    Promise.resolve(present() ? mapPermission(XplatSpeechRecognizer.permissionStatus()) : mapPermission('')),
  ensurePermission: () =>
    present()
      ? new Promise((resolve) => {
          XplatSpeechRecognizer.requestPermission((status) => resolve(mapPermission(status)))
        })
      : Promise.resolve(mapPermission('')),
  availability,
  begin,
  // Apple's partial results refine in place; two quiet seconds after a
  // non-empty hypothesis is the engine-requested endpoint.
  silenceEndpointMs: 2000,
}

/** Speech recognition service — Apple engine via the shared ObjC facade. */
export const speechRecognition: Permissioned<SpeechRecognitionImpl> = createSpeechService(engine)
