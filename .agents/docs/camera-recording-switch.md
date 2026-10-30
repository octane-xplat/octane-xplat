# Camera changes during a movie take

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
- iOS still uses AVCaptureMovieFileOutput and reports live switching unavailable
  ([#86](https://github.com/octane-xplat/octane-xplat/issues/86)). A guard removal
  or input-swap transaction is not a continuation implementation. A candidate
  sample-output/AVAssetWriter replacement needs timeline, writer, orientation,
  recovery and physical-device qualification before being enabled.
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

Expo's official camera documentation says flipping ends recording. Its
`expo-camera@58.0.14` source at `075c93fe58bb4f76316183ac7fdb005403475970`
uses movie-file output input replacement on iOS and nonpersistent CameraX
recording on Android; its recording callbacks settle the original promise.
No Expo code is copied. CameraX's persistent API is experimental and predates
our pinned 1.5.3 dependency; inspect its contract when upgrading.

See [the public workflow](../../docs/app/movie-capture.md#switch-cameras-during-a-take)
and [the maintained Android case](../../packages/camera/tests/movie-switch.android.tsrx).
Standalone source findings, platform evidence and the private consumer migration
belong in `~/dev/reports/octane-xplat/camera-recording-switch.md`. Qualification
must distinguish encoded timing and native source events from visual results.
