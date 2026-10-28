/** @jsxImportSource @octane-xplat/jsx */
import type { RegisteredRouteContracts, AppRouteStacks, RouteTransitionName } from './props'
import type { NavigationMenuImplementation } from './nav-link'
import { MenuData } from './MenuParts.macos.tsrx'
import { MenuSurface } from './MenuSurface.macos.tsrx'
import { useEffect, useMemo, useRef, useState } from 'octane'
import type { DropdownMenuProps } from './props'
import { cx } from '@octane-xplat/lib'
import { Button } from './controls.macos.tsrx'
import { Icon } from './Icon.macos.tsrx'
import { Popover } from './Popover.macos.tsrx'
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
	const anchor = useRef<NSView | null>(null)
	const group = useButtonGroup()
	const button = props.button ?? { label: 'Menu' }
	const disabled = !!(props.isDisabled || group?.isDisabled || button.isDisabled)
	const mergedRef = useMemo(() => button.ref ? [anchor, button.ref] : anchor, [button.ref])
	const [internal, setInternal] = useState(props.defaultOpen ?? false)
	const controlled = props.isOpen !== undefined
	const requestedOpen = props.isOpen ?? internal
	const open = requestedOpen && !disabled

	const setOpen = (next: boolean) => {
		if (disabled && next) {
			return
		}

		if (!controlled) {
			setInternal(next)
		}

		props.onOpenChange?.(next)
	}

	useEffect(() => {
		if (disabled && requestedOpen) setOpen(false)
	}, [disabled, requestedOpen])

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
			ref={mergedRef}
			id={props.id ?? button.id}
			className={cx('vx-menu-trigger', button.className)}
			isDisabled={disabled}
			endContent={endContent}
			clickAction={() => setOpen(!open)}
			accessibilityState={{ ...button.accessibilityState, expanded: open }}
		/>
		<Popover
			anchor={anchor}
			open={open}
			placement={props.placement ?? 'bottom'}
			alignment={props.alignment}
			onDismiss={() => setOpen(false)}
			className={cx('vx-menu', props.menuClassName)}
			style={typeof props.menuWidth === 'number' ? { minWidth: props.menuWidth } : undefined}
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
	</>
}
