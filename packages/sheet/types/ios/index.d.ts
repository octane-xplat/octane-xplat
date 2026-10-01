export type SwiftUISheetDetent = 'medium' | 'large' | 'fraction' | 'height'

export interface SwiftUIBottomSheetProps {
	id?: string
	className?: any
	style?: any
	open?: boolean
	onPresentedChange?: (presented: boolean) => void
	onDismissed?: () => void
	fitToContents?: boolean
	detents?: SwiftUISheetDetent[]
	customFraction?: number
	customHeight?: number
	showDragIndicator?: boolean
	interactiveDismissDisabled?: boolean
	content?: () => any
}

export declare function SwiftUIBottomSheet(props: SwiftUIBottomSheetProps): unknown
