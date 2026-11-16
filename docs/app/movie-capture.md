# Record and reopen a camera movie

> Show a camera preview, record a short movie, and reopen the saved result.

Build a short video recorder with a live preview, a Record button, and a Stop
button. This guide covers Android, Web, macOS, and Windows (WinUI 3)
movie capture; iOS uses the same session interface. Windows support is
implemented through the NativeScript WinUI host but still needs a real Windows
machine with a camera to finish qualification — see the gaps at the end of
this guide.

Install the camera package from your app's folder:

```sh
bun add @octane-xplat/camera
```

## Show the shared preview

A session owns the camera used by both preview and recording. Create it once
for the lifetime of your recorder screen, and pass it to `CameraView`. Omit
`facing` when passing a session: the session selects the camera. An existing
preview without a session retains its earlier permission and teardown behavior.

```tsx
import { CameraView, createCameraSession } from '@octane-xplat/camera'

const session = createCameraSession({ camera: 'default', audio: false })

export function RecorderPreview() {
  return (
    <CameraView
      session={session}
      style={{ width: 320, height: 240 }}
      onReady={() => console.log('Preview is ready')}
      onError={(error) => console.log(error.message)}
    />
  )
}
```

## Ask for access from a button

Creating a session does not ask for permission. Query permission without a
prompt, explain why your app needs the camera, then call `requestPermission`
from a button handler. An already-mounted preview activates after camera access
is granted. Web needs HTTPS or localhost; an embedded page also needs its host
to allow the `camera` and, for audio, `microphone` permissions policy.

```ts
async function allowCamera() {
  console.log(await session.permissions())
  const permission = await session.requestPermission('camera')
  if (permission !== 'granted') {
    console.log('Camera access is unavailable:', permission)
  }
}
// Connect allowCamera to your app's Allow camera button.
```

Browser recordings require persistent origin storage in this adapter. The
camera permission action also asks the browser for persistence when permitted.
A browser may refuse it even after granting camera access; stored clips remain
subject to user-cleared site data. Native Linux GTK has no recording adapter.

```ts
async function canRecord() {
  const capabilities = await session.capabilities()
  if (!capabilities.supported || !capabilities.available) {
    console.log(capabilities.reason)

    return false
  }
  console.log(capabilities.output.mimeType, capabilities.output.container)

  return true
}
```

Audio is opt-in. Ask for microphone access separately before enabling it; denied
or missing audio produces a failure rather than a silent substitute. Android
apps need `CAMERA` and `RECORD_AUDIO` manifest declarations; the leaf contributes
both. Android reports `blocked` when it cannot distinguish permanent denial
from a policy restriction.

On Windows, the app must declare `webcam` and `microphone` device capabilities in
`App_Resources/Windows/Package.appxmanifest`; a missing declaration reports a
`configurationMissing` error rather than pretending a permission status. The
operating system's own privacy toggles also apply: a user-level refusal reports
`denied`, and a system or policy level refusal reports `restricted`.

```xml
<Capabilities>
  <DeviceCapability Name="webcam" />
  <DeviceCapability Name="microphone" />
</Capabilities>
```

macOS needs usage descriptions in the app bundle's `Info.plist`. Declare them
through the package config and both dev launches and packaged builds receive
them:

```json
{
  "xplat": {
    "targets": {
      "macos": {
        "package": {
          "infoPlist": {
            "NSCameraUsageDescription": "This app records video with the camera.",
            "NSMicrophoneUsageDescription": "This app records audio with your video."
          }
        }
      }
    }
  }
}
```

Without the matching key, `permissions()` stays `unknown` and
`requestPermission` fails with `configurationMissing` — the system would
reject the prompt outright, so the adapter fails instead. The macOS camera
leaf is a compiled Swift host, so the AppKit backend
needs a native build; `xplat` dev and package builds compile it when the
app depends on `@octane-xplat/camera`.

```ts
async function enableAudio() {
  if ((await session.requestPermission('microphone')) === 'granted') {
    await session.configure({ audio: true })
  }
}
```

## Allow iOS feedback while the microphone is active

iOS normally suppresses haptics when microphone capture is active. With audio
enabled, this includes camera preview before you press Record. If your recorder
needs tactile controls, explicitly allow haptics **and system sounds**. Sounds
or vibration can affect the recorded audio, so this is an app choice. The iOS
option has no effect on other platforms.

```ts
import { createCameraSession } from '@octane-xplat/camera'

const feedbackCamera = createCameraSession({
  audio: true,
  ios: { allowHapticsAndSystemSoundsDuringRecording: true },
})
// Request camera/microphone access and attach this session to CameraView as above.
// When the screen closes:
await feedbackCamera.dispose()
```

The camera applies this policy before starting microphone capture without
changing the audio category, route, or activation state. It restores the prior
value after the last opted-in camera owner stops audio capture. Other audio
services must coordinate writes to this app-wide policy while a camera owns it.
Leaving the option unset preserves the existing app policy. Use the
[silent iOS haptics setup](../packages/package-haptics.md#set-up-ios) if you also
use `@octane-xplat/haptics`; physical feedback during capture still needs
verification on the iPhone models you support.

## Record, then wait for the finished movie

Start requires an attached, active, ready preview. A take begins in `starting`,
then emits `started` when capture actually begins. Stop enters `finalizing`;
completion becomes a clip only after media metadata is verified and storage
is committed. Repeated Stop calls join the same completion. A second Start
while starting, recording, or finalizing throws a `busy` error.

```ts
import { CameraCaptureError } from '@octane-xplat/camera'
import type { MovieTake } from '@octane-xplat/camera'

let currentTake: MovieTake | undefined

function record() {
  try {
    currentTake = session.startRecording({ maximumDurationMs: 30_000 })
  } catch (error) {
    if (!(error instanceof CameraCaptureError)) throw error
    console.log('Cannot start:', error.kind)
    return
  }
  void currentTake.completion.then((outcome) => {
    if (outcome.kind === 'clip') {
      console.log('Finished:', outcome.clip.durationMs, outcome.clip.output)
    } else {
      console.log('Recording failed:', outcome.stage, outcome.error.kind)
    }
  })
}

async function stop() {
  return currentTake?.stop()
}
```

A duration limit requests stopping; it is not an editing cutoff. Android uses
CameraX media-time enforcement and macOS uses `AVCaptureMovieFileOutput`
media-time enforcement. Web and Windows timers are best effort and may
run late when the app is busy or suspended. Elapsed time is native
media time on Android and macOS and an estimate on Web and Windows;
the clip's duration is read from finalized media.

```ts
console.log((await session.capabilities()).durationLimit)
console.log(currentTake?.elapsedMs)
const outcome = await currentTake?.completion
if (outcome?.kind === 'clip') console.log(outcome.clip.durationMs)
```

Backgrounding, source loss, preview removal, and disposal request a stop. A
usable interrupted clip has `partial: true` and an `endReason`; an empty or
unusable take fails. Returning to the foreground does not resume the take.
Wait for disposal before replacing an owner that is still finishing.

```ts
session.subscribe((event) => {
  if (event.type === 'finished' && event.outcome.kind === 'clip') {
    console.log(event.outcome.endReason, event.outcome.partial)
  }
})
await session.dispose()
```

## Reopen for playback

Keep the clip's `output` reference in your app's library. A fresh session can
reopen that reference after app restart or page reload, without activating the
camera. Release the returned access when playback ends; release does not delete
the stored movie. Android and Windows return app-private MP4 file URLs; macOS returns an app-private MOV file URL. Web commits bytes and metadata to IndexedDB and returns a stable resource ID. The opened Blob URL is temporary playback access.

```ts
import { createCameraSession } from '@octane-xplat/camera'
import type { MovieOutput } from '@octane-xplat/camera'

async function reviewSavedMovie(output: MovieOutput) {
  const owner = createCameraSession()
  const access = await owner.openOutput(output)
  console.log('Use this URL for playback:', access.url)
  // Once the player has released the URL:
  access.release()
  await owner.dispose()
}
```

Android and Windows additionally accept a new writable absolute `.mp4`
destination file URL. They reserve that path before capture and refuse
existing files and known cache or temporary directories. macOS accepts a new `.mov` file URL inside the app's private Application Support root and refuses existing files, missing directories, and paths outside that root. Web does not accept native file destinations. Check the destination capability before showing that option.

```ts
const capabilities = await session.capabilities()
if (capabilities.output.destinationFileUrl) {
  // newMovieFileUrl must be an app-owned, writable, unused file:// path.
  const newMovieFileUrl = 'file:///data/user/0/com.example.app/files/new-take.mp4'
  const take = session.startRecording({ destinationFileUrl: newMovieFileUrl })
  console.log(take.id)
}
```

## Switch cameras during a take

On supported hosts, a live camera switch keeps the same take, microphone,
elapsed-time clock, duration limit and completion promise. Recorded video holds
its last frame during acquisition, then resumes from the new camera in one
output file. Check the capability after preview activation; a usable camera
pair and compatible recording profile are still required.

```ts
// Continue with the session created above; call during recording.
const capabilities = await session.capabilities()
if (capabilities.cameraSwitchDuringRecording) {
  await session.switchCamera('front')
}
```

| Host                  | Live switching                                                                                                                                                                                                                                                                          |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Web                   | Available when canvas recording and manual frame submission are supported. Preview and recording share the held video source. Chromium timing is qualified with generated video and a mock microphone; other browser engines, physical browser cameras, and timing under severe host load remain unqualified.           |
| Android               | Uses one persistent CameraX recorder while rebinding video. Audio stays active; the preview retains its last frame until the new source is ready. Physical front/back recording and packet timing have been exercised; image orientation and mirroring have not been visually verified. |
| iOS                   | One sample writer keeps an independent microphone session active during video-input replacement. Physical iPhone front/back swaps, incoming audio, encoded timing, stop/limit races and background recovery have been exercised. Connection metadata verifies mirroring/orientation settings; their appearance has not been visually verified. |
| macOS, Windows | Unavailable in their current native/host adapters. Web support does not imply support in a separate desktop camera adapter.                                                                                                                                                             |

The session remains `recording` while `switchingCamera` is true. Disable repeated
Flip presses during that interval and while saving, starting or finalizing.
Keep Stop available. `activeCamera` describes the latest confirmed recording
source; `attempt.configuration` remains the take's starting configuration.
Subscribe to state changes so the controls update as the switch progresses.

```ts
const unsubscribe = session.subscribe((event) => {
  if (event.type === 'stateChanged') {
    console.log(event.snapshot.switchingCamera, event.snapshot.activeCamera)
  }
})
// Call unsubscribe when this screen's subscription is no longer needed.
```

The output keeps its starting dimensions and rotation. Web and iOS crop replacement
video around its center to fill those dimensions; Android keeps its recording
profile. Front-camera preview may be mirrored; recorded video is unmirrored.
Use the attempt's configuration to inspect the starting format.

```ts
console.log(session.snapshot().attempt?.configuration)
```

On iOS, upgrading the package requires a native app rebuild. A microphone
interruption or timestamp gap ends the take with a diagnostic and preserves a
verified partial clip when possible. It does not silently shorten the missing
audio interval or start a replacement take. Keep the original completion handler
responsible for saving and reporting partial results.

```ts
const result = await take.completion
if (result.kind === 'clip' && result.partial) {
  console.warn('Saved the captured portion', result.endReason, result.warning)
}
```

A switch resolves when the replacement camera is producing frames and is
connected to the existing recording path. This confirms source readiness;
it does not acknowledge that a particular frame has been encoded.
It rejects overlapping requests with `busy`, calls outside recording with
`invalidState`, and unavailable host support with `unsupportedConfiguration`.
A failed acquisition attempts to restore the previous camera while keeping the
take running. If recovery fails, the original completion delivers a usable
partial clip when possible. Stop, interruption, disposal and duration limits
cancel switching and retain their normal completion ownership.

```ts
import type { CameraSelection } from '@octane-xplat/camera'

// Continue with session. Connect this function to your selection control.
async function changeRecordingCamera(camera: CameraSelection) {
  const state = session.snapshot()
  if (state.state !== 'recording' || state.switchingCamera) {
    return
  }
  try {
    await session.switchCamera(camera)
    // Persist the selection here, after success.
  } catch (error) {
    console.error('Could not switch cameras', error)
  }
}
// Keep saving and playback on the original take.completion handler.
```

Browser device lists may omit front/back labels. Use a camera picker with
capability-listed device IDs when direction is unknown; do not guess another
camera from its label or array position. A facing request also rejects if the
browser cannot select and confirm that direction; listed device IDs remain usable.

```ts
const devices = (await session.capabilities()).cameras
// Call from the picker with the device the person selected:
async function selectRecordingDevice(deviceId: string) {
  await changeRecordingCamera({ deviceId })
}
console.log(devices)
```

## Camera selection and orientation

Use `configure` only while idle, before arming automatic recording. It rejects
changes during a take and leaves that take running. Use the dedicated live
operation above when its capability is available.

```ts
// Continue with the session created above, before arming automatic recording.
await session.configure({ camera: 'front' })
```

Use capability-listed camera IDs when selecting a particular device. Browser
front/back requests use exact facing constraints and fail when the source
cannot satisfy them; an ordinary webcam is selected with `default` or its ID.
The automatic standard profile targets 720p/30 and reports the available source
combination after preview activates.

```ts
const capabilities = await session.capabilities()
const camera = capabilities.cameras[0]
if (camera) await session.configure({ camera: { deviceId: camera.id } })
console.log((await session.capabilities()).profiles)
```

iOS starts in portrait unless you request another supported orientation. It
keeps that orientation for the whole take, including camera switches. Request
the orientation before recording begins.

```ts
const capabilities = await session.capabilities()
if (capabilities.orientations.includes('landscapeRight')) {
  const landscapeTake = session.startRecording({ orientation: 'landscapeRight' })
  console.log(landscapeTake.id)
}
```

Android and Web currently advertise no fixed cardinal orientations.
Omit
`orientation`; clips report `unspecified` alongside actual presentation width
and height. Android samples display rotation at start and reads the final MP4
transform; Web reads final container metadata. Windows advertises cardinal
orientations only while a live source exposes `SetRecordRotation`; clips
otherwise report the rotation stored in the file. On macOS 14 and later the four
cardinal orientations are advertised and locked through the recording
connection's rotation angle; on macOS 13 `orientations` is empty and an
orientation request fails `unsupportedConfiguration`. macOS clips report the
actual orientation read from the finalized MOV track transform. Recorded output
is unmirrored;
front-camera preview may be mirrored. No shared file suffix or codec is assumed:
Android and Windows write MP4, iOS and macOS write MOV (`video/quicktime`), while Web selects an explicitly supported WebM or MP4 codec and reports the finalized file's actual MIME type, including codecs.

```ts
const take = session.startRecording()
const outcome = await take.stop()
if (outcome.kind === 'clip') {
  console.log(outcome.clip.orientation, outcome.clip.width, outcome.clip.height)
  console.log(outcome.clip.mimeType)
}
```

## Platform limits

Test recording and reopening a movie on a physical device with the camera and
microphone your app will use. Emulator and mock-camera checks do not establish
physical input, phone rotation, OS suspension, disk exhaustion, front-camera
mirroring, or playback by an OS player after restart.

Chromium checks cover WebM VP8/Opus; MP4-only browser hosts need their own codec,
permission and persistence checks. Native AppKit capture on a
camera-equipped Mac remains unverified.

Windows preview and MP4 recording have source implementations only. Real preview,
permission prompts, recording, device contention, reopening after restart and
suspension still need Windows hardware verification. Do not treat the presence
of a platform entry as a runtime support guarantee.
