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
  /** Content uses neutral block flow; use an explicit child layout for rows or stacks. */
  children?: unknown
  id?: string
  className?: ClassValue
  /** Styles the capture frame, including an explicit display override. */
  style?: Record<string, unknown>
}
