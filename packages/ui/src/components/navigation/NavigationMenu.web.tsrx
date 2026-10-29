/** @jsxImportSource @octane-xplat/jsx/dom */
import type {
	NavigationMenuProps,
	NavigationMenuItem,
	RegisteredRouteContracts,
	AppRouteStacks,
	RouteTransitionName,
} from '../../props'

import type { NavigationItemImplementation, NavigationItemsImplementation } from './nav-link'
import { useNavigationItem } from './use-navigation-item.shared.tsrx'
import { applyEscapeProps } from '../overlays/escape-props'
import { Icon } from '../media/Icon.web.tsrx'
import { useListFocus } from '../collections/list-focus.web.tsrx'

function NavigationMenuRow(props: {
	item: NavigationItemImplementation<NavigationMenuItem>
}) @{
	const item = props.item
	const link = useNavigationItem({ ...item, isSelected: item.active, onClick: item.onSelect })
	const Element: any = link.href != null ? 'a' : 'button'

	<Element
		className={['vx-navmenu-strip-item', link.selected && 'vx-navmenu-strip-item--active']}
		type={link.href == null ? 'button' : undefined}
		href={link.disabled ? undefined : link.href}
		target={item.target}
		rel={item.rel}
		download={item.download}
		disabled={link.href == null ? link.disabled : undefined}
		aria-disabled={link.disabled || undefined}
		tabIndex={link.disabled ? -1 : undefined}
		aria-current={link.selected ? 'page' : undefined}
		onClick={link.activateWeb}
	>
		{item.icon ? <Icon name={item.icon} size={16} /> : null}
		{item.label}
	</Element>
}

/** A keyboard-operable navigation strip with typed routes, URLs and actions. */
export function NavigationMenu<
	C = RegisteredRouteContracts,
	S extends string = keyof AppRouteStacks & string,
	T extends string = RouteTransitionName,
>(props: NavigationMenuProps<C, S, T>): any

export function NavigationMenu(
	props: NavigationItemsImplementation<NavigationMenuProps, NavigationMenuItem>,
) @{
	const { listRef, handleKeyDown, handleFocus } = useListFocus<HTMLElement>({
		itemSelector: '.vx-navmenu-strip-item',
		orientation: props.horizontal === false ? 'vertical' : 'horizontal',
	})

	<nav
		ref={(element: any) => {
			listRef.current = element
			applyEscapeProps(element, props)
		}}
		id={props.id}
		className={[
			'vx-navmenu-strip',
			props.horizontal === false && 'vx-navmenu-strip--vertical',
			props.className,
		]}
		style={props.style}
		aria-label={props.accessibilityLabel}
		onKeyDown={handleKeyDown}
		onFocus={handleFocus}
	>
		@for (const item of props.items; key item.key) {
			<NavigationMenuRow item={item} />
		}
	</nav>
}
