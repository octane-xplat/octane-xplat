/** Minimal element shape used by the Web focus-restoration ref. */
export type WebFocusTarget = {
	focus(options?: { preventScroll?: boolean }): void
	/** Whether the web surface is currently mounted. */
	isConnected: boolean
	/** Closest ancestor element lookup used by the focus helpers. */
	closest(selector: string): object | null
}

/** Web bottom-sheet props — mirrors the mobile sheet vocabulary onto
 *  a composed web panel (no native sheet exists in browsers). */
export interface BottomSheetProps {
	/** Element id passed through to the host element. */
	id?: string
	/** Accessible name for the modal dialog. */
	label?: string
	/** Element that should regain focus when the sheet closes. */
	finalFocusRef?: { current: WebFocusTarget | null }
	/** Class list applied to the element. */
	className?: any
	/** Inline style (string CSS or object). */
	style?: any
	/** Controlled presentation. */
	open?: boolean
	/** Fires after the sheet finishes dismissing. */
	onDismissed?: () => void
	/** Skip the half-height detent; open straight to full height. */
	skipPartiallyExpanded?: boolean
	/** Render the drag affordance. */
	showDragHandle?: boolean
	/** Enable swipe-to-dismiss gestures. */
	sheetGesturesEnabled?: boolean
	/** Back-button dismiss (Android hardware back / Escape on web). */
	shouldDismissOnBackPress?: boolean
	/** Scrim-tap dismiss. */
	shouldDismissOnClickOutside?: boolean
	/** Sheet surface color (any platform color string). */
	containerColor?: string
	/** Content foreground color. */
	contentColor?: string
	/** Backdrop scrim color. */
	scrimColor?: string
	/** Sheet body renderer; `any` covers any renderable. */
	content?: () => any
}
