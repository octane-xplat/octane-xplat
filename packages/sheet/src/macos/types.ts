/** macOS sheet props (window-attached sheet). */
export interface AppKitSheetProps {
	/** Element id passed through to the host element. */
	id?: string
	/** Classes for the sheet content host. */
	className?: any
	/** Styles for the sheet content host. */
	style?: any
	/** Controls sheet presentation. */
	/** Controlled presentation. */
	open?: boolean
	/** Called once when a presented/queued sheet ends, including `open`→false.
	 * Unmounting or replacing the anchor/id cleans up without notifying. */
	/** Fires after the sheet finishes dismissing. */
	onDismissed?: () => void
	/** Content portals from the declaring tree, retaining its providers. */
	/** Sheet body renderer; `any` covers any renderable. */
	content?: () => any
}
