import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@nativescript/core', () => {
  const activity = {
    checkSelfPermission: () => 0,
    shouldShowRequestPermissionRationale: () => false,
    requestPermissions: () => {},
  }
  const context = {
    getSharedPreferences: () => ({
      getBoolean: () => false,
      edit: () => ({ putBoolean: () => ({ apply: () => {} }) }),
    }),
    getPackageManager: () => ({ hasSystemFeature: () => true }),
    getFilesDir: () => ({ getAbsolutePath: () => '/data/app/files' }),
  }

  return {
    Application: {
      android: {
        context,
        foregroundActivity: activity,
        startActivity: activity,
        activityRequestPermissionsEvent: 'activityRequestPermissions',
      },
      suspendEvent: 'suspend',
      resumeEvent: 'resume',
      on: () => {},
      off: () => {},
    },
  }
})

import { SharedCameraSession } from '../src/session-core'
import { createSessionBackend } from '../src/session-backend.android'
import { CameraCaptureError } from '../src/types'
import type { CameraSessionEvent, MovieOutcome } from '../src/types'

const flush = async () => {
  for (let i = 0; i < 8; i++) {
    await Promise.resolve()
  }
}

// CameraX bridge double: captures the Listener the backend installs so the
// spec can drive the same event stream CameraSessionBridge emits.
class FakeBridge {
  static Listener = class {
    impl: { event(type: string, payload: string): void }
    constructor(impl: { event(type: string, payload: string): void }) {
      this.impl = impl
    }

    event(type: string, payload: string) {
      this.impl.event(type, payload)
    }
  }

  static instances: FakeBridge[] = []
  static openOutput = vi.fn()

  listener: { event(type: string, payload: string): void }
  readyValue = false
  released = false
  attachArgs: { host: unknown; selected: string }[] = []
  start = vi.fn()
  stop = vi.fn()
  switchCamera = vi.fn()
  confirmCameraSwitch = vi.fn()
  cancelCameraSwitch = vi.fn()

  constructor(_context: unknown, listener: FakeBridge['listener']) {
    this.listener = listener
    FakeBridge.instances.push(this)
  }

  emit(type: string, payload: string) {
    this.listener.event(type, payload)
  }

  attach(host: unknown, selected: string) {
    this.attachArgs.push({ host, selected })
  }

  detach() {}
  isReady() {
    return this.readyValue
  }

  capabilities() {
    return JSON.stringify({
      cameras: [
        { id: '0', label: 'Back camera', facing: 'back' },
        { id: '1', label: 'Front camera', facing: 'front' },
      ],
      profiles: [{ profile: 'standard', width: 1280, height: 720, frameRate: 30 }],
    })
  }

  elapsedMs() {
    return 0
  }

  background() {}
  foreground() {}
  focusAtPoint() {
    return true
  }

  zoomRatio = 1
  zoom() {
    return JSON.stringify({ zoom: this.zoomRatio, minZoom: 1, maxZoom: 8 })
  }

  setZoom(ratio: number) {
    this.zoomRatio = ratio
    return true
  }

  release() {
    this.released = true
  }
}

interface ReadySession {
  session: SharedCameraSession
  bridge: FakeBridge
  readyCalls: number
  takes: ReturnType<SharedCameraSession['startRecording']>[]
  errors: string[]
  events: CameraSessionEvent[]
  detach: () => void
}

/** Attach with an onReady consumer that records synchronously — the
 *  auto-record admission path that surfaced the bug. */
async function attachReadySession(
  afterAcquired?: (ready: ReadySession) => void,
): Promise<ReadySession> {
  const backend = createSessionBackend({})
  if (afterAcquired) {
    const switchCamera = backend.switchCamera!
    backend.switchCamera = (camera) => {
      const operation = switchCamera(camera)
      return {
        ...operation,
        completion: operation.completion.then((selected) => {
          afterAcquired(result)
          return selected
        }),
      }
    }
  }
  const result: ReadySession = {
    session: new SharedCameraSession(backend, {}),
    bridge: undefined as unknown as FakeBridge,
    readyCalls: 0,
    takes: [],
    errors: [],
    events: [],
    detach: () => {},
  }

  result.session.subscribe((event) => result.events.push(event))
  result.detach = result.session.attach(
    {},
    {
      onReady: () => {
        result.readyCalls += 1
        try {
          result.takes.push(result.session.startRecording())
        } catch (error) {
          result.errors.push(error instanceof Error ? error.message : String(error))
        }
      },
      onError: (issue) => result.errors.push(issue.message),
    },
  )

  await flush()
  result.bridge = FakeBridge.instances.at(-1)!
  return result
}

const settleTake = (bridge: FakeBridge, payload: string) => {
  bridge.emit('finished', payload)
}

const clip = JSON.stringify({
  kind: 'clip',
  output: {
    kind: 'nativeFile',
    resourceId: 'file:///data/app/files/octane-camera/clip.mp4',
    fileUrl: 'file:///data/app/files/octane-camera/clip.mp4',
  },
  mimeType: 'video/mp4',
  durationMs: 900,
  width: 1280,
  height: 720,
  orientation: 'unspecified',
  hasAudio: false,
})

beforeEach(() => {
  FakeBridge.instances = []
  vi.stubGlobal('com', {
    octanexplat: { camera: { CameraSessionBridge: FakeBridge } },
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('android adapter onReady admission', () => {
  it('finalizes usable output with a warning if native acquisition cannot be committed', async () => {
    const { session, bridge, takes, detach } = await attachReadySession()
    bridge.readyValue = true
    bridge.emit('ready', 'true')
    bridge.emit(
      'started',
      JSON.stringify({
        cameraId: '0',
        facing: 'back',
        audio: false,
        width: 1280,
        height: 720,
        frameRate: 30,
        orientation: 'unspecified',
        mimeType: 'video/mp4',
        container: 'mp4',
      }),
    )
    bridge.confirmCameraSwitch.mockImplementation(() => {
      throw new Error('Acquisition retired')
    })
    const flip = session.switchCamera('front')
    // Finalization cancels the operation; the clip carries the native diagnostic.
    const rejected = expect(flip).rejects.toMatchObject({ kind: 'invalidState' })
    await flush()
    bridge.emit('switchFinished', JSON.stringify({ id: '1', label: 'Front', facing: 'front' }))
    await rejected
    expect(bridge.cancelCameraSwitch).toHaveBeenCalledOnce()
    expect(bridge.stop).toHaveBeenCalledOnce()
    expect(session.snapshot().activeCamera?.facing).toBe('back')
    settleTake(bridge, clip)
    await expect(takes[0]!.completion).resolves.toMatchObject({
      kind: 'clip',
      endReason: 'cameraUnavailable',
      warning: { operation: 'switchCamera', kind: 'unavailable' },
    })
    await detach()
    await session.dispose()
  })

  it('keeps the previous selection when stop wins after acquisition but before commit', async () => {
    const { session, bridge, takes, detach } = await attachReadySession((ready) =>
      ready.takes[0]!.stop(),
    )
    bridge.readyValue = true
    bridge.emit('ready', 'true')
    bridge.emit(
      'started',
      JSON.stringify({
        cameraId: '0',
        facing: 'back',
        audio: false,
        width: 1280,
        height: 720,
        frameRate: 30,
        orientation: 'unspecified',
        mimeType: 'video/mp4',
        container: 'mp4',
      }),
    )
    const flip = session.switchCamera('front')
    const rejected = expect(flip).rejects.toMatchObject({ kind: 'invalidState' })
    await flush()
    bridge.emit('switchFinished', JSON.stringify({ id: '1', label: 'Front', facing: 'front' }))
    await rejected
    expect(bridge.confirmCameraSwitch).not.toHaveBeenCalled()
    expect(bridge.cancelCameraSwitch).toHaveBeenCalledOnce()
    expect(session.snapshot().activeCamera?.facing).toBe('back')
    settleTake(bridge, clip)
    await takes[0]!.completion
    await detach()
    const detachAgain = session.attach({})
    await flush()
    expect(bridge.attachArgs.at(-1)!.selected).toBe('default')
    await detachAgain()
    await session.dispose()
  })

  it('joins a native camera swap without admitting another take', async () => {
    const { session, bridge, takes, detach } = await attachReadySession()
    bridge.readyValue = true
    bridge.emit('ready', 'true')
    bridge.emit(
      'started',
      JSON.stringify({
        cameraId: '0',
        facing: 'back',
        audio: false,
        width: 1280,
        height: 720,
        frameRate: 30,
        orientation: 'unspecified',
        mimeType: 'video/mp4',
        container: 'mp4',
      }),
    )
    const flip = session.switchCamera('front')
    await flush()
    expect(bridge.switchCamera).toHaveBeenCalledWith('front')
    bridge.emit('ready', 'true')
    expect(takes).toHaveLength(1)
    bridge.emit('switchFinished', JSON.stringify({ id: '1', label: 'Front', facing: 'front' }))
    await flip
    expect(bridge.confirmCameraSwitch).toHaveBeenCalledExactlyOnceWith('1')
    expect(session.snapshot().activeCamera?.facing).toBe('front')
    expect(bridge.start).toHaveBeenCalledTimes(1)
    expect(bridge.stop).not.toHaveBeenCalled()
    settleTake(bridge, clip)
    detach()
    await session.dispose()
  })

  it('cancels a native swap on stop and ignores late native selection', async () => {
    const { session, bridge, takes, detach } = await attachReadySession()
    bridge.readyValue = true
    bridge.emit('ready', 'true')
    bridge.emit(
      'started',
      JSON.stringify({
        cameraId: '0',
        facing: 'back',
        audio: false,
        width: 1280,
        height: 720,
        frameRate: 30,
        orientation: 'unspecified',
        mimeType: 'video/mp4',
        container: 'mp4',
      }),
    )
    const flip = session.switchCamera('front')
    const rejected = expect(flip).rejects.toMatchObject({ kind: 'invalidState' })
    await flush()
    takes[0]!.stop()
    await rejected
    expect(bridge.cancelCameraSwitch).toHaveBeenCalledTimes(1)
    bridge.emit('switchFinished', JSON.stringify({ id: '1', label: 'Front', facing: 'front' }))
    await flush()
    expect(session.snapshot().activeCamera?.facing).toBe('back')
    settleTake(bridge, clip)
    detach()
    await session.dispose()
  })

  it('does not rebind the native source when auto-recording overtakes configure', async () => {
    const { session, bridge, takes, events, detach } = await attachReadySession()
    const configuring = session.configure({ audio: true })
    bridge.readyValue = true
    bridge.emit('ready', 'true')
    expect(takes).toHaveLength(1)
    await expect(configuring).rejects.toMatchObject({ kind: 'invalidState' })
    expect(bridge.attachArgs).toHaveLength(1)
    expect(bridge.stop).not.toHaveBeenCalled()
    expect(events.filter((event) => event.type === 'finished')).toHaveLength(0)
    settleTake(bridge, clip)
    await expect(takes[0].completion).resolves.toMatchObject({ kind: 'clip' })
    detach()
    await session.dispose()
  })

  it('withholds onReady until the availability event lands, then admits recording', async () => {
    const { session, bridge, takes, errors, detach } = await attachReadySession()
    expect(bridge.attachArgs).toHaveLength(1)

    // The pre-fix stream observer emitted "ready" before "availability"
    // — a synchronous onReady recording raced the stale flag.
    bridge.emit('availability', 'false')
    bridge.readyValue = true
    bridge.emit('ready', 'true')
    expect(takes).toHaveLength(0)

    bridge.emit('availability', 'true')
    expect(takes).toHaveLength(1)
    expect(errors).toEqual([])
    expect(bridge.start).toHaveBeenCalledTimes(1)
    expect(session.snapshot().state).toBe('starting')

    settleTake(bridge, clip)
    await detach()
    await session.dispose()
  })

  it('admits the awaited onReady -> capabilities -> startRecording path', async () => {
    const session = new SharedCameraSession(createSessionBackend({}), {})
    const outcomes: MovieOutcome[] = []
    const errors: string[] = []
    const detach = session.attach(
      {},
      {
        onReady: () => {
          void session
            .capabilities()
            .then(() => session.startRecording().completion)
            .then((outcome) => outcomes.push(outcome))
            .catch((error) => errors.push(error instanceof Error ? error.message : String(error)))
        },
        onError: (issue) => errors.push(issue.message),
      },
    )

    await flush()
    const bridge = FakeBridge.instances.at(-1)!
    // Reported ordering: ready fires while availability is still false,
    // the availability update landing in the same event burst.
    bridge.emit('availability', 'false')
    bridge.readyValue = true
    bridge.emit('ready', 'true')
    bridge.emit('availability', 'true')
    await flush()
    expect(errors).toEqual([])
    expect(bridge.start).toHaveBeenCalledTimes(1)

    settleTake(bridge, clip)
    await flush()
    expect(outcomes).toHaveLength(1)
    expect(outcomes[0].kind).toBe('clip')

    detach()
    await session.dispose()
  })

  it('withholds onReady while an interruption is in effect', async () => {
    const { session, bridge, takes, errors, detach } = await attachReadySession()
    bridge.emit('interruption', 'cameraInUse')
    bridge.readyValue = true
    bridge.emit('ready', 'true')
    expect(takes).toHaveLength(0)
    expect(session.snapshot().interrupted).toBe(true)
    expect(() => session.startRecording()).toThrowError(/interrupted/)

    bridge.emit('recovered', 'cameraInUse')
    expect(takes).toHaveLength(1)
    expect(errors).toEqual([])

    settleTake(bridge, clip)
    await detach()
    await session.dispose()
  })

  it('keeps onReady withheld while the camera is genuinely unavailable', async () => {
    const { session, bridge, takes, events, detach } = await attachReadySession()
    bridge.emit('availability', 'false')
    bridge.readyValue = true
    bridge.emit('ready', 'true')
    expect(takes).toHaveLength(0)
    expect(session.snapshot().cameraAvailable).toBe(false)

    try {
      session.startRecording()
      expect.unreachable()
    } catch (error) {
      expect(error).toBeInstanceOf(CameraCaptureError)
      expect((error as CameraCaptureError).kind).toBe('unavailable')
      expect((error as CameraCaptureError).message).toBe('Camera is unavailable')
    }

    expect(events.some((event) => event.type === 'availability' && !event.available)).toBe(true)

    // Recovery delivers the held ready once admission is possible again.
    bridge.emit('availability', 'true')
    expect(takes).toHaveLength(1)

    settleTake(bridge, clip)
    await detach()
    await session.dispose()
  })

  it('drops a pending onReady when readiness is retracted', async () => {
    const { session, bridge, takes, detach } = await attachReadySession()
    bridge.emit('availability', 'false')
    bridge.readyValue = true
    bridge.emit('ready', 'true')
    bridge.readyValue = false
    bridge.emit('ready', 'false')
    bridge.emit('availability', 'true')
    expect(takes).toHaveLength(0)

    bridge.readyValue = true
    bridge.emit('ready', 'true')
    expect(takes).toHaveLength(1)

    settleTake(bridge, clip)
    await detach()
    await session.dispose()
  })

  it('drops a pending onReady when the preview detaches', async () => {
    const { session, bridge, takes, detach } = await attachReadySession()
    bridge.emit('availability', 'false')
    bridge.readyValue = true
    bridge.emit('ready', 'true')
    await detach()
    bridge.emit('availability', 'true')
    expect(takes).toHaveLength(0)

    await session.dispose()
  })

  it('reports preview bind failures through onError and stays unavailable', async () => {
    const { session, bridge, errors, detach } = await attachReadySession()
    bridge.emit('previewError', 'java.lang.IllegalArgumentException: No SDR recording profile')
    expect(session.snapshot().cameraAvailable).toBe(false)
    expect(errors.at(-1)).toContain('No SDR recording profile')
    try {
      session.startRecording()
      expect.unreachable()
    } catch (error) {
      expect((error as CameraCaptureError).kind).toBe('unavailable')
    }

    await detach()
    await session.dispose()
  })
})

describe('android adapter zoom and display readiness', () => {
  it('reports and writes clamped zoom through the CameraX bridge', async () => {
    const { session, bridge, detach } = await attachReadySession()

    expect(session.zoomState()).toEqual({ zoom: 1, minZoom: 1, maxZoom: 8 })
    session.setZoom(3)
    expect(bridge.zoomRatio).toBe(3)
    session.setZoom(20)
    expect(bridge.zoomRatio).toBe(8)

    await detach()
    await session.dispose()
  })

  it('maps the native displayed edge to onDisplayReady', async () => {
    const backend = createSessionBackend({})
    const session = new SharedCameraSession(backend, {})
    const onDisplayReady = vi.fn()
    session.attach({}, { onDisplayReady })
    const bridge = FakeBridge.instances.at(-1)!
    bridge.emit('displayed', 'true')
    expect(onDisplayReady).toHaveBeenCalledTimes(1)

    await session.dispose()
  })
})
