/** @jsxImportSource @octane-xplat/macos-renderer */
import { DropdownMenu } from './DropdownMenu.macos.tsrx'
import { MenuData } from './MenuParts.macos.tsrx'
import type { BreadcrumbProps, BreadcrumbItem, RegisteredRouteContracts, AppRouteStacks, RouteTransitionName } from './props'
import type { NavigationItemImplementation, NavigationItemsImplementation, MenuOptionImplementation } from './nav-link'
import { useNavigationItem } from './use-navigation-item.shared.tsrx'
import { applyEscapeProps } from './escape-props'
import { Pressable } from './Pressable.macos'
import { Text } from './Text.macos'
import { followHref } from './nav-href.macos'
import { mergeStyle } from './style-merge'
import { cx } from '@octane-xplat/lib'

function BreadcrumbEntry(props: { item: NavigationItemImplementation<BreadcrumbItem>; current: boolean }) @{
	const link = useNavigationItem({ ...props.item, onClick: () => props.item.onSelect?.() })
	@if (link.href != null || props.item.onSelect) {
		<Pressable className="vx-breadcrumb-link" disabled={link.disabled}
			accessibilityRole={link.href != null ? 'link' : 'button'} accessibilityLabel={props.item.label}
			accessibilityState={{ disabled: link.disabled, selected: link.selected }}
			onPress={() => link.activateNative(followHref)}><Text accessible={false}>{props.item.label}</Text></Pressable>
	} @else {
		<Text className="vx-breadcrumb-text">{props.item.label}</Text>
	}
}

/** Ancestor links share typed destinations with the owning route flow. */
export function Breadcrumb<
	Contracts = RegisteredRouteContracts,
	Stacks extends string = keyof AppRouteStacks & string,
	Transitions extends string = RouteTransitionName,
>(props: BreadcrumbProps<Contracts, Stacks, Transitions>): any

export function Breadcrumb(props: NavigationItemsImplementation<BreadcrumbProps, BreadcrumbItem>) @{
	const sep = props.separator ?? '/'
	const limit = Math.max(2, props.maxVisibleItems ?? props.items.length)
	const overflow = props.items.length > limit ? props.items.slice(1, props.items.length - limit + 1) : []
	const visible = overflow.length ? [props.items[0], ...props.items.slice(props.items.length - limit + 1)] : props.items
	const overflowItems: readonly MenuOptionImplementation[] = overflow.map((item, index) => (
		item.to !== undefined || item.href !== undefined
			? { ...item, type: 'link', key: 'ancestor-' + index }
			: { type: 'action', key: 'ancestor-' + index, label: item.label, onSelect: item.onSelect, isDisabled: item.isDisabled || !item.onSelect }
	))

	<masonview ref={(view: any) => applyEscapeProps(view, props)} id={props.id}
		className={cx('vx-breadcrumb', props.className)} style={mergeStyle({ display: 'flex', flexDirection: 'row' }, props.style)}>
		@for (const item of visible; index index; key index) {
			<masonview className="vx-breadcrumb-item" style={{ display: 'flex' }}>
				{index === 1 && (overflow.length > 0 || props.overflowMenu) && <DropdownMenu trigger="…" accessibilityLabel={props.overflowLabel ?? 'More ancestors'}>
					<MenuData items={overflowItems} />{props.overflowMenu}
				</DropdownMenu>}
				{index > 0 ? <label className="vx-breadcrumb-sep" text={sep} /> : null}
				<BreadcrumbEntry item={item} current={index === visible.length - 1} />
			</masonview>
		}
	</masonview>
}
