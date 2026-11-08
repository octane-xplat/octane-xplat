import { CameraCaptureError } from './types'
import {
  cameraHost,
  commitHostMovie,
  openHostMovie,
  removeHostReservation,
  reserveHostMovie,
  type CameraHost,
} from './host-movie.web'

import { commitMovie, openStoredMovie, removeReservation, reserveMovie } from './movie-storage.web'
import { inspectMovie } from './movie-metadata.web'
import { createRecordingVideoSource, supportsRecordingVideoSource } from './recording-source.web'
import type { RecordingVideoSource } from './recording-source.web'
import type {
  BackendCaptureSink,
  BackendObserver,
  BackendPreviewListener,
  CameraSessionBackend,
} from './session-core'

import type {
  CameraPermissionKind,
  CameraPermissionStatus,
  CameraSessionConfig,
  CameraSelection,
  CaptureIssue,
  EffectiveCaptureConfig,
  MovieClip,
} from './types'

const mimeCandidates = [
  'video/webm;codecs=vp8,opus',
  'video/webm;codecs=vp9,opus',
  'video/mp4;codecs=avc1.424028,mp4a.40.2',
  'video/mp4',
]

let owner: object | undefined

const error = (kind: CaptureIssue['kind'], operation: string, message: string, cause?: unknown) =>
  new CameraCaptureError({ kind, operation, message, cause })

const policyAllows = (kind: CameraPermissionKind) => {
  const policy =
    (
      document as Document & {
        permissionsPolicy?: { allowsFeature(feature: string): boolean }
        featurePolicy?: { allowsFeature(feature: string): boolean }
      }
    ).permissionsPolicy ?? (document as any).featurePolicy

  return policy?.allowsFeature(kind) !== false
}

export function createSessionBackend(config: CameraSessionConfig): CameraSessionBackend {
  let currentConfig = { ...config }
  let observer: BackendObserver | undefined
  let host: HTMLVideoElement | undefined
  let listener: BackendPreviewListener | undefined
  let stream: MediaStream | undefined
  let ready = false
  let released = false
  let generation = 0
  let persistent = false
  let recorder: MediaRecorder | undefined
  let sink: BackendCaptureSink | undefined
  let startedAt = 0
  let stoppedAt = 0
  let stopTimer: ReturnType<typeof setTimeout> | undefined
  let watchdog: ReturnType<typeof setTimeout> | undefined
  let recordingAudio = false
  let recordingVideo: RecordingVideoSource | undefined
  let switchWarning: CaptureIssue | undefined
  let pendingSwitch: { cancel: () => void } | undefined
  let captureFailure: ((cause: unknown) => Promise<void>) | undefined
  // Desktop native webview probe: 'unknown' until the capability request
  // settles; 'available' means app-private file storage and honest host
  // permission status replace browser storage and permission queries.
  let hostState: 'unknown' | 'available' | 'absent' = 'unknown'
  const hostProbe = cameraHost().then((host) => {
    hostState = host ? 'available' : 'absent'
    return host
  })

  const lease = {}
  const known: Record<CameraPermissionKind, CameraPermissionStatus> = {
    camera: 'unknown',
    microphone: 'unknown',
  }

  const browserStorage = () => typeof indexedDB !== 'undefined' && !!navigator.storage?.persisted

  // A settled desktop-host probe means app-private file storage replaces
  // IndexedDB. While the probe is pending keep the browser answer;
  // `capabilities()` awaits the probe for the settled result.
  const supported = () =>
    typeof navigator !== 'undefined' &&
    globalThis.isSecureContext === true &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== 'undefined' &&
    !!mimeType() &&
    (hostState === 'available' || browserStorage())

  const mimeType = () =>
    typeof MediaRecorder === 'undefined'
      ? ''
      : (mimeCandidates.find((mime) => MediaRecorder.isTypeSupported(mime)) ?? '')

  const markReady = (value: boolean) => {
    ready = value
    observer?.previewReady(value)
  }

  /** MediaTrack `zoom` is a camera-control constraint some browsers
   *  expose; absent track capabilities mean no zoom control. */
  const readZoom = () => {
    const track = stream?.getVideoTracks()[0]
    const zoom = (track?.getCapabilities?.() as any)?.zoom

    if (!track || typeof zoom?.min !== 'number' || typeof zoom?.max !== 'number') {
      return undefined
    }

    const current = (track.getSettings?.() as any)?.zoom

    return {
      zoom: typeof current === 'number' ? current : zoom.min,
      minZoom: zoom.min,
      maxZoom: zoom.max,
    }
  }

  const dropStream = () => {
    if (host) {
      host.srcObject = null
    }

    stream?.getTracks().forEach((track) => track.stop())
    stream = undefined
    markReady(false)
    if (owner === lease) {
      owner = undefined
    }
  }

  const onVisibility = () => {
    if (document.visibilityState === 'hidden') {
      markReady(false)
      observer?.interruption('began', 'background')
    } else {
      observer?.interruption('ended', 'background')
      markReady(!!host && stream?.getVideoTracks()[0]?.readyState === 'live')
    }
  }

  const onPageHide = () => {
    markReady(false)
    observer?.interruption('began', 'background')
  }

  // Track-caused interruptions (ended/mute) need an explicit 'ended' —
  // a fresh live stream resolves them, and without the event the core
  // keeps interrupted=true until the session is recreated.
  let deviceInterrupted = false

  const observeTracks = (target: MediaStream) => {
    for (const track of target.getTracks()) {
      track.addEventListener('ended', () => {
        if (track.kind === 'audio' && (!sink || !recordingAudio)) {
          return
        }

        if (stream !== target) {
          return
        }

        markReady(false)
        deviceInterrupted = true
        observer?.availability(false)
        observer?.interruption('began', 'unknown')
      })

      track.addEventListener('mute', () => {
        if (track.kind === 'audio' && (!sink || !recordingAudio)) {
          return
        }

        if (stream === target) {
          markReady(false)
          deviceInterrupted = true
          observer?.interruption('began', 'unknown')
        }
      })

      track.addEventListener('unmute', () => {
        if (stream === target && document.visibilityState !== 'hidden') {
          deviceInterrupted = false
          observer?.interruption('ended', 'unknown')
          observer?.availability(true)
          markReady(!!host)
        }
      })
    }
  }

  const constraints = (camera = currentConfig.camera): MediaTrackConstraints => {
    return {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30 },
      ...(typeof camera === 'object'
        ? { deviceId: { exact: camera.deviceId } }
        : camera === 'front' || camera === 'back'
          ? { facingMode: { exact: camera === 'front' ? 'user' : 'environment' } }
          : {}),
    }
  }

  let acquisition: Promise<void> | undefined
  const acquireCameraOnce = async () => {
    if (stream?.getVideoTracks()[0]?.readyState === 'live') {
      return
    }

    if (owner && owner !== lease) {
      throw error('busy', 'preview', 'Another camera session still owns the source')
    }

    owner = lease

    const epoch = generation

    try {
      const acquired = await navigator.mediaDevices.getUserMedia({
        video: constraints(),
        audio: false,
      })

      if (released || epoch !== generation) {
        acquired.getTracks().forEach((track) => track.stop())
        if (!stream && owner === lease) {
          owner = undefined
        }

        return
      }

      for (const track of stream?.getAudioTracks() ?? []) {
        acquired.addTrack(track)
      }

      stream = acquired
      known.camera = 'granted'
      observeTracks(acquired)
      if (deviceInterrupted) {
        deviceInterrupted = false
        observer?.interruption('ended', 'unknown')
      }

      observer?.availability(true)
    } catch (cause) {
      if (owner === lease) {
        owner = undefined
      }

      throw cause
    }
  }

  const acquireCamera = () => {
    acquisition ??= acquireCameraOnce().finally(() => {
      acquisition = undefined
    })

    return acquisition
  }

  const showPreview = async (notify = true) => {
    if (!host || released) {
      return
    }

    const element = host
    const epoch = generation

    if ((await checkPermission('camera')) !== 'granted') {
      listener?.onError?.(
        error(
          'permissionBlocked',
          'preview',
          'Request camera access from a user action before activating this preview',
        ),
      )

      return
    }

    await acquireCamera()
    if (host !== element || !stream || released || epoch !== generation) {
      return
    }

    element.srcObject = stream
    element.muted = true

    const facing = stream.getVideoTracks()[0]?.getSettings().facingMode

    element.style.transform = facing === 'user' ? 'scaleX(-1)' : ''
    await element.play()
    if (host !== element || released || epoch !== generation) {
      return
    }

    markReady(document.visibilityState !== 'hidden')
    if (notify) {
      listener?.onReady?.()
    }

    // Display readiness is its own edge: requestVideoFrameCallback fires
    // on the first presented frame; without it, a resolved play() is the
    // only display confirmation the element exposes.
    if (typeof element.requestVideoFrameCallback === 'function') {
      element.requestVideoFrameCallback(() => {
        if (host === element && !released && epoch === generation) {
          listener?.onDisplayReady?.()
        }
      })
    } else {
      listener?.onDisplayReady?.()
    }
  }

  const hostMediaKind = (kind: CameraPermissionKind) =>
    kind === 'microphone' ? 'microphone' : 'camera'

  async function checkPermission(kind: CameraPermissionKind): Promise<CameraPermissionStatus> {
    if (globalThis.isSecureContext !== true || !navigator.mediaDevices?.getUserMedia) {
      return 'unavailable'
    }

    if (!policyAllows(kind)) {
      return 'blocked'
    }

    const desktop = await hostProbe

    if (desktop) {
      try {
        const { status } = await desktop.call('camera', 'permissionStatus', {
          kind: hostMediaKind(kind),
        })

        if (status === 'granted' || status === 'notDetermined') {
          return status
        }

        if (status === 'restricted') {
          return 'restricted'
        }

        if (status === 'denied' || status === 'blocked') {
          return 'denied'
        }

        // 'undeclared' and unknown statuses stay honest but unadorned.
        return 'unknown'
      } catch {
        return 'unknown'
      }
    }

    try {
      const status = await navigator.permissions.query({ name: kind as PermissionName })

      return status.state === 'granted'
        ? 'granted'
        : status.state === 'denied'
          ? 'blocked'
          : known[kind] === 'blocked'
            ? 'blocked'
            : 'notDetermined'
    } catch {
      if (known[kind] !== 'granted') {
        return known[kind]
      }

      const tracks = kind === 'camera' ? stream?.getVideoTracks() : stream?.getAudioTracks()

      return tracks?.some((track) => track.readyState === 'live') ? 'granted' : 'unknown'
    }
  }

  const settle = (value: Parameters<BackendCaptureSink['settled']>[0], expected = sink) => {
    const target = sink

    if (!target || target !== expected) {
      return
    }

    sink = undefined
    recorder = undefined
    captureFailure = undefined
    if (recordingVideo) {
      if (host) {
        host.srcObject = stream ?? null
        void host.play().catch(() => {})
      }

      recordingVideo.release()
      recordingVideo = undefined
    }

    clearTimeout(stopTimer)
    clearTimeout(watchdog)
    if (!host) {
      dropStream()
    }

    target.settled(value)
    if (host && !released && stream?.getVideoTracks()[0]?.readyState !== 'live') {
      void showPreview(false).catch(() => observer?.availability(false))
    }
  }

  const stop = () => {
    pendingSwitch?.cancel()
    if (!recorder || !sink) {
      return
    }

    stoppedAt ||= performance.now()
    clearTimeout(watchdog)

    const target = sink
    const fail = captureFailure

    watchdog = setTimeout(() => {
      if (sink !== target) {
        return
      }

      dropStream()
      void fail?.(error('finalizationFailed', 'stop', 'Recorder finalization callback timed out'))
    }, 30_000)

    if (recorder.state === 'inactive') {
      return
    }

    try {
      recorder.stop()
    } catch (cause) {
      void fail?.(error('captureFailed', 'stop', 'The recorder could not stop', cause))
    }
  }

  return {
    platform: 'web',
    get supported() {
      return supported()
    },
    checkPermission,
    requestPermission: async (kind) => {
      const status = await checkPermission(kind)

      if (status === 'blocked' || status === 'unavailable') {
        return status
      }

      if (navigator.userActivation && !navigator.userActivation.isActive && status !== 'granted') {
        return 'blocked'
      }

      // Persistence and device prompts run only inside an explicit app action.
      persistent = (await navigator.storage?.persisted?.().catch(() => false)) ?? false
      if (!persistent && (!navigator.userActivation || navigator.userActivation.isActive)) {
        persistent = (await navigator.storage?.persist?.().catch(() => false)) ?? false
      }

      const desktop = await hostProbe

      if (desktop) {
        const { status: hostStatus } = await desktop.call('camera', 'requestPermission', {
          kind: hostMediaKind(kind),
        })

        if (hostStatus === 'undeclared') {
          throw error(
            'configurationMissing',
            'requestPermission',
            `Missing ${kind === 'camera' ? 'NSCameraUsageDescription' : 'NSMicrophoneUsageDescription'} in the host app's Info.plist`,
          )
        }

        if (hostStatus !== 'granted') {
          known[kind] =
            hostStatus === 'denied' || hostStatus === 'blocked'
              ? 'denied'
              : hostStatus === 'restricted'
                ? 'restricted'
                : 'unknown'

          return known[kind]
        }
        // The system permission is granted — the capture delegate grants
        // this trusted origin, so the acquisition below gets the track.
      }

      try {
        if (kind === 'camera') {
          await acquireCamera()
        } else if (!stream?.getAudioTracks().some((track) => track.readyState === 'live')) {
          const epoch = generation
          const audio = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })

          if (released || epoch !== generation) {
            audio.getTracks().forEach((track) => track.stop())
            return 'unavailable'
          }

          if (!stream) {
            stream = new MediaStream()
          }

          for (const track of audio.getAudioTracks()) {
            stream.addTrack(track)
          }

          observeTracks(stream)
        }

        known[kind] = 'granted'
        if (host) {
          await showPreview()
        }

        return 'granted'
      } catch (cause) {
        known[kind] =
          cause instanceof DOMException &&
          (cause.name === 'NotAllowedError' || cause.name === 'SecurityError')
            ? 'blocked'
            : 'unavailable'

        return known[kind]
      }
    },
    getCapabilities: async () => {
      const desktop = await hostProbe

      persistent = (await navigator.storage?.persisted?.().catch(() => false)) ?? false

      const devices = (await navigator.mediaDevices?.enumerateDevices?.().catch(() => [])) ?? []
      const settings = stream?.getVideoTracks()[0]?.getSettings()
      const mime = mimeType()
      const storageReady = persistent || !!desktop

      return {
        supported: supported(),
        available: ready && storageReady && stream?.getVideoTracks()[0]?.readyState === 'live',
        reason: !supported()
          ? 'Secure media capture, a supported WebM/MP4 codec, and durable storage are required'
          : !storageReady
            ? 'Persistent origin storage must be granted before recording'
            : !ready
              ? 'An active permitted preview is required'
              : undefined,
        cameras: devices
          .filter((device) => device.kind === 'videoinput')
          .map((device) => ({ id: device.deviceId, label: device.label })),
        profiles:
          settings?.width && settings.height && settings.frameRate
            ? [
                {
                  profile: 'standard' as const,
                  width: settings.width,
                  height: settings.height,
                  frameRate: settings.frameRate,
                },
              ]
            : [],
        audio: devices.some((device) => device.kind === 'audioinput'),
        // The `pointsOfInterest` track constraint is not wired into
        // the adapter — report honestly rather than fabricate.
        focusPointOfInterest: false,
        exposurePointOfInterest: false,
        zoom: (() => {
          const state = readZoom()

          return !!state && state.maxZoom > state.minZoom
        })(),
        orientations: [],
        cameraSwitchDuringRecording: supportsRecordingVideoSource(),
        durationLimit: 'bestEffort',
        elapsedTime: 'estimated',
        output: {
          mimeType: mime,
          container: !mime ? '' : mime.startsWith('video/mp4') ? 'mp4' : 'webm',
          storage: desktop ? 'appPrivateFile' : 'originLocal',
          destinationFileUrl: !!desktop,
        },
      }
    },
    previewReady: () =>
      ready && !!host && !released && stream?.getVideoTracks()[0]?.readyState === 'live',
    validateStart: (options) => {
      // Once the desktop-host probe settles absent, browser storage rules
      // apply synchronously. A pending probe defers both checks to the
      // async start path, which knows the real storage owner.
      if (hostState === 'absent') {
        if (!persistent) {
          throw error(
            'destinationUnavailable',
            'startRecording',
            'Persistent origin storage has not been granted; check capabilities after a user permission action',
          )
        }

        if (options.destinationFileUrl) {
          throw error(
            'unsupportedConfiguration',
            'startRecording',
            'Browser output does not accept native file URLs',
          )
        }
      }

      if (options.orientation && options.orientation !== 'unspecified') {
        throw error(
          'unsupportedConfiguration',
          'startRecording',
          'This browser cannot lock a recording orientation',
        )
      }
    },
    attachPreview: (target, callbacks) => {
      if (released || sink) {
        throw error('invalidState', 'attachPreview', 'The camera is disposed or still finalizing')
      }

      host = target as HTMLVideoElement
      listener = callbacks
      document.addEventListener('visibilitychange', onVisibility)
      globalThis.addEventListener('pagehide', onPageHide)
      void showPreview().catch((cause) =>
        callbacks?.onError?.(
          error('unavailable', 'preview', 'Could not activate camera preview', cause),
        ),
      )

      return () => {
        if (host) {
          host.srcObject = null
        }

        host = undefined
        listener = undefined
        generation += 1
        markReady(false)
        document.removeEventListener('visibilitychange', onVisibility)
        globalThis.removeEventListener('pagehide', onPageHide)
        if (!sink) {
          dropStream()
        }
      }
    },
    configure: (next) => {
      const sourceChanged =
        JSON.stringify(next.camera) !== JSON.stringify(currentConfig.camera) ||
        next.profile !== currentConfig.profile

      currentConfig = { ...next }
      if (sourceChanged) {
        generation += 1
        dropStream()
        if (host) {
          void showPreview().catch((cause) =>
            listener?.onError?.(
              error('unavailable', 'configure', 'Could not change camera', cause),
            ),
          )
        }
      }
    },
    switchCamera: (camera: CameraSelection) => {
      if (!sink || !recordingVideo || pendingSwitch) {
        throw error('invalidState', 'switchCamera', 'The recording source cannot switch now')
      }

      if (
        (camera === 'front' || camera === 'back') &&
        !navigator.mediaDevices.getSupportedConstraints().facingMode
      ) {
        throw error(
          'unsupportedConfiguration',
          'switchCamera',
          'This browser cannot select by facing; choose a listed camera device ID',
        )
      }

      const videoSource = recordingVideo
      const previous = currentConfig.camera
      const microphones = stream?.getAudioTracks() ?? []
      let cancelled = false
      let acquired = false
      let rejectCancellation: (error: Error) => void = () => {}
      const cancellation = new Promise<never>((_resolve, reject) => {
        rejectCancellation = reject
      })

      const operation = {
        cancel: () => {
          if (cancelled || pendingSwitch !== operation) {
            return
          }

          cancelled = true
          videoSource.hold()
          stream?.getVideoTracks().forEach((track) => track.stop())
          markReady(false)
          pendingSwitch = undefined
          rejectCancellation(
            error('invalidState', 'switchCamera', 'Camera switching was cancelled'),
          )
        },
      }

      pendingSwitch = operation

      const check = () => {
        if (cancelled || released || recordingVideo !== videoSource || !sink) {
          throw error('invalidState', 'switchCamera', 'The recording is no longer active')
        }
      }

      const obtain = async (selection: CameraSelection | undefined) => {
        let expired = false
        let timeout: ReturnType<typeof setTimeout> | undefined
        const acquisition = navigator.mediaDevices
          .getUserMedia({ video: constraints(selection), audio: false })
          .then((value) => {
            if (expired || cancelled || released) {
              value.getTracks().forEach((track) => track.stop())
              throw error('invalidState', 'switchCamera', 'Camera acquisition was retired')
            }

            return value
          })

        try {
          return await Promise.race([
            acquisition,
            cancellation,
            new Promise<never>((_resolve, reject) => {
              timeout = setTimeout(
                () => reject(error('unavailable', 'switchCamera', 'Camera acquisition timed out')),
                5000,
              )
            }),
          ])
        } finally {
          expired = true
          clearTimeout(timeout)
        }
      }

      const install = async (selection: CameraSelection | undefined) => {
        check()

        const acquired = await obtain(selection)

        try {
          check()

          const settings = acquired.getVideoTracks()[0]!.getSettings()
          const expectedFacing =
            selection === 'front' ? 'user' : selection === 'back' ? 'environment' : undefined

          if (expectedFacing && settings.facingMode !== expectedFacing) {
            throw error(
              'unsupportedConfiguration',
              'switchCamera',
              'The requested camera facing could not be confirmed; choose a device ID',
            )
          }

          for (const microphone of microphones) {
            acquired.addTrack(microphone)
          }

          stream = acquired
          observeTracks(acquired)
          await videoSource.setSource(acquired)
          check()
          if (host) {
            host.style.transform = settings.facingMode === 'user' ? 'scaleX(-1)' : ''
          }

          markReady(true)
          check()
          return {
            id: settings.deviceId ?? '',
            label: acquired.getVideoTracks()[0]!.label,
            facing:
              settings.facingMode === 'user'
                ? ('front' as const)
                : settings.facingMode === 'environment'
                  ? ('back' as const)
                  : undefined,
          }
        } catch (cause) {
          acquired.getVideoTracks().forEach((track) => track.stop())
          throw cause
        }
      }

      const completion = (async () => {
        videoSource.hold()
        stream?.getVideoTracks().forEach((track) => track.stop())
        stream = new MediaStream(microphones)
        observeTracks(stream)
        markReady(false)
        try {
          const selected = await install(camera)

          acquired = true
          return selected
        } catch (cause) {
          if (!cancelled && !released) {
            try {
              await install(previous)
            } catch (rollback) {
              switchWarning = error(
                'captureFailed',
                'switchCamera',
                'Camera switching and rollback failed; the captured take was finalized',
                rollback,
              )

              sink?.finishing('cameraUnavailable')
              stop()
            }
          }

          throw cause instanceof CameraCaptureError
            ? cause
            : error('unavailable', 'switchCamera', 'Could not acquire the requested camera', cause)
        } finally {
          if (!acquired && pendingSwitch === operation) {
            pendingSwitch = undefined
          }
        }
      })()

      return {
        completion,
        commit: () => {
          check()
          if (!acquired || pendingSwitch !== operation) {
            throw error(
              'invalidState',
              'switchCamera',
              'Camera switching was cancelled before commit',
            )
          }

          currentConfig = { ...currentConfig, camera }
          pendingSwitch = undefined
        },
        cancel: operation.cancel,
      }
    },
    startCapture: (request, target) => {
      sink = target
      recordingAudio = request.audio
      switchWarning = undefined
      startedAt = 0
      stoppedAt = 0

      const source = stream
      const video = source?.getVideoTracks()[0]
      const audio = source?.getAudioTracks().filter((track) => track.readyState === 'live') ?? []

      if (!video || (request.audio && !audio.length)) {
        settle({
          kind: 'failed',
          stage: 'preparation',
          issue: error(
            request.audio ? 'permissionDenied' : 'unavailable',
            'startRecording',
            request.audio
              ? 'Requested microphone access is missing'
              : 'Video source is unavailable',
          ),
        })

        return
      }

      let recordingStream = new MediaStream([video, ...(request.audio ? audio : [])])
      let desktop: CameraHost | null = null
      let reservation: string | undefined
      let stage: 'preparation' | 'capture' | 'finalization' | 'storage' = 'preparation'
      const chunks: Blob[] = []
      let captureError: unknown
      let limitReached = false
      let failing = false
      let didStart = false

      captureFailure = fail
      void (async () => {
        try {
          desktop = await hostProbe
          if (request.destinationPath && !desktop) {
            throw error(
              'unsupportedConfiguration',
              'startRecording',
              'Web recordings do not accept native file destinations',
            )
          }

          if (desktop) {
            reservation = (
              await reserveHostMovie(desktop, {
                destinationFileUrl: request.destinationPath
                  ? `file://${request.destinationPath.split('/').map(encodeURIComponent).join('/')}`
                  : undefined,
                container: mimeType().startsWith('video/mp4') ? 'mp4' : 'webm',
              })
            ).fileUrl
          } else {
            if (!(await navigator.storage?.persisted?.())) {
              throw error(
                'destinationUnavailable',
                'startRecording',
                'Persistent storage is unavailable',
              )
            }

            reservation = await reserveMovie()
          }

          if (!source || video.readyState !== 'live' || document.visibilityState === 'hidden') {
            throw error(
              'unavailable',
              'startRecording',
              'Camera source became inactive before recording',
            )
          }

          if (supportsRecordingVideoSource()) {
            const settings = video.getSettings()

            recordingVideo = createRecordingVideoSource(
              settings.width ?? 1280,
              settings.height ?? 720,
              settings.frameRate ?? 30,
            )

            await recordingVideo.setSource(source)
            recordingStream = new MediaStream([
              ...recordingVideo.stream.getVideoTracks(),
              ...(request.audio ? audio : []),
            ])

            if (host) {
              host.srcObject = recordingVideo.stream
              await host.play()
            }
          }

          const activeRecorder = new MediaRecorder(recordingStream, { mimeType: mimeType() })

          recorder = activeRecorder
          activeRecorder.ondataavailable = (event) => {
            if (sink !== target || failing) {
              return
            }

            if (event.data.size) {
              chunks.push(event.data)
            }
          }

          activeRecorder.onerror = (event) => {
            if (sink !== target || failing) {
              return
            }

            captureError = event
            stop()
          }

          activeRecorder.onstart = () => {
            if (sink !== target || failing) {
              return
            }

            if (didStart) {
              return
            }

            didStart = true
            clearTimeout(watchdog)
            startedAt = performance.now()
            stage = 'capture'

            const settings = video.getSettings()
            const effective: EffectiveCaptureConfig = {
              cameraId: settings.deviceId ?? '',
              facing:
                settings.facingMode === 'user'
                  ? 'front'
                  : settings.facingMode === 'environment'
                    ? 'back'
                    : undefined,
              audio: request.audio,
              width: settings.width ?? 0,
              height: settings.height ?? 0,
              frameRate: settings.frameRate ?? 0,
              orientation: 'unspecified',
              mimeType: activeRecorder.mimeType,
              container: activeRecorder.mimeType.startsWith('video/mp4') ? 'mp4' : 'webm',
            }

            // The adapter owns a limit even when capabilities() was not called.
            if (request.maximumDurationMs) {
              const limit = request.maximumDurationMs
              const checkLimit = () => {
                if (sink !== target || failing) {
                  return
                }

                const remaining = limit - (performance.now() - startedAt)

                if (remaining > 0) {
                  stopTimer = setTimeout(checkLimit, Math.min(remaining, 2_147_483_647))
                } else {
                  limitReached = true
                  stop()
                }
              }

              stopTimer = setTimeout(checkLimit, Math.min(limit, 2_147_483_647))
            }

            target.started(effective)
          }

          activeRecorder.onstop = () => {
            if (sink !== target || failing) {
              return
            }

            target.finishing(
              captureError ? 'captureError' : limitReached ? 'maximumDuration' : undefined,
            )

            stoppedAt ||= performance.now()
            clearTimeout(stopTimer)
            clearTimeout(watchdog)
            void (async () => {
              try {
                stage = 'finalization'
                if (!startedAt) {
                  throw error('noMedia', 'finalize', 'No recording start was observed')
                }

                const bytes = new Blob(chunks, { type: activeRecorder.mimeType })
                const metadata = await inspectMovie(bytes, request.audio)

                if (sink !== target || failing) {
                  return
                }

                stage = 'storage'

                const output = desktop
                  ? await commitHostMovie(desktop, reservation!, bytes)
                  : {
                      kind: 'browserStorage' as const,
                      resourceId: reservation!,
                      retention: 'persistent' as const,
                    }

                const clip: MovieClip = { ...metadata, output }

                if (!desktop) {
                  await commitMovie(reservation!, bytes, clip)
                }

                settle(
                  {
                    kind: 'clip',
                    ...clip,
                    limitReached,
                    warning:
                      switchWarning ??
                      (captureError
                        ? error(
                            'captureFailed',
                            'capture',
                            'Recorder reported an error; finalized media was verified',
                            captureError,
                          )
                        : undefined),
                  },
                  target,
                )
              } catch (cause) {
                await fail(cause)
              }
            })()
          }

          activeRecorder.start(1000)
          watchdog = setTimeout(() => {
            if (!startedAt && sink === target) {
              stop()
              void fail(
                error('captureFailed', 'startRecording', 'Recorder start callback timed out'),
              )
            }
          }, 15_000)
        } catch (cause) {
          await fail(cause)
        }
      })()

      async function fail(cause: unknown) {
        if (sink !== target || failing) {
          return
        }

        failing = true
        if (reservation) {
          await (desktop
            ? removeHostReservation(desktop, reservation)
            : removeReservation(reservation).catch(() => {}))
        }

        settle(
          {
            kind: 'failed',
            stage,
            issue:
              cause instanceof CameraCaptureError
                ? cause
                : error(
                    stage === 'storage'
                      ? 'storageFailed'
                      : stage === 'preparation' || stage === 'capture'
                        ? 'captureFailed'
                        : 'finalizationFailed',
                    stage,
                    'Movie recording could not complete',
                    cause,
                  ),
          },
          target,
        )
      }
    },
    stopCapture: stop,
    elapsedMs: () => (startedAt ? Math.max(0, (stoppedAt || performance.now()) - startedAt) : 0),
    zoomState: () => readZoom(),
    setZoom: (ratio) => {
      const track = stream?.getVideoTracks()[0]
      const applied = track?.applyConstraints?.({
        advanced: [{ zoom: ratio } as any],
      })

      applied?.catch?.(() => {})
    },
    openOutput: async (output) => {
      if (output.kind === 'nativeFile') {
        const desktop = await hostProbe

        if (!desktop) {
          throw error(
            'unavailable',
            'openOutput',
            'File-backed output requires the desktop host that recorded it',
          )
        }

        return openHostMovie(desktop, output)
      }

      return openStoredMovie(output)
    },
    release: async () => {
      released = true
      generation += 1
      document.removeEventListener('visibilitychange', onVisibility)
      globalThis.removeEventListener('pagehide', onPageHide)
      dropStream()
      host = undefined
    },
    setObserver: (value) => {
      observer = value
    },
  }
}
