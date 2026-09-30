/** @jsxImportSource @xplat/macos/renderer */
import type { CameraViewProps, WebViewProps } from './props'

export function WebView(_props: WebViewProps) @{
	<label className="vx-unsupported">WebView is unsupported by the AppKit host</label>
}

export function CameraView(_props: CameraViewProps) @{
	<label className="vx-unsupported">Camera capture is unsupported by the AppKit host</label>
}
