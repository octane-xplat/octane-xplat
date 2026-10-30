/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import type { MoreMenuProps, MoreMenuPlacement } from './props'
import { DropdownMenu } from './DropdownMenu'
import { Icon } from './Icon'
import { cx } from '@octane-xplat/lib'

function popoverPlacement(placement?: MoreMenuPlacement): any {
	if (placement === 'above') {
		return 'top'
	}

	if (placement === 'below' || placement == null) {
		return 'bottom'
	}

	if (placement === 'start') {
		return 'left'
	}

	if (placement === 'end') {
		return 'right'
	}

	return placement
}

// MoreMenu — GTK leaf. Identical to the shared leaf minus the BottomSheet
// branch: 'adaptive' resolves to popover on fine-pointer GTK desktops, and an
// explicit 'bottom-sheet' throws a clear error (slice D, unqualified).
export function MoreMenu(props: MoreMenuProps) @{
	const [localOpen, setLocalOpen] = useState(false)
	const open = props.isMenuOpen ?? localOpen
	const presentation = props.presentation ?? 'popover'
	const setOpen = (next: boolean) => {
		if (props.isMenuOpen === undefined) {
			setLocalOpen(next)
		}

		props.onOpenChange?.(next)
	}

	if (presentation === 'bottom-sheet') {
		throw new Error('linux-gtk: presentation="bottom-sheet" requires slice D (BottomSheet is not qualified on GTK)')
	}

	const icon =
		typeof props.icon === 'string' ? (
			<Icon name={props.icon} />
		) : (
			(props.icon ?? <Icon name="xplat-more-horizontal" />)
		)

	const label = props.label ?? 'More options'
	const button = {
		label,
		icon,
		variant: props.variant ?? 'ghost',
		size: props.size,
		isDisabled: props.isDisabled,
		tooltip: label,
		isIconOnly: true,
		className: 'vx-more-menu-trigger',
	} as const

	<DropdownMenu
		id={props.id}
		className={props.className}
		style={props.style}
		items={props.items}
		isDisabled={props.isDisabled}
		isOpen={open}
		onOpenChange={setOpen}
		placement={popoverPlacement(props.placement)}
		alignment={props.alignment}
		label={label}
		hasChevron={false}
		button={button}
	/>
}
