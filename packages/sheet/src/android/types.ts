export interface MaterialBottomSheetProps {
	id?: string
	className?: any
	style?: any
	/** Controls sheet visibility. */
	open?: boolean
	/** Called when the sheet asks to close (swipe, scrim, back). */
	onDismissed?: () => void
	/** Skip the half-expanded detent; only fully expanded/hidden remain. */
	skipPartiallyExpanded?: boolean
	/** Show the drag handle affordance. @default true */
	showDragHandle?: boolean
	/** Allow swipe gestures on the sheet surface. @default true
	 *  Not supported by the material3 version the app resolves — prop is
	 *  accepted but ignored. */
	sheetGesturesEnabled?: boolean
	/** @default true */
	shouldDismissOnBackPress?: boolean
	/** @default true — accepted but ignored on the resolved material3. */
	shouldDismissOnClickOutside?: boolean
	containerColor?: string
	contentColor?: string
	scrimColor?: string
	/** Render fn producing the sheet content — hosted inside the sheet's
	 *  dialog window through AndroidView. */
	content?: () => any
}
