/** @jsxImportSource @nativescript-community/octane */
import type {
	NavigationMenuProps,
	NavigationMenuItem,
	RegisteredRouteContracts,
	AppRouteStacks,
	RouteTransitionName,
} from './props'

import type { NavigationItemImplementation, NavigationItemsImplementation } from './nav-link'
import { useNavigationItem } from './use-navigation-item.shared.tsrx'
import { cx } from '@octane-xplat/lib'
import { mergeStyle } from './style-merge'
import { applyEscapeProps } from './escape-props'
import { Icon } from './Icon'
import { Text } from './Text'
import { Pressable } from './Pressable'
import { followHref } from './nav-href'

function NavigationMenuRow(props: {
	item: NavigationItemImplementation<NavigationMenuItem>
}) @{
	const item = props.item
	const link = useNavigationItem({ ...item, isSelected: item.active, onClick: item.onSelect })

	<Pressable
		className={cx('vx-navmenu-strip-item', link.selected && 'vx-navmenu-strip-item--active')}
		disabled={link.disabled}
		accessibilityRole={link.href != null ? 'link' : 'button'}
		accessibilityState={{ disabled: link.disabled, selected: link.selected }}
		onPress={() => link.activateNative(followHref)}
	>
		<masonview style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
			{item.icon ? <Icon name={item.icon} size={16} /> : null}
			<Text>{item.label}</Text>
		</masonview>
	</Pressable>
}

/** A navigation strip whose route links use the rendering flow. */
export function NavigationMenu<
	C = RegisteredRouteContracts,
	S extends string = keyof AppRouteStacks & string,
	T extends string = RouteTransitionName,
>(props: NavigationMenuProps<C, S, T>): any

export function NavigationMenu(
	props: NavigationItemsImplementation<NavigationMenuProps, NavigationMenuItem>,
) @{
	const isHorizontal = props.horizontal !== false

	<masonview
		ref={(view: any) => applyEscapeProps(view, props)}
		id={props.id}
		className={cx('vx-navmenu-strip', !isHorizontal && 'vx-navmenu-strip--vertical', props.className)}
		style={mergeStyle({flexDirection: isHorizontal ? 'row' : 'column'}, mergeStyle({display: "flex"}, props.style))}
		accessibilityLabel={props.accessibilityLabel}
	>
		@for (const item of props.items; key item.key) {
			<NavigationMenuRow item={item} />
		}
	</masonview>
}
