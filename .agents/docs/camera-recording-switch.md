# Camera changes during a movie take

The contract and architecture rationale are recorded in the
[design record](../design/camera-recording-switch.md).

Use this note when changing the recorder or integrating an automatically
recorded preview. General configuration remains idle-only, including its
post-discovery lifecycle check. Live camera changes belong to the dedicated
session operation and must preserve one take, completion and durable output.

## Recorder boundaries

- Web keeps one canvas video track and the original microphone track attached
  to MediaRecorder. Replacing the camera must never replace the recorder's track
  set. Redraw the retained canvas while acquiring a new source: requestFrame
  alone can produce sparse packets. Stop late acquisitions after cancellation,
  and gate admission on a live source when preview recovery is pending. Canvas
  frame scheduling depends on the renderer; passing an isolated timing test does
  not qualify audio/video timing under severe host load.
- Android uses CameraX persistent recording with one Recorder/VideoCapture.
  Rebind only this session's use cases; leave audio active, retain rotation and
  profile, and reject incompatible camera profiles before unbinding. The preview
  keeps an in-memory copy of its last transformed frame during acquisition.
  Treat camera CLOSED during an intentional rebind separately from an actual
  interruption. Keep explicit background/stop/disposal handling: persistence
  otherwise outlives lifecycle unbinding. Roll back failed acquisition and bound
  both acquisition and rollback.
  Native acquisition is provisional: keep the previous selection and held
  preview until `confirmCameraSwitch` acknowledges the shared lifecycle check.
  A cancelled acquisition restores the previous preview after finalization.
  If acknowledgement fails, finalize usable output with a warning instead of
  continuing to record an uncommitted camera.
- iOS uses one AVAssetWriter fed by video sample output and an independent
  microphone AVCaptureSession. Sharing microphone and video inputs in one capture
  session caused real missing audio during front/back swaps; the encoder can
  concatenate the remaining audio and hide the loss. Synchronize audio sample
  timestamps into the video session clock, measure incoming duration/gaps as
  well as encoded packets, and finalize with a warning on microphone loss.
  Keep the video session's `usesApplicationAudioSession` false; the separate
  microphone session owns audio activation and interruption handling. Retain one
  MOV writer, elapsed clock and fixed starting dimensions through replacement.
  Rebuild native apps after upgrading; a missing linked writer is unsupported,
  with rebuild guidance, rather than a fallback to movie-file recording.
- macOS has a separate AppKit movie-file writer; Windows uses MediaCapture;
  Linux has a separate host adapter. None currently supplies the dedicated live
  operation. Do not infer their support from the browser implementation.

## Ownership and evidence

Switching is orthogonal to recorder state. The starting attempt configuration
stays immutable; active selection updates only after the replacement camera is
producing frames on the existing recording path. This confirms source readiness,
not encoding of a particular frame. Reject overlapping switches, retire stale callbacks and let stop,
limits and lifecycle loss keep their original exactly-once completion cause.
Preview rebind readiness must not rearm automatic recording.

Web, Android, the synthetic source and iOS defer their cached
selection update to the backend operation's synchronous `commit`. Stop can win
after `completion` resolves but before the shared session resumes; cancellation
must remain effective in that window. Web retires the uncommitted video source
and reacquires the previous camera after finalization. Neither acquisition nor
preview readiness alone commits the app's saved selection.

The iOS writer owns samples on its serial queue and runs capture-session
transactions on main so input replacement cannot block audio sample processing.
Acquisition remains provisional until the shared session rechecks the take and
synchronously commits the switch. Native retains the previous input and preview
hold until that acknowledgement, so stop can restore the previous selection even
after acquisition succeeds but before JavaScript resumes.
Retire source generations before cancellation/restoration, wait for fresh source
frames before admitting the next take, and clear writer ownership before terminal
callbacks. The preview hold uses an in-memory layer; it is never persisted for
verification. Failed writer output is verified before returning a partial clip;
unverified output bytes are not removed as cleanup.

Expo's official camera documentation says flipping ends recording. Its
`expo-camera@58.0.14` source at `075c93fe58bb4f76316183ac7fdb005403475970`
uses movie-file output input replacement on iOS and nonpersistent CameraX
recording on Android; its recording callbacks settle the original promise.
No Expo code is copied. VisionCamera v4.7.3's MIT-licensed
[audio ownership](https://github.com/mrousavy/react-native-vision-camera/blob/v4.7.3/package/ios/Core/CameraSession%2BAudio.swift)
and [clock synchronization](https://github.com/mrousavy/react-native-vision-camera/blob/v4.7.3/package/ios/Core/Extensions/AVCaptureSession%2BsynchronizeBuffer.swift)
were studied for the separate microphone-session architecture; no code was
copied. CameraX's persistent API is experimental and predates
our pinned 1.5.3 dependency; inspect its contract when upgrading.

See [the public workflow](../../docs/app/movie-capture.md#switch-cameras-during-a-take)
and [the maintained Android case](../../packages/camera/tests/movie-switch.android.tsrx).
The [iOS qualification case](../../packages/camera/tests/movie-switch.ios.tsrx)
checks native connection metadata, incoming audio coverage, encoded timing,
stop/limit races, actual background/foreground recovery and the public factory.
Run it through the [device controller](../../packages/camera/tests/ios-device.mts)
on an unlocked, paired physical phone. The controller signs/builds under one
broker reservation, releases build capacity, then reserves the phone. It uses
per-run tokens and launches Settings to background the isolated probe before
foregrounding the same process. No settings are changed or images inspected.

```sh
XPLAT_IOS_DEVICE=YOUR_DEVICE_UDID XPLAT_IOS_DEVELOPMENT_TEAM=YOUR_TEAM_ID \
  bun run turbo run test:ios-device --filter=@octane-xplat/camera
```

Physical evidence covers the tested iPhone and its native connection settings;
it does not establish visual orientation/mirroring or every OS/hardware pair.
Standalone source findings, platform evidence and the private consumer migration
belong in `~/dev/reports/octane-xplat/camera-recording-switch.md`. Qualification
must distinguish encoded timing and native source events from visual results.

The native writer has a [generated-media simulator test](../../packages/camera/tests/ios-writer-simulator.mts).
It appends a test-only Swift extension to a temporary copy of the maintained
writer, feeds generated video and PCM audio, and reads compressed packet
metadata without decoding images. The inspector expands batched samples and
counts zero-sample reader markers separately from encoded media packets.
Run from the agent environment with SSH access to the remote Mac:

```sh
XPLAT_IOS_WRITER_HOST=skymac.local bun run turbo run test:ios-writer --filter=@octane-xplat/camera
```

Omit the environment variable for local execution. The runner reserves
compilation and device phases separately and removes its owned simulator.
This does not exercise real camera input replacement, microphone hardware,
preview overlays or orientation visuals; use the physical-device runner for
source and microphone qualification. The generated gap case verifies that
unexpected microphone loss preserves captured content with an explicit diagnostic.
