# Same-take camera switching

Status: landed on `origin/main` (`e706d534b` shared contract plus Web/Android,
`c98f60e95` gated iOS writer, `11446423c` simulator qualification,
`25e7ce239` iOS enablement and physical qualification; `9e1751fec` added the
capture haptics policy afterward). Recorded for issue #86's design gate: the
contract and architecture below are committed code, presented for design
review. Issue closure still needs the design approval and device acceptance
noted under [remaining qualification](#remaining-qualification-and-acceptance).
Mechanics for future maintainers live in the
[implementation record](../docs/camera-recording-switch.md); the public
workflow is [Switch cameras during a take](../../docs/app/movie-capture.md#switch-cameras-during-a-take).

## Contract

`CameraSession.switchCamera` changes only the camera during `recording`. The
take keeps its original completion promise, microphone capture, elapsed-time
clock and duration limit, and produces exactly one output file. The starting
attempt configuration is immutable; `snapshot().activeCamera` updates only
after a switch is confirmed. `snapshot().switchingCamera` reports a pending
switch while the recorder state stays `recording`.

General configuration remains idle-only: `configure` rejects during an
attempt and while a switch is settling (`busy`). A dedicated operation — not
an extension of `configure` — owns in-flight source changes, because the
failure modes are disjoint: a failed switch rolls back or preserves a partial
clip, while a failed configuration must never disturb a take.

```ts
if ((await session.capabilities()).cameraSwitchDuringRecording) {
  await session.switchCamera('front') // Resolves when the front camera is producing frames.
}
```

`switchCamera` resolves when the replacement camera is delivering frames on
the existing recording path — source readiness, not acknowledgement of a
particular encoded frame. It rejects `busy` for overlapping switches,
`invalidState` outside recording, `unavailable` for a missing device, and
`unsupportedConfiguration` where the host cannot preserve the contract.
Cancellation never restarts recording; stop, duration limits, interruptions
and disposal keep their original exactly-once completion cause.

Honest capability reporting: `capabilities().cameraSwitchDuringRecording` is
true only where the backend implements the contract — Web (MediaRecorder with
canvas/manual frame submission), Android (CameraX persistent recording), and
iOS (the writer below, when linked). macOS, Windows and Linux keep separate
adapters and report false; a missing linked native writer is unsupported with
rebuild guidance, not a silent fallback to movie-file recording.

## iOS pipeline

`AVCaptureMovieFileOutput` cannot continue one file across a video-input
replacement, so iOS records through `XplatSwitchingMovieWriter`
(`packages/camera/platforms/ios/src/`): one `AVAssetWriter` fed by an
`AVCaptureVideoDataOutput` on the camera session, plus an
`AVCaptureAudioDataOutput` on an independent microphone `AVCaptureSession`.
The camera session's `usesApplicationAudioSession` stays false so input
transactions never reconfigure the microphone.

The separate microphone session is a load-bearing decision, not a preference.
Physical testing of the shared-session design showed real audio loss during
front/back swaps (391 ms maximum input gap, 2.7 s encoded over 4.9 s elapsed)
that AAC packet timestamps concealed by concatenating remaining samples.
Audio input duration and inter-buffer gaps are measured at ingress — gaps
above 5 ms finalize captured content with a `captureError` diagnostic rather
than hiding missing time — and audio sample timestamps are converted into the
video session's synchronization clock before append. All sample, writer and
switch state lives on one serial queue; capture-session transactions run on
main so input replacement cannot block audio processing.

### Frame hold

While a new lens acquires, recorded video holds the last frame: a 33 ms
timer re-appends the retained pixel buffer at the current audio-clock (or
host-clock, when silent) position, so the take's timeline stays continuous
instead of accumulating a gap. The preview holds through an in-memory
`CALayer` overlay rendered from the same last frame, matching the preview's
mirroring so the freeze is invisible; it is removed when the new source
produces frames and is never persisted for verification.

### Timestamp continuity

The writer records one `origin` at `startSession(atSourceTime:)`. Video
appends are monotonic against `lastVideo`; audio advances `lastAudio` by
actual sample duration. Elapsed time is the furthest track progress past the
origin and keeps publishing through a switch; the duration limit evaluates on
every append and hold tick, so a limit reached mid-flip still finalizes the
take with `maximumDuration`. Held-frame timestamps derive from the audio
clock when audio is requested, keeping held video aligned with real
microphone progress instead of the wall clock.

### Orientation and mirroring

Recording orientation is fixed at start (`portrait` when unspecified) and
applies per-connection: every video input exchange reapplies
`videoOrientation`, disables `automaticallyAdjustsVideoMirroring`, and keeps
recording unmirrored. The preview connection keeps its own orientation and
front-camera mirroring, which the hold overlay replicates. Output dimensions
are fixed at the first frame of the take; incoming frames are normalized into
the writer's pixel-buffer pool so a replacement camera with different native
geometry cannot change the file's track size mid-take.

### Serialized flips

One pending switch owns acquisition. The shared session rejects a second
`switchCamera` with `busy`, and `configure` reports `busy` until the switch
settles. In the writer, `switchEpoch`/`sourceEpoch` counters retire stale
callbacks from earlier generations; `unacknowledgedInput` blocks a new switch
until the shared session has committed the previous one. Source readiness is
gated on frames arriving through the expected camera's input
(`expectedCameraID`), so frames from the outgoing source cannot falsely
complete a switch.

### Provisional acquisition, rollback and cancellation

Physical acquisition precedes the shared session's lifecycle recheck. The
writer retains the previous video input and the preview hold until
`commit` — a synchronous handoff that runs only if the take is still active —
so `stop` can win after acquisition succeeds but before JavaScript resumes,
and cancellation restores the prior camera. A failed acquisition rolls back
to the previous input under a bounded timeout; if rollback itself fails or
no prior input exists, captured content is finalized as a partial clip with
a diagnostic. Rollback failure never discards verified output bytes.

Stop, limits, interruption and release cancel any in-flight or uncommitted
switch, restore the previous source for preview where possible, and let the
original completion carry the take's real end cause (`stopped`,
`maximumDuration`, `backgrounded`, `cameraUnavailable`, `captureError`).

## Qualification evidence

Native-state and encoded-timing evidence only; no pixels were inspected.

- Physical iPhone 13 Pro Max (iOS 27.0.1), 44 assertions on the landed
  writer path: front/back swaps in one take/file/completion, stop during
  acquisition and between acquisition and commit, duration limit while
  switching, prior-camera restoration, subsequent take admission, real OS
  backgrounding through Settings with `backgrounded` partial-clip retention,
  and a public `createCameraSession` take ending in a silent landscape MOV.
  Incoming audio covered the take with a 0.019 ms maximum input gap; encoded
  endpoints stayed within 30 ms with strictly increasing timestamps.
  Full evidence: `~/dev/reports/octane-xplat/camera-recording-switch.md`.
- Simulator generated-media tests (four scenarios: source gap/resume, stop,
  limit, injected microphone loss) verify encoded packet timing without real
  cameras. Maintained at `packages/camera/tests/ios-writer-simulator.mts`.
- Shared/backend tests cover invalid phases, overlap rejection, cancelled
  acquisition, provisional-commit races, immutable starting configuration
  and rollback paths (`packages/camera/tests/switch.test.ts` and adapter
  suites).

## Remaining qualification and acceptance

- The physical run predates `9e1751fec` (capture haptics policy in
  `session-backend.ios.ts`). Re-running the maintained device case on the
  paired phone is the bounded acceptance check for #86 — it is user-run
  because it needs an unlocked, paired physical device:

  ```sh
  XPLAT_IOS_DEVICE=YOUR_DEVICE_UDID XPLAT_IOS_DEVELOPMENT_TEAM=YOUR_TEAM_ID \
    bun run turbo run test:ios-device --filter=@octane-xplat/camera
  ```

- Unverified by evidence boundary, not by known defect: visual
  orientation/mirroring of recorded frames (verification is
  native-state/encoded-timing only), camera hardware failure injection,
  device/OS pairs beyond the tested iPhone 13 Pro Max, and physical browser
  lens acquisition or severe-load timing on Web.
