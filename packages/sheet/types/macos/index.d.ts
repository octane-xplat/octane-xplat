import type { UniversalComponent } from 'octane/universal'

export interface AppKitSheetProps {
	id?: string
	className?: any
	style?: any
	open?: boolean
	onDismissed?: () => void
	content?: () => any
}

export declare const AppKitSheet: UniversalComponent<AppKitSheetProps>
