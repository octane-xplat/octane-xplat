export interface AppKitSheetProps {
	id?: string
	className?: any
	style?: any
	open?: boolean
	onDismissed?: () => void
	content?: () => any
}

export declare function AppKitSheet(props: AppKitSheetProps): unknown
