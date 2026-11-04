### Microphone recording needs no native rebuild on macOS

`@octane-xplat/recorder` no longer ships a Swift leaf on macOS. The AppKit backend calls `AVAudioRecorder`, `AVCaptureDevice` and `NSFileManager` directly from TypeScript through the host's Objective-C bridge, so installing or updating the package works with a JavaScript-only refresh — no plugin rebuild is needed on macOS. iOS and Android are unchanged.

The API, permission states, pause/resume, interruption handling, metering, finalization and error behavior are unchanged, and the macOS backend is now runtime-verified inside the real AppKit host.

See [`@octane-xplat/recorder`](https://octane-xplat.goddardai.org/package-recorder).
