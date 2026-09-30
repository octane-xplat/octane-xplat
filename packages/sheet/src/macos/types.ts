export interface AppKitSheetProps {
	id?: string
	className?: any
	style?: any
	/** Controls sheet presentation. */
	open?: boolean
	/** Called when the sheet window closes (close button or `open`→false). */
	onDismissed?: () => void
	/** Render fn producing the sheet content — hosted in the sheet's own
	 *  octane root inside the presented window. */
	content?: () => any
}
