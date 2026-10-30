/** @jsxImportSource @octane-xplat/jsx */
import { DropdownMenu } from '../overlays/DropdownMenu.macos.tsrx'
import { MenuData } from '../overlays/MenuParts.macos.tsrx'
import type {
	BreadcrumbProps,
	BreadcrumbEntry as BreadcrumbItemData,
	BreadcrumbItemProps,
	RegisteredRouteContracts,
	AppRouteStacks,
	RouteTransitionName,
} from '../../props'

import type {
	NavigationItemImplementation,
	NavigationItemsImplementation,
	MenuOptionImplementation,
} from './nav-link'

import { useNavigationItem } from './use-navigation-item.shared.tsrx'
import { applyEscapeProps } from '../overlays/escape-props'
import { Pressable } from '../actions/Pressable.macos'
import { Text } from '../content/Text.macos'
import { followHref } from './nav-href.macos'
import { mergeStyle } from '../../internal/layout/style-merge'
import { cx } from '@octane-xplat/lib'

/** BreadcrumbItem part — AppKit leaf renders the same link/text branches. */
export function BreadcrumbItem(props: BreadcrumbItemProps): unknown @{
	const label = typeof props.children === 'string' ? props.children : ''
	const menu = props.menu
		? props.menu.map((opt, i) =>
				'type' in opt && opt.type === 'divider'
					? { type: 'separator', key: 'divider-' + i }
					: {
							type: 'action',
							key: 'opt-' + i,
							label: (opt as { label: string }).label,
							onSelect: (opt as { onClick?: () => void }).onClick,
						},
			)
		: null

	<masonview
		id={props.id}
		className={cx('vx-breadcrumb-crumb', props.className)}
		style={mergeStyle({ display: 'flex' }, props.style)}
	>
		{props.startIcon}
		{menu ? (
			<DropdownMenu
				hasChevron={false}
				button={{ label: '', variant: 'ghost', size: 'sm', accessibilityLabel: 'Options' }}
			>
				<MenuData items={menu as any} />
			</DropdownMenu>
		) : null}
		{(props.href ?? props.to) != null || props.onPress || props.onClick ? (
			<Pressable
				className="vx-breadcrumb-link"
				accessibilityRole="link"
				accessibilityLabel={label}
				onPress={props.onPress ?? props.onClick}
			>
				<Text accessible={false}>{props.children}</Text>
			</Pressable>
		) : (
			<Text className="vx-breadcrumb-text">{props.children}</Text>
		)}
	</masonview>
}

function BreadcrumbCrumb(props: {
	item: NavigationItemImplementation<BreadcrumbItemData>
	current: boolean
}) @{
	const link = useNavigationItem({ ...props.item, onClick: () => props.item.onSelect?.() })

	@if (link.href != null || props.item.onSelect) {
		<Pressable
			className="vx-breadcrumb-link"
			disabled={link.disabled}
			accessibilityRole={link.href != null ? 'link' : 'button'}
			accessibilityLabel={props.item.label}
			accessibilityState={{ disabled: link.disabled, selected: link.selected }}
			onPress={() => link.activateNative(followHref)}
		>
			<Text accessible={false}>{props.item.label}</Text>
		</Pressable>
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

export function Breadcrumb(
	props: Omit<NavigationItemsImplementation<BreadcrumbProps, BreadcrumbItemData>, 'items'> & {
		items?: readonly NavigationItemImplementation<BreadcrumbItemData>[]
	},
) @{
	const all = props.items ?? []
	const sep = props.separator ?? '/'
	const limit = Math.max(2, props.maxVisibleItems ?? all.length)
	const overflow = all.length > limit ? all.slice(1, all.length - limit + 1) : []
	const visibleArr = overflow.length ? [all[0], ...all.slice(all.length - limit + 1)] : all
	const overflowItems: readonly MenuOptionImplementation[] = overflow.map((item, index) =>
		item.to !== undefined || item.href !== undefined
			? { ...item, type: 'link', key: 'ancestor-' + index }
			: {
					type: 'action',
					key: 'ancestor-' + index,
					label: item.label,
					onSelect: item.onSelect,
					isDisabled: item.isDisabled || !item.onSelect,
				},
	)

	<masonview
		ref={(view: any) => applyEscapeProps(view, props)}
		id={props.id}
		className={cx('vx-breadcrumb', props.className)}
		style={mergeStyle({ display: 'flex', flexDirection: 'row' }, props.style)}
	>
		@for (const item of visibleArr; index index; key index) {
			<masonview className="vx-breadcrumb-item" style={{ display: 'flex' }}>
				{index === 1 && (overflow.length > 0 || props.overflowMenu) && (
					<DropdownMenu
						hasChevron={false}
						button={{
							label: '…',
							variant: 'ghost',
							size: 'sm',
							accessibilityLabel: props.overflowLabel ?? 'More ancestors',
						}}
					>
						<MenuData items={overflowItems} />
						{props.overflowMenu}
					</DropdownMenu>
				)}
				{index > 0 ? (
					<label className="vx-breadcrumb-sep" text={typeof sep === 'string' ? sep : ''} />
				) : null}
				<BreadcrumbCrumb item={item} current={index === visibleArr.length - 1} />
			</masonview>
		}
	</masonview>
}
