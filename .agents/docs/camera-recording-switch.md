# Camera changes during a movie take

Use this note when changing recording-time camera selection or integrating an
app that starts recording as soon as its preview is ready. Live front/back
switching is not implemented. Keep the idle-only configuration boundary until
a recorder can preserve the admitted take across a source change.

## What the current implementation establishes

The baseline examined is `4e146cffd`: camera 0.18.0, Octane 0.16.3,
NativeScript core 9.1.3, NativeScript Vite 8.0.20, CameraX 1.5.3.
One session owns preview and one attempt; configuration is idle-only.
Capability discovery suspends configuration, so its idle/disposal checks must
also run after discovery returns. Otherwise preview readiness can admit an
automatic recording before a pending configuration reaches the adapter.

| Host | Current source path | Consequence for live switching |
| --- | --- | --- |
| iOS | `session-backend.ios.ts`: one `AVCaptureSession`, video input, audio input and `AVCaptureMovieFileOutput`; configuration changes inputs | No recorder continuation mechanism or tested live-input-swap contract. Removing the core guard does not establish preservation of the file or audio. |
| Android | `CameraSessionBridge.java`: `attach` rejects an existing recording; rebind creates a new Recorder and VideoCapture; `prepareRecording` is nonpersistent | Cannot reuse the existing attach/configure operation during a take. |
| Web | `session-backend.web.ts`: a MediaRecorder captures a fixed recording stream; configuration releases and reacquires the preview source | Replacing the preview stream does not replace the recorder's source safely. Capabilities list device IDs without facing labels, but idle exact front/back constraints are implemented. |
| Desktop | Separate macOS/Windows host recorders; Linux uses the web media path | No qualified live-switch operation. Do not infer desktop support from a mobile implementation. |

A rejected configuration must not stop the take, change elapsed time, finalize
it, or send a second completion. Session tests cover starting, recording,
finalizing, interruption, disposal and repeated pending requests. An Android
adapter double covers auto-record admission overtaking configuration. These
are state-machine/adapter evidence, not physical camera or audio evidence.

## Expo prior art

Inspected the official `expo-camera@58.0.14` tag, resolved through GitHub to
[`075c93fe58bb4f76316183ac7fdb005403475970`](https://github.com/expo/expo/tree/075c93fe58bb4f76316183ac7fdb005403475970/packages/expo-camera),
using `opensrc`. The source package manifest at that tag still says 58.0.12;
the commit, rather than that embedded version, identifies this inspection.
No Expo code is copied; its repository uses the MIT license.

- [Official recording documentation](https://docs.expo.dev/versions/latest/sdk/camera/#recordasyncoptions)
  says a facing change stops recording. A changing facing prop is not evidence
  of continuation.
- [iOS CameraSessionManager](https://github.com/expo/expo/blob/075c93fe58bb4f76316183ac7fdb005403475970/packages/expo-camera/ios/Current/CameraSessionManager.swift):
  camera discovery selects a device; `addDevice` removes the previous input
  and adds the replacement inside a configuration transaction. It updates
  preview rotation afterwards. Audio input is managed separately. There is
  no asset writer, segment coordinator or continuation of the recording promise.
- [iOS CameraVideoRecording](https://github.com/expo/expo/blob/075c93fe58bb4f76316183ac7fdb005403475970/packages/expo-camera/ios/Current/CameraVideoRecording.swift):
  starts one movie output with its recording delegate. `didFinishRecordingTo`
  resolves the URI when the native result is successful (including Apple's
  successfully-finished error key), otherwise rejects, then clears the promise
  and progress timer. Connection options are applied at recording start.
- [Android ExpoCameraView](https://github.com/expo/expo/blob/075c93fe58bb4f76316183ac7fdb005403475970/packages/expo-camera/android/src/main/java/expo/modules/camera/ExpoCameraView.kt):
  recreates the video capture use case, unbinds and rebinds on camera changes.
  Recording does not opt into persistent capture. Finalize resolves the URI
  for success, limits and source-inactive endings; other errors reject. No
  internal stitching hides that completion.
- [Expo #29367](https://github.com/expo/expo/issues/29367) reports Android
  switching terminating recording or returning an error. It closed for
  inactivity, not a demonstrated fix. Treat this as historical user evidence,
  separate from the pinned source inspection.

[Octane issue #22](https://github.com/octane-xplat/octane-xplat/issues/22)
requested the original movie API and is closed. Its delivered selection API is
idle-only; it does not promise recording-time switching. No duplicate upstream
issue is needed for Octane's missing recording architecture. No new dependency
bug or hardware failure has been established by this investigation.

## Feasible directions and limits

Android's [persistent recording API](https://developer.android.com/reference/androidx/camera/video/PendingRecording#asPersistentRecording())
exists in the pinned CameraX generation (introduced in 1.3). It can retain one
Recorder/VideoCapture while rebinding to another camera. Audio continues during
unbind unless explicitly paused. Camera frames pause, and an incompatible
camera/surface combination can reject binding. This is an experimental API;
retain explicit lifecycle stop handling, rollback, source readiness and native
media-duration accounting. It is a promising single-file path, not an Octane
runtime qualification.

On iOS, Expo supplies no seamless-switch implementation to adapt. A candidate
is video/audio data outputs feeding one AVAssetWriter with stable encoding,
orientation and timeline ownership. Apple's [capture guide](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/AVFoundationPG/Articles/04_MediaCapture.html)
describes sample outputs; its [external-camera guidance](https://developer.apple.com/videos/play/wwdc2023/10106/)
discusses custom recording with an asset writer. This is a recorder replacement,
not evidence that a minimal input swap preserves the current movie output.
Apple's constituent-device switching controls concern a virtual camera's
constituent lenses; do not treat them as front/back input replacement.

Internal segmentation is another design, but is not implemented or selected.
It would belong in the framework: retain all finalized segments until one
verified durable output commits; normalize resolution, orientation and mirroring;
place audio/video using media timestamps; account for capture gaps; retain
recoverable content on failed assembly. The current single-output failure type
does not expose recoverable segment references. Silent segment deletion,
multiple user-visible clips and restarting into an idle preview are unacceptable
substitutes for a single logical recording.

The smallest outstanding product decision is the allowed transition behavior:
may a take keep continuous audio while video briefly freezes or has a gap during
lens acquisition, or must new video frames remain continuous? Prefer the first
for a bounded future recorder project: it avoids requiring simultaneous cameras
and leaves room for one physical output. The exact gap policy and elapsed-time
meaning must be specified and tested before shipping. No continuous-audio or
single-file guarantee has been verified on hardware here.

## Consumer integration: Opals

There is no small consumer change that enables same-take flipping with the
current framework. Keep the existing recording/saving handler guard until a
live-switch primitive exists. In particular, do not remove it, call stop from
Flip, or rearm auto-record to imitate continuation.

For the existing idle selection path:

- Keep one MovieCapture session attached to CameraView. Do not also pass facing
  to CameraView or replace/unmount the session to change lenses.
- Treat record intent/admission as busy, in addition to the session's starting,
  recording and finalizing states, saving and a pending selection. Session idle
  alone does not describe an app's asynchronous start intent.
- Await the existing serialized `capture.setFacing` configuration before
  updating facing or persisting `video-grid.camera`. Surface rejection. Choose
  one configuration owner; avoid configuring again from the preview effect
  after a handler has already done so.
- Match `capture.flip`'s actual disabled behavior, accessibility disabled state
  and handler guard. Explain that changing cameras during a take is unavailable;
  this is honest UI for the limit, not a solution to the requested capture flow.
- Have the consumer stop wrapper return `take.stop()` so its owner can join
  finalization; keep save/upload/thumbnail ownership on the same completion
  promise and never invoke it again for a rejected selection.
- On web, use capability-listed device IDs for discovery. The absence of facing
  labels explains why an automatic opposite-device picker cannot be inferred;
  it does not mean idle exact facing constraints are absent.

A future live-switch integration should route Flip through a dedicated session
operation, await it once, disable only overlapping switches/saving/terminal
states, and persist the new lens only after success. It must retain the original
take, completion/save handler, maximum duration and media clock. That operation
is a design requirement, not an API exported by this change.
