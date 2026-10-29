export interface AppKitSheetProps {
	id?: string
	/** Classes for the sheet content host. */
	className?: any
	/** Styles for the sheet content host. */
	style?: any
	/** Controls sheet presentation. */
	open?: boolean
	/** Called once when a presented/queued sheet ends, including `open`→false.
	 * Unmounting or replacing the anchor/id cleans up without notifying. */
	onDismissed?: () => void
	/** Content portals from the declaring tree, retaining its providers. */
	content?: () => any
}
