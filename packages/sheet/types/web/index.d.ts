/** Minimal element shape used by the Web focus-restoration ref. */
type WebFocusTarget = {
	focus(options?: { preventScroll?: boolean }): void
	isConnected: boolean
	closest(selector: string): object | null
}

export interface BottomSheetProps {
	id?: string
	/** Accessible name for the modal dialog. */
	label?: string
	/** Element that should regain focus when the sheet closes. */
	finalFocusRef?: { current: WebFocusTarget | null }
	className?: any
	style?: any
	open?: boolean
	onDismissed?: () => void
	skipPartiallyExpanded?: boolean
	showDragHandle?: boolean
	sheetGesturesEnabled?: boolean
	shouldDismissOnBackPress?: boolean
	shouldDismissOnClickOutside?: boolean
	containerColor?: string
	contentColor?: string
	scrimColor?: string
	content?: () => any
}

export declare function BottomSheet(props: BottomSheetProps): unknown
