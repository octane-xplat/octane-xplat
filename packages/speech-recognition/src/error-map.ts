// Engine error → public SpeechRecognitionErrorCode mappings. Pure and
// DOM-free. Exported from this module for leaf reuse and tests; not
// re-exported from the package root.
import { SpeechRecognitionError } from './types'
import type { SpeechRecognitionErrorCode } from './types'

// Web Speech API SpeechRecognitionErrorCode strings.
// 'aborted' maps to 'interrupted' — the self-abort case never reaches this
// table: the leaf detaches handlers on cancel() and the core ignores
// callbacks after the session ended.
const WEB_CODES: Record<string, SpeechRecognitionErrorCode> = {
  'not-allowed': 'permission-denied',
  'service-not-allowed': 'service-unavailable',
  network: 'network',
  'audio-capture': 'audio-capture',
  'no-speech': 'no-speech',
  'language-not-supported': 'language-unsupported',
  aborted: 'interrupted',
  'bad-grammar': 'unknown',
  'phrases-not-supported': 'unknown',
}

/** Classify a Web Speech `SpeechRecognitionErrorEvent.error` string. */
export function mapWebSpeechError(error: string): SpeechRecognitionError {
  const code = WEB_CODES[error] ?? 'unknown'
  return new SpeechRecognitionError(code, `Speech recognition failed: ${error}`, {
    nativeCode: error,
  })
}

// android.speech.SpeechRecognizer ERROR_* ints.
const ANDROID_CODES: Record<number, SpeechRecognitionErrorCode> = {
  1: 'network', // ERROR_NETWORK_TIMEOUT
  2: 'network', // ERROR_NETWORK
  3: 'audio-capture', // ERROR_AUDIO
  4: 'service-unavailable', // ERROR_SERVER
  5: 'unknown', // ERROR_CLIENT
  6: 'no-speech', // ERROR_SPEECH_TIMEOUT
  7: 'no-speech', // ERROR_NO_MATCH
  8: 'busy', // ERROR_RECOGNIZER_BUSY
  9: 'permission-denied', // ERROR_INSUFFICIENT_PERMISSIONS
  10: 'service-unavailable', // ERROR_TOO_MANY_REQUESTS
  11: 'service-unavailable', // ERROR_SERVER_DISCONNECTED
  12: 'language-unsupported', // ERROR_LANGUAGE_NOT_SUPPORTED
  13: 'language-unsupported', // ERROR_LANGUAGE_UNAVAILABLE
}

/** Classify an `android.speech.SpeechRecognizer` `onError` int. */
export function mapAndroidSpeechError(code: number): SpeechRecognitionError {
  return new SpeechRecognitionError(
    ANDROID_CODES[code] ?? 'unknown',
    `Speech recognition failed: ${code}`,
    { nativeCode: code },
  )
}

// Facade-defined domain — codes mirror XplatSpeechErrorCode in
// platforms/*/src/XplatSpeechRecognizer.h.
const APPLE_FACADE_DOMAIN = 'XplatSpeechRecognizer'
const APPLE_FACADE_CODES: Record<number, SpeechRecognitionErrorCode> = {
  1: 'language-unsupported',
  2: 'service-unavailable',
  3: 'audio-capture',
  4: 'audio-capture',
  5: 'audio-capture',
}

// Codes observed/derived per Apple domain. `kAFAssistantErrorDomain` is the
// domain SFSpeechRecognitionTask errors actually arrive in (1110 = "no
// speech detected", observed). NSURLErrorDomain is handled wholesale —
// every URL error is a network failure for a remote recognizer.
const APPLE_DOMAIN_CODES: Record<string, Record<number, SpeechRecognitionErrorCode>> = {
  kAFAssistantErrorDomain: {
    1110: 'no-speech', // observed: "no speech detected"
    203: 'service-unavailable', // observed: retry/service error
  },
}

/** Classify an Apple speech error from the facade's (domain, code) pair. */
export function mapAppleSpeechError(
  domain: string,
  code: number,
  message?: string,
): SpeechRecognitionError {
  let mapped: SpeechRecognitionErrorCode
  if (domain === APPLE_FACADE_DOMAIN) {
    mapped = APPLE_FACADE_CODES[code] ?? 'unknown'
  } else if (domain === 'NSURLErrorDomain') {
    mapped = 'network'
  } else {
    mapped = APPLE_DOMAIN_CODES[domain]?.[code] ?? 'unknown'
  }

  return new SpeechRecognitionError(
    mapped,
    message ?? `Speech recognition failed: ${domain}:${code}`,
    { nativeCode: `${domain}:${code}` },
  )
}
