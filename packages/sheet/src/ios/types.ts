/** iOS sheet rest-height spec. */
export type SwiftUISheetDetent = 'medium' | 'large' | 'fraction' | 'height'

/** iOS bottom-sheet props (SwiftUI sheet detents). */
export interface SwiftUIBottomSheetProps {
	/** Element id passed through to the host element. */
	id?: string
	/** Class list applied to the element. */
	className?: any
	/** Inline style (string CSS or object). */
	style?: any
	/** Controls sheet presentation. */
	/** Controlled presentation. */
	open?: boolean
	/** Reports the platform-side presented state (echo-suppressed). */
	/** Presentation-state change echo for controlled `open`. */
	onPresentedChange?: (presented: boolean) => void
	/** Called when the sheet dismisses. */
	/** Fires after the sheet finishes dismissing. */
	onDismissed?: () => void
	/** Measure content height and use it as the single detent (iOS 16+). */
	/** Size the sheet to content instead of detents. */
	fitToContents?: boolean
	/** Detent set — 'fraction' reads `customFraction`, 'height' reads
	 *  `customHeight` (iOS 16+). @default ['medium'] */
	/** Allowed rest heights (fractions/heights). */
	detents?: SwiftUISheetDetent[]
	/** Fraction-of-screen detent (0-1). */
	customFraction?: number
	/** Fixed-height detent in dips. */
	customHeight?: number
	/** Show the grabber. @default false (SwiftUI default is hidden). */
	/** Render the drag affordance. */
	showDragIndicator?: boolean
	/** Disable swipe-to-dismiss. */
	interactiveDismissDisabled?: boolean
	/** Render fn producing the sheet content — hosted inside the sheet
	 *  presentation through NativeScriptViewFactory. */
	/** Sheet body renderer; `any` covers any renderable. */
	content?: () => any
}
