/** @jsxImportSource @nativescript-community/octane */
import { DropdownMenu } from './DropdownMenu.tsrx'
import { MenuData } from './MenuParts.tsrx'
import type { BreadcrumbProps, BreadcrumbEntry, BreadcrumbItemProps, BreadcrumbMenuOption, RegisteredRouteContracts, AppRouteStacks, RouteTransitionName } from './props'
import type { NavigationItemImplementation, NavigationItemsImplementation, MenuOptionImplementation } from './nav-link'
import { useNavigationItem } from './use-navigation-item.shared.tsrx'
import { toChildArray } from './child-array'
import { applyEscapeProps } from './escape-props'
import { Pressable } from './Pressable'
import { Text } from './Text'
import { followHref } from './nav-href'
import { mergeStyle } from './style-merge'
import { cx } from '@octane-xplat/lib'

/** BreadcrumbItem part — native leaf renders the same link/text branches. */
export function BreadcrumbItem(props: BreadcrumbItemProps) @{
	const label = typeof props.children === 'string' ? props.children : ''
	const menu = props.menu ? props.menu.map((opt, i) => ('type' in opt && opt.type === 'divider'
		? { type: 'separator', key: 'divider-' + i }
		: { type: 'action', key: 'opt-' + i, label: (opt as { label: string }).label, onSelect: (opt as { onClick?: () => void }).onClick })) : null
	<masonview id={props.id} className={cx('vx-breadcrumb-crumb', props.className)} style={mergeStyle({ display: 'flex' }, props.style)}>
		{props.startIcon}
		{menu ? (
			<DropdownMenu hasChevron={false} button={{ label: '', variant: 'ghost', size: 'sm', accessibilityLabel: 'Options' }}>
				<MenuData items={menu as any} />
			</DropdownMenu>
		) : null}
		{(props.href ?? props.to) != null || props.onPress || props.onClick
			? <Pressable className="vx-breadcrumb-link" accessibilityRole="link" accessibilityLabel={label} onPress={props.onPress ?? props.onClick}><Text accessible={false}>{typeof props.children === 'string' ? props.children : props.children}</Text></Pressable>
			: <Text className="vx-breadcrumb-text">{typeof props.children === 'string' ? props.children : props.children}</Text>}
	</masonview>
}

function BreadcrumbCrumb(props: { item: NavigationItemImplementation<BreadcrumbEntry>; current: boolean }) @{
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

export function Breadcrumb(props: Omit<NavigationItemsImplementation<BreadcrumbProps, BreadcrumbEntry>, 'items'> & { items?: readonly NavigationItemImplementation<BreadcrumbEntry>[] }) @{
	const sep = props.separator ?? '/'
	const all = props.items ?? []
	const childCrumb = (typeof props.children === 'function' ? [] : toChildArray(props.children))
	const limit = Math.max(2, props.maxVisibleItems ?? all.length)
	const overflow = all.length > limit ? all.slice(1, all.length - limit + 1) : []
	const visible = overflow.length ? [all[0], ...all.slice(all.length - limit + 1)] : all
	const overflowItems: readonly MenuOptionImplementation[] = overflow.map((item, index) => (
		item.to !== undefined || item.href !== undefined
			? { ...item, type: 'link', key: 'ancestor-' + index }
			: { type: 'action', key: 'ancestor-' + index, label: item.label, onSelect: item.onSelect, isDisabled: item.isDisabled || !item.onSelect }
	))

	<masonview ref={(v: any) => applyEscapeProps(v, props)} id={props.id} className={cx('vx-breadcrumb', props.variant === 'supporting' && 'vx-breadcrumb--supporting', props.className)} style={mergeStyle({display: "flex"}, props.style)}>
		@for (const item of visible; index index; key index) {
			<masonview className="vx-breadcrumb-item" style={{ display: 'flex' }}>
				{index === 1 && (overflow.length > 0 || props.overflowMenu) && <DropdownMenu hasChevron={false} button={{ label: '…', variant: 'ghost', size: 'sm', accessibilityLabel: props.overflowLabel ?? 'More ancestors' }}>
					<MenuData items={overflowItems} />{props.overflowMenu}
				</DropdownMenu>}
				{index > 0 ? <label className="vx-breadcrumb-sep" text={typeof sep === 'string' ? sep : ''} /> : null}
				<BreadcrumbCrumb item={item} current={index === visible.length - 1} />
			</masonview>
		}
			{typeof props.children === 'function' ? props.children : childCrumb.map((child: any, i: number) => (
			<masonview className="vx-breadcrumb-item" key={'c' + i}>
				{(all.length + i) > 0 ? <Text className="vx-breadcrumb-sep">{typeof sep === 'string' ? sep : ''}</Text> : null}
				{child}
			</masonview>
		))}
	</masonview>
}
