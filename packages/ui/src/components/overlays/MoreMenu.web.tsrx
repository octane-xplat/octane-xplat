/** @jsxImportSource @octane-xplat/jsx/dom */
import { useEffect, useState } from 'octane'
import type { MoreMenuProps, MoreMenuPlacement } from '../../props'
import { DropdownMenu } from './DropdownMenu.web.tsrx'
import { Button } from '../actions/Button.web.tsrx'
import { Pressable } from '../actions/Pressable.web.tsrx'
import { BottomSheet } from './BottomSheet.web.tsrx'
import { Icon } from '../media/Icon.web.tsrx'

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

export function MoreMenu(props: MoreMenuProps) @{
	const [localOpen, setLocalOpen] = useState(false)
	const MenuItemView: any = Pressable
	const [adaptiveSheet, setAdaptiveSheet] = useState(false)
	useEffect(() => {
		if (props.presentation !== 'adaptive') {
			setAdaptiveSheet(false)
			return
		}

		const query = window.matchMedia('(max-width: 768px) and (pointer: coarse)')
		const update = () => setAdaptiveSheet(query.matches)
		update()
		query.addEventListener?.('change', update)
		return () => query.removeEventListener?.('change', update)
	}, [props.presentation])

	const open = props.isMenuOpen ?? localOpen
	const presentation = props.presentation ?? 'popover'
	const useSheet = presentation === 'bottom-sheet' || (presentation === 'adaptive' && adaptiveSheet)
	const setOpen = (next: boolean) => {
		if (props.isMenuOpen === undefined) {
			setLocalOpen(next)
		}

		props.onOpenChange?.(next)
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

	@if (useSheet) {
		<>
			<Button {...button} id={props.id} style={props.style} clickAction={() => setOpen(!open)} />
			<BottomSheet
				isOpen={open}
				onOpenChange={setOpen}
				label={props.label ?? 'More options'}
				snapPoints={[0.5, 1]}
				className="vx-more-menu-sheet"
			>
				<div className="vx-more-menu-sheet-list">
					{props.items.map((item) => (
						<MenuItemView
							key={item.key}
							className={['vx-menu-item', item.isDisabled ? 'vx-menu-item--disabled' : undefined]}
							disabled={item.isDisabled}
							onPress={() => {
								if (item.isDisabled) {
									return
								}

								setOpen(false)
								item.onSelect?.()
							}}
						>
							{item.icon ? <Icon name={item.icon} /> : null}
							{item.label}
						</MenuItemView>
					))}
				</div>
			</BottomSheet>
		</>
	} @else {
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
}
