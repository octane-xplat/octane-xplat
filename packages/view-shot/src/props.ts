import type { Octane, ClassValue } from 'octane/jsx-runtime'
import type { CaptureOptions, ViewShotRef } from './types'

export interface CaptureLifecycleProps {
	options?: CaptureOptions
	captureMode?: 'mount' | 'update' | 'continuous'
	onCapture?(uri: string): void
	onCaptureFailure?(error: Error): void
}
export interface ViewShotProps extends CaptureLifecycleProps {
	ref?: Octane.Ref<ViewShotRef>
	children?: unknown
	id?: string
	className?: ClassValue
	style?: Record<string, unknown>
}
