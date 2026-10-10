# Record and reopen a camera movie

ID: camera-movie
Targets: web, ios, android, macos, linux
Related APIs: createCameraSession, CameraView.session, CameraSession.startRecording, MovieTake.stop, CameraSession.openOutput

## Starting point

An app with the camera leaf installed and a bounded preview screen. The app
owns recording controls, saved output references, playback, and deletion.

## Requirements

Windows is also part of the movie-capture delivery plan. The recipe validator
currently cannot represent it in Targets; its WinUI adapter is implemented and
its real-host qualification remains open alongside the desktop gaps below.

- Use one camera owner for preview and capture, with explicit permission actions.
- Wait for finalized, verified, locally committed output before review.
- Handle audio refusal, duration limits, source loss, and teardown honestly.
- Reopen an output reference after disposing the camera and restarting the app.
- Qualify each supported target and report actual codec, orientation, and retention.

## Acceptance criteria

- AC1: The reader can activate a shared preview and enable Record only after camera, requested audio, storage, and source availability checks.
- AC2: The reader can record, stop repeatedly, handle early stop and lifecycle loss, and distinguish usable partial clips from failures.
- AC3: The reader can persist an output reference and reopen media after disposal and app restart or page reload, without treating a temporary URL as durable output.
- AC4: The reader can discover actual profiles and output format, avoid unsupported orientation/destination requests, and understand duration-limit and retention precision on every target.

## Documentation

- AC1: [Permission and preview setup](../docs/app/movie-capture.md#ask-for-access-from-a-button). Gap: Linux permission and persistence setup remains unfinished; Windows prompts await a real host.
- AC2: [Recording and completion](../docs/app/movie-capture.md#record-then-wait-for-the-finished-movie). Gap: macOS capture, interruption, and lifecycle proof require a camera-equipped host; Windows runtime conformance awaits a real host; Linux remains unfinished.
- AC3: [Reopening saved output](../docs/app/movie-capture.md#reopen-for-playback). Gap: Native player playback after restart and browser persistence approval remain unqualified on every desktop; macOS and Windows reopen-after-restart proofs require hardware hosts.
- AC4: [Camera selection and orientation](../docs/app/movie-capture.md#camera-selection-and-orientation). Gap: Fixed Android/Web orientation, physical-device rotation, MP4-only browser hosts, macOS 13 orientation, Windows real-host capabilities, and Linux support remain unqualified.
