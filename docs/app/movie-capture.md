# Record and reopen a camera movie

Build a short video recorder with a live preview, a Record button, and a Stop
button. This guide covers Android, Web, macOS, and Windows (WinUI 3) movie
capture; iOS uses the same session interface. Linux adapters remain
unfinished. Windows support is implemented through the NativeScript WinUI
host but still needs a real Windows machine with a camera to finish
qualification — see the gaps at the end of this guide.

Install the camera package from your app's folder:

```sh
pnpm add @octane-xplat/camera
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
A browser may refuse it even after granting camera access. Check capabilities
again after that action and enable Record only when `available` is true.
`reason` explains unavailable storage or preview. Stored clips remain subject
to user-cleared site data. The current shared interface has no best-effort
retention option, so this adapter rejects recording rather than weakening
retention silently.

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
leaf is a compiled Swift host, so the AppKit backend and the WKWebView host
both need a native build; `xplat` dev and package builds compile it when the
app depends on `@octane-xplat/camera`.


```ts
async function enableAudio() {
	if (await session.requestPermission('microphone') === 'granted') {
		await session.configure({ audio: true })
	}
}
```

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
media time on Android and macOS and an estimate on Web and Windows; the clip's
duration is read from finalized media.

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
the stored movie. Android and Windows return app-private MP4 file URLs and
macOS returns an app-private MOV file URL. Web commits bytes
and metadata to IndexedDB and returns a stable resource ID; the opened Blob URL
is temporary playback access.

Inside a qualified macOS WKWebView host the same Web backend stores finalized
bytes in the host's app-private Application Support directory instead of
IndexedDB. Output still reopens through `session.openOutput` — the returned
`url` is temporary playback access while `fileUrl` is the durable reference.

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
existing files and known cache or temporary directories. macOS accepts a new
`.mov` destination file URL inside the app's private Application Support root
and refuses existing files, missing directories, and paths outside that root.
Web does not accept native file destinations. Check the destination capability
before
showing that option.

```ts
const capabilities = await session.capabilities()
if (capabilities.output.destinationFileUrl) {
	// newMovieFileUrl must be an app-owned, writable, unused file:// path.
	const newMovieFileUrl = 'file:///data/user/0/com.example.app/files/new-take.mp4'
	const take = session.startRecording({ destinationFileUrl: newMovieFileUrl })
	console.log(take.id)
}
```

## Camera selection and orientation

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

Android and Web currently advertise no fixed cardinal orientations. Omit
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
Android and Windows write MP4, macOS writes MOV (`video/quicktime`), while Web
selects an explicitly supported WebM or MP4 codec
and reports the finalized file's actual MIME type, including codecs.


```ts
const take = session.startRecording()
const outcome = await take.stop()
if (outcome.kind === 'clip') {
	console.log(outcome.clip.orientation, outcome.clip.width, outcome.clip.height)
	console.log(outcome.clip.mimeType)
}
```

## Qualification and remaining gaps

The maintained [Android conformance case](../../packages/camera/tests/movie-capture.android.tsrx)
exercises real CameraX finalization, source inactivity, denied and enabled audio,
non-overwrite destinations, lifecycle notification dispatch, disposal, and
reopening after process restart in an Android API 35 emulator. The
[browser conformance runner](../../packages/camera/tests/browser-conformance.web.mjs)
exercises real Chromium MediaRecorder, media parsing, IndexedDB, and reopening
after reload. The browser's persistent-storage grant and hidden-page state are
injected test seams. They do not prove browser persistence approval or OS page
suspension. Deterministic adapter tests cover delayed storage, failure cleanup,
early and repeated Stop, track loss, denied audio, and oversized timers.

```sh
pnpm --filter @octane-xplat/camera test
node packages/camera/tests/browser-conformance.web.mjs
pnpm probe run packages/camera/tests/movie-capture.android.tsrx \
  --target android --device DEVICE_ID --deps @octane-xplat/camera --timeout 130000
pnpm probe run packages/camera/tests/movie-capture.macos.tsrx \
  --target macos --deps @octane-xplat/camera --timeout 120000
pnpm --filter @xplat/macos test:camera-webview
```

The Android case needs camera permission granted to its isolated test app and
microphone permission initially left denied. After the audio-refusal assertion,
its `CAMERA_PROBE_ALLOW_MIC` log identifies when to grant microphone access for
the audio-track check. The [macOS conformance case](../../packages/camera/tests/movie-capture.macos.tsrx)
runs inside a signed probe bundle carrying camera and microphone usage
descriptions: on a camera-equipped Mac it exercises the full
recording assertions, and on a camera-less host it verifies real system
permission status, capability honesty, preview failure, and recording-admission
rejection. The [WKWebView camera proof](../../apps/macos/scripts/camera-webview-proof.mjs)
verifies the host camera service end to end: system media permission status,
app-private movie storage reserve/commit/reopen/delete, private-root
containment, and the session backend switching to host storage — all inside a
bundled `xplat` WKWebView. Runtime evidence does not establish physical
phone rotation, actual OS backgrounding, disk exhaustion, front-camera visual
mirroring, or playback by an OS player after restart. Those remain acceptance
gaps. MP4-only browser hosts need their own codec and permission qualification; Chromium evidence here
covers WebM VP8/Opus. **The development host used for the current macOS
evidence has no camera hardware** — real AppKit capture, interruption
settlement, and WKWebView `MediaRecorder` capture remain unverified until run
on a camera-equipped Mac.

Windows delivers preview and recording through the WinUI 3 `MediaCapture` +
`CaptureElement` projection in the NativeScript host — permission status and
requests through `AppCapability`/`DeviceAccessInformation`, device selection
through `DeviceInformation` (including external webcams by id), app-private
MP4 output in `ApplicationData.LocalFolder`, native finalization through
`StopRecordAsync`, and clip metadata verified from the finalized file's video
properties and audio tracks. Because no Windows host was available during this
delivery, the projection details — event subscription, async marshaling, and
the recording pipeline itself — are source-verified only. A Windows machine
with a camera still needs to qualify real preview, recording, permission
prompts, contention, restart reopening, and suspension behavior. The
WebView2 experiment in `apps/windows/webview-host` is not a configured camera
presentation; its media permissions and persistence would need separate
qualification if it ever becomes one. Linux and the final platform matrix
remain separate unfinished milestones.
