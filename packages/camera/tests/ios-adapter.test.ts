import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'

const model = vi.hoisted(() => {
  const array = (entries: any[]) => ({
    get count() {
      return entries.length
    },
    objectAtIndex: (index: number) => entries[index],
  })
  const devices = [1, 2].map((position) => ({
    uniqueID: position === 1 ? 'back' : 'front',
    localizedName: String(position),
    position,
    hasMediaType: (type: string) => type === 'video',
    supportsAVCaptureSessionPreset: () => true,
  }))
  class Input {
    device: any
    constructor(device: any) {
      this.device = device
    }
    static deviceInputWithDeviceError(device: any) {
      return new Input(device)
    }
  }
  class Session {
    entries: any[] = []
    inputs = array(this.entries)
    static new() {
      return new Session()
    }
    beginConfiguration() {}
    commitConfiguration() {}
    canSetSessionPreset() {
      return true
    }
    canAddInput(input: any) {
      return !this.entries.some((entry) => entry.device.position && input.device.position)
    }
    addInput(input: any) {
      this.entries.push(input)
    }
    removeInput(input: any) {
      this.entries.splice(this.entries.indexOf(input), 1)
    }
    canAddOutput() {
      return true
    }
    addOutput() {}
    startRunning() {}
    stopRunning() {}
  }
  const bridge = () => ({
    target: undefined as Session | undefined,
    ready: undefined as ((ready: boolean) => void) | undefined,
    events: [] as ((type: string, payload: string) => void)[],
    flip: undefined as ((problem: string | null) => void) | undefined,
    install(target: Session) {
      this.target = target
      return null
    },
    observeSource(callback: (ready: boolean) => void) {
      this.ready = callback
    },
    setPreviewLayer: vi.fn(),
    configureAudio: vi.fn(() => null),
    expectCamera: vi.fn(),
    startAudioOrientationMaximumDurationMsReply(
      _path: string,
      _audio: boolean,
      _orientation: number,
      _limit: number,
      callback: (type: string, payload: string) => void,
    ) {
      this.events.push(callback)
    },
    switchToReply: vi.fn(function (
      this: any,
      id: string,
      callback: (problem: string | null) => void,
    ) {
      this.flip = (problem: string | null) => {
        if (!problem) {
          const previous = this.target.entries.find((entry: any) => entry.device.position)
          if (previous) {
            this.target.removeInput(previous)
          }

          this.target.addInput(new Input(devices.find((device) => device.uniqueID === id)))
        }
        callback(problem)
      }
    }),
    cancelSwitch: vi.fn(),
    confirmSwitch: vi.fn(),
    stop: vi.fn(),
    elapsedMs: () => 1000,
    releaseWithReply(callback: () => void) {
      callback()
    },
  })
  return { array, devices, Input, Session, bridge }
})

vi.mock('@nativescript/core', () => ({
  File: { exists: (path: string) => path === '/docs' },
  knownFolders: { documents: () => ({ path: '/docs' }) },
  path: { join: (...args: string[]) => args.join('/') },
}))

vi.mock('@octane-xplat/platform/ios', () => ({
  AVCaptureDevice: {
    authorizationStatusForMediaType: () => 3,
    defaultDeviceWithMediaType: () => ({
      uniqueID: 'mic',
      hasMediaType: (type: string) => type === 'audio',
    }),
  },
  AVCaptureDeviceDiscoverySession: {
    discoverySessionWithDeviceTypesMediaTypePosition: () => ({
      devices: model.array(model.devices),
    }),
  },
  AVCaptureDeviceInput: model.Input,
  AVCaptureSession: model.Session,
  AVCaptureVideoPreviewLayer: {
    layerWithSession: () => ({
      connection: { supportsVideoMirroring: true },
      removeFromSuperlayer() {},
    }),
  },
  AVURLAsset: {
    assetWithURL: () => ({
      duration: 2,
      tracksWithMediaType: (type: string) =>
        model.array(
          type === 'video'
            ? [
                {
                  naturalSize: { width: 720, height: 1280 },
                  preferredTransform: { a: 1, b: 0, c: 0, d: 1 },
                },
              ]
            : [{}],
        ),
    }),
  },
  CGPointMake: () => ({}),
  NSBundle: { mainBundle: { objectForInfoDictionaryKey: () => 'Declared' } },
  NSNotification: class {},
  NSNumber: class {},
  NSFileManager: {
    defaultManager: { attributesOfFileSystemForPathError: () => ({ objectForKey: () => 1e9 }) },
  },
  NSNotificationCenter: {
    defaultCenter: { addObserverForNameObjectQueueUsingBlock: () => ({}), removeObserver() {} },
  },
  NSOperationQueue: { mainQueue: {} },
  NSURL: { fileURLWithPath: (path: string) => ({ path }) },
}))

import { createSessionBackend } from '../src/session-backend.ios'
import { SharedCameraSession } from '../src/session-core'

beforeEach(() => {
  for (const name of [
    'AVCaptureDeviceTypeBuiltInWideAngleCamera',
    'AVCaptureDeviceTypeBuiltInUltraWideCamera',
    'AVCaptureDeviceTypeBuiltInTelephotoCamera',
    'AVCaptureDeviceTypeBuiltInDualCamera',
    'AVCaptureDeviceTypeBuiltInDualWideCamera',
    'AVCaptureDeviceTypeBuiltInTripleCamera',
    'AVCaptureDeviceTypeBuiltInTrueDepthCamera',
    'AVCaptureSessionPreset1280x720',
    'AVCaptureSessionWasInterruptedNotification',
    'AVCaptureSessionInterruptionEndedNotification',
    'AVCaptureSessionRuntimeErrorNotification',
    'AVCaptureDeviceWasDisconnectedNotification',
    'AVCaptureDeviceWasConnectedNotification',
    'UIApplicationDidEnterBackgroundNotification',
    'UIApplicationWillEnterForegroundNotification',
    'AVLayerVideoGravityResizeAspectFill',
    'NSFileSystemFreeSize',
  ]) {
    vi.stubGlobal(name, name)
  }
  vi.stubGlobal('AVMediaTypeVideo', 'video')
  vi.stubGlobal('AVMediaTypeAudio', 'audio')
  vi.stubGlobal('CMTimeGetSeconds', (time: number) => time)
})

afterEach(() => vi.unstubAllGlobals())

function setup() {
  const native = model.bridge()
  vi.stubGlobal('XplatSwitchingMovieWriter', { new: () => native })
  const backend = createSessionBackend({ audio: true })
  const session = new SharedCameraSession(backend, { audio: true })
  const onReady = vi.fn()
  const detach = session.attach({ ios: { layer: { addSublayer() {} }, bounds: {} } }, { onReady })
  const start = () => {
    const take = session.startRecording({ destinationFileUrl: 'file:///docs/take.mov' })
    native.events.at(-1)!('started', '{"width":720,"height":1280}')
    return take
  }
  const finish = (warning = '') =>
    native.events.at(-1)!('finished', JSON.stringify({ path: '/docs/take.mov', warning }))
  return { native, backend, session, onReady, start, finish, detach }
}

describe('iOS sample writer adapter', () => {
  it('retains the native duration limit cause through finishing', async () => {
    const h = setup()
    h.native.ready!(true)
    const take = h.start()
    h.native.events.at(-1)!('limit', '')
    h.native.events.at(-1)!('finishing', '')
    h.finish()
    await expect(take.completion).resolves.toMatchObject({
      kind: 'clip',
      endReason: 'maximumDuration',
    })
    await h.session.dispose()
  })

  it('keeps microphone ownership outside the video session and reports effective audio', async () => {
    const h = setup()
    expect(h.native.configureAudio).toHaveBeenCalledWith(true)
    expect(h.native.target!.entries).toHaveLength(1)
    expect(h.native.target!.entries[0].device.hasMediaType('video')).toBe(true)
    h.native.ready!(true)
    const take = h.start()
    expect(h.session.snapshot().attempt?.configuration?.audio).toBe(true)
    h.finish()
    await take.completion
    await h.session.configure({ audio: false })
    expect(h.native.configureAudio).toHaveBeenCalledWith(false)
    await h.session.dispose()
  })

  it('fails preparation when independent microphone capture is unavailable', async () => {
    const h = setup()
    h.native.configureAudio.mockReturnValue('Microphone capture interrupted')
    h.native.ready!(true)
    const take = h.session.startRecording()
    await expect(take.completion).resolves.toMatchObject({ kind: 'failed', stage: 'preparation' })
    expect(h.native.events).toHaveLength(0)
    await h.session.dispose()
  })

  it('advertises switching when the native writer is linked', async () => {
    vi.stubGlobal('XplatSwitchingMovieWriter', { new: model.bridge })
    expect((await createSessionBackend({}).getCapabilities()).cameraSwitchDuringRecording).toBe(
      true,
    )
  })

  it('reports a missing native writer with rebuild guidance', async () => {
    const backend = createSessionBackend({})
    expect(await backend.getCapabilities()).toMatchObject({
      supported: false,
      cameraSwitchDuringRecording: false,
      reason: 'Movie writer is not linked; rebuild the iOS app',
    })
  })

  it('waits for native frames and does not rearm onReady when a switch becomes ready', async () => {
    const h = setup()
    expect(h.backend.previewReady()).toBe(false)
    expect(() => h.start()).toThrow()
    h.native.ready!(true)
    expect(h.onReady).toHaveBeenCalledOnce()
    const take = h.start()
    const flip = h.session.switchCamera('front')
    await vi.waitFor(() => expect(h.native.switchToReply).toHaveBeenCalledOnce())
    h.native.ready!(false)
    h.native.ready!(true)
    h.native.flip!(null)
    await flip
    expect(h.native.confirmSwitch).toHaveBeenCalledWith('front')
    expect(h.onReady).toHaveBeenCalledOnce()
    expect(h.session.snapshot()).toMatchObject({
      state: 'recording',
      activeCamera: { id: 'front' },
      attempt: { configuration: { cameraId: 'back', width: 720, height: 1280 } },
    })
    expect(take.stop()).toBe(take.completion)
    h.finish()
    await expect(take.completion).resolves.toMatchObject({ kind: 'clip', clip: { hasAudio: true } })
    await h.session.dispose()
  })

  it('preserves a usable partial clip when source recovery fails', async () => {
    const h = setup()
    h.native.ready!(true)
    const take = h.start()
    h.native.events[0]!('sourceLost', 'Rollback failed')
    h.native.events[0]!('finishing', 'captureError')
    h.finish('Rollback failed')
    await expect(take.completion).resolves.toMatchObject({
      kind: 'clip',
      endReason: 'cameraUnavailable',
      partial: true,
      warning: { kind: 'captureFailed' },
    })
    await h.session.dispose()
  })

  it('joins stop, cancels selection and ignores late native success', async () => {
    const h = setup()
    h.native.ready!(true)
    const take = h.start()
    const flip = h.session.switchCamera('front')
    const rejected = expect(flip).rejects.toMatchObject({ kind: 'invalidState' })
    await vi.waitFor(() => expect(h.native.switchToReply).toHaveBeenCalledOnce())
    take.stop()
    await rejected
    h.native.flip!(null)
    h.finish()
    await take.completion
    expect(h.session.snapshot().activeCamera?.id).toBe('back')
    expect(h.native.cancelSwitch).toHaveBeenCalledOnce()
    await h.session.dispose()
  })
})

describe('writer completion recovery', () => {
  it('verifies the file when native completion metadata is malformed', async () => {
    const h = setup()
    h.native.ready!(true)
    const take = h.start()
    take.stop()
    h.native.events[0]!('finished', 'not JSON')
    await expect(take.completion).resolves.toMatchObject({
      kind: 'clip',
      warning: { operation: 'finalize' },
    })
    await h.session.dispose()
  })
  it('returns a verified partial clip when a failed writer owns playable output', async () => {
    const h = setup()
    h.native.ready!(true)
    const take = h.start()
    h.native.events[0]!(
      'failed',
      JSON.stringify({
        ownsOutput: true,
        hasVideo: true,
        canInspectOutput: true,
        message: 'Encoder reported failure',
      }),
    )
    await expect(take.completion).resolves.toMatchObject({
      kind: 'clip',
      partial: true,
      endReason: 'captureError',
      warning: { kind: 'captureFailed' },
    })
    await h.session.dispose()
  })
})

it('retracts source readiness while native teardown is still pending', async () => {
  const h = setup()
  let release: (() => void) | undefined
  h.native.releaseWithReply = (callback) => {
    release = callback
  }
  const disposal = h.session.dispose()
  await vi.waitFor(() => expect(release).toBeTypeOf('function'))
  h.native.ready!(true)
  expect(h.backend.previewReady()).toBe(false)
  expect(h.onReady).not.toHaveBeenCalled()
  release!()
  await disposal
})

it('retracts admission until an idle camera replacement supplies fresh frames', async () => {
  const h = setup()
  h.native.ready!(true)
  await h.session.configure({ camera: 'front' })
  expect(h.backend.previewReady()).toBe(false)
  expect(() => h.start()).toThrow()
  h.native.ready!(true)
  const take = h.start()
  expect(h.session.snapshot().activeCamera?.id).toBe('front')
  take.stop()
  h.finish()
  await take.completion
  await h.session.dispose()
})

it('rebinds an absent input when retrying the same idle selection', async () => {
  const h = setup()
  h.native.ready!(true)
  const target = h.native.target!
  target.entries.splice(0, 1)
  await h.session.configure({ camera: 'back' })
  expect(target.entries.some((entry) => entry.device.uniqueID === 'back')).toBe(true)
  expect(h.backend.previewReady()).toBe(false)
  h.native.ready!(true)
  const take = h.start()
  take.stop()
  h.finish()
  await take.completion
  await h.session.dispose()
})

it('does not return an audio-only writer result as a captured movie', async () => {
  const h = setup()
  h.native.ready!(true)
  const take = h.start()
  h.native.events[0]!(
    'failed',
    JSON.stringify({ ownsOutput: true, hasVideo: false, message: 'No video frames were captured' }),
  )
  await expect(take.completion).resolves.toMatchObject({ kind: 'failed' })
  await h.session.dispose()
})

it('joins finalization and retains verified media after malformed start metadata', async () => {
  const h = setup()
  h.native.ready!(true)
  const take = h.session.startRecording({ destinationFileUrl: 'file:///docs/take.mov' })
  h.native.events[0]!('started', 'not JSON')
  expect(h.native.stop).toHaveBeenCalledOnce()
  h.finish()
  await expect(take.completion).resolves.toMatchObject({
    kind: 'clip',
    partial: true,
    endReason: 'captureError',
    warning: { kind: 'captureFailed' },
  })
  await h.session.dispose()
})

it('reports incomplete output without treating a timed-out writer as finalized media', async () => {
  const h = setup()
  h.native.ready!(true)
  const take = h.start()
  h.native.events[0]!(
    'failed',
    JSON.stringify({
      ownsOutput: true,
      hasVideo: true,
      canInspectOutput: false,
      message: 'Finalization timed out',
    }),
  )
  await expect(take.completion).resolves.toMatchObject({
    kind: 'failed',
    error: { cause: { candidateFileUrl: 'file:///docs/take.mov' } },
  })
  await h.session.dispose()
})

it('does not acknowledge a physical swap when stop wins before the JS commit', async () => {
  const h = setup()
  h.native.ready!(true)
  const take = h.start()
  const flip = h.session.switchCamera('front')
  const rejected = expect(flip).rejects.toMatchObject({ kind: 'invalidState' })
  await vi.waitFor(() => expect(h.native.switchToReply).toHaveBeenCalledOnce())
  // Native has accepted the new source, but promise continuations have not run.
  h.native.flip!(null)
  take.stop()
  await rejected
  expect(h.native.confirmSwitch).not.toHaveBeenCalled()
  h.finish()
  await take.completion
  expect(h.session.snapshot().activeCamera?.id).toBe('back')
  await h.session.dispose()
})
