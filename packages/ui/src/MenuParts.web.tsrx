import type { RegisteredRouteContracts, AppRouteStacks, RouteTransitionName } from './props'
import type { NavigationItemImplementation, NavigationMenuImplementation, MenuOptionImplementation } from './nav-link'
import { useNavigationItem } from './use-navigation-item.shared.tsrx'
import { useContext, useId, useMemo, useRef, useState } from 'octane'
import type { Octane } from 'octane/jsx-runtime'
import type { MenuItemProps, MenuLinkProps, MenuSectionProps, MenuCheckboxItemProps, MenuRadioItemProps, MenuRadioGroupProps, MenuSeparatorProps, MenuSubMenuProps, MenuSurfaceProps } from './props'
import { MenuRadioContext, MenuRadioProvider, useDropdownMenuContext } from './menu-context'
import { View } from './View.web.tsrx'
import { Text } from './Text.web.tsrx'
import { Pressable } from './Pressable.web.tsrx'
import { Icon } from './Icon.web.tsrx'
import { Separator } from './Separator.web.tsrx'
import { Popover } from './Popover.web.tsrx'
import { MenuSurface } from './MenuSurface.web.tsrx'

export function DropdownMenuItem(props: MenuItemProps) @{
	const menu = useDropdownMenuContext()
	if (!menu) throw new Error('DropdownMenuItem requires a menu — render it inside DropdownMenu or ContextMenu')
	const select = () => {
		if (props.isDisabled) return
		props.onSelect?.()
		if (props.hasCloseOnSelect !== false) menu.closeMenu()
	}

	<Pressable ref={props.ref} id={props.id} className={['vx-menu-item', props.isDisabled && 'vx-menu-item--disabled', props.variant === 'destructive' && 'vx-menu-item--destructive', props.className]} style={props.style}
		accessibilityRole="menuitem" accessibilityLabel={typeof props.label === 'string' ? props.label : undefined}
		accessibilityState={{ disabled: props.isDisabled }} onPress={select}>
		{props.icon && <Icon name={props.icon} />}
		<Text className="vx-menu-item-label">{props.label}</Text>
		{props.description && <Text>{props.description}</Text>}{props.endContent}
	</Pressable>
}

export function DropdownMenuCheckboxItem(props: MenuCheckboxItemProps) @{
	const menu = useDropdownMenuContext()
	if (!menu) throw new Error('DropdownMenuCheckboxItem requires a menu — render it inside DropdownMenu or ContextMenu')
	const select = () => {
		if (props.isDisabled) return
		props.onValueChange?.(!props.value)
		props.onSelect?.()
		if (props.hasCloseOnSelect) menu.closeMenu()
	}

	<Pressable ref={props.ref} id={props.id} className={['vx-menu-item', props.isDisabled && 'vx-menu-item--disabled', props.variant === 'destructive' && 'vx-menu-item--destructive', props.className]} style={props.style}
		accessibilityRole="menuitemcheckbox" accessibilityLabel={typeof props.label === 'string' ? props.label : undefined}
		accessibilityState={{ disabled: props.isDisabled, checked: props.value }} onPress={select}>
		<Text accessible={false}>{props.value ? '✓' : '○'}</Text>
		{props.icon && <Icon name={props.icon} />}
		<Text className="vx-menu-item-label">{props.label}</Text>
		{props.description && <Text>{props.description}</Text>}{props.endContent}
	</Pressable>
}

export function DropdownMenuRadioGroup(props: MenuRadioGroupProps) @{
	const [internal, setInternal] = useState(props.defaultValue)
	const context: MenuRadioGroupProps = {
		get value() { return props.value !== undefined ? props.value : internal },
		get isDisabled() { return props.isDisabled },
		get hasCloseOnSelect() { return props.hasCloseOnSelect },
		get label() { return props.label },
		onValueChange: (value) => {
			if (props.isDisabled) return
			if (props.value === undefined) setInternal(value)
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
	if (!group) throw new Error('MenuRadioItem requires a MenuRadioGroup')
	if (!menu) throw new Error('DropdownMenuRadioItem requires a menu — render it inside DropdownMenu or ContextMenu')
	const select = () => {
		if (props.isDisabled || group.isDisabled) return
		if (group.value !== props.value) group.onValueChange?.(props.value)
		props.onSelect?.()
		if ((props.hasCloseOnSelect ?? group.hasCloseOnSelect) !== false) menu.closeMenu()
	}

	<Pressable ref={props.ref} id={props.id} className={['vx-menu-item', props.isDisabled && 'vx-menu-item--disabled', props.variant === 'destructive' && 'vx-menu-item--destructive', props.className]} style={props.style}
		accessibilityRole="menuitemradio" accessibilityLabel={typeof props.label === 'string' ? props.label : undefined}
		accessibilityState={{ disabled: props.isDisabled || group.isDisabled, checked: group.value === props.value }} onPress={select}>
		<Text accessible={false}>{group.value === props.value ? '●' : '○'}</Text>
		{props.icon && <Icon name={props.icon} />}
		<Text className="vx-menu-item-label">{props.label}</Text>
		{props.description && <Text>{props.description}</Text>}{props.endContent}
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
	<View id={props.id} accessibilityRole="group" accessibilityLabel={props.label}>{props.children}</View>
}

export function DropdownMenuLink<
	Contracts = RegisteredRouteContracts,
	Stacks extends string = keyof AppRouteStacks & string,
	Transitions extends string = RouteTransitionName,
>(props: MenuLinkProps<Contracts, Stacks, Transitions>): any

export function DropdownMenuLink(props: NavigationItemImplementation<MenuLinkProps>) @{
	const menu = useDropdownMenuContext()
	if (!menu) throw new Error('DropdownMenuLink requires a menu — render it inside DropdownMenu or ContextMenu')
	const link = useNavigationItem({ ...props, onPress: props.onSelect }, 'link')

	<a ref={props.ref as Octane.Ref<HTMLAnchorElement>} id={props.id} href={link.href} target={props.target} rel={props.rel} download={props.download} role="menuitem"
		aria-disabled={link.disabled || undefined} aria-current={link.selected ? 'page' : undefined}
		tabIndex={link.disabled ? -1 : undefined}
		onClick={(event: any) => { if (link.activateWeb(event) && props.hasCloseOnSelect !== false) menu.closeMenu() }}
		className={['vx-menu-item', link.disabled && 'vx-menu-item--disabled', props.className]} style={props.style}>
		{props.icon && <Icon name={props.icon} />}
		<Text className="vx-menu-item-label">{props.label}</Text>
		{props.description && <Text>{props.description}</Text>}{props.endContent}
	</a>
}

export function DropdownMenuSubMenu<
	Contracts = RegisteredRouteContracts,
	Stacks extends string = keyof AppRouteStacks & string,
	Transitions extends string = RouteTransitionName,
>(props: MenuSubMenuProps<Contracts, Stacks, Transitions>): any

export function DropdownMenuSubMenu(props: NavigationMenuImplementation<MenuSubMenuProps>) @{
	const parent = useDropdownMenuContext()
	if (!parent) throw new Error('DropdownMenuSubMenu requires a menu — render it inside DropdownMenu or ContextMenu')
	const anchor = useRef<any>(null)
	const triggerId = useId()
	const initialFocus = useRef<'first' | 'container'>('container')
	const mergedRef = useMemo(() => props.ref ? [anchor, props.ref] : anchor, [props.ref])
	const [internal, setInternal] = useState(props.defaultOpen ?? false)
	const open = props.isOpen ?? internal
	const setOpen = (next: boolean) => {
		if (next && props.isDisabled) return
		if (props.isOpen === undefined) setInternal(next)
		props.onOpenChange?.(next)
	}

	const closeLevel = () => setOpen(false)

	<>
		<Pressable ref={mergedRef} id={props.id ?? triggerId} className={['vx-menu-item', props.isDisabled && 'vx-menu-item--disabled', props.variant === 'destructive' && 'vx-menu-item--destructive', props.className]} style={props.style}
			accessibilityRole="menuitem" accessibilityLabel={typeof props.label === 'string' ? props.label : undefined}
			accessibilityHint="Opens submenu" accessibilityState={{ disabled: props.isDisabled }} onPress={() => setOpen(!open)}
			web={{ onpointerdown: () => { initialFocus.current = 'container' }, 'aria-haspopup': 'menu', 'aria-expanded': String(open), 'data-menu-submenu': true,
				onkeydown: (event: any) => {
					if (event.isComposing || event.keyCode === 229 || event.defaultPrevented) return
					if (event.key === 'Enter' || event.key === ' ') initialFocus.current = 'first'
					if (event.key === (getComputedStyle(anchor.current).direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight') && !props.isDisabled) { event.preventDefault(); event.stopPropagation(); initialFocus.current = 'first'; setOpen(true) }
				} }}>
			{props.icon && <Icon name={props.icon} />}<Text>{props.label}</Text><Text accessible={false}>›</Text>
		</Pressable>
		<Popover anchor={anchor} open={open} placement="right" alignment="start" onDismiss={() => setOpen(false)} className="vx-menu">
			<MenuSurface initialFocus={initialFocus.current} closeMenu={() => { setOpen(false); parent.closeMenu() }} closeLevel={closeLevel} label={typeof props.label === 'string' ? props.label : undefined} labelledBy={props.id ?? triggerId}>
				<MenuData items={props.items} />{props.children}
			</MenuSurface>
		</Popover>
	</>
}

// Data already passed the public discriminated contract. These private views
// carry its erased navigation fields without inventing an application contract.
const MenuLinkView = DropdownMenuLink as (props: NavigationItemImplementation<MenuLinkProps>) => any
const MenuSubMenuView = DropdownMenuSubMenu as (props: NavigationMenuImplementation<MenuSubMenuProps>) => any

/** Render data through the same stateful components as compound content. */
export function MenuData(props: { items?: readonly MenuOptionImplementation[] }) @{
	<>
		{props.items?.map((item) => item.type === 'separator' ? <DropdownMenuSeparator id={item.key} />
			: item.type === 'section' ? <DropdownMenuSection id={item.key} label={item.label}><MenuData items={item.items} /></DropdownMenuSection>
			: item.type === 'radio-group' ? <DropdownMenuRadioGroup label={item.label ?? 'Options'} value={typeof item.value === 'string' ? item.value : undefined} onValueChange={item.onValueChange} isDisabled={item.isDisabled} hasCloseOnSelect={item.hasCloseOnSelect}>
				{item.items?.map((option) => <DropdownMenuRadioItem id={option.key} label={option.label} value={typeof option.value === 'string' ? option.value : option.key} isDisabled={option.isDisabled} onSelect={option.onSelect} />)}
			</DropdownMenuRadioGroup>
			: item.type === 'checkbox' ? <DropdownMenuCheckboxItem {...item} id={item.key} label={item.label} value={item.value === true} onValueChange={item.onValueChange} isDisabled={item.isDisabled} />
			: item.type === 'submenu' ? <MenuSubMenuView {...item} id={item.key} label={item.label} isDisabled={item.isDisabled} />
			: item.type === 'link' ? <MenuLinkView {...item} id={item.key} label={item.label ?? item.href ?? (typeof item.to === 'string' ? item.to : 'Open')} />
			: <DropdownMenuItem {...item} id={item.key} label={item.label ?? item.key} isDisabled={item.isDisabled} />)}
	</>
}
