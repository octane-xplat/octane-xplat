import type { UniversalComponent } from 'octane/universal'

export interface BottomSheetProps {
	id?: string
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

export declare const BottomSheet: UniversalComponent<BottomSheetProps>
