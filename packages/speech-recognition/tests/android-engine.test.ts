// Android engine contract tests — the leaf driven through stubbed
// `android`/`com`/`java`/`androidx` globals. The module is re-imported per
// test because host state (askedOnce, activity tracking, resume
// generation) lives at module scope; `vi.resetModules()` gives each test a
// fresh engine and a fresh session core.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Permissioned } from '@octane-xplat/lib/capability'
import type { SpeechRecognitionImpl } from '../src/types'

const RESULTS_KEY = 'android.speech.extra.RESULTS'

class FakeImpl {
  constructor(impl?: Record<string, unknown>) {
    if (impl) {
      Object.assign(this, impl)
    }
  }
}

class FakeIntent {
  action: string
  extras = new Map<string, unknown>()
  flags = 0

  constructor(action: string) {
    this.action = action
  }

  putExtra(name: string, value: unknown): this {
    this.extras.set(name, value)
    return this
  }

  setFlags(flags: number): this {
    this.flags = flags
    return this
  }
}

class FakeRecognizer {
  static instances: FakeRecognizer[] = []
  static available = true
  static returnNull = false
  static failStart: Error | null = null

  listener: Record<string, (...args: never[]) => void> | null = null
  intent: FakeIntent | null = null
  stopped = false
  cancelled = false
  destroyed = false

  static createSpeechRecognizer(_context: unknown): FakeRecognizer | null {
    if (FakeRecognizer.returnNull) {
      return null
    }

    const recognizer = new FakeRecognizer()

    FakeRecognizer.instances.push(recognizer)
    return recognizer
  }

  static isRecognitionAvailable(_context: unknown): boolean {
    return FakeRecognizer.available
  }

  setRecognitionListener(listener: Record<string, (...args: never[]) => void>): void {
    this.listener = listener
  }

  startListening(intent: FakeIntent): void {
    if (FakeRecognizer.failStart !== null) {
      throw FakeRecognizer.failStart
    }

    this.intent = intent
  }

  stopListening(): void {
    this.stopped = true
  }

  cancel(): void {
    this.cancelled = true
  }

  destroy(): void {
    this.destroyed = true
  }
}

const resultsBundle = (texts: string[]) => ({
  getStringArrayList: (name: string) =>
    name !== RESULTS_KEY || texts.length === 0
      ? { isEmpty: () => true, get: () => '' }
      : { isEmpty: () => false, get: (index: number) => texts[index] },
})

const context = {
  permission: 0,
  serviceList: { isEmpty: () => false } as { isEmpty(): boolean } | null,
  lifecycleCallbacks: null as Record<string, (...args: never[]) => void> | null,
  startedIntents: [] as FakeIntent[],
  checkSelfPermission(_permission: string): number {
    return this.permission
  },
  getPackageName(): string {
    return 'com.xplat.speech.test'
  },
  getPackageManager() {
    return { queryIntentServices: () => this.serviceList }
  },
  registerActivityLifecycleCallbacks(callbacks: Record<string, unknown>): void {
    this.lifecycleCallbacks = callbacks as Record<string, (...args: never[]) => void>
  },
  startActivity(intent: FakeIntent): void {
    this.startedIntents.push(intent)
  },
}

const activity = {
  rationale: true,
  registry: null as {
    register(
      key: string,
      contract: unknown,
      callback: { onActivityResult(result: unknown): void },
    ): { launch(input: string): void; unregister(): void }
  } | null,
  registration: null as {
    key: string
    callback: { onActivityResult(result: unknown): void }
  } | null,
  launchInput: null as string | null,
  unregistered: false,
  requestPermissions(_permissions: string[], _requestCode: number): void {},
  shouldShowRequestPermissionRationale(_permission: string): boolean {
    return this.rationale
  },
  getActivityResultRegistry() {
    return this.registry
  },
}

const makeRegistry = () => {
  const registry = {
    register(
      key: string,
      _contract: unknown,
      callback: { onActivityResult(result: unknown): void },
    ) {
      activity.registration = { key, callback }
      return {
        launch(input: string) {
          activity.launchInput = input
        },
        unregister() {
          activity.unregistered = true
        },
      }
    },
  }

  return registry
}

const androidFake = {
  app: { Application: { ActivityLifecycleCallbacks: FakeImpl } },
  content: {
    Intent: FakeIntent,
    pm: { PackageManager: { PERMISSION_GRANTED: 0 } },
  },
  speech: {
    RecognitionListener: FakeImpl,
    RecognitionService: { SERVICE_INTERFACE: 'android.speech.RecognitionService' },
    RecognizerIntent: {
      ACTION_RECOGNIZE_SPEECH: 'android.speech.action.RECOGNIZE_SPEECH',
      EXTRA_CALLING_PACKAGE: 'calling_package',
      EXTRA_LANGUAGE: 'android.speech.extra.LANGUAGE',
      EXTRA_LANGUAGE_MODEL: 'android.speech.extra.LANGUAGE_MODEL',
      EXTRA_PARTIAL_RESULTS: 'android.speech.extra.PARTIAL_RESULTS',
      EXTRA_RESULTS: RESULTS_KEY,
      LANGUAGE_MODEL_FREE_FORM: 'free_form',
    },
    SpeechRecognizer: FakeRecognizer,
  },
}

const comFake = {
  tns: {
    NativeScriptApplication: {
      getInstance: () => context,
    },
  },
}

const javaFake = {
  util: { Locale: { getDefault: () => ({ toLanguageTag: () => 'en-US' }) } },
}

const androidxFake = {
  activity: {
    result: {
      ActivityResultCallback: FakeImpl,
      contract: { ActivityResultContracts: { RequestPermission: FakeImpl } },
    },
  },
}

const stubHost = (): void => {
  vi.stubGlobal('android', androidFake)
  vi.stubGlobal('com', comFake)
  vi.stubGlobal('java', javaFake)
  vi.stubGlobal('androidx', androidxFake)
}

const loadService = async (): Promise<Permissioned<SpeechRecognitionImpl>> => {
  vi.resetModules()
  return (await import('../src/android-engine')).speechRecognition
}

const listen = (session: ReturnType<SpeechRecognitionImpl['start']>) => {
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

const began = () => vi.waitFor(() => expect(FakeRecognizer.instances.length).toBeGreaterThan(0))
const lastRecognizer = () => FakeRecognizer.instances[FakeRecognizer.instances.length - 1]

const stockIsRecognitionAvailable = FakeRecognizer.isRecognitionAvailable
const stockStartActivity = context.startActivity

beforeEach(() => {
  FakeRecognizer.instances = []
  FakeRecognizer.available = true
  FakeRecognizer.returnNull = false
  FakeRecognizer.failStart = null
  FakeRecognizer.isRecognitionAvailable = stockIsRecognitionAvailable
  context.permission = 0
  context.lifecycleCallbacks = null
  context.startedIntents = []
  context.serviceList = { isEmpty: () => false }
  context.startActivity = stockStartActivity
  activity.rationale = true
  activity.registry = null
  activity.registration = null
  activity.launchInput = null
  activity.unregistered = false
})

afterEach(() => {
  vi.unstubAllGlobals()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (Array as any).create
})

describe('android engine presence', () => {
  it('is unsupported without the interop globals', async () => {
    const leaf = await loadService()

    expect(leaf.supported).toBe(false)
    expect(() => leaf.start()).toThrow()

    const availability = await leaf.getAvailability({ lang: 'en-US' })

    expect(availability).toEqual({
      available: false,
      reason: 'unsupported',
      lang: 'en-US',
      networkUse: null,
      continuous: false,
    })

    expect(await leaf.getPermissions()).toEqual({
      status: 'unsupported',
      granted: false,
      canAskAgain: false,
    })
  })

  it('is unsupported when the application instance is absent', async () => {
    stubHost()
    vi.stubGlobal('com', { tns: { NativeScriptApplication: { getInstance: () => null } } })

    const leaf = await loadService()

    expect(leaf.supported).toBe(false)
  })
})

describe('android availability', () => {
  it('reports the requested language, possible network, and no continuous', async () => {
    stubHost()

    const leaf = await loadService()
    const availability = await leaf.getAvailability({ lang: 'de-DE' })

    expect(availability).toEqual({
      available: true,
      reason: null,
      lang: 'de-DE',
      networkUse: 'possible',
      continuous: false,
    })
  })

  it('resolves the default language through java.util.Locale', async () => {
    stubHost()

    const leaf = await loadService()
    const availability = await leaf.getAvailability()

    expect(availability.lang).toBe('en-US')
  })

  it('maps an unavailable recognizer to service-unavailable', async () => {
    stubHost()
    FakeRecognizer.available = false

    const leaf = await loadService()
    const availability = await leaf.getAvailability()

    expect(availability.available).toBe(false)
    expect(availability.reason).toBe('service-unavailable')
    expect(availability.networkUse).toBeNull()
  })

  it('falls back to the RecognitionService intent query on pre-31 hosts', async () => {
    stubHost()
    // @ts-expect-error — removing the API 31+ static to model an older host
    FakeRecognizer.isRecognitionAvailable = undefined

    const leaf = await loadService()

    expect((await leaf.getAvailability()).available).toBe(true)
    context.serviceList = { isEmpty: () => true }
    expect((await leaf.getAvailability()).available).toBe(false)
  })
})

describe('android permissions', () => {
  it('reads granted state from checkSelfPermission', async () => {
    stubHost()

    const leaf = await loadService()

    expect(await leaf.getPermissions()).toEqual({
      status: 'granted',
      granted: true,
      canAskAgain: true,
    })
  })

  it('reads undetermined before the first request', async () => {
    stubHost()
    context.permission = -1

    const leaf = await loadService()

    expect(await leaf.getPermissions()).toEqual({
      status: 'undetermined',
      granted: false,
      canAskAgain: true,
    })
  })

  it('prompts through the activity result registry and reports the outcome', async () => {
    stubHost()
    context.permission = -1
    activity.registry = makeRegistry()

    const leaf = await loadService()

    await leaf.getPermissions() // registers lifecycle tracking
    context.lifecycleCallbacks?.onActivityResumed?.(activity as never)

    const response = leaf.requestPermissions()

    await vi.waitFor(() => expect(activity.launchInput).toBe('android.permission.RECORD_AUDIO'))
    expect(activity.registration?.key).toBe('octane-xplat.speech.record_audio')
    context.permission = 0
    activity.registration?.callback.onActivityResult(true)
    expect(await response).toEqual({ status: 'granted', granted: true, canAskAgain: true })
    expect(activity.unregistered).toBe(true)
  })

  it('reports denial with rationale as a re-askable denial', async () => {
    stubHost()
    context.permission = -1
    activity.registry = makeRegistry()

    const leaf = await loadService()

    await leaf.getPermissions()
    context.lifecycleCallbacks?.onActivityResumed?.(activity as never)

    const response = leaf.requestPermissions()

    await vi.waitFor(() => expect(activity.launchInput).not.toBeNull())
    activity.registration?.callback.onActivityResult(false)
    expect(await response).toEqual({ status: 'denied', granted: false, canAskAgain: true })
    expect(await leaf.getPermissions()).toEqual({
      status: 'denied',
      granted: false,
      canAskAgain: true,
    })
  })

  it('skips re-prompting on a permanent denial', async () => {
    stubHost()
    context.permission = -1
    activity.registry = makeRegistry()
    activity.rationale = false

    const leaf = await loadService()

    await leaf.getPermissions()
    context.lifecycleCallbacks?.onActivityResumed?.(activity as never)

    // First request: denial without rationale marks the denial permanent.
    const first = leaf.requestPermissions()

    await vi.waitFor(() => expect(activity.launchInput).not.toBeNull())
    activity.registration?.callback.onActivityResult(false)
    expect(await first).toEqual({ status: 'denied', granted: false, canAskAgain: false })

    // Second request: no new prompt is launched.
    activity.launchInput = null
    expect(await leaf.requestPermissions()).toEqual({
      status: 'denied',
      granted: false,
      canAskAgain: false,
    })

    expect(activity.launchInput).toBeNull()
  })

  it('falls back to the ACTION_REQUEST_PERMISSIONS intent without a tracked activity', async () => {
    stubHost()
    context.permission = -1

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(Array as any).create = (_type: string, count: number) => new Array(count)

    const leaf = await loadService()

    const response = leaf.requestPermissions()

    await vi.waitFor(() => expect(context.startedIntents.length).toBe(1))

    const intent = context.startedIntents[0]

    expect(intent.action).toBe('android.content.pm.action.REQUEST_PERMISSIONS')
    expect(intent.flags).toBe(0x10000000)
    expect(intent.extras.get('android.content.pm.extra.REQUEST_PERMISSIONS_NAMES')).toEqual([
      'android.permission.RECORD_AUDIO',
    ])

    expect(intent.extras.get('android.content.pm.extra.REQUEST_PERMISSIONS_PACKAGE_NAME')).toBe(
      'com.xplat.speech.test',
    )

    context.permission = 0 // poll observes the grant
    expect(await response).toEqual({ status: 'granted', granted: true, canAskAgain: true })
  })
})

describe('android session events', () => {
  it('forwards options as recognizer intent extras and maps the event stream', async () => {
    stubHost()

    const leaf = await loadService()
    const session = leaf.start({ lang: 'fr-FR', interimResults: false })

    await began()

    const recognizer = lastRecognizer()
    const intent = recognizer.intent

    expect(intent?.action).toBe('android.speech.action.RECOGNIZE_SPEECH')
    expect(intent?.extras.get('android.speech.extra.LANGUAGE')).toBe('fr-FR')
    expect(intent?.extras.get('android.speech.extra.PARTIAL_RESULTS')).toBe(false)
    expect(intent?.extras.get('android.speech.extra.LANGUAGE_MODEL')).toBe('free_form')
    expect(intent?.extras.get('calling_package')).toBe('com.xplat.speech.test')

    const events = listen(session)

    recognizer.listener?.onReadyForSpeech?.(null as never)
    recognizer.listener?.onResults?.(resultsBundle(['bonjour le monde']) as never)

    const result = await session.result

    expect(result.reason).toBe('completed')
    expect(result.transcript).toBe('bonjour le monde')
    expect(events).toContain('state:listening')
    expect(events).toContain('transcript:bonjour le monde:true')
    expect(events).toContain('end:completed:')
    await vi.waitFor(() => expect(recognizer.destroyed).toBe(true))
  })

  it('takes the first EXTRA_RESULTS entry from partial results', async () => {
    stubHost()

    const leaf = await loadService()
    const session = leaf.start({ lang: 'en-US' })

    await began()

    const recognizer = lastRecognizer()
    const events = listen(session)

    recognizer.listener?.onReadyForSpeech?.(null as never)
    recognizer.listener?.onPartialResults?.(resultsBundle(['hello wor', 'other']) as never)
    recognizer.listener?.onPartialResults?.(resultsBundle(['hello world']) as never)
    recognizer.listener?.onResults?.(resultsBundle(['hello world']) as never)

    const result = await session.result

    expect(result.transcript).toBe('hello world')
    expect(events).toContain('transcript:hello wor:false')
    expect(events).toContain('transcript:hello world:false')
  })

  it('maps recognizer errors through the Android error map', async () => {
    stubHost()

    const leaf = await loadService()
    const session = leaf.start({ lang: 'en-US' })

    await began()

    const recognizer = lastRecognizer()

    recognizer.listener?.onReadyForSpeech?.(null as never)
    recognizer.listener?.onError?.(7 as never) // ERROR_NO_MATCH

    const result = await session.result

    expect(result.reason).toBe('error')
    expect(result.error?.code).toBe('no-speech')
    expect(result.error?.nativeCode).toBe(7)
    await vi.waitFor(() => expect(recognizer.destroyed).toBe(true))
  })

  it('maps ERROR_INSUFFICIENT_PERMISSIONS to permission-denied', async () => {
    stubHost()

    const leaf = await loadService()
    const session = leaf.start({ lang: 'en-US' })

    await began()
    lastRecognizer().listener?.onError?.(9 as never)

    const result = await session.result

    expect(result.error?.code).toBe('permission-denied')
  })

  it('stop() calls stopListening and ends stopped on results', async () => {
    stubHost()

    const leaf = await loadService()
    const session = leaf.start({ lang: 'en-US' })

    await began()

    const recognizer = lastRecognizer()

    recognizer.listener?.onReadyForSpeech?.(null as never)

    const stopping = session.stop()

    expect(recognizer.stopped).toBe(true)
    recognizer.listener?.onResults?.(resultsBundle(['final text']) as never)
    expect((await stopping).reason).toBe('stopped')
    expect((await session.result).transcript).toBe('final text')
  })

  it('abort() cancels and destroys the recognizer', async () => {
    stubHost()

    const leaf = await loadService()
    const session = leaf.start({ lang: 'en-US' })

    await began()

    const recognizer = lastRecognizer()

    recognizer.listener?.onReadyForSpeech?.(null as never)
    session.abort()
    expect(recognizer.cancelled).toBe(true)
    expect(recognizer.destroyed).toBe(true)
    expect((await session.result).reason).toBe('aborted')
  })

  it('ends a second concurrent start with busy', async () => {
    stubHost()

    const leaf = await loadService()
    const first = leaf.start({ lang: 'en-US' })

    await began()

    const second = leaf.start({ lang: 'en-US' })
    const result = await second.result

    expect(result.reason).toBe('error')
    expect(result.error?.code).toBe('busy')
    first.abort()
    await first.result
  })

  it('ends a continuous session as unsupported-option', async () => {
    stubHost()

    const leaf = await loadService()
    const session = leaf.start({ lang: 'en-US', continuous: true })
    const result = await session.result

    expect(result.reason).toBe('error')
    expect(result.error?.code).toBe('unsupported-option')
    expect(FakeRecognizer.instances.length).toBe(0)
  })

  it('a null recognizer instance ends as service-unavailable', async () => {
    stubHost()
    FakeRecognizer.returnNull = true

    const leaf = await loadService()
    const session = leaf.start({ lang: 'en-US' })
    const result = await session.result

    expect(result.reason).toBe('error')
    expect(result.error?.code).toBe('service-unavailable')
  })

  it('a startListening SecurityException ends as permission-denied', async () => {
    stubHost()
    FakeRecognizer.failStart = new Error('Missing RECORD_AUDIO permission')

    const leaf = await loadService()
    const session = leaf.start({ lang: 'en-US' })
    const result = await session.result

    expect(result.reason).toBe('error')
    expect(result.error?.code).toBe('permission-denied')
  })

  it('a denied session never reaches the recognizer', async () => {
    stubHost()
    context.permission = -1
    context.startActivity = () => {
      throw new Error('unreachable')
    }

    const leaf = await loadService()
    const session = leaf.start({ lang: 'en-US' })
    const result = await session.result

    expect(result.reason).toBe('error')
    expect(result.error?.code).toBe('permission-denied')
    expect(FakeRecognizer.instances.length).toBe(0)
  })
})
