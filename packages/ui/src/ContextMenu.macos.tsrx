/** @jsxImportSource @octane-xplat/jsx */
import type { RegisteredRouteContracts, AppRouteStacks, RouteTransitionName } from './props'
import type { NavigationMenuImplementation } from './nav-link'
import { mergeStyle } from './style-merge'
import { MenuData } from './MenuParts.macos.tsrx'
import { MenuSurface } from './MenuSurface.macos.tsrx'
import { useEffect, useRef, useState } from 'octane'
import type { ContextMenuProps } from './props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps } from './escape-props'
import { Pressable } from './Pressable.macos.tsrx'
import { Popover } from './Popover.macos.tsrx'

/** Self-drawn context menu — long-press opens the same anchored list as
 *  DropdownMenu, positioned over the children. There is no right-click on
 *  touch targets; long-press is the honest equivalent gesture. */
export function ContextMenu<
	Contracts = RegisteredRouteContracts,
	Stacks extends string = keyof AppRouteStacks & string,
	Transitions extends string = RouteTransitionName,
>(props: ContextMenuProps<Contracts, Stacks, Transitions>): any

export function ContextMenu(props: NavigationMenuImplementation<ContextMenuProps>) @{
	const anchor = useRef<NSView | null>(null)
	const [internal, setInternal] = useState(props.defaultOpen ?? false)
	const controlled = props.isOpen !== undefined
	const requestedOpen = props.isOpen ?? internal
	const open = requestedOpen && !props.isDisabled

	const setOpen = (next: boolean) => {
		if (props.isDisabled && next) {
			return
		}

		if (!controlled) {
			setInternal(next)
		}

		props.onOpenChange?.(next)
	}

	useEffect(() => {
		if (props.isDisabled && requestedOpen) setOpen(false)
	}, [props.isDisabled, requestedOpen])

	<masonview
		ref={(v: NSView | null) => {
			anchor.current = v
			if (v) {
				applyEscapeProps(v, props)
			}
		}}
		id={props.id}
		disabled={props.isDisabled}
		className={cx('vx-contextmenu', props.className)}
		style={mergeStyle({ display: 'flex' }, props.style)}
		onLongPress={props.isDisabled ? undefined : () => setOpen(true)}
	>
		{props.children}
		{props.trigger && (
			<Pressable
				accessibilityLabel={props.accessibilityLabel ?? 'Open actions'}
				disabled={props.isDisabled}
				onPress={() => setOpen(!open)}
			>
				{props.trigger}
			</Pressable>
		)}
		<Popover
			anchor={anchor}
			open={open}
			placement={props.placement ?? 'bottom'}
			alignment={props.alignment}
			onDismiss={() => setOpen(false)}
			className={cx('vx-menu', props.menuClassName)}
		>
			<MenuSurface closeMenu={() => setOpen(false)} label={props.accessibilityLabel}>
				<MenuData items={props.items} />
				{props.menu}
			</MenuSurface>
		</Popover>
	</masonview>
}
