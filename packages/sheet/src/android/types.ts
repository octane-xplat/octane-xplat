/** Android bottom-sheet props (Material3 modal bottom sheet). */
export interface MaterialBottomSheetProps {
	/** Element id passed through to the host element. */
	id?: string
	/** Class list applied to the element. */
	className?: any
	/** Inline style (string CSS or object). */
	style?: any
	/** Controls sheet visibility. */
	/** Controlled presentation. */
	open?: boolean
	/** Called when the sheet asks to close (swipe, scrim, back). */
	/** Fires after the sheet finishes dismissing. */
	onDismissed?: () => void
	/** Skip the half-expanded detent; only fully expanded/hidden remain. */
	/** Skip the half-expanded state; expand straight to full. */
	skipPartiallyExpanded?: boolean
	/** Show the drag handle affordance. @default true */
	/** Render the drag affordance. */
	showDragHandle?: boolean
	/** Allow swipe gestures on the sheet surface. @default true
	 *  Not supported by the material3 version the app resolves — prop is
	 *  accepted but ignored. */
	sheetGesturesEnabled?: boolean
	/** @default true */
	/** Android back-button dismiss. */
	shouldDismissOnBackPress?: boolean
	/** @default true — accepted but ignored on the resolved material3. */
	/** Scrim-tap dismiss. */
	shouldDismissOnClickOutside?: boolean
	/** Sheet surface color. */
	containerColor?: string
	/** Content foreground color. */
	contentColor?: string
	/** Backdrop scrim color. */
	scrimColor?: string
	/** Render fn producing sheet content — portaled from the declaring Octane
	 *  tree through AndroidView into the sheet dialog. */
	/** Sheet body renderer; `any` covers any renderable. */
	content?: () => any
}
