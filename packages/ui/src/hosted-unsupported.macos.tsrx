/** @jsxImportSource @xplat/macos/renderer */
import type { CameraViewProps, VideoProps, WebViewProps } from './props'

export function WebView(_props: WebViewProps) @{
	<label className="vx-unsupported">WebView is unsupported by the AppKit host</label>
}
export function Video(_props: VideoProps) @{
	<label className="vx-unsupported">Video playback is unsupported by the AppKit host</label>
}
export function CameraView(_props: CameraViewProps) @{
	<label className="vx-unsupported">Camera capture is unsupported by the AppKit host</label>
}
