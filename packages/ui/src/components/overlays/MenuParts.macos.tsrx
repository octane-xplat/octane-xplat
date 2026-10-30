/** @jsxImportSource @octane-xplat/jsx */
import type { NSView } from '@octane-xplat/platform/macos'
import type { RegisteredRouteContracts, AppRouteStacks, RouteTransitionName } from '../../props'
import type {
	NavigationItemImplementation,
	NavigationMenuImplementation,
	MenuOptionImplementation,
} from '../navigation/nav-link'

import { useNavigationItem } from '../navigation/use-navigation-item.shared.tsrx'
import { followHref } from '../navigation/nav-href.macos'
import { useAppKitMenuRow } from './use-menu-row.macos.tsrx'
import {
	AppKitMenuReturnContext,
	AppKitMenuReturnProvider,
	createAppKitMenuReturn,
} from './menu-return.macos'

import { useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'octane'
import type {
	MenuItemProps,
	MenuLinkProps,
	MenuSectionProps,
	MenuCheckboxItemProps,
	MenuRadioItemProps,
	MenuRadioGroupProps,
	MenuSeparatorProps,
	MenuSubMenuProps,
	MenuSurfaceProps,
} from '../../props'

import { MenuRadioContext, MenuRadioProvider, useDropdownMenuContext } from './menu-context'
import { View } from '../layout/View.macos.tsrx'
import { Text } from '../content/Text.macos.tsrx'
import { Pressable } from '../actions/Pressable.macos.tsrx'
import { Icon } from '../media/Icon.macos.tsrx'
import { Separator } from '../feedback/Separator.macos.tsrx'
import { Popover } from './Popover.macos.tsrx'
import { MenuSurface } from './MenuSurface.macos.tsrx'

export function DropdownMenuItem(props: MenuItemProps) @{
	const menu = useDropdownMenuContext()
	if (!menu) {
		throw new Error(
			'DropdownMenuItem requires a menu — render it inside DropdownMenu or ContextMenu',
		)
	}

	const select = () => {
		if (props.isDisabled) {
			return
		}

		props.onSelect?.()
		if (props.hasCloseOnSelect !== false) {
			menu.closeMenu()
		}
	}

	const row = useAppKitMenuRow({
		label: typeof props.label === 'string' ? props.label : '',
		disabled: Boolean(props.isDisabled),
		press: select,
	})

	<Pressable
		ref={props.ref ? [props.ref, row.ref] : row.ref}
		id={props.id}
		className={[
			'vx-menu-item',
			props.variant === 'destructive' && 'vx-menu-item--destructive',
			props.isDisabled && 'vx-menu-item--disabled',
			props.className,
		]}
		style={props.style}
		accessibilityRole="menuitem"
		disabled={props.isDisabled}
		accessibilityLabel={typeof props.label === 'string' ? props.label : undefined}
		accessibilityState={{ disabled: props.isDisabled }}
		onPress={row.press}
	>
		{props.icon && <Icon name={props.icon} />}
		<Text className="vx-menu-item-label">{props.label}</Text>
		{props.description && <Text>{props.description}</Text>}
		{props.endContent}
	</Pressable>
}

export function DropdownMenuCheckboxItem(props: MenuCheckboxItemProps) @{
	const menu = useDropdownMenuContext()
	if (!menu) {
		throw new Error(
			'DropdownMenuCheckboxItem requires a menu — render it inside DropdownMenu or ContextMenu',
		)
	}

	const select = () => {
		if (props.isDisabled) {
			return
		}

		props.onValueChange?.(!props.value)
		props.onSelect?.()
		if (props.hasCloseOnSelect) {
			menu.closeMenu()
		}
	}

	const row = useAppKitMenuRow({
		label: typeof props.label === 'string' ? props.label : '',
		disabled: Boolean(props.isDisabled),
		press: select,
	})

	<Pressable
		ref={props.ref ? [props.ref, row.ref] : row.ref}
		id={props.id}
		className={[
			'vx-menu-item',
			props.variant === 'destructive' && 'vx-menu-item--destructive',
			props.isDisabled && 'vx-menu-item--disabled',
			props.className,
		]}
		style={props.style}
		accessibilityRole="menuitemcheckbox"
		disabled={props.isDisabled}
		accessibilityLabel={typeof props.label === 'string' ? props.label : undefined}
		accessibilityState={{ disabled: props.isDisabled, checked: props.value }}
		onPress={row.press}
	>
		<Text accessible={false}>{props.value ? '✓' : '○'}</Text>
		{props.icon && <Icon name={props.icon} />}
		<Text className="vx-menu-item-label">{props.label}</Text>
		{props.description && <Text>{props.description}</Text>}
		{props.endContent}
	</Pressable>
}

export function DropdownMenuRadioGroup(props: MenuRadioGroupProps) @{
	const [internal, setInternal] = useState(props.defaultValue)
	const context: MenuRadioGroupProps = {
		get value() {
			return props.value !== undefined ? props.value : internal
		},
		get isDisabled() {
			return props.isDisabled
		},
		get hasCloseOnSelect() {
			return props.hasCloseOnSelect
		},
		get label() {
			return props.label
		},
		onValueChange: (value) => {
			if (props.isDisabled) {
				return
			}

			if (props.value === undefined) {
				setInternal(value)
			}

			props.onValueChange?.(value)
		},
	}

	<View accessibilityRole="group" accessibilityLabel={props.label}>
		<MenuRadioProvider value={context}>{props.children}</MenuRadioProvider>
	</View>
}

export function DropdownMenuRadioItem(props: MenuRadioItemProps) @{
	const group = useContext(MenuRadioContext)
	const menu = useDropdownMenuContext()
	if (!group) {
		throw new Error('MenuRadioItem requires a MenuRadioGroup')
	}

	if (!menu) {
		throw new Error(
			'DropdownMenuRadioItem requires a menu — render it inside DropdownMenu or ContextMenu',
		)
	}

	const select = () => {
		if (props.isDisabled || group.isDisabled) {
			return
		}

		if (group.value !== props.value) {
			group.onValueChange?.(props.value)
		}

		props.onSelect?.()
		if ((props.hasCloseOnSelect ?? group.hasCloseOnSelect) !== false) {
			menu.closeMenu()
		}
	}

	const row = useAppKitMenuRow({
		label: typeof props.label === 'string' ? props.label : '',
		disabled: Boolean(props.isDisabled || group.isDisabled),
		press: select,
	})

	<Pressable
		ref={props.ref ? [props.ref, row.ref] : row.ref}
		id={props.id}
		className={[
			'vx-menu-item',
			props.variant === 'destructive' && 'vx-menu-item--destructive',
			(props.isDisabled || group.isDisabled) && 'vx-menu-item--disabled',
			props.className,
		]}
		style={props.style}
		accessibilityRole="menuitemradio"
		disabled={props.isDisabled || group.isDisabled}
		accessibilityLabel={typeof props.label === 'string' ? props.label : undefined}
		accessibilityState={{
			disabled: props.isDisabled || group.isDisabled,
			checked: group.value === props.value,
		}}
		onPress={row.press}
	>
		<Text accessible={false}>{group.value === props.value ? '●' : '○'}</Text>
		{props.icon && <Icon name={props.icon} />}
		<Text className="vx-menu-item-label">{props.label}</Text>
		{props.description && <Text>{props.description}</Text>}
		{props.endContent}
	</Pressable>
}

export function DropdownMenuSeparator(props: MenuSeparatorProps) @{
	<Separator {...props} />
}

/** @deprecated Use `DropdownMenuSeparator`. */
export function DropdownMenuDivider(props: MenuSeparatorProps) @{
	<DropdownMenuSeparator {...props} />
}

export function DropdownMenuSection(props: MenuSectionProps) @{
	<View id={props.id} accessibilityRole="group" accessibilityLabel={props.label}>
		{props.children}
	</View>
}

export function DropdownMenuLink<
	Contracts = RegisteredRouteContracts,
	Stacks extends string = keyof AppRouteStacks & string,
	Transitions extends string = RouteTransitionName,
>(props: MenuLinkProps<Contracts, Stacks, Transitions>): any

export function DropdownMenuLink(props: NavigationItemImplementation<MenuLinkProps>) @{
	const menu = useDropdownMenuContext()
	if (!menu) {
		throw new Error(
			'DropdownMenuLink requires a menu — render it inside DropdownMenu or ContextMenu',
		)
	}

	const link = useNavigationItem({ ...props, onPress: props.onSelect }, 'link')

	const row = useAppKitMenuRow({
		label: typeof props.label === 'string' ? props.label : '',
		disabled: link.disabled,
		press: () => {
			if (link.activateNative(followHref) && props.hasCloseOnSelect !== false) {
				menu.closeMenu()
			}
		},
	})

	<Pressable
		ref={props.ref ? [props.ref, row.ref] : row.ref}
		id={props.id}
		accessibilityRole="menuitem"
		disabled={link.disabled}
		accessibilityLabel={typeof props.label === 'string' ? props.label : undefined}
		accessibilityState={{ disabled: link.disabled, selected: link.selected }}
		onPress={row.press}
		className={[
			'vx-menu-item',
			props.variant === 'destructive' && 'vx-menu-item--destructive',
			link.disabled && 'vx-menu-item--disabled',
			props.className,
		]}
		style={props.style}
	>
		{props.icon && <Icon name={props.icon} />}
		<Text className="vx-menu-item-label">{props.label}</Text>
		{props.description && <Text>{props.description}</Text>}
		{props.endContent}
	</Pressable>
}

export function DropdownMenuSubMenu<
	Contracts = RegisteredRouteContracts,
	Stacks extends string = keyof AppRouteStacks & string,
	Transitions extends string = RouteTransitionName,
>(props: MenuSubMenuProps<Contracts, Stacks, Transitions>): any

export function DropdownMenuSubMenu(
	props: NavigationMenuImplementation<MenuSubMenuProps>,
) @{
	const parentReturn = useContext(AppKitMenuReturnContext)
	const parent = useDropdownMenuContext()
	if (!parent) {
		throw new Error(
			'DropdownMenuSubMenu requires a menu — render it inside DropdownMenu or ContextMenu',
		)
	}

	const anchor = useRef<NSView | null>(null)
	const [internal, setInternal] = useState(props.defaultOpen ?? false)
	const requestedOpen = props.isOpen ?? internal
	const open = requestedOpen && !props.isDisabled
	const setOpen = (next: boolean) => {
		if (next && props.isDisabled) {
			return
		}

		if (props.isOpen === undefined) {
			setInternal(next)
		}

		props.onOpenChange?.(next)
	}

	useEffect(() => {
		if (props.isDisabled && requestedOpen) {
			setOpen(false)
		}
	}, [props.isDisabled, requestedOpen])

	const liveReturn = useRef({ open, parent: parentReturn, close: () => setOpen(false) })
	liveReturn.current = { open, parent: parentReturn, close: () => setOpen(false) }
	const returnOwner = useMemo(
		() =>
			createAppKitMenuReturn({
				anchor: () => anchor.current,
				open: () => liveReturn.current.open,
				parent: () => liveReturn.current.parent,
				close: () => liveReturn.current.close(),
			}),
		[],
	)

	const finalFocus = useMemo(
		() => ({
			get current() {
				return returnOwner.focusTarget()
			},
		}),
		[],
	)

	useLayoutEffect(() => {
		if (open) {
			returnOwner.reset()
		}
	}, [open])

	const closeLevel = () => {
		returnOwner.reset()
		setOpen(false)
	}

	const row = useAppKitMenuRow({
		label: typeof props.label === 'string' ? props.label : '',
		disabled: Boolean(props.isDisabled),
		press: () => {
			returnOwner.reset()
			setOpen(!open)
		},
		openSubmenu: () => {
			returnOwner.reset()
			setOpen(true)
		},
	})

	const mergedRef = useMemo(
		() => (props.ref ? [anchor, props.ref, row.ref] : [anchor, row.ref]),
		[props.ref, row.ref],
	)

	<>
		<Pressable
			ref={mergedRef}
			id={props.id}
			className={[
				'vx-menu-item',
				props.variant === 'destructive' && 'vx-menu-item--destructive',
				props.isDisabled && 'vx-menu-item--disabled',
				props.className,
			]}
			style={props.style}
			accessibilityRole="menuitem"
			disabled={props.isDisabled}
			accessibilityLabel={typeof props.label === 'string' ? props.label : undefined}
			accessibilityHint="Opens submenu"
			accessibilityState={{ disabled: props.isDisabled, expanded: open }}
			onPress={row.press}
		>
			{props.icon && <Icon name={props.icon} />}
			<Text>{props.label}</Text>
			<Text accessible={false}>›</Text>
		</Pressable>
		<Popover
			anchor={anchor}
			finalFocusRef={finalFocus}
			open={open}
			placement="right"
			alignment="start"
			onDismiss={closeLevel}
			className="vx-menu"
		>
			<AppKitMenuReturnProvider value={parentReturn ? returnOwner : null}>
				<MenuSurface
					closeMenu={() => {
						setOpen(false)
						parent.closeMenu()
					}}
					closeLevel={closeLevel}
					initialFocus="first"
					label={typeof props.label === 'string' ? props.label : undefined}
				>
					<MenuData items={props.items} />
					{props.children}
				</MenuSurface>
			</AppKitMenuReturnProvider>
		</Popover>
	</>
}

// Data already passed the public discriminated contract. These private views
// carry its erased navigation fields without inventing an application contract.
const MenuLinkView = DropdownMenuLink as (props: NavigationItemImplementation<MenuLinkProps>) => any
const MenuSubMenuView = DropdownMenuSubMenu as (
	props: NavigationMenuImplementation<MenuSubMenuProps>,
) => any

/** Render data through the same stateful components as compound content. */
export function MenuData(props: { items?: readonly MenuOptionImplementation[] }) @{
	<>
		{props.items?.map((item) =>
			item.type === 'separator' ? (
				<DropdownMenuSeparator id={item.key} />
			) : item.type === 'section' ? (
				<DropdownMenuSection id={item.key} label={item.label}>
					<MenuData items={item.items} />
				</DropdownMenuSection>
			) : item.type === 'radio-group' ? (
				<DropdownMenuRadioGroup
					label={item.label ?? 'Options'}
					value={typeof item.value === 'string' ? item.value : undefined}
					onValueChange={item.onValueChange}
					isDisabled={item.isDisabled}
					hasCloseOnSelect={item.hasCloseOnSelect}
				>
					{item.items?.map((option) => (
						<DropdownMenuRadioItem
							id={option.key}
							label={option.label}
							value={typeof option.value === 'string' ? option.value : option.key}
							isDisabled={option.isDisabled}
							onSelect={option.onSelect}
						/>
					))}
				</DropdownMenuRadioGroup>
			) : item.type === 'checkbox' ? (
				<DropdownMenuCheckboxItem
					{...item}
					id={item.key}
					label={item.label}
					value={item.value === true}
					onValueChange={item.onValueChange}
					isDisabled={item.isDisabled}
				/>
			) : item.type === 'submenu' ? (
				<MenuSubMenuView {...item} id={item.key} label={item.label} isDisabled={item.isDisabled} />
			) : item.type === 'link' ? (
				<MenuLinkView
					{...item}
					id={item.key}
					label={item.label ?? item.href ?? (typeof item.to === 'string' ? item.to : 'Open')}
				/>
			) : (
				<DropdownMenuItem
					{...item}
					id={item.key}
					label={item.label ?? item.key}
					isDisabled={item.isDisabled}
				/>
			),
		)}
	</>
}
