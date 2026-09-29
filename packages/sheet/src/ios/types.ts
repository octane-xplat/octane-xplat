export type SwiftUISheetDetent = 'medium' | 'large' | 'fraction' | 'height'

export interface SwiftUIBottomSheetProps {
	id?: string
	className?: any
	style?: any
	/** Controls sheet presentation. */
	open?: boolean
	/** Reports the platform-side presented state (echo-suppressed). */
	onPresentedChange?: (presented: boolean) => void
	/** Called when the sheet dismisses. */
	onDismissed?: () => void
	/** Measure content height and use it as the single detent (iOS 16+). */
	fitToContents?: boolean
	/** Detent set — 'fraction' reads `customFraction`, 'height' reads
	 *  `customHeight` (iOS 16+). @default ['medium'] */
	detents?: SwiftUISheetDetent[]
	customFraction?: number
	customHeight?: number
	/** Show the grabber. @default false (SwiftUI default is hidden). */
	showDragIndicator?: boolean
	interactiveDismissDisabled?: boolean
	/** Render fn producing the sheet content — hosted inside the sheet
	 *  presentation through NativeScriptViewFactory. */
	content?: () => any
}
