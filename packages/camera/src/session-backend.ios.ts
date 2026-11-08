import { File, knownFolders, path } from '@nativescript/core'
import { CameraCaptureError } from './types'
import { canonicalizePath } from './session-core'
import { IOSMovieWriterDriver } from './movie-writer.ios'
import { acquireRecordingHaptics } from './recording-haptics.ios'
import { observePreviewDisplay, previewLayerDisplaying } from './preview-display.ios'
import type { IOSMovieWriter } from './movie-writer.ios'
import type {
  BackendCaptureRequest,
  BackendCaptureSink,
  BackendObserver,
  BackendPreviewListener,
  CameraSessionBackend,
} from './session-core'

import type {
  CameraDeviceInfo,
  CameraInterruptionReason,
  CameraOrientation,
  CameraPermissionKind,
  CameraPermissionStatus,
  CaptureIssue,
  CameraSessionConfig,
  CameraZoomState,
  EffectiveCaptureConfig,
  MovieOutputHandle,
} from './types'

import {
  AVCaptureDevice,
  AVCaptureDeviceDiscoverySession,
  AVCaptureDeviceInput,
  AVCaptureSession,
  AVCaptureVideoPreviewLayer,
  AVURLAsset,
  CGPointMake,
  NSBundle,
  NSFileManager,
  NSNotification,
  NSNotificationCenter,
  NSNumber,
  NSOperationQueue,
  NSURL,
} from '@octane-xplat/platform/ios'

import type { CGAffineTransform, NSObjectProtocol } from '@octane-xplat/platform/ios'

// AVAuthorizationStatus numeric values — the ambient const enum cannot be
// read under verbatimModuleSyntax in every build lane.
const authorizationNotDetermined = 0
const authorizationRestricted = 1
const authorizationDenied = 2
const authorizationAuthorized = 3

// CoreMedia sits outside the common NativeScript iOS ambient set — declare
// the handful of C functions this adapter needs instead of referencing the
// full typings.
declare function CMTimeGetSeconds(time: any): number
declare function CMVideoFormatDescriptionGetDimensions(videoDesc: any): {
  width: number
  height: number
}

// Ambient const enums cannot be read under verbatimModuleSyntax — keep the
// numeric values here with their Objective-C names.
const captureDevicePositionUnspecified = 0
const captureDevicePositionBack = 1
const captureDevicePositionFront = 2
const videoOrientationPortrait = 1
const videoOrientationPortraitUpsideDown = 2
const videoOrientationLandscapeRight = 3
const videoOrientationLandscapeLeft = 4
const interruptionVideoDeviceNotAvailableInBackground = 1
const interruptionAudioDeviceInUseByAnotherClient = 2
const interruptionVideoDeviceInUseByAnotherClient = 3
const interruptionVideoDeviceNotAvailableWithMultipleForegroundApps = 4
const interruptionVideoDeviceNotAvailableDueToSystemPressure = 5
const videoStabilizationModeAuto = -1

// AVCaptureFocusMode/AVCaptureExposureMode numeric values — tap-to-focus
// uses the single-shot modes, matching the AVCam convention.
const focusModeAutoFocus = 1
const exposureModeAutoExpose = 1

const mediaTypeFor = (kind: CameraPermissionKind): string =>
  kind === 'camera' ? AVMediaTypeVideo : AVMediaTypeAudio

const usageKeyFor = (kind: CameraPermissionKind): string =>
  kind === 'camera' ? 'NSCameraUsageDescription' : 'NSMicrophoneUsageDescription'

const readPermission = (kind: CameraPermissionKind): CameraPermissionStatus => {
  const status = AVCaptureDevice.authorizationStatusForMediaType(
    mediaTypeFor(kind),
  ) as unknown as number

  switch (status) {
    case authorizationAuthorized:
      return 'granted'
    case authorizationDenied:
      return 'denied'
    case authorizationRestricted:
      return 'restricted'
    case authorizationNotDetermined:
      return 'notDetermined'
    default:
      return 'unknown'
  }
}

const requestAccess = (kind: CameraPermissionKind): Promise<CameraPermissionStatus> => {
  const declaration = NSBundle.mainBundle.objectForInfoDictionaryKey(usageKeyFor(kind))

  if (!declaration) {
    // Requesting access without the usage-description key crashes the
    // host app — refuse before reaching AVFoundation.
    return Promise.reject(
      new CameraCaptureError({
        kind: 'configurationMissing',
        operation: 'requestPermission',
        permission: kind,
        message: `Missing ${usageKeyFor(kind)} in the host app's Info.plist`,
      }),
    )
  }

  const status = readPermission(kind)

  if (status !== 'notDetermined') {
    // Repeated requests must not pretend to show a prompt the system
    // will not display.
    return Promise.resolve(status)
  }

  return new Promise<CameraPermissionStatus>((resolve) => {
    AVCaptureDevice.requestAccessForMediaTypeCompletionHandler(mediaTypeFor(kind), () =>
      resolve(readPermission(kind)),
    )
  })
}

const facingForPosition = (position: number): 'front' | 'back' | undefined =>
  position === captureDevicePositionFront
    ? 'front'
    : position === captureDevicePositionBack
      ? 'back'
      : undefined

const listCameras = (): AVCaptureDevice[] => {
  const types = [
    AVCaptureDeviceTypeBuiltInWideAngleCamera,
    AVCaptureDeviceTypeBuiltInUltraWideCamera,
    AVCaptureDeviceTypeBuiltInTelephotoCamera,
    AVCaptureDeviceTypeBuiltInDualCamera,
    AVCaptureDeviceTypeBuiltInDualWideCamera,
    AVCaptureDeviceTypeBuiltInTripleCamera,
    AVCaptureDeviceTypeBuiltInTrueDepthCamera,
  ].filter((entry) => typeof entry === 'string')

  const discovery =
    AVCaptureDeviceDiscoverySession.discoverySessionWithDeviceTypesMediaTypePosition(
      types,
      AVMediaTypeVideo,
      captureDevicePositionUnspecified,
    )

  const devices: AVCaptureDevice[] = []
  const found = discovery?.devices
  const count = found?.count ?? 0

  for (let index = 0; index < count; index++) {
    devices.push(found.objectAtIndex(index))
  }

  if (!devices.length) {
    // Older runtime or no discovery support — fall back to the flat
    // device list so simulator-style "no camera" stays honest.
    const legacy = AVCaptureDevice.devicesWithMediaType(AVMediaTypeVideo)

    for (let index = 0; index < (legacy?.count ?? 0); index++) {
      devices.push(legacy.objectAtIndex(index))
    }
  }

  return devices
}

const selectDevice = (
  camera: CameraSessionConfig['camera'],
  devices: AVCaptureDevice[],
): AVCaptureDevice | undefined => {
  if (camera && typeof camera === 'object' && 'deviceId' in camera) {
    return devices.find((device) => device.uniqueID === camera.deviceId)
  }

  if (camera === 'front' || camera === 'back') {
    const position = camera === 'front' ? captureDevicePositionFront : captureDevicePositionBack

    return devices.find((device) => device.position === position)
  }

  return devices.find((device) => device.position === captureDevicePositionBack) ?? devices[0]
}

const orientationToLegacyConstant = (orientation: CameraOrientation): number | undefined =>
  orientation === 'portrait'
    ? videoOrientationPortrait
    : orientation === 'portraitUpsideDown'
      ? videoOrientationPortraitUpsideDown
      : orientation === 'landscapeLeft'
        ? videoOrientationLandscapeLeft
        : orientation === 'landscapeRight'
          ? videoOrientationLandscapeRight
          : undefined

/** Derive the cardinal capture orientation from a video track's
 *  preferred transform; `undefined` when it cannot be told honestly. */
const orientationFromTransform = (transform: CGAffineTransform): CameraOrientation => {
  const { a, b, c, d } = transform

  if (a === 0 && b === 1 && c === -1 && d === 0) {
    return 'portrait'
  }

  if (a === 0 && b === -1 && c === 1 && d === 0) {
    return 'portraitUpsideDown'
  }

  if (a === 1 && b === 0 && c === 0 && d === 1) {
    return 'landscapeRight'
  }

  if (a === -1 && b === 0 && c === 0 && d === -1) {
    return 'landscapeLeft'
  }

  return 'unspecified'
}

/** Prefer Apple's automatic stabilization on a capture connection when the
 *  hardware offers it; unsupported connections keep the runtime default.
 *  `isVideoStabilizationModeSupported:` is missing from the generated {N}
 *  typings, so it is invoked dynamically with `supportsVideoStabilization`
 *  as the older-runtime fallback. */
const preferAutoStabilization = (connection: AVCaptureConnection | undefined | null) => {
  if (!connection) {
    return
  }

  const check = (connection as any).isVideoStabilizationModeSupported
  const supported =
    typeof check === 'function'
      ? Boolean(check.call(connection, videoStabilizationModeAuto))
      : Boolean(connection.supportsVideoStabilization)

  if (supported) {
    connection.preferredVideoStabilizationMode = videoStabilizationModeAuto
  }
}

const mapInterruptionReason = (raw: number | undefined): CameraInterruptionReason => {
  switch (raw) {
    case interruptionVideoDeviceNotAvailableInBackground:
      return 'background'
    case interruptionAudioDeviceInUseByAnotherClient:
      return 'audioInUse'
    case interruptionVideoDeviceInUseByAnotherClient:
      return 'cameraInUse'
    case interruptionVideoDeviceNotAvailableWithMultipleForegroundApps:
      return 'multitasking'
    case interruptionVideoDeviceNotAvailableDueToSystemPressure:
      return 'systemPressure'
    default:
      return 'unknown'
  }
}

const recordingsDirectory = (): string => {
  const directory = path.join(knownFolders.documents().path, 'octane-camera')

  if (!File.exists(directory)) {
    NSFileManager.defaultManager.createDirectoryAtPathWithIntermediateDirectoriesAttributesError(
      directory,
      true,
      null,
      undefined,
    )
  }

  return directory
}

const hasUsageDeclaration = (kind: CameraPermissionKind): boolean =>
  Boolean(NSBundle.mainBundle.objectForInfoDictionaryKey(usageKeyFor(kind)))

const minFreeDiskBytes = 64 * 1024 * 1024

/** Values returned through `id`-typed APIs (NSDictionary.objectForKey) arrive
 *  already unboxed by the {N} iOS runtime — NSNumber becomes a JS number (or
 *  boolean), not an NSNumber instance. Accept either shape so numeric reads
 *  stay correct under both conventions. */
const numericValue = (value: unknown): number | undefined => {
  try {
    if (typeof value === 'number') {
      return value
    }

    if (typeof value === 'boolean') {
      return value ? 1 : 0
    }

    const boxed = value as NSNumber | undefined
    const raw = boxed?.longLongValue ?? boxed?.doubleValue

    return typeof raw === 'number' ? raw : undefined
  } catch {
    return undefined
  }
}

const freeDiskBytes = (): number => {
  try {
    const attributes = NSFileManager.defaultManager.attributesOfFileSystemForPathError(
      knownFolders.documents().path,
      undefined,
    )

    return numericValue(attributes?.objectForKey(NSFileSystemFreeSize)) ?? Number.MAX_SAFE_INTEGER
  } catch {
    return Number.MAX_SAFE_INTEGER
  }
}

/** iOS adapter: one video session and an independent microphone session feed
 *  a single sample writer shared with the attached preview. */
declare const XplatSwitchingMovieWriter: { new: () => IOSMovieWriter }

export function createSessionBackend(
  config: CameraSessionConfig,
  writerDiagnostics?: (type: string, payload: string) => void,
): CameraSessionBackend {
  let currentConfig = { ...config }
  let session: AVCaptureSession | undefined
  let videoInput: AVCaptureDeviceInput | undefined
  let writerHasAudio = false
  let releaseRecordingHaptics: (() => void) | undefined
  let previewLayer: AVCaptureVideoPreviewLayer | undefined
  let previewHost: any
  let detachFrame: (() => void) | undefined
  let detachDisplay: (() => void) | undefined
  let displayReady = false
  let previewReadyFlag = false
  let device: AVCaptureDevice | undefined
  let observer: BackendObserver | undefined
  let observers: NSObjectProtocol[] = []
  let captureSink: BackendCaptureSink | undefined
  let captureRequest: BackendCaptureRequest | undefined
  let nativeLimitReached = false
  let interrupted = false
  let nativeWriter: IOSMovieWriter | undefined
  let writerDriver: IOSMovieWriterDriver | undefined
  let writerSourceReady = false
  let initialWriterReady: (() => void) | undefined
  let writerWarning: CaptureIssue | undefined
  let writerRelease: Promise<void> = Promise.resolve()
  /** Connection state of the video-data output feeding the writer. */
  const recordingConnectionState = () => {
    const outputs = session?.outputs
    const connection =
      outputs &&
      Array.from({ length: outputs.count }, (_, index) =>
        outputs.objectAtIndex(index).connectionWithMediaType(AVMediaTypeVideo),
      ).find(Boolean)

    return {
      videoMirrored: !!connection?.videoMirrored,
      orientation: connection?.videoOrientation,
      preferredStabilization: connection?.preferredVideoStabilizationMode,
      activeStabilization: connection?.activeVideoStabilizationMode,
      previewMirrored: !!previewLayer?.connection?.videoMirrored,
      previewMirrorSupported: !!previewLayer?.connection?.supportsVideoMirroring,
    }
  }

  const mirrorPreview = () => {
    const connection = previewLayer?.connection

    if (connection) {
      connection.automaticallyAdjustsVideoMirroring = false
      if (connection.supportsVideoMirroring) {
        connection.videoMirrored = device?.position === captureDevicePositionFront
      }

      preferAutoStabilization(connection)
    }
  }

  const emitIssue = (
    kind: CaptureIssue['kind'],
    operation: string,
    message: string,
    cause?: unknown,
  ): CaptureIssue => ({
    kind,
    operation,
    message,
    cause,
  })

  const notify = (phase: 'began' | 'ended', reason?: CameraInterruptionReason) => {
    interrupted = phase === 'began'
    observer?.interruption(phase, reason)
    observer?.previewReady(previewReadyFlag && !interrupted && writerSourceReady)
  }

  const observeSession = (target: AVCaptureSession) => {
    const center = NSNotificationCenter.defaultCenter
    const add = (name: string, object: unknown, handler: (note: NSNotification) => void) => {
      observers.push(
        center.addObserverForNameObjectQueueUsingBlock(
          name,
          object as any,
          NSOperationQueue.mainQueue,
          handler,
        ),
      )
    }

    add(AVCaptureSessionWasInterruptedNotification, target, (note) => {
      const raw = note.userInfo?.objectForKey(AVCaptureSessionInterruptionReasonKey)

      notify('began', mapInterruptionReason(numericValue(raw)))
    })

    add(AVCaptureSessionInterruptionEndedNotification, target, () => {
      notify('ended')
    })

    add(AVCaptureSessionRuntimeErrorNotification, target, () => {
      observer?.availability(false)
    })

    // Filter by the ACTIVE device — `device` is reassigned on
    // configure(), so an observer bound to the captured object would
    // keep reporting on the stale one while the active camera's
    // disconnect went unreported (and any device's connect reported
    // availability(true)).
    add(AVCaptureDeviceWasDisconnectedNotification, null, (note) => {
      if (device && note.object === device) {
        observer?.availability(false)
      }
    })

    add(AVCaptureDeviceWasConnectedNotification, null, (note) => {
      if (device && note.object === device) {
        observer?.availability(true)
      }
    })

    add(UIApplicationDidEnterBackgroundNotification, null, () => {
      notify('began', 'background')
    })

    add(UIApplicationWillEnterForegroundNotification, null, () => {
      notify('ended', 'background')
    })
  }

  const clearObservers = () => {
    const center = NSNotificationCenter.defaultCenter

    for (const entry of observers) {
      center.removeObserver(entry)
    }

    observers = []
  }

  const supportedPreset = (target: AVCaptureSession, captureDevice: AVCaptureDevice) =>
    target.canSetSessionPreset(AVCaptureSessionPreset1280x720) &&
    captureDevice.supportsAVCaptureSessionPreset(AVCaptureSessionPreset1280x720)

  /** Resolve the effective standard profile for the current camera:
   *  720p/30 when the device supports it, otherwise the device's own
   *  active format disclosed honestly. */
  const standardProfile = (captureDevice: AVCaptureDevice | undefined) => {
    if (captureDevice && session && supportedPreset(session, captureDevice)) {
      return { width: 1280, height: 720, frameRate: 30 }
    }

    const format = captureDevice?.activeFormat
    const dimensions = format
      ? CMVideoFormatDescriptionGetDimensions(format.formatDescription)
      : undefined

    const range = captureDevice?.activeVideoMinFrameDuration
    const frameRate =
      range && range.timescale > 0 && range.value > 0
        ? Math.round(range.timescale / range.value)
        : 30

    return {
      width: dimensions?.width ?? 1280,
      height: dimensions?.height ?? 720,
      frameRate,
    }
  }

  const ensureAudioInput = (): boolean => {
    const optedIn = currentConfig.ios?.allowHapticsAndSystemSoundsDuringRecording === true
    const acquired = optedIn && !releaseRecordingHaptics ? acquireRecordingHaptics() : undefined

    try {
      writerHasAudio = !!nativeWriter && !nativeWriter.configureAudio(true)
      if (writerHasAudio && optedIn) {
        releaseRecordingHaptics ??= acquired
      } else {
        acquired?.()
        releaseRecordingHaptics?.()
        releaseRecordingHaptics = undefined
      }

      return writerHasAudio
    } catch (error) {
      acquired?.()
      throw error
    }
  }

  const ensureSession = (): AVCaptureSession => {
    if (session) {
      return session
    }

    const target = AVCaptureSession.new()

    target.beginConfiguration()
    device = selectDevice(currentConfig.camera, listCameras())
    if (!device) {
      target.commitConfiguration()
      throw new CameraCaptureError({
        kind: 'unavailable',
        operation: 'startPreview',
        message: 'No camera device is available',
      })
    }

    if (supportedPreset(target, device)) {
      target.sessionPreset = AVCaptureSessionPreset1280x720
    }

    const input = AVCaptureDeviceInput.deviceInputWithDeviceError(device, undefined)

    if (!input || !target.canAddInput(input)) {
      target.commitConfiguration()
      throw new CameraCaptureError({
        kind: 'unavailable',
        operation: 'startPreview',
        message: 'Camera input is unavailable',
      })
    }

    target.addInput(input)
    videoInput = input

    if (typeof XplatSwitchingMovieWriter === 'undefined') {
      target.commitConfiguration()
      throw new CameraCaptureError({
        kind: 'unsupportedPlatform',
        operation: 'startPreview',
        message: 'Movie writer is not linked; rebuild the iOS app',
      })
    }

    nativeWriter = XplatSwitchingMovieWriter.new()

    const problem = nativeWriter.install(target)

    if (problem) {
      target.commitConfiguration()
      throw new CameraCaptureError({
        kind: 'unavailable',
        operation: 'startPreview',
        message: problem,
      })
    }

    writerDriver = new IOSMovieWriterDriver(nativeWriter)

    const sourceOwner = nativeWriter

    nativeWriter.observeSource((ready) => {
      if (nativeWriter !== sourceOwner) {
        return
      }

      writerSourceReady = ready
      observer?.previewReady(previewReadyFlag && ready && !interrupted)
      if (ready && initialWriterReady && !captureSink) {
        const callback = initialWriterReady

        initialWriterReady = undefined
        callback()
      }
    })

    try {
      if (currentConfig.audio && readPermission('microphone') === 'granted') {
        ensureAudioInput()
      }
    } catch (error) {
      const driver = writerDriver

      writerDriver = undefined
      nativeWriter = undefined
      writerRelease = Promise.all([writerRelease, driver.release()]).then(() => {})
      videoInput = undefined
      device = undefined
      throw error
    } finally {
      target.commitConfiguration()
    }

    session = target
    observeSession(target)
    return target
  }

  const stopSessionIfIdle = () => {
    if (!session || captureSink || previewHost) {
      return
    }

    session.stopRunning()
    if (writerDriver) {
      const releasePolicy = releaseRecordingHaptics

      releaseRecordingHaptics = undefined
      writerRelease = Promise.all([
        writerRelease,
        writerDriver.release().then(() => releasePolicy?.()),
      ]).then(() => {})
    }

    writerDriver = undefined
    nativeWriter = undefined
    writerSourceReady = false
    clearObservers()
    if (interrupted) {
      // The 'ended' notification can be lost when the session is
      // torn down mid-interruption — report it so the flag does not
      // wedge previewReady/startRecording for the next session.
      notify('ended')
    }

    // A destroyed session's runtime error must not wedge the next
    // one — AVCaptureDeviceWasConnected never fires for built-in
    // cameras, so cameraAvailable would otherwise stay false forever.
    observer?.availability(true)

    session = undefined
    videoInput = undefined
    writerHasAudio = false
    previewLayer = undefined
    device = undefined
  }

  const onCaptureStarted = (dimensions?: { width: number; height: number }) => {
    const request = captureRequest
    const sink = captureSink

    if (!request || !sink || !device) {
      return
    }

    const profile = standardProfile(device)
    const configuration: EffectiveCaptureConfig = {
      cameraId: device.uniqueID,
      facing: facingForPosition(device.position),
      audio: request.audio && writerHasAudio,
      width: dimensions?.width ?? profile.width,
      height: dimensions?.height ?? profile.height,
      frameRate: profile.frameRate,
      orientation: request.orientation ?? 'unspecified',
      mimeType: 'video/quicktime',
      container: 'mov',
    }

    sink.started(configuration)
  }

  const onCaptureFinished = (url: NSURL) => {
    const request = captureRequest
    const sink = captureSink

    captureRequest = undefined
    captureSink = undefined
    if (!request || !sink) {
      return
    }

    const filePath = url?.path ? String(url.path) : ''
    const limitReached = nativeLimitReached

    try {
      const asset = AVURLAsset.assetWithURL(url)
      const durationSeconds = asset ? CMTimeGetSeconds(asset.duration) : 0
      const videoTracks = asset?.tracksWithMediaType(AVMediaTypeVideo)
      const audioTracks = asset?.tracksWithMediaType(AVMediaTypeAudio)
      const track = videoTracks && videoTracks.count > 0 ? videoTracks.objectAtIndex(0) : null

      if (!track || !(durationSeconds > 0)) {
        sink.settled({
          kind: 'failed',
          stage: 'capture',
          issue: emitIssue('noMedia', 'finalize', 'The finalized movie contains no playable media'),
        })

        stopSessionIfIdle()
        return
      }

      const naturalSize = track.naturalSize
      const transform = track.preferredTransform
      const orientation =
        request.orientation && request.orientation !== 'unspecified'
          ? request.orientation
          : orientationFromTransform(transform)

      const rotated = Math.abs(transform.b) === 1 && Math.abs(transform.c) === 1
      const width = rotated ? naturalSize.height : naturalSize.width
      const height = rotated ? naturalSize.width : naturalSize.height

      if (request.audio && !(audioTracks && audioTracks.count > 0)) {
        // Requested audio missing must not masquerade as silent
        // capture — classify as failure, not a successful clip.

        sink.settled({
          kind: 'failed',
          stage: 'capture',
          issue: emitIssue(
            'captureFailed',
            'finalize',
            'Requested audio track is missing from the finalized movie',
          ),
        })

        stopSessionIfIdle()
        return
      }

      sink.settled({
        kind: 'clip',
        output: {
          kind: 'nativeFile',
          resourceId: `file:${filePath}`,
          fileUrl: `file://${filePath}`,
        },
        mimeType: 'video/quicktime',
        durationMs: Math.round(durationSeconds * 1000),
        width,
        height,
        orientation,
        hasAudio: request.audio && (audioTracks?.count ?? 0) > 0,
        limitReached,
        warning: writerWarning,
      })
    } catch (cause) {
      sink.settled({
        kind: 'failed',
        stage: 'finalization',
        issue: emitIssue(
          'finalizationFailed',
          'finalize',
          cause instanceof Error ? cause.message : String(cause),
          cause,
        ),
      })
    }

    stopSessionIfIdle()
  }

  const failWriter = (cause: unknown, details?: unknown) => {
    const sink = captureSink

    captureSink = undefined
    captureRequest = undefined
    sink?.settled({
      kind: 'failed',
      stage: 'capture',
      issue: emitIssue(
        'captureFailed',
        'capture',
        cause instanceof Error ? cause.message : String(cause),
        details ?? cause,
      ),
    })

    stopSessionIfIdle()
  }

  return {
    platform: 'ios',
    supported: typeof XplatSwitchingMovieWriter !== 'undefined',
    checkPermission: async (kind) => {
      if (!hasUsageDeclaration(kind)) {
        // Missing declarations are a setup error, not a permission
        // status — surface through start/configure failures instead of
        // pretending a status.
        return 'unknown'
      }

      return readPermission(kind)
    },
    requestPermission: (kind) => requestAccess(kind),
    getCapabilities: async () => {
      const devices = listCameras()
      const cameras: CameraDeviceInfo[] = devices.map((entry) => ({
        id: entry.uniqueID,
        label: entry.localizedName ?? entry.uniqueID,
        facing: facingForPosition(entry.position),
      }))

      const selected = device ?? selectDevice(currentConfig.camera, devices)
      const profile = selected
        ? (() => {
            const probe = AVCaptureSession.new()

            probe.beginConfiguration()

            const supported = supportedPreset(probe, selected)

            probe.commitConfiguration()
            return supported
              ? { width: 1280, height: 720, frameRate: 30 }
              : standardProfile(selected)
          })()
        : { width: 1280, height: 720, frameRate: 30 }

      const available = cameras.length > 0
      const supported = typeof XplatSwitchingMovieWriter !== 'undefined' && available

      return {
        supported,
        reason: !available
          ? 'No camera device is available on this host'
          : typeof XplatSwitchingMovieWriter === 'undefined'
            ? 'Movie writer is not linked; rebuild the iOS app'
            : undefined,
        available: available && writerSourceReady,
        cameras,
        profiles: [{ profile: 'standard', ...profile }],
        audio: typeof AVCaptureDevice.defaultDeviceWithMediaType === 'function',
        focusPointOfInterest: selected?.focusPointOfInterestSupported === true,
        exposurePointOfInterest: selected?.exposurePointOfInterestSupported === true,
        zoom:
          typeof selected?.maxAvailableVideoZoomFactor === 'number' &&
          typeof selected?.minAvailableVideoZoomFactor === 'number' &&
          selected.maxAvailableVideoZoomFactor > selected.minAvailableVideoZoomFactor,
        orientations: ['portrait', 'portraitUpsideDown', 'landscapeLeft', 'landscapeRight'],
        cameraSwitchDuringRecording: typeof XplatSwitchingMovieWriter !== 'undefined',
        durationLimit: 'native',
        elapsedTime: 'nativeMedia',
        output: {
          mimeType: 'video/quicktime',
          container: 'mov',
          storage: 'appPrivateFile',
          destinationFileUrl: true,
        },
      }
    },
    previewReady: () => previewReadyFlag && !interrupted && writerSourceReady,
    attachPreview: (host, listener?: BackendPreviewListener) => {
      let target: AVCaptureSession

      try {
        target = ensureSession()
      } catch (error) {
        throw error instanceof CameraCaptureError
          ? error
          : new CameraCaptureError({
              kind: 'unavailable',
              operation: 'startPreview',
              message: error instanceof Error ? error.message : String(error),
              cause: error,
            })
      }

      const view = host as any
      const nativeView = view?.ios ?? view?.nativeViewProtected

      if (!nativeView?.layer) {
        throw new CameraCaptureError({
          kind: 'invalidArgument',
          operation: 'attachPreview',
          message: 'Camera preview host is unavailable',
        })
      }

      const layer = AVCaptureVideoPreviewLayer.layerWithSession(target)

      layer.videoGravity = AVLayerVideoGravityResizeAspectFill

      const connection = layer.connection

      if (connection) {
        connection.automaticallyAdjustsVideoMirroring = false
        if (connection.supportsVideoMirroring) {
          connection.videoMirrored = device?.position === captureDevicePositionFront
        }

        preferAutoStabilization(connection)
      }

      nativeView.layer.addSublayer(layer)
      previewLayer = layer
      nativeWriter?.setPreviewLayer(layer)
      previewHost = view

      const updateFrame = () => {
        layer.frame = nativeView.bounds
        nativeWriter?.setPreviewLayer(layer)
      }

      detachFrame = () => view.off?.('layoutChanged', updateFrame)
      view.on?.('layoutChanged', updateFrame)
      updateFrame()

      // Display readiness is its own signal: `previewing` flips true
      // asynchronously after startRunning returns, and only while the
      // layer is actually rendering into non-empty bounds. onReady stays
      // admission readiness — writer frames flowing, preview attached.
      const evaluateDisplay = () => {
        const showing = previewLayerDisplaying(layer)

        if (showing === displayReady) {
          return
        }

        displayReady = showing
        if (showing) {
          listener?.onDisplayReady?.()
        }
      }

      detachDisplay?.()
      detachDisplay = observePreviewDisplay(layer, evaluateDisplay)
      evaluateDisplay()
      target.startRunning()
      previewReadyFlag = true

      initialWriterReady = () => {
        if (writerDiagnostics) {
          try {
            writerDiagnostics('previewConnection', JSON.stringify(recordingConnectionState()))
          } catch {
            /* Diagnostics cannot own capture completion. */
          }
        }

        listener?.onReady?.()
      }

      observer?.previewReady(writerSourceReady)
      if (writerSourceReady) {
        initialWriterReady()
        initialWriterReady = undefined
      }

      return () => {
        previewReadyFlag = false
        initialWriterReady = undefined
        detachDisplay?.()
        detachDisplay = undefined
        displayReady = false
        nativeWriter?.setPreviewLayer(null)
        view.off?.('layoutChanged', updateFrame)
        layer.removeFromSuperlayer()
        previewLayer = undefined
        previewHost = undefined
        detachFrame = undefined
        observer?.previewReady(false)
        stopSessionIfIdle()
      }
    },
    configure: (next) => {
      const previous = currentConfig

      currentConfig = { ...next }

      const target = session

      if (!target || !device) {
        return
      }

      target.beginConfiguration()

      const wanted = selectDevice(next.camera ?? previous.camera, listCameras())
      const hasSelectedInput =
        wanted &&
        Array.from({ length: target.inputs.count }, (_, index) =>
          target.inputs.objectAtIndex(index),
        ).some(
          (input) =>
            input instanceof AVCaptureDeviceInput && input.device.uniqueID === wanted.uniqueID,
        )

      if (wanted && videoInput && (wanted !== device || !hasSelectedInput)) {
        const input = AVCaptureDeviceInput.deviceInputWithDeviceError(wanted, undefined)

        const previousInput = videoInput

        writerSourceReady = false
        observer?.previewReady(false)
        for (const entry of Array.from({ length: target.inputs.count }, (_, index) =>
          target.inputs.objectAtIndex(index),
        )) {
          if (
            entry instanceof AVCaptureDeviceInput &&
            entry.device.hasMediaType(AVMediaTypeVideo)
          ) {
            target.removeInput(entry)
          }
        }

        if (!input || !target.canAddInput(input)) {
          if (target.canAddInput(previousInput)) {
            target.addInput(previousInput)
          }

          target.commitConfiguration()
          currentConfig = previous
          nativeWriter?.expectCamera(device.uniqueID)
          throw new CameraCaptureError({
            kind: 'unsupportedConfiguration',
            operation: 'configure',
            message: 'Camera input is incompatible',
          })
        }

        target.addInput(input)
        videoInput = input
        device = wanted
      }

      try {
        if (next.audio === true && readPermission('microphone') === 'granted') {
          ensureAudioInput()
        } else if (next.audio === false) {
          const problem = nativeWriter?.configureAudio(false)

          if (problem) {
            throw new CameraCaptureError({
              kind: 'unavailable',
              operation: 'configure',
              message: problem,
            })
          }

          writerHasAudio = false
          releaseRecordingHaptics?.()
          releaseRecordingHaptics = undefined
        }
      } catch (error) {
        currentConfig = previous
        throw error
      } finally {
        target.commitConfiguration()
      }

      if (device) {
        writerSourceReady = false
        observer?.previewReady(false)
        nativeWriter?.expectCamera(device.uniqueID)
      }

      // Swapping the video input recreates the preview connection — the
      // stabilization preference must be restated.
      preferAutoStabilization(previewLayer?.connection)
    },
    focusAtPoint: (point) => {
      const captureDevice = device
      const layer = previewLayer

      if (!captureDevice || !layer) {
        return
      }

      // Front cameras are commonly fixed-focus — meter only the
      // dimensions the device actually supports.
      const focus =
        captureDevice.focusPointOfInterestSupported === true &&
        captureDevice.isFocusModeSupported?.(focusModeAutoFocus) !== false

      const expose =
        captureDevice.exposurePointOfInterestSupported === true &&
        captureDevice.isExposureModeSupported?.(exposureModeAutoExpose) !== false

      if (!focus && !expose) {
        return
      }

      // The preview layer converts view space into device space —
      // aspect-fill cropping, sensor orientation, and the front
      // camera's mirrored connection are all accounted for. Without
      // it there is no honest mapping, so bail rather than meter the
      // wrong point.
      const bounds = layer.bounds
      const layerPoint = CGPointMake(point.x * bounds.size.width, point.y * bounds.size.height)

      if (typeof layer.captureDevicePointOfInterestForPoint !== 'function') {
        return
      }

      const devicePoint = layer.captureDevicePointOfInterestForPoint(layerPoint)

      try {
        if (captureDevice.lockForConfiguration?.(undefined) !== true) {
          return
        }

        // Single-shot AF/AE at the point — the Apple AVCam
        // tap-to-focus convention; the device locks after metering.
        if (focus) {
          captureDevice.focusPointOfInterest = devicePoint
          captureDevice.focusMode = focusModeAutoFocus
        }

        if (expose) {
          captureDevice.exposurePointOfInterest = devicePoint
          captureDevice.exposureMode = exposureModeAutoExpose
        }

        captureDevice.unlockForConfiguration()
      } catch {
        // A missed metering pass must not fault the session.
      }
    },
    zoomState: (): CameraZoomState | undefined => {
      const captureDevice = device

      if (!captureDevice || typeof captureDevice.videoZoomFactor !== 'number') {
        return undefined
      }

      // min/maxAvailableVideoZoomFactor are iOS 11+; older runtimes only
      // expose the format maximum — report what the device proves.
      const minZoom =
        typeof captureDevice.minAvailableVideoZoomFactor === 'number'
          ? captureDevice.minAvailableVideoZoomFactor
          : 1

      const maxZoom =
        typeof captureDevice.maxAvailableVideoZoomFactor === 'number'
          ? captureDevice.maxAvailableVideoZoomFactor
          : minZoom

      return { zoom: captureDevice.videoZoomFactor, minZoom, maxZoom }
    },
    setZoom: (ratio) => {
      const captureDevice = device

      if (!captureDevice || typeof captureDevice.videoZoomFactor !== 'number') {
        return
      }

      const min =
        typeof captureDevice.minAvailableVideoZoomFactor === 'number'
          ? captureDevice.minAvailableVideoZoomFactor
          : 1

      const max =
        typeof captureDevice.maxAvailableVideoZoomFactor === 'number'
          ? captureDevice.maxAvailableVideoZoomFactor
          : Math.max(min, ratio)

      try {
        if (captureDevice.lockForConfiguration?.(undefined) !== true) {
          return
        }

        // Out-of-range writes raise NSRangeException — clamp against the
        // live device bounds even though the shared session already did.
        try {
          captureDevice.videoZoomFactor = Math.min(max, Math.max(min, ratio))
        } finally {
          captureDevice.unlockForConfiguration()
        }
      } catch {
        // A refused zoom write must not fault the session.
      }
    },
    switchCamera: (selection) => {
      if (!writerDriver || !captureSink || !writerSourceReady) {
        throw new CameraCaptureError({
          kind: 'invalidState',
          operation: 'switchCamera',
          message: 'Movie writer is not active',
        })
      }

      const wanted = selectDevice(selection, listCameras())

      if (!wanted) {
        throw new CameraCaptureError({
          kind: 'unavailable',
          operation: 'switchCamera',
          message: 'Selected camera is unavailable',
        })
      }

      const operation = writerDriver.switchCamera({
        id: wanted.uniqueID,
        label: wanted.localizedName,
        facing: facingForPosition(wanted.position),
      })

      let cancelled = false

      return {
        completion: operation.completion,
        commit: () => {
          if (cancelled) {
            throw new CameraCaptureError({
              kind: 'invalidState',
              operation: 'switchCamera',
              message: 'Camera switching was cancelled',
            })
          }

          const selectedInput =
            session?.inputs &&
            (Array.from({ length: session.inputs.count }, (_, index) =>
              session!.inputs.objectAtIndex(index),
            ).find(
              (input) =>
                input instanceof AVCaptureDeviceInput && input.device.uniqueID === wanted.uniqueID,
            ) as AVCaptureDeviceInput | undefined)

          if (!selectedInput) {
            throw new CameraCaptureError({
              kind: 'unavailable',
              operation: 'switchCamera',
              message: 'The acquired camera input disappeared before commit',
            })
          }

          operation.commit?.()
          device = wanted
          videoInput = selectedInput
          currentConfig = { ...currentConfig, camera: selection }
          try {
            mirrorPreview()
          } catch {
            /* The source commit must survive a preview preference failure. */
          }

          if (writerDiagnostics) {
            try {
              writerDiagnostics(
                'cameraCommitted',
                JSON.stringify({ id: wanted.uniqueID, ...recordingConnectionState() }),
              )
            } catch {
              /* Diagnostics cannot own capture completion. */
            }
          }
        },
        cancel: () => {
          cancelled = true
          operation.cancel()
        },
      }
    },
    startCapture: (request, sink) => {
      const target = session

      if (!target || !writerDriver || !device) {
        sink.settled({
          kind: 'failed',
          stage: 'preparation',
          issue: emitIssue('unavailable', 'startRecording', 'The camera session is not running'),
        })

        return
      }

      if (!hasUsageDeclaration('camera')) {
        sink.settled({
          kind: 'failed',
          stage: 'preparation',
          issue: emitIssue(
            'configurationMissing',
            'startRecording',
            "Missing NSCameraUsageDescription in the host app's Info.plist",
          ),
        })

        return
      }

      if (request.audio) {
        if (!hasUsageDeclaration('microphone')) {
          sink.settled({
            kind: 'failed',
            stage: 'preparation',
            issue: emitIssue(
              'configurationMissing',
              'startRecording',
              "Missing NSMicrophoneUsageDescription in the host app's Info.plist",
            ),
          })

          return
        }

        const micStatus = readPermission('microphone')

        if (micStatus !== 'granted') {
          sink.settled({
            kind: 'failed',
            stage: 'preparation',
            issue: emitIssue(
              micStatus === 'restricted' ? 'permissionRestricted' : 'permissionDenied',
              'startRecording',
              `Microphone permission is ${micStatus}`,
              { permission: 'microphone' },
            ),
          })

          return
        }

        if (!ensureAudioInput()) {
          sink.settled({
            kind: 'failed',
            stage: 'preparation',
            issue: emitIssue('unavailable', 'startRecording', 'No audio input device is available'),
          })

          return
        }
      }

      let filePath: string

      if (request.destinationPath) {
        // Durable output stays app-private — canonicalize first so a
        // '..' segment cannot keep the Documents prefix while
        // resolving outside it.
        const destination = canonicalizePath(request.destinationPath)
        const documents = knownFolders.documents().path
        const inside = destination.startsWith(`${documents}/`)
        const directory = destination.slice(0, destination.lastIndexOf('/'))

        if (!inside || !File.exists(directory) || File.exists(destination)) {
          sink.settled({
            kind: 'failed',
            stage: 'preparation',
            issue: emitIssue(
              'destinationUnavailable',
              'startRecording',
              !inside
                ? 'destinationFileUrl must resolve inside the app-private documents directory'
                : File.exists(destination)
                  ? 'destinationFileUrl already exists'
                  : 'destinationFileUrl directory does not exist',
            ),
          })

          return
        }

        filePath = destination
      } else {
        try {
          filePath = path.join(
            recordingsDirectory(),
            `clip-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.mov`,
          )
        } catch (cause) {
          sink.settled({
            kind: 'failed',
            stage: 'preparation',
            issue: emitIssue(
              'destinationUnavailable',
              'startRecording',
              cause instanceof Error ? cause.message : String(cause),
              cause,
            ),
          })

          return
        }
      }

      if (freeDiskBytes() < minFreeDiskBytes) {
        sink.settled({
          kind: 'failed',
          stage: 'preparation',
          issue: emitIssue(
            'insufficientStorage',
            'startRecording',
            'Not enough local storage for a movie recording',
          ),
        })

        return
      }

      captureRequest = {
        ...request,
        orientation:
          request.orientation && request.orientation !== 'unspecified'
            ? request.orientation
            : 'portrait',
      }

      captureSink = sink
      nativeLimitReached = false
      writerWarning = undefined
      try {
        writerDriver.start(
          filePath,
          request.audio,
          orientationToLegacyConstant(request.orientation ?? 'portrait') ?? 1,
          request.maximumDurationMs ?? 0,
          (type, payload) => {
            try {
              writerDiagnostics?.(type, payload)
            } catch {
              /* Diagnostics cannot own capture completion. */
            }

            if (type === 'started') {
              if (writerDiagnostics) {
                try {
                  writerDiagnostics(
                    'recordingConnection',
                    JSON.stringify(recordingConnectionState()),
                  )
                } catch {
                  /* Diagnostics cannot own capture completion. */
                }
              }

              try {
                onCaptureStarted(JSON.parse(payload))
              } catch (error) {
                writerWarning = emitIssue(
                  'captureFailed',
                  'capture',
                  'Writer start metadata was malformed; recording was stopped for verification',
                  error,
                )

                sink.finishing('captureError')
                writerDriver?.stop()
              }
            } else if (type === 'limit') {
              nativeLimitReached = true
              sink.finishing('maximumDuration')
            } else if (type === 'sourceLost') {
              sink.finishing('cameraUnavailable')
            } else if (type === 'finishing') {
              sink.finishing(
                nativeLimitReached
                  ? 'maximumDuration'
                  : payload === 'captureError'
                    ? 'captureError'
                    : 'stopped',
              )
            } else if (type === 'finished') {
              try {
                const result = JSON.parse(payload)

                if (result?.warning) {
                  writerWarning = emitIssue('captureFailed', 'capture', result.warning)
                }
              } catch (error) {
                writerWarning = emitIssue(
                  'captureFailed',
                  'finalize',
                  'Writer completion metadata was malformed; the movie was verified separately',
                  error,
                )
              }

              onCaptureFinished(NSURL.fileURLWithPath(filePath))
            } else if (type === 'failed') {
              let result:
                | {
                    ownsOutput?: boolean
                    hasVideo?: boolean
                    canInspectOutput?: boolean
                    message?: string
                  }
                | undefined

              try {
                result = JSON.parse(payload)
              } catch {
                /* Preserve the original native error below. */
              }

              if (
                result?.ownsOutput === true &&
                result.hasVideo === true &&
                result.canInspectOutput === true
              ) {
                writerWarning = emitIssue(
                  'captureFailed',
                  'capture',
                  result.message ?? 'Native writer failed',
                )

                sink.finishing('captureError')
                onCaptureFinished(NSURL.fileURLWithPath(filePath))
              } else {
                failWriter(result?.message ?? payload, {
                  native: result,
                  candidateFileUrl: `file://${filePath}`,
                })
              }
            }
          },
        )
      } catch (error) {
        failWriter(error)
      }

      return
    },
    stopCapture: () => writerDriver?.stop(),
    elapsedMs: () => nativeWriter?.elapsedMs() ?? 0,
    openOutput: async (output) => {
      if (output.kind !== 'nativeFile') {
        throw new CameraCaptureError({
          kind: 'invalidArgument',
          operation: 'openOutput',
          message: 'Only file-backed output can be opened on iOS',
        })
      }

      const filePath = output.fileUrl.slice('file://'.length)

      if (!File.exists(filePath)) {
        throw new CameraCaptureError({
          kind: 'unavailable',
          operation: 'openOutput',
          message: `Movie file is missing at ${output.fileUrl}`,
        })
      }

      const handle: MovieOutputHandle = {
        url: output.fileUrl,
        fileUrl: output.fileUrl,
        release: () => {},
      }

      return handle
    },
    release: async () => {
      const driver = writerDriver

      writerDriver = undefined
      nativeWriter = undefined
      initialWriterReady = undefined
      previewReadyFlag = false
      await driver?.release()
      releaseRecordingHaptics?.()
      releaseRecordingHaptics = undefined
      await writerRelease
      detachFrame?.()
      detachFrame = undefined
      detachDisplay?.()
      detachDisplay = undefined
      displayReady = false
      if (previewHost) {
        try {
          previewLayer?.removeFromSuperlayer()
        } catch {}
      }

      previewHost = undefined
      previewLayer = undefined
      captureRequest = undefined
      captureSink = undefined
      clearObservers()
      interrupted = false
      try {
        session?.stopRunning()
      } catch {}

      session = undefined
      videoInput = undefined
      writerHasAudio = false
      device = undefined
    },
    onPreviewDetached: () => {
      // The view went away; if a settle is still in flight the session
      // stays alive until it arrives (stopSessionIfIdle re-checks).
      stopSessionIfIdle()
    },
    setObserver: (next) => {
      observer = next
    },
  }
}
