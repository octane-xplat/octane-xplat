/** @jsxImportSource @octane-xplat/jsx */
import type { MoreMenuPresentation } from './props'

// menu-sheet — GTK leaf. 'adaptive' resolves to popover on fine-pointer GTK
// desktops (props.ts: sheet on coarse/touch, popover on fine). Only an
// explicit 'bottom-sheet' is unqualified — it throws a clear error instead
// of silently importing a host-specific overlay that cannot render
// (BottomSheet is slice D).
const noSheet = () =>
	new Error('linux-gtk: presentation="bottom-sheet" requires slice D (BottomSheet is not qualified on GTK)')

export function useMenuSheet(presentation: MoreMenuPresentation | undefined): boolean {
	if (presentation === 'bottom-sheet') {
		throw noSheet()
	}
	return false
}

/** Menu rows presented inside a BottomSheet — unreachable on GTK; renders
 *  throw so a missed guard surfaces the same error. */
export function MenuSheet(props: {
	open: boolean
	onOpenChange: (open: boolean) => void
	label?: string
	items?: any
	children?: any
}): any {
	throw noSheet()
}
