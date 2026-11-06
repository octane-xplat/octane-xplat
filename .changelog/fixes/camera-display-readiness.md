`CameraView` gains `onDisplayReady`, a displayed-preview readiness signal
separate from `onReady`'s recording-admission readiness. iOS 13+ observes
`AVCaptureVideoPreviewLayer.previewing` in non-empty bounds, Android reports
the PreviewView `STREAMING` state, and web fires on the first presented video
frame; macOS, Windows, and Linux expose no distinct display signal and never
fire it. Apps that record automatically should wait for `onDisplayReady`.
