// Scripted SpeechEngine for session-core tests. No timers fire on their
// own — tests drive every sink callback and clock advance explicitly.
import type { PermissionResponse } from '@octane-xplat/lib/capability'
import type {
  SpeechBeginOptions,
  SpeechEngine,
  SpeechEngineHandle,
  SpeechEngineSink,
} from '../src/session-core'

import { SpeechRecognitionError } from '../src/types'
import type { SpeechRecognitionAvailability } from '../src/types'

export class FakeHandle implements SpeechEngineHandle {
  finishCalls = 0
  cancelCalls = 0

  constructor(private readonly sink: SpeechEngineSink) {}

  finish(): void {
    this.finishCalls++
  }

  cancel(): void {
    this.cancelCalls++
  }

  listening(): void {
    this.sink.listening()
  }

  hypothesis(text: string, segmentFinal = false): void {
    this.sink.hypothesis(text, segmentFinal)
  }

  finished(): void {
    this.sink.finished()
  }

  failed(error: SpeechRecognitionError): void {
    this.sink.failed(error)
  }
}

export class FakeEngine implements SpeechEngine {
  supported = true
  lang = 'en-US'
  silenceEndpointMs: number | undefined = undefined
  permission: PermissionResponse = { status: 'granted', granted: true, canAskAgain: true }
  ensureResult: PermissionResponse | undefined = undefined
  availabilityValue: SpeechRecognitionAvailability = {
    available: true,
    reason: null,
    lang: 'en-US',
    networkUse: 'required',
    continuous: true,
  }

  availabilityRejects = false
  handles: FakeHandle[] = []
  readCalls = 0
  ensureCalls = 0
  beginCalls = 0
  beginOptions: SpeechBeginOptions | null = null
  ensurePermissionImpl: (() => Promise<PermissionResponse>) | null = null

  defaultLang(): string {
    return this.lang
  }

  async readPermission(): Promise<PermissionResponse> {
    this.readCalls++
    return this.permission
  }

  async ensurePermission(): Promise<PermissionResponse> {
    this.ensureCalls++
    return this.ensurePermissionImpl !== null
      ? this.ensurePermissionImpl()
      : (this.ensureResult ?? this.permission)
  }

  async availability(lang?: string): Promise<SpeechRecognitionAvailability> {
    if (this.availabilityRejects) {
      throw new Error('availability probe failed')
    }

    return { ...this.availabilityValue, lang: lang ?? this.availabilityValue.lang }
  }

  begin(options: SpeechBeginOptions, sink: SpeechEngineSink): SpeechEngineHandle {
    this.beginCalls++
    this.beginOptions = options
    const handle = new FakeHandle(sink)
    this.handles.push(handle)
    return handle
  }
}

/** Flush the microtask queue — the async startup pipeline and deferred ends
 *  are all microtask-delivered, so a handful of ticks settles them. */
export const tick = async (turns = 12): Promise<void> => {
  for (let i = 0; i < turns; i++) {
    await Promise.resolve()
  }
}
