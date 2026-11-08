import { afterEach, describe, expect, it } from 'vitest'
import {
  mapWindowsSpeechError,
  speechRecognition,
} from '../src/speech-recognition.windows'
import type { SpeechRecognitionErrorCode } from '../src/types'

describe('mapWindowsSpeechError', () => {
  const cases: [number, SpeechRecognitionErrorCode][] = [
    [0x80045509 | 0, 'permission-denied'], // SPERR_SPEECH_PRIVACY_POLICY_NOT_ACCEPTED
    [1, 'interrupted'],
    [5, 'interrupted'], // Canceled (self-cancel never reaches this)
    [10, 'network'],
    [11, 'audio-capture'], // MicrophoneUnavailable
    [4, 'audio-capture'], // Muted
    [13, 'audio-capture'], // AudioQualityFailure
    [8, 'no-speech'], // PauseLimitExceeded
    [9, 'no-speech'], // TimeoutExceeded
    [6, 'language-unsupported'],
    [14, 'language-unsupported'], // TopicLanguageNotSupported
    [7, 'language-unsupported'], // UserLanguageMismatch
    [3, 'language-unsupported'], // GrammarLanguageMismatch
    [2, 'service-unavailable'], // GrammarCompilationFailure
    [12, 'unknown'],
    [99, 'unknown'],
  ]

  for (const [status, code] of cases) {
    it(`maps status ${status} to '${code}'`, () => {
      const error = mapWindowsSpeechError(status)
      expect(error.code).toBe(code)
      expect(error.nativeCode).toBe(status)
    })
  }

  it('keeps an explicit message when provided', () => {
    expect(mapWindowsSpeechError(10, 'no route').message).toBe('no route')
  })
})

describe('windows leaf', () => {
  afterEach(() => {
    delete (globalThis as any).Windows
    delete (globalThis as any).NSWinRT
  })

  it('loads without the WinRT projection and reports unsupported', () => {
    expect(speechRecognition.supported).toBe(false)
  })

  it('reports unsupported from getAvailability without a projection', async () => {
    const availability = await speechRecognition.getAvailability({ lang: 'en-US' })
    expect(availability.available).toBe(false)
    expect(availability.reason).toBe('unsupported')
    expect(availability.networkUse).toBeNull()
  })

  it('reports required network use when the projection is present', async () => {
    installProjection({ results: [] })
    const availability = await speechRecognition.getAvailability({ lang: 'en-US' })
    expect(availability).toMatchObject({
      available: true,
      reason: null,
      lang: 'en-US',
      networkUse: 'required',
      continuous: true,
    })
  })

  it('maps NotDeclaredByApp to an unsupported permission', async () => {
    installProjection({ results: [], micStatus: 1 })
    const permission = await speechRecognition.getPermissions()
    expect(permission).toEqual({ status: 'unsupported', granted: false, canAskAgain: false })
  })

  it('requests access only while undetermined', async () => {
    let requests = 0
    installProjection({
      results: [],
      micStatus: 3,
      onRequest: () => {
        requests++
        return 4
      },
    })
    const first = await speechRecognition.requestPermissions()
    expect(first.status).toBe('granted')
    expect(requests).toBe(1)
  })

  it('commits each RecognizeAsync result as a final segment in continuous mode', async () => {
    installProjection({
      results: [
        { Status: 0, Text: 'hello world' },
        { Status: 9, Text: '' }, // TimeoutExceeded — retryable
        { Status: 0, Text: 'second take' },
        // After these, the recognizer blocks until disposed.
        { Status: 10, Text: '' },
      ],
    })
    const transcripts: string[] = []
    const session = speechRecognition.start({ continuous: true })
    session.subscribe((event) => {
      if (event.type === 'transcript' && event.isFinal) {
        transcripts.push(event.transcript)
      }
    })
    const result = await session.result
    expect(result.reason).toBe('error')
    expect(result.error?.code).toBe('network')
    expect(transcripts).toEqual(['hello world', 'hello world second take'])
    expect(result.transcript).toBe('hello world second take')
  })

  it('ends a non-continuous session with no-speech on utterance timeout', async () => {
    installProjection({ results: [{ Status: 9, Text: '' }] })
    const result = await speechRecognition.start().result
    expect(result.reason).toBe('error')
    expect(result.error?.code).toBe('no-speech')
  })

  it('forwards interim hypotheses when interimResults is set', async () => {
    installProjection({
      results: [{ Status: 0, Text: 'final text' }],
      interimText: 'partial words',
    })
    const transcripts: string[] = []
    const session = speechRecognition.start({ interimResults: true })
    session.subscribe((event) => {
      if (event.type === 'transcript') {
        transcripts.push(`${event.transcript}|${event.isFinal}`)
      }
    })
    // The fake emits a mid-utterance hypothesis inside RecognizeAsync.
    const result = await session.result
    expect(result.reason).toBe('completed')
    expect(transcripts).toEqual(['partial words|false', 'final text|true'])
  })

  it('abort releases the recognizer and ends with aborted', async () => {
    const projection = installProjection({ results: [{ Status: 0, Text: 'late' }], block: true })
    const session = speechRecognition.start()
    await new Promise((resolve) => setTimeout(resolve, 10))
    session.abort()
    const result = await session.result
    expect(result.reason).toBe('aborted')
    expect(projection.disposed).toBe(true)
  })
})

/** Minimal Windows.Media.SpeechRecognition + AppCapability projection. */
function installProjection(options: {
  results: { Status: number; Text: string }[]
  micStatus?: number
  onRequest?: () => number
  block?: boolean
  interimText?: string
}) {
  const state = {
    disposed: false,
    hypothesisHandler: null as null | ((sender: unknown, args: unknown) => void),
  }
  let index = 0

  class FakeRecognizer {
    Constraints = { Append: () => undefined }
    CompileConstraintsAsync = () => Promise.resolve({ Status: 0 })
    get HypothesisGenerated() {
      return state.hypothesisHandler
    }
    set HypothesisGenerated(handler: any) {
      state.hypothesisHandler = handler
    }
    StateChanged: unknown = null
    Dispose() {
      state.disposed = true
    }
    async RecognizeAsync() {
      if (options.block) {
        await new Promise(() => undefined) // blocked utterance — abort path
      }
      // A mid-utterance hypothesis before the final result.
      if (options.interimText != null && index === 0) {
        state.hypothesisHandler?.(null, { Hypothesis: { Text: options.interimText } })
      }
      const result = options.results[Math.min(index++, options.results.length - 1)]
      return result
    }
  }

  const capability = {
    CheckAccess: () => options.micStatus ?? 4,
    RequestAccessAsync: () => Promise.resolve(options.onRequest ? options.onRequest() : 4),
  }

  ;(globalThis as any).Windows = {
    Media: {
      SpeechRecognition: {
        SpeechRecognizer: FakeRecognizer,
        SpeechRecognitionTopicConstraint: class {},
        SpeechRecognitionScenario: { Dictation: 0 },
      },
    },
    Globalization: { Language: class {} },
    Security: {
      Authorization: { AppCapabilityAccess: { AppCapability: { Create: () => capability } } },
    },
  }
  ;(globalThis as any).NSWinRT = { toPromise: (op: any) => op }
  return state
}
