import type { Octane } from 'octane/jsx-runtime'
import type { CameraSession } from './types'

export type CameraAccessibilityRole =
	| 'button'
	| 'link'
	| 'search'
	| 'image'
	| 'heading'
	| 'adjustable'
	| 'summary'
	| 'text'
	| 'none'
	| 'progressbar'
	| 'checkbox'
	| 'switch'
	| 'radio'
	| 'spinbutton'
	| 'tab'

export interface CameraViewHandle {
	/** The native preview surface (`HTMLVideoElement` on web). */
	native: any
}

export interface CameraViewProps {
	className?: any
	style?: any
	id?: string
	row?: number
	col?: number
	rowSpan?: number
	colSpan?: number
	dock?: 'left' | 'top' | 'right' | 'bottom'
	left?: number
	top?: number
	flexGrow?: number
	flexShrink?: number
	alignSelf?: string
	order?: number
	accessible?: boolean
	accessibilityLabel?: string
	accessibilityRole?: CameraAccessibilityRole
	accessibilityHint?: string
	accessibilityValue?: string
	accessibilityState?: {
		disabled?: boolean
		selected?: boolean
		checked?: boolean
	}
	accessibilityLiveRegion?: 'none' | 'polite' | 'assertive'
	/** Shared camera owner enabling movie recording. When set, the preview
	 *  attaches to the session's acquisition instead of owning one, and
	 *  `facing` must be omitted — camera selection lives on the session. */
	session?: CameraSession
	/** Lens — defaults to the rear camera. Invalid together with `session`. */
	facing?: 'front' | 'back'
	/** Default true. False releases the preview session. */
	active?: boolean
	/** Fires after the preview surface starts. */
	onReady?: () => void
	onError?: (error: { message?: string }) => void
	/** Native preview surface for platform-specific controls. */
	ref?: Octane.Ref<CameraViewHandle>
	/** Platform-specific properties applied to the preview surface. */
	ios?: Record<string, any>
	android?: Record<string, any>
	web?: Record<string, any>
}
