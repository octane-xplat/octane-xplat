import type { Octane } from 'octane/jsx-runtime'
import type { CameraPreviewPoint, CameraSession } from './types'

/** Accessibility roles the preview accepts. */
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

/** Imperative handle exposed through the CameraView `ref`. */
export interface CameraViewHandle {
	/** The native preview surface (`HTMLVideoElement` on web). */
	native: any
}

/** Props for the CameraView element. */
export interface CameraViewProps {
	/** Class list applied to the preview element. */
	className?: any
	/** Inline style (string CSS or object). */
	style?: any
	/** Element id passed through to the host element. */
	id?: string
	/** Zero-based row index in the parent grid. */
	row?: number
	/** Zero-based column index. */
	col?: number
	/** Row tracks to span (>= 1). */
	rowSpan?: number
	/** Column tracks to span (>= 1). */
	colSpan?: number
	/** Edge of the parent dock layout this child pins to. */
	dock?: 'left' | 'top' | 'right' | 'bottom'
	/** Absolute x offset in dips. */
	left?: number
	/** Absolute y offset in dips. */
	top?: number
	/** Flex grow factor. */
	flexGrow?: number
	/** Flex shrink factor. */
	flexShrink?: number
	/** Cross-axis self alignment. */
	alignSelf?: string
	/** Sibling ordering. */
	order?: number
	/** Expose to assistive tech as an accessibility element. */
	accessible?: boolean
	/** Spoken name for assistive tech. */
	accessibilityLabel?: string
	/** Semantic role mapped per platform. */
	accessibilityRole?: CameraAccessibilityRole
	/** Spoken hint describing what activating does. */
	accessibilityHint?: string
	/** Spoken current value text. */
	accessibilityValue?: string
	/** State flags merged into the platform a11y state. */
	accessibilityState?: {
		disabled?: boolean
		selected?: boolean
		checked?: boolean
	}
	/** Live-region announcements: polite queues, assertive interrupts. */
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
	/** Camera/preview errors. */
	onError?: (error: { message?: string }) => void
	/** Notification-only tap event — fires with the normalized
	 *  preview-space position (`CameraPreviewPoint`) and never consumes
	 *  the gesture, so recognizers layered above the preview (double-tap,
	 *  pan) still run. Pair with `session.focusAtPoint` for tap-to-focus.
	 *  Delivered on iOS, Android, and web; desktop runtimes do not dispatch
	 *  it yet. */
	onTap?: (point: CameraPreviewPoint) => void
	/** Native preview surface for platform-specific controls. */
	ref?: Octane.Ref<CameraViewHandle>
	/** Platform-specific properties applied to the preview surface. */
	ios?: Record<string, any>
	/** Platform escape hatch — same bag contract as `ios`. */
	android?: Record<string, any>
	/** Platform escape hatch — same bag contract as `ios`. */
	web?: Record<string, any>
	/** Platform escape hatch — same bag contract as `ios`. */
	windows?: Record<string, any>
}
