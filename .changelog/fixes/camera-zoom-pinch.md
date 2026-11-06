`CameraSession` gains `zoomState()` and `setZoom(ratio)` — live
`{ zoom, minZoom, maxZoom }` reads and clamped writes on the bound camera,
including mid-recording, plus a `capabilities().zoom` flag. iOS uses
`AVCaptureDevice.videoZoomFactor`, Android CameraX `ZoomState`/`setZoomRatio`,
and web the `MediaStreamTrack` `zoom` constraint where exposed; other hosts
report no zoom control. Shared `View`/`Row`/`Stack`/`StackItem`/`Pressable`
gain `onPinch`, a normalized cumulative-scale pinch event on native targets.
