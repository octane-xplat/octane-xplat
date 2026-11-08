import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { speechRecognition } from '../src/apple-engine'

type FacadeHandler = (
  type: string,
  text: string,
  segmentFinal: boolean,
  errorDomain: string,
  errorCode: number,
  message: string,
) => void

class FakeFacade {
  configured = true
  permission = 'granted'
  availability: Record<string, unknown> = {
    available: true,
    reason: null,
    lang: 'en-US',
    onDevice: false,
  }
  instance = { finish: vi.fn(), cancel: vi.fn() }
  handler: FacadeHandler | null = null
  beginArgs: [string, boolean, boolean] | null = null
  beginCount = 0
  permissionCalls = 0

  defaultLanguage(): string {
    return 'en-US'
  }

  isConfigured(): boolean {
    return this.configured
  }

  permissionStatus(): string {
    return this.permission
  }

  requestPermission(completion: (status: string) => void): void {
    this.permissionCalls++
    completion(this.permission)
  }

  availabilityJSON(_lang: string): string {
    return JSON.stringify(this.availability)
  }

  startWithLanguageInterimResultsContinuousOnEvent(
    lang: string,
    interimResults: boolean,
    continuous: boolean,
    onEvent: FacadeHandler,
  ): { finish(): void; cancel(): void } | null {
    this.beginCount++
    this.beginArgs = [lang, interimResults, continuous]
    this.handler = onEvent
    return this.instance
  }
}

const facade = new FakeFacade()

const listen = (session: ReturnType<typeof speechRecognition.start>) => {
  const events: string[] = []

  session.subscribe((event) => {
    if (event.type === 'state') {
      events.push(`state:${event.state}`)
    }

    if (event.type === 'transcript') {
      events.push(`transcript:${event.transcript}:${event.isFinal}`)
    }

    if (event.type === 'end') {
      events.push(`end:${event.result.reason}:${event.result.error?.code ?? ''}`)
    }
  })

  return events
}

// start() runs availability and permission checks asynchronously before the
// engine begins — wait for the facade handler before driving events.
const began = () => vi.waitFor(() => expect(facade.handler).not.toBeNull())

afterEach(() => {
  vi.unstubAllGlobals()
  facade.configured = true
  facade.permission = 'granted'
  facade.handler = null
  facade.beginArgs = null
  facade.beginCount = 0
  facade.permissionCalls = 0
  facade.instance = { finish: vi.fn(), cancel: vi.fn() }
  facade.availability = { available: true, reason: null, lang: 'en-US', onDevice: false }
})

describe('apple engine presence', () => {
  it('is unsupported without the facade global', () => {
    expect(speechRecognition.supported).toBe(false)
    expect(() => speechRecognition.start()).toThrow()
  })

  it('is unsupported when the host bundle is unconfigured', async () => {
    facade.configured = false
    vi.stubGlobal('XplatSpeechRecognizer', facade)
    expect(speechRecognition.supported).toBe(false)

    const availability = await speechRecognition.getAvailability()

    expect(availability.available).toBe(false)
    expect(availability.reason).toBe('unsupported')
  })
})

describe('apple availability', () => {
  it('maps a remote recognizer to networkUse required', async () => {
    vi.stubGlobal('XplatSpeechRecognizer', facade)

    const availability = await speechRecognition.getAvailability({ lang: 'en-US' })

    expect(availability).toEqual({
      available: true,
      reason: null,
      lang: 'en-US',
      networkUse: 'required',
      continuous: true,
    })
  })

  it('maps on-device recognition to networkUse possible', async () => {
    vi.stubGlobal('XplatSpeechRecognizer', facade)
    facade.availability.onDevice = true

    const availability = await speechRecognition.getAvailability()

    expect(availability.networkUse).toBe('possible')
  })

  it('maps a nil recognizer payload to language-unsupported', async () => {
    vi.stubGlobal('XplatSpeechRecognizer', facade)
    facade.availability = {
      available: false,
      reason: 'language-unsupported',
      lang: 'xx',
      onDevice: false,
    }

    const availability = await speechRecognition.getAvailability({ lang: 'xx' })

    expect(availability.reason).toBe('language-unsupported')
    expect(availability.networkUse).toBeNull()
  })

  it('maps malformed payloads to service-unavailable', async () => {
    vi.stubGlobal('XplatSpeechRecognizer', facade)
    facade.availability = { reason: 'unexpected' }

    const availability = await speechRecognition.getAvailability()

    expect(availability.reason).toBe('service-unavailable')
    expect(availability.available).toBe(false)
  })
})

describe('apple permissions', () => {
  it('maps denied to canAskAgain false', async () => {
    vi.stubGlobal('XplatSpeechRecognizer', facade)
    facade.permission = 'denied'

    const response = await speechRecognition.getPermissions()

    expect(response).toEqual({ status: 'denied', granted: false, canAskAgain: false })
  })

  it('prompts through the facade on request', async () => {
    vi.stubGlobal('XplatSpeechRecognizer', facade)
    facade.permission = 'granted'

    const response = await speechRecognition.requestPermissions()

    expect(facade.permissionCalls).toBe(1)
    expect(response.status).toBe('granted')
  })
})

describe('apple session events', () => {
  it('forwards options and maps the event stream', async () => {
    vi.stubGlobal('XplatSpeechRecognizer', facade)

    const session = speechRecognition.start({
      lang: 'fr-FR',
      interimResults: false,
      continuous: true,
    })

    await began()
    expect(facade.beginArgs).toEqual(['fr-FR', false, true])

    const events = listen(session)

    facade.handler?.('listening', '', false, '', 0, '')
    facade.handler?.('hypothesis', 'bonjour', false, '', 0, '')
    facade.handler?.('hypothesis', 'bonjour le monde', true, '', 0, '')
    facade.handler?.('finished', '', false, '', 0, '')

    const result = await session.result

    expect(result.reason).toBe('completed')
    expect(result.transcript).toBe('bonjour le monde')
    expect(events).toContain('state:listening')
    expect(events).toContain('end:completed:')
  })

  it('stop() finishes the facade and ends stopped', async () => {
    vi.stubGlobal('XplatSpeechRecognizer', facade)

    const session = speechRecognition.start({ lang: 'en-US', continuous: true })

    await began()
    facade.handler?.('listening', '', false, '', 0, '')

    const stopping = session.stop()

    expect(facade.instance.finish).toHaveBeenCalledOnce()
    facade.handler?.('finished', '', false, '', 0, '')

    const result = await stopping

    expect(result.reason).toBe('stopped')
  })

  it('abort() cancels the facade and ends aborted', async () => {
    vi.stubGlobal('XplatSpeechRecognizer', facade)

    const session = speechRecognition.start({ lang: 'en-US', continuous: true })

    await began()
    facade.handler?.('listening', '', false, '', 0, '')
    session.abort()
    expect(facade.instance.cancel).toHaveBeenCalledOnce()

    const result = await session.result

    expect(result.reason).toBe('aborted')
  })

  it('maps facade errors through the Apple error map', async () => {
    vi.stubGlobal('XplatSpeechRecognizer', facade)

    const session = speechRecognition.start({ lang: 'en-US' })

    await began()
    facade.handler?.('listening', '', false, '', 0, '')
    facade.handler?.('error', '', false, 'XplatSpeechRecognizer', 1, 'No recognizer for lang')

    const result = await session.result

    expect(result.reason).toBe('error')
    expect(result.error?.code).toBe('language-unsupported')
    expect(result.error?.nativeCode).toBe('XplatSpeechRecognizer:1')
  })

  it('maps interrupted events to the interrupted code', async () => {
    vi.stubGlobal('XplatSpeechRecognizer', facade)

    const session = speechRecognition.start({ lang: 'en-US' })

    await began()
    facade.handler?.('listening', '', false, '', 0, '')
    facade.handler?.(
      'interrupted',
      '',
      false,
      'XplatSpeechRecognizer',
      0,
      'audio session interrupted',
    )

    const result = await session.result

    expect(result.reason).toBe('error')
    expect(result.error?.code).toBe('interrupted')
  })

  it('a null facade instance ends as service-unavailable', async () => {
    vi.stubGlobal('XplatSpeechRecognizer', facade)
    vi.spyOn(facade, 'startWithLanguageInterimResultsContinuousOnEvent').mockReturnValueOnce(null)

    const session = speechRecognition.start({ lang: 'en-US' })
    const result = await session.result

    expect(result.reason).toBe('error')
    expect(result.error?.code).toBe('service-unavailable')
  })
})

describe('apple facade copies', () => {
  const packageRoot = join(__dirname, '..')
  const pairs: [string, string][] = [
    [
      'platforms/ios/src/XplatSpeechRecognizer.h',
      'platforms/macos/include/XplatSpeechRecognizer.h',
    ],
    ['platforms/ios/src/XplatSpeechRecognizer.m', 'platforms/macos/src/XplatSpeechRecognizer.m'],
  ]

  for (const [iosPath, macosPath] of pairs) {
    it(`${macosPath} is byte-identical to ${iosPath}`, () => {
      expect(readFileSync(join(packageRoot, macosPath))).toEqual(
        readFileSync(join(packageRoot, iosPath)),
      )
    })
  }
})
