/** @jsxImportSource @octane-xplat/macos-renderer */
import { useContext, useMemo, useRef, useState } from 'octane'
import type { MenuItemProps, MenuCheckboxItemProps, MenuRadioItemProps, MenuRadioGroupProps, MenuDividerProps, MenuSubMenuProps, MenuSurfaceProps } from './props'
import { MenuRadioContext, MenuRadioProvider, useDropdownMenuContext } from './menu-context'
import { View } from './View.macos.tsrx'
import { Text } from './Text.macos.tsrx'
import { Pressable } from './Pressable.macos.tsrx'
import { Icon } from './Icon.macos.tsrx'
import { Separator } from './Separator.macos.tsrx'
import { Popover } from './Popover.macos.tsrx'
import { MenuSurface } from './MenuSurface.macos.tsrx'

export function DropdownMenuItem(props: MenuItemProps) @{
	const menu = useDropdownMenuContext()
	const select = () => {
		if (props.isDisabled) return
		props.onSelect?.()
		if (props.hasCloseOnSelect !== false) menu?.closeMenu()
	}

	<Pressable ref={props.ref} id={props.id} className={['vx-menu-item', props.isDisabled && 'vx-menu-item--disabled', props.className]} style={props.style}
		accessibilityRole="menuitem" accessibilityLabel={typeof props.label === 'string' ? props.label : undefined}
		accessibilityState={{ disabled: props.isDisabled }} onPress={select}>
		{props.icon && <Icon name={props.icon} />}
		<Text className="vx-menu-item-label">{props.label}</Text>
		{props.description && <Text>{props.description}</Text>}{props.endContent}
	</Pressable>
}

export function DropdownMenuCheckboxItem(props: MenuCheckboxItemProps) @{
	const menu = useDropdownMenuContext()
	const select = () => {
		if (props.isDisabled) return
		props.onValueChange?.(!props.value)
		props.onSelect?.()
		if (props.hasCloseOnSelect) menu?.closeMenu()
	}

	<Pressable ref={props.ref} id={props.id} className={['vx-menu-item', props.isDisabled && 'vx-menu-item--disabled', props.className]} style={props.style}
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
	const select = () => {
		if (props.isDisabled || group.isDisabled) return
		if (group.value !== props.value) group.onValueChange?.(props.value)
		props.onSelect?.()
		if ((props.hasCloseOnSelect ?? group.hasCloseOnSelect) !== false) menu?.closeMenu()
	}

	<Pressable ref={props.ref} id={props.id} className={['vx-menu-item', props.isDisabled && 'vx-menu-item--disabled', props.className]} style={props.style}
		accessibilityRole="menuitemradio" accessibilityLabel={typeof props.label === 'string' ? props.label : undefined}
		accessibilityState={{ disabled: props.isDisabled || group.isDisabled, checked: group.value === props.value }} onPress={select}>
		<Text accessible={false}>{group.value === props.value ? '●' : '○'}</Text>
		{props.icon && <Icon name={props.icon} />}
		<Text className="vx-menu-item-label">{props.label}</Text>
		{props.description && <Text>{props.description}</Text>}{props.endContent}
	</Pressable>
}

export function DropdownMenuDivider(props: MenuDividerProps) @{
	<Separator {...props} />
}

export function DropdownMenuSubMenu(props: MenuSubMenuProps) @{
	const parent = useDropdownMenuContext()
	const anchor = useRef<any>(null)
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
		<Pressable ref={mergedRef} id={props.id} className={['vx-menu-item', props.isDisabled && 'vx-menu-item--disabled', props.className]} style={props.style}
			accessibilityRole="menuitem" accessibilityLabel={typeof props.label === 'string' ? props.label : undefined}
			accessibilityHint="Opens submenu" accessibilityState={{ disabled: props.isDisabled }} onPress={() => setOpen(!open)}
			web={{ 'aria-haspopup': 'menu', 'aria-expanded': open, 'data-menu-submenu': true,
				onKeyDown: (event: any) => {
					if (event.isComposing || event.keyCode === 229 || event.defaultPrevented) return
					if (event.key === 'ArrowRight' && !props.isDisabled) { event.preventDefault(); event.stopPropagation(); setOpen(true) }
				} }}>
			{props.icon && <Icon name={props.icon} />}<Text>{props.label}</Text><Text accessible={false}>›</Text>
		</Pressable>
		<Popover anchor={anchor} open={open} placement="right" alignment="start" onDismiss={() => setOpen(false)} className="vx-menu">
			<MenuSurface closeMenu={() => { setOpen(false); parent?.closeMenu() }} closeLevel={closeLevel} label={typeof props.label === 'string' ? props.label : undefined}>
				<MenuData items={props.items} />{props.children}
			</MenuSurface>
		</Popover>
	</>
}

/** Convert legacy data into the same stateful components as compound content. */
export function MenuData(props: Pick<MenuSurfaceProps, 'items'>) @{
	<>
		{props.items?.map((item) => item.type === 'divider' ? <DropdownMenuDivider id={item.key} />
			: item.type === 'radio-group' ? <DropdownMenuRadioGroup label={item.label ?? 'Options'} value={typeof item.value === 'string' ? item.value : undefined} onValueChange={item.onValueChange} isDisabled={item.isDisabled ?? item.disabled} hasCloseOnSelect={item.hasCloseOnSelect}>
				{item.items?.map((option) => <DropdownMenuRadioItem id={option.key} label={option.label} value={typeof option.value === 'string' ? option.value : option.key} isDisabled={option.isDisabled ?? option.disabled} onSelect={option.onSelect} />)}
			</DropdownMenuRadioGroup>
			: item.type === 'checkbox' ? <DropdownMenuCheckboxItem {...item} id={item.key} label={item.label} value={item.value === true} onValueChange={item.onValueChange} isDisabled={item.isDisabled ?? item.disabled} />
			: item.items ? <DropdownMenuSubMenu {...item} id={item.key} label={item.label} isDisabled={item.isDisabled ?? item.disabled} />
			: <DropdownMenuItem {...item} id={item.key} label={item.label} isDisabled={item.isDisabled ?? item.disabled} />)}
	</>
}
