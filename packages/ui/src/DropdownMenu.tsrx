/** @jsxImportSource @nativescript-community/octane */
import type { RegisteredRouteContracts, AppRouteStacks, RouteTransitionName } from './props'
import type { NavigationMenuImplementation } from './nav-link'
import { MenuData } from './MenuParts'
import { MenuSurface } from './MenuSurface'
import { useRef, useState } from 'octane'
import type { DropdownMenuProps } from './props'
import { cx } from '@octane-xplat/lib'
import { Button } from './Button'
import { Icon } from './Icon'
import { Popover } from './Popover'
import { MenuSheet, useMenuSheet } from './menu-sheet'
import { useButtonGroup } from './button-group-context'

/** Self-drawn dropdown menu — a shared-`Button` trigger (`button` props,
 *  Astryx `button`) plus an anchored item list via Popover. The same
 *  anchored listbox renders on every target (decision #48): bounded,
 *  unvirtualized items. */
export function DropdownMenu<
	Contracts = RegisteredRouteContracts,
	Stacks extends string = keyof AppRouteStacks & string,
	Transitions extends string = RouteTransitionName,
>(props: DropdownMenuProps<Contracts, Stacks, Transitions>): any

export function DropdownMenu(props: NavigationMenuImplementation<DropdownMenuProps>) @{
	const anchor = useRef<any>(null)
	const group = useButtonGroup()
	const disabled = !!(props.isDisabled || group?.isDisabled)
	const [internal, setInternal] = useState(props.defaultOpen ?? false)
	const controlled = props.isOpen !== undefined
	const open = props.isOpen ?? internal
	const asSheet = useMenuSheet(props.presentation)

	const setOpen = (next: boolean) => {
		if (disabled && next) {
			return
		}

		if (!controlled) {
			setInternal(next)
		}

		props.onOpenChange?.(next)
	}

	const button = props.button ?? { label: 'Menu' }
	const buttonLabel = typeof button.label === 'string' ? button.label : undefined
	const iconOnly = button.isIconOnly === true
	const endContent =
		button.endContent ??
		(props.hasChevron !== false && !iconOnly ? (
			<Icon name="xplat-chevron-down" size={16} />
		) : undefined)

	<>
		<Button
			{...button}
			ref={(v: any) => {
				anchor.current = v
			}}
			id={props.id}
			className={cx('vx-menu-trigger', button.className)}
			isDisabled={disabled || button.isDisabled}
			endContent={endContent}
			clickAction={() => setOpen(!open)}
			accessibilityState={{ ...button.accessibilityState, expanded: open }}
			web={{ 'aria-haspopup': 'menu', 'aria-expanded': open }}
		/>
		@if (asSheet) {
			<MenuSheet
				open={open}
				onOpenChange={setOpen}
				label={props.label ?? buttonLabel}
				items={props.items}
			>
				{props.children}
			</MenuSheet>
		} @else {
			<Popover
				anchor={anchor}
				open={open}
				placement={props.placement ?? 'bottom'}
				alignment={props.alignment}
				onDismiss={() => setOpen(false)}
				className={cx('vx-menu', props.menuClassName)}
				style={
					typeof props.menuWidth === 'number' ? { minWidth: props.menuWidth } : undefined
				}
			>
				<MenuSurface
					closeMenu={() => setOpen(false)}
					label={props.label ?? buttonLabel}
					className={props.className}
					style={props.style}
				>
					<MenuData items={props.items} />
					{props.children}
				</MenuSurface>
			</Popover>
		}
	</>
}
