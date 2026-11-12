// Web leaf contract — a modeled Web Speech API exercises the leaf's event
// wiring, error mapping, permission paths, and cleanup. This does not
// establish real recognizer behavior; tests/web-chrome-runtime.mts does.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { UnavailabilityError } from '@octane-xplat/lib/capability'
import { speechRecognition } from '../src/index.web'
import type { SpeechRecognitionEvent } from '../src/types'
import { tick } from './fake-engine'

interface FakeAlternative {
  transcript: string
}

interface FakeResult {
  isFinal: boolean
  0: FakeAlternative
}

class FakeRecognition {
  static instances: FakeRecognition[] = []
  static availableResults: { remote: string; local: string } | null = null

  lang = ''
  continuous = false
  interimResults = false
  maxAlternatives = 0
  startCalls = 0
  stopCalls = 0
  abortCalls = 0
  onstart: (() => void) | null = null
  onend: (() => void) | null = null
  onresult: ((event: { resultIndex: number; results: { length: number } }) => void) | null = null
  onerror: ((event: { error: string; message?: string }) => void) | null = null

  constructor() {
    FakeRecognition.instances.push(this)
  }

  static async available(options: { langs: string[]; processLocally: boolean }) {
    const results = FakeRecognition.availableResults

    return options.processLocally
      ? (results?.local ?? 'unavailable')
      : (results?.remote ?? 'available')
  }

  start(): void {
    this.startCalls++
  }

  stop(): void {
    this.stopCalls++
  }

  abort(): void {
    this.abortCalls++
  }

  emitStart(): void {
    this.onstart?.()
  }

  emitResult(results: FakeResult[], resultIndex: number): void {
    this.onresult?.({ resultIndex, results })
  }

  emitError(error: string): void {
    this.onerror?.({ error })
  }

  emitEnd(): void {
    this.onend?.()
  }
}

class FakeRecognitionNoProbe {
  lang = ''
  continuous = false
  interimResults = false
  maxAlternatives = 0
  start(): void {}
  stop(): void {}
  abort(): void {}
  onstart: (() => void) | null = null
  onend: (() => void) | null = null
  onresult: unknown = null
  onerror: unknown = null
}

const documentListeners = new Map<string, (...args: never[]) => void>()

const fakeDocument = {
  visibilityState: 'visible',
  addEventListener(name: string, listener: (...args: never[]) => void): void {
    documentListeners.set(name, listener)
  },
  removeEventListener(name: string): void {
    documentListeners.delete(name)
  },
}

const grantedQuery = { state: 'granted' }

function stubNavigator(overrides: Record<string, unknown> = {}): void {
  vi.stubGlobal('navigator', {
    language: 'en-US',
    permissions: { query: async () => grantedQuery },
    mediaDevices: {
      getUserMedia: async () => ({ getTracks: () => [{ stop: () => {} }] }),
    },
    ...overrides,
  })
}

function stubCtor(ctor: unknown = FakeRecognition): void {
  FakeRecognition.instances = []
  FakeRecognition.availableResults = null
  vi.stubGlobal('SpeechRecognition', ctor)
}

afterEach(() => {
  documentListeners.clear()
  fakeDocument.visibilityState = 'visible'
  vi.unstubAllGlobals()
})

describe('capability checks', () => {
  it('reports unsupported without a constructor', async () => {
    stubNavigator()
    vi.stubGlobal('document', fakeDocument)
    expect(speechRecognition.supported).toBe(false)
    expect(await speechRecognition.isAvailable()).toBe(false)
    expect((await speechRecognition.getAvailability({ lang: 'en-US' })).reason).toBe('unsupported')
    expect(() => speechRecognition.start()).toThrow(UnavailabilityError)
  })

  it('falls back to webkitSpeechRecognition', () => {
    stubNavigator()
    vi.stubGlobal('webkitSpeechRecognition', FakeRecognition)
    expect(speechRecognition.supported).toBe(true)
  })
})

describe('getAvailability', () => {
  it('reports networkUse possible without a static probe', async () => {
    stubNavigator()
    stubCtor(FakeRecognitionNoProbe)

    const availability = await speechRecognition.getAvailability({ lang: 'en-US' })

    expect(availability).toEqual({
      available: true,
      reason: null,
      lang: 'en-US',
      networkUse: 'possible',
      continuous: true,
    })
  })

  it('maps the Chrome 139+ static probe answers', async () => {
    stubNavigator()
    stubCtor()
    FakeRecognition.availableResults = { remote: 'available', local: 'available' }
    expect((await speechRecognition.getAvailability({ lang: 'en-US' })).networkUse).toBe('possible')

    FakeRecognition.availableResults = { remote: 'available', local: 'downloadable' }
    expect((await speechRecognition.getAvailability({ lang: 'en-US' })).networkUse).toBe('required')

    FakeRecognition.availableResults = { remote: 'unavailable', local: 'unavailable' }

    const availability = await speechRecognition.getAvailability({ lang: 'tlh' })

    expect(availability).toEqual({
      available: false,
      reason: 'language-unsupported',
      lang: 'tlh',
      networkUse: null,
      continuous: true,
    })
  })
})

describe('permissions', () => {
  it('maps the Permissions API states', async () => {
    for (const [state, status] of [
      ['granted', 'granted'],
      ['denied', 'denied'],
      ['prompt', 'undetermined'],
    ] as const) {
      stubCtor()
      stubNavigator({
        permissions: { query: async () => ({ state }) },
      })

      const permission = await speechRecognition.getPermissions()

      expect(permission.status).toBe(status)
      vi.unstubAllGlobals()
    }
  })

  it('requests through getUserMedia and stops the tracks', async () => {
    stubCtor()

    let stopped = 0

    stubNavigator({
      mediaDevices: {
        getUserMedia: async () => ({
          getTracks: () => [{ stop: () => stopped++ }],
        }),
      },
    })

    const permission = await speechRecognition.requestPermissions()

    expect(permission.status).toBe('granted')
    expect(stopped).toBe(1)
  })

  it('denies on NotAllowedError without re-prompt', async () => {
    stubCtor()
    stubNavigator({
      mediaDevices: {
        getUserMedia: async () => {
          const error = new Error('denied')

          error.name = 'NotAllowedError'
          throw error
        },
      },
    })

    const permission = await speechRecognition.requestPermissions()

    expect(permission).toEqual({ status: 'denied', granted: false, canAskAgain: false })
  })

  it('keeps the queried state on NotFoundError — no usable input device', async () => {
    stubCtor()
    stubNavigator({
      permissions: { query: async () => ({ state: 'granted' }) },
      mediaDevices: {
        getUserMedia: async () => {
          const error = new Error('no mic')

          error.name = 'NotFoundError'
          throw error
        },
      },
    })

    // The microphone permission is still granted — the device is missing,
    // so the recognizer itself surfaces 'audio-capture' when capture starts.
    const permission = await speechRecognition.requestPermissions()

    expect(permission.status).toBe('granted')
  })
})

describe('session wiring', () => {
  const sessionSetup = async (options?: { continuous?: boolean; interimResults?: boolean }) => {
    stubNavigator()
    stubCtor()
    vi.stubGlobal('document', fakeDocument)

    const events: SpeechRecognitionEvent[] = []
    const session = speechRecognition.start(options)

    session.subscribe((event) => events.push(event))
    await tick()

    const recognition = FakeRecognition.instances.at(-1)!

    return { session, events, recognition }
  }

  it('configures the recognizer and wires results', async () => {
    const { session, events, recognition } = await sessionSetup({
      continuous: true,
      interimResults: true,
    })

    expect(recognition.startCalls).toBe(1)
    expect(recognition.lang).toBe('en-US')
    expect(recognition.continuous).toBe(true)
    expect(recognition.interimResults).toBe(true)

    recognition.emitStart()
    expect(session.state).toBe('listening')

    // Cumulative results: an interim, then a final plus the next interim.
    recognition.emitResult([{ isFinal: false, 0: { transcript: 'the quick' } }], 0)
    recognition.emitResult(
      [
        { isFinal: true, 0: { transcript: 'the quick' } },
        { isFinal: false, 0: { transcript: ' brown' } },
      ],
      0,
    )

    const transcripts = events.flatMap((event) =>
      event.type === 'transcript' ? [`${event.transcript}|${event.isFinal}`] : [],
    )

    expect(transcripts).toEqual(['the quick|false', 'the quick|true', 'the quick brown|false'])

    session.abort()

    const result = await session.result

    expect(result.reason).toBe('aborted')
    expect(result.transcript).toBe('the quick brown')
  })

  it('maps onerror through the web error table', async () => {
    const { session, recognition } = await sessionSetup()

    recognition.emitStart()
    recognition.emitError('network')

    const result = await session.result

    expect(result.reason).toBe('error')
    expect(result.error?.code).toBe('network')
    expect(result.error?.nativeCode).toBe('network')
  })

  it('onend completes the session', async () => {
    const { session, recognition } = await sessionSetup({ continuous: true })

    recognition.emitStart()
    recognition.emitEnd()

    const result = await session.result

    expect(result.reason).toBe('completed')
  })

  it('stop() calls recognition.stop and resolves on end', async () => {
    const { session, recognition } = await sessionSetup({ continuous: true })

    recognition.emitStart()

    const stopping = session.stop()

    expect(recognition.stopCalls).toBe(1)
    recognition.emitEnd()

    const result = await stopping

    expect(result.reason).toBe('stopped')
  })

  it('abort() aborts the recognizer and detaches every handler', async () => {
    const { session, recognition } = await sessionSetup({ continuous: true })

    recognition.emitStart()
    session.abort()
    expect(recognition.abortCalls).toBe(1)
    expect(recognition.onstart).toBeNull()
    expect(recognition.onend).toBeNull()
    expect(recognition.onresult).toBeNull()
    expect(recognition.onerror).toBeNull()
    expect(documentListeners.has('visibilitychange')).toBe(false)
    await session.result
  })

  it('hiding the page while listening fails interrupted and aborts', async () => {
    const { session, events, recognition } = await sessionSetup({ continuous: true })

    recognition.emitStart()
    expect(documentListeners.has('visibilitychange')).toBe(true)

    fakeDocument.visibilityState = 'hidden'
    documentListeners.get('visibilitychange')?.()

    const result = await session.result

    expect(result.reason).toBe('error')
    expect(result.error?.code).toBe('interrupted')
    expect(recognition.abortCalls).toBe(1)
    expect(documentListeners.has('visibilitychange')).toBe(false)
    expect(events.at(-1)?.type).toBe('end')
  })

  it('hiding the page before the recognizer starts does not interrupt', async () => {
    const { session, recognition } = await sessionSetup()

    fakeDocument.visibilityState = 'hidden'
    documentListeners.get('visibilitychange')?.()
    expect(session.state).toBe('starting')
    expect(recognition.abortCalls).toBe(0)
    fakeDocument.visibilityState = 'visible'
    session.abort()
    await session.result
  })

  it('releases the visibilitychange listener when the session ends normally', async () => {
    const { session, recognition } = await sessionSetup()

    recognition.emitStart()
    recognition.emitEnd()
    await session.result
    expect(documentListeners.has('visibilitychange')).toBe(false)
  })
})
