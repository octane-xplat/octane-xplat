import { afterEach, describe, expect, it, vi } from 'vitest'
import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { PermissionResponse } from '@octane-xplat/lib/capability'
import { createSpeechService } from '../src/session-core'
import { SpeechRecognitionError } from '../src/types'
import type { SpeechRecognitionEvent, SpeechSessionState } from '../src/types'
import { FakeEngine, tick } from './fake-engine'

const granted: PermissionResponse = { status: 'granted', granted: true, canAskAgain: true }
const undetermined: PermissionResponse = {
  status: 'undetermined',
  granted: false,
  canAskAgain: true,
}

const denied: PermissionResponse = { status: 'denied', granted: false, canAskAgain: false }

const UNSUPPORTED_PERMISSION: PermissionResponse = {
  status: 'unsupported',
  granted: false,
  canAskAgain: false,
}

const states = (events: SpeechRecognitionEvent[]): SpeechSessionState[] =>
  events.flatMap((event) => (event.type === 'state' ? [event.state] : []))

const transcripts = (
  events: SpeechRecognitionEvent[],
): { transcript: string; isFinal: boolean }[] =>
  events.flatMap((event) =>
    event.type === 'transcript' ? [{ transcript: event.transcript, isFinal: event.isFinal }] : [],
  )

afterEach(() => {
  vi.useRealTimers()
})

describe('unsupported service', () => {
  it('reports unsupported and start() throws UnavailabilityError', async () => {
    const service = createSpeechService(null)

    expect(service.supported).toBe(false)
    expect(await service.isAvailable()).toBe(false)
    expect(await service.getPermissions()).toEqual(UNSUPPORTED_PERMISSION)
    expect(await service.requestPermissions()).toEqual(UNSUPPORTED_PERMISSION)
    expect(await service.getAvailability()).toEqual({
      available: false,
      reason: 'unsupported',
      lang: '',
      networkUse: null,
      continuous: false,
    })

    expect(await service.getAvailability({ lang: 'de-DE' })).toEqual({
      available: false,
      reason: 'unsupported',
      lang: 'de-DE',
      networkUse: null,
      continuous: false,
    })

    expect(() => service.start()).toThrow(UnavailabilityError)
    expect(() => service.start()).toThrow('speech recognition')
  })

  it('throws UnavailabilityError when the engine is present but unsupported', async () => {
    const engine = new FakeEngine()

    engine.supported = false

    const service = createSpeechService(engine)

    expect(service.supported).toBe(false)
    expect(await service.isAvailable()).toBe(false)
    expect(await service.getPermissions()).toEqual(UNSUPPORTED_PERMISSION)
    expect(() => service.start()).toThrow(UnavailabilityError)
    expect(engine.beginCalls).toBe(0)
  })
})

describe('session startup', () => {
  it('starts in starting and reaches listening on the engine signal', async () => {
    const engine = new FakeEngine()
    const service = createSpeechService(engine)
    const events: SpeechRecognitionEvent[] = []
    const session = service.start({ lang: 'fr-FR' })

    session.subscribe((event) => events.push(event))
    expect(session.state).toBe('starting')
    expect(session.lang).toBe('fr-FR')

    await tick()
    expect(engine.beginCalls).toBe(1)
    expect(engine.beginOptions).toEqual({
      lang: 'fr-FR',
      interimResults: true,
      continuous: false,
    })

    engine.handles[0]!.listening()
    expect(session.state).toBe('listening')
    expect(states(events)).toEqual(['listening'])
  })

  it('defaults lang to the engine default', () => {
    const engine = new FakeEngine()

    engine.lang = 'ja-JP'

    const service = createSpeechService(engine)

    expect(service.start().lang).toBe('ja-JP')
  })

  it('passes availability and permission through on a supported engine', async () => {
    const engine = new FakeEngine()
    const service = createSpeechService(engine)

    expect(await service.isAvailable()).toBe(true)
    expect(await service.getAvailability({ lang: 'de-DE' })).toEqual({
      available: true,
      reason: null,
      lang: 'de-DE',
      networkUse: 'required',
      continuous: true,
    })

    expect(await service.getPermissions()).toEqual(granted)
    expect(engine.readCalls).toBe(1)
  })

  it('ends a second concurrent session with busy while the active one is untouched', async () => {
    const engine = new FakeEngine()
    const service = createSpeechService(engine)
    const first = service.start()

    await tick()
    engine.handles[0]!.listening()

    const second = service.start()
    const seen: SpeechRecognitionEvent[] = []

    second.subscribe((event) => seen.push(event))

    const result = await second.result

    expect(result.reason).toBe('error')
    expect(result.error).toBeInstanceOf(SpeechRecognitionError)
    expect(result.error?.code).toBe('busy')
    expect(second.state).toBe('ended')
    // Delivered after subscribe — the listener observed the end event.
    expect(seen.some((event) => event.type === 'end')).toBe(true)
    expect(engine.beginCalls).toBe(1)
    expect(first.state).toBe('listening')
  })

  it('ends with permission-denied when permission is refused, without beginning', async () => {
    const engine = new FakeEngine()

    engine.permission = denied

    const service = createSpeechService(engine)
    const result = await service.start().result

    expect(result.reason).toBe('error')
    expect(result.error?.code).toBe('permission-denied')
    expect(engine.beginCalls).toBe(0)
  })

  it('requests permission when undetermined and begins after a grant', async () => {
    const engine = new FakeEngine()

    engine.permission = undetermined
    engine.ensureResult = granted

    const service = createSpeechService(engine)
    const session = service.start()

    await tick()
    expect(engine.ensureCalls).toBe(1)
    expect(engine.beginCalls).toBe(1)

    session.abort()
    await session.result
  })

  it('ends with permission-denied when the request is refused', async () => {
    const engine = new FakeEngine()

    engine.permission = undetermined
    engine.ensureResult = denied

    const service = createSpeechService(engine)
    const result = await service.start().result

    expect(result.reason).toBe('error')
    expect(result.error?.code).toBe('permission-denied')
    expect(engine.ensureCalls).toBe(1)
    expect(engine.beginCalls).toBe(0)
  })

  it('abort during a pending permission prompt ends aborted and never begins', async () => {
    const engine = new FakeEngine()

    engine.permission = undetermined

    let resolvePrompt: (response: PermissionResponse) => void = () => {}

    engine.ensurePermissionImpl = () =>
      new Promise<PermissionResponse>((resolve) => {
        resolvePrompt = resolve
      })

    const service = createSpeechService(engine)
    const session = service.start()

    await tick()
    expect(engine.ensureCalls).toBe(1)

    session.abort()

    const result = await session.result

    expect(result.reason).toBe('aborted')
    expect(result.error).toBeNull()

    // The late grant must not begin capture.
    resolvePrompt(granted)
    await tick()
    expect(engine.beginCalls).toBe(0)
  })

  it('ends with unsupported-option for continuous on an engine without it', async () => {
    const engine = new FakeEngine()

    engine.availabilityValue = {
      available: true,
      reason: null,
      lang: 'en-US',
      networkUse: 'possible',
      continuous: false,
    }

    const service = createSpeechService(engine)
    const result = await service.start({ continuous: true }).result

    expect(result.reason).toBe('error')
    expect(result.error?.code).toBe('unsupported-option')
    expect(engine.beginCalls).toBe(0)

    // The same service starts a non-continuous session fine afterwards.
    const session = service.start({ continuous: false })

    await tick()
    expect(engine.beginCalls).toBe(1)
    session.abort()
    await session.result
  })

  it('ends with the mapped code when availability reports unavailable', async () => {
    for (const [reason, code] of [
      ['language-unsupported', 'language-unsupported'],
      ['service-unavailable', 'service-unavailable'],
      ['unsupported', 'service-unavailable'],
    ] as const) {
      const engine = new FakeEngine()

      engine.availabilityValue = {
        available: false,
        reason,
        lang: 'en-US',
        networkUse: null,
        continuous: true,
      }

      const service = createSpeechService(engine)
      const result = await service.start().result

      expect(result.reason).toBe('error')
      expect(result.error?.code).toBe(code)
      expect(engine.beginCalls).toBe(0)
    }
  })

  it('proceeds when the availability probe throws', async () => {
    const engine = new FakeEngine()

    engine.availabilityRejects = true

    const service = createSpeechService(engine)
    const session = service.start()

    await tick()
    expect(engine.beginCalls).toBe(1)
    session.abort()
    await session.result
  })

  it('ends error when begin throws', async () => {
    const engine = new FakeEngine()

    engine.begin = () => {
      throw new Error('engine exploded')
    }

    const service = createSpeechService(engine)
    const result = await service.start().result

    expect(result.reason).toBe('error')
    expect(result.error?.code).toBe('unknown')
    expect(result.error?.message).toBe('engine exploded')
  })
})

describe('transcript accumulation', () => {
  it('emits cumulative text and dedupes unchanged updates', async () => {
    const engine = new FakeEngine()
    const service = createSpeechService(engine)
    const session = service.start({ continuous: true })
    const events: SpeechRecognitionEvent[] = []

    session.subscribe((event) => events.push(event))
    await tick()

    const handle = engine.handles[0]!

    handle.listening()

    handle.hypothesis('the', false)
    handle.hypothesis('the quick', false)
    handle.hypothesis('the quick', false) // unchanged — deduped
    handle.hypothesis('the quick', true)
    handle.hypothesis(' brown', false) // leading space — trimmed
    handle.hypothesis('brown fox', true)

    expect(transcripts(events)).toEqual([
      { transcript: 'the', isFinal: false },
      { transcript: 'the quick', isFinal: false },
      { transcript: 'the quick', isFinal: true },
      { transcript: 'the quick brown', isFinal: false },
      { transcript: 'the quick brown fox', isFinal: true },
    ])

    expect(session.transcript).toBe('the quick brown fox')

    session.abort()

    const result = await session.result

    expect(result.transcript).toBe('the quick brown fox')
  })

  it('emits the same text again when only finality changes', async () => {
    const engine = new FakeEngine()
    const service = createSpeechService(engine)
    const session = service.start({ continuous: true })
    const events: SpeechRecognitionEvent[] = []

    session.subscribe((event) => events.push(event))
    await tick()

    const handle = engine.handles[0]!

    handle.listening()
    handle.hypothesis('same', false)
    handle.hypothesis('same', true)

    expect(transcripts(events)).toEqual([
      { transcript: 'same', isFinal: false },
      { transcript: 'same', isFinal: true },
    ])

    session.abort()
    await session.result
  })

  it('suppresses interim events with interimResults: false', async () => {
    const engine = new FakeEngine()
    const service = createSpeechService(engine)
    const session = service.start({ interimResults: false, continuous: true })
    const events: SpeechRecognitionEvent[] = []

    session.subscribe((event) => events.push(event))
    await tick()

    const handle = engine.handles[0]!

    handle.listening()
    handle.hypothesis('interim', false)
    handle.hypothesis('still interim', false)
    handle.hypothesis('final', true)

    expect(transcripts(events)).toEqual([{ transcript: 'final', isFinal: true }])
    session.abort()
    await session.result
  })
})

describe('session end', () => {
  it('completes a non-continuous session after the first committed segment', async () => {
    const engine = new FakeEngine()
    const service = createSpeechService(engine)
    const session = service.start({ continuous: false })
    const events: SpeechRecognitionEvent[] = []

    session.subscribe((event) => events.push(event))
    await tick()

    const handle = engine.handles[0]!

    handle.listening()
    handle.hypothesis('done talking', true)

    const result = await session.result

    expect(result.reason).toBe('completed')
    expect(result.transcript).toBe('done talking')
    // The core releases the engine on a core-initiated end.
    expect(handle.cancelCalls).toBe(1)
    expect(events.at(-1)).toEqual({ type: 'end', result })
    // Late engine callbacks are ignored.
    handle.hypothesis('more', true)
    handle.finished()
    expect(transcripts(events).length).toBe(1)
  })

  it('runs a continuous session until stopped', async () => {
    const engine = new FakeEngine()
    const service = createSpeechService(engine)
    const events: SpeechRecognitionEvent[] = []
    const session = service.start({ continuous: true })

    session.subscribe((event) => events.push(event))
    await tick()

    const handle = engine.handles[0]!

    handle.listening()
    handle.hypothesis('one', true)
    handle.hypothesis('two', true)
    expect(session.state).toBe('listening')

    const stopping = session.stop()

    expect(session.state).toBe('stopping')
    expect(handle.finishCalls).toBe(1)

    handle.finished()

    const result = await stopping

    expect(result.reason).toBe('stopped')
    expect(result.transcript).toBe('one two')
    expect(states(events)).toEqual(['listening', 'stopping', 'ended'])
    expect(events.at(-1)).toEqual({ type: 'end', result })
  })

  it('stop() falls back after 5s, cancels the engine, and ends stopped', async () => {
    vi.useFakeTimers()

    const engine = new FakeEngine()
    const service = createSpeechService(engine)
    const session = service.start({ continuous: true })

    await tick()

    const handle = engine.handles[0]!

    handle.listening()
    handle.hypothesis('kept', true)

    const stopping = session.stop()

    expect(handle.finishCalls).toBe(1)
    // The engine never calls finished — the fallback must release it.
    await vi.advanceTimersByTimeAsync(5000)

    const result = await stopping

    expect(result.reason).toBe('stopped')
    expect(result.transcript).toBe('kept')
    expect(handle.cancelCalls).toBe(1)
  })

  it('abort() cancels the engine and ends aborted', async () => {
    const engine = new FakeEngine()
    const service = createSpeechService(engine)
    const session = service.start()

    await tick()

    const handle = engine.handles[0]!

    handle.listening()
    handle.hypothesis('partial', false)

    session.abort()

    const result = await session.result

    expect(result.reason).toBe('aborted')
    expect(result.transcript).toBe('partial')
    expect(result.error).toBeNull()
    expect(handle.cancelCalls).toBe(1)
    expect(session.state).toBe('ended')
  })

  it('abort() after begin but before listening cancels the handle', async () => {
    const engine = new FakeEngine()
    const service = createSpeechService(engine)
    const session = service.start()

    await tick()
    expect(engine.beginCalls).toBe(1)
    session.abort()
    expect(engine.handles[0]!.cancelCalls).toBe(1)

    const result = await session.result

    expect(result.reason).toBe('aborted')
  })

  it('ends error on engine failure and preserves the error', async () => {
    const engine = new FakeEngine()
    const service = createSpeechService(engine)
    const session = service.start()

    await tick()

    const handle = engine.handles[0]!

    handle.listening()
    handle.failed(
      new SpeechRecognitionError('network', 'service went away', {
        nativeCode: 'network',
      }),
    )

    const result = await session.result

    expect(result.reason).toBe('error')
    expect(result.error?.code).toBe('network')
    expect(result.error?.nativeCode).toBe('network')
    expect(handle.cancelCalls).toBe(1)
  })

  it('wraps a non-SpeechRecognitionError failure as unknown', async () => {
    const engine = new FakeEngine()
    const service = createSpeechService(engine)
    const session = service.start()

    await tick()

    const handle = engine.handles[0]!

    handle.listening()
    // The sink contract takes SpeechRecognitionError, but the core
    // normalizes defensively for engines that violate it.
    handle.failed(new SpeechRecognitionError('unknown', 'wrapped', { cause: new Error('raw') }))

    const result = await session.result

    expect(result.error?.code).toBe('unknown')
  })

  it('first end wins — later finishes are ignored', async () => {
    const engine = new FakeEngine()
    const service = createSpeechService(engine)
    const session = service.start()

    await tick()

    const handle = engine.handles[0]!

    handle.listening()
    handle.failed(new SpeechRecognitionError('interrupted', 'phone call'))
    handle.finished()

    const result = await session.result

    expect(result.reason).toBe('error')
    expect(result.error?.code).toBe('interrupted')
  })

  it('stop() during startup finishes as soon as the engine begins', async () => {
    const engine = new FakeEngine()

    engine.permission = undetermined

    let resolvePrompt: (response: PermissionResponse) => void = () => {}

    engine.ensurePermissionImpl = () =>
      new Promise<PermissionResponse>((resolve) => {
        resolvePrompt = resolve
      })

    const service = createSpeechService(engine)
    const session = service.start()

    await tick()

    const stopping = session.stop()

    expect(session.state).toBe('stopping')

    resolvePrompt(granted)
    await tick()
    expect(engine.beginCalls).toBe(1)

    const handle = engine.handles[0]!

    expect(handle.finishCalls).toBe(1)

    handle.finished()

    const result = await stopping

    expect(result.reason).toBe('stopped')
  })

  it('stop() fallback during startup ends stopped without a handle', async () => {
    vi.useFakeTimers()

    const engine = new FakeEngine()

    engine.permission = undetermined
    engine.ensurePermissionImpl = () => new Promise<PermissionResponse>(() => {})

    const service = createSpeechService(engine)
    const session = service.start()

    await tick()

    const stopping = session.stop()

    await vi.advanceTimersByTimeAsync(5000)

    const result = await stopping

    expect(result.reason).toBe('stopped')
    expect(engine.beginCalls).toBe(0)
  })

  it('stop() after end returns the settled result; abort() after end is a no-op', async () => {
    const engine = new FakeEngine()
    const service = createSpeechService(engine)
    const session = service.start()

    await tick()
    engine.handles[0]!.listening()
    session.abort()

    const first = await session.result
    const second = await session.stop()

    expect(second).toBe(first)
    session.abort()
    expect(engine.handles[0]!.cancelCalls).toBe(1)
  })
})

describe('silence endpoint', () => {
  it('finishes the engine after a hypothesis goes unchanged and ends completed', async () => {
    vi.useFakeTimers()

    const engine = new FakeEngine()

    engine.silenceEndpointMs = 200

    const service = createSpeechService(engine)
    const session = service.start({ continuous: false })
    const events: SpeechRecognitionEvent[] = []

    session.subscribe((event) => events.push(event))
    await tick()

    const handle = engine.handles[0]!

    handle.listening()

    handle.hypothesis('draft', false)
    await vi.advanceTimersByTimeAsync(150)
    handle.hypothesis('draft two', false) // resets the clock
    await vi.advanceTimersByTimeAsync(199)
    expect(handle.finishCalls).toBe(0)
    await vi.advanceTimersByTimeAsync(1)
    expect(handle.finishCalls).toBe(1)
    // A silence endpoint is a natural completion, not a user stop.
    expect(session.state).toBe('listening')

    handle.finished()

    const result = await session.result

    expect(result.reason).toBe('completed')
    expect(result.transcript).toBe('draft two')
  })

  it('does not arm for continuous sessions or empty hypotheses', async () => {
    vi.useFakeTimers()

    const engine = new FakeEngine()

    engine.silenceEndpointMs = 100

    const service = createSpeechService(engine)
    const session = service.start({ continuous: true })

    await tick()

    const handle = engine.handles[0]!

    handle.listening()
    handle.hypothesis('continuous text', false)
    await vi.advanceTimersByTimeAsync(1000)
    expect(handle.finishCalls).toBe(0)
    session.abort()
    await session.result
  })
})

describe('listeners', () => {
  it('isolates a throwing listener from the others and the session', async () => {
    const engine = new FakeEngine()
    const service = createSpeechService(engine)
    const session = service.start()
    const seen: SpeechRecognitionEvent[] = []

    session.subscribe(() => {
      throw new Error('listener exploded')
    })

    session.subscribe((event) => seen.push(event))
    await tick()
    engine.handles[0]!.listening()
    engine.handles[0]!.hypothesis('hello', true)
    expect(seen.some((event) => event.type === 'transcript')).toBe(true)

    const result = await session.result

    expect(result.reason).toBe('completed')
    expect(seen.at(-1)?.type).toBe('end')
  })

  it('clears listeners after the end event', async () => {
    const engine = new FakeEngine()
    const service = createSpeechService(engine)
    const session = service.start()
    const seen: SpeechRecognitionEvent[] = []

    session.subscribe((event) => seen.push(event))
    await tick()

    const handle = engine.handles[0]!

    handle.listening()
    session.abort()
    await session.result

    const count = seen.length

    handle.hypothesis('late', false)
    handle.finished()
    handle.failed(new SpeechRecognitionError('network', 'late'))
    await tick()
    expect(seen.length).toBe(count)
    expect(seen.at(-1)?.type).toBe('end')
  })

  it('unsubscribes on demand and ignores late subscriptions', async () => {
    const engine = new FakeEngine()
    const service = createSpeechService(engine)
    const session = service.start()
    const seen: SpeechRecognitionEvent[] = []
    const off = session.subscribe((event) => seen.push(event))

    off()
    await tick()
    engine.handles[0]!.listening()
    expect(seen.length).toBe(0)
    session.abort()
    await session.result

    const late: SpeechRecognitionEvent[] = []
    const offLate = session.subscribe((event) => late.push(event))

    offLate()
    await tick()
    expect(late.length).toBe(0)
  })
})

describe('deferred ends', () => {
  it('delivers the busy end asynchronously to a post-start subscriber', async () => {
    const engine = new FakeEngine()
    const service = createSpeechService(engine)

    service.start()

    const second = service.start()

    // Synchronously after start() the session has not ended yet — the busy
    // end is delivered on a microtask so subscribers still catch it.
    expect(second.state).toBe('starting')

    const result = await second.result

    expect(result.reason).toBe('error')
    expect(result.error?.code).toBe('busy')
    expect(second.state).toBe('ended')
  })
})
