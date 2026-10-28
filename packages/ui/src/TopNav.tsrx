/** @jsxImportSource @nativescript-community/octane */
import { MenuSurface } from './MenuSurface.tsrx'
import { useDropdownMenuContext } from './menu-context'
import type { TopNavMenuItemData } from './props'

import type { RegisteredRouteContracts, AppRouteStacks, RouteTransitionName } from './props'
import type { NavigationItemImplementation, NavigationItemsImplementation } from './nav-link'
import { useNavigationItem } from './use-navigation-item.shared.tsrx'
import { mergeStyle } from './style-merge'
import { useCallback, useContext, useMemo, useRef, useState } from 'octane'
import type {
	TopNavHeadingProps,
	TopNavItemProps,
	TopNavMenuProps,
	TopNavMegaMenuProps,
	TopNavMegaMenuItemProps,
	TopNavMegaMenuFeaturedCardProps,
	TopNavProps,
} from './props'

import { cx } from '@octane-xplat/lib'
import { applyEscapeProps } from './escape-props'
import { Icon } from './Icon'
import { Text } from './Text'
import { Image } from './Image'
import { Pressable } from './Pressable'
import { Popover } from './Popover'
import { MobileNav, MobileNavToggle } from './MobileNav'
import { followHref } from './nav-href'
import {
	NavHeadingCloseContext,
	TopNavMobileContentContext,
	TopNavRenderContext,
	TopNavSlotContext,
	useTopNavMobileContent,
	useTopNavRenderMode,
	useTopNavSlot,
	TopNavSlotProvider,
	NavHeadingCloseProvider,
} from './nav-contexts'

export {
	TopNavRenderContext,
	TopNavSlotContext,
	TopNavMobileContentContext,
	useTopNavRenderMode,
	useTopNavSlot,
	useTopNavMobileContent,
}

function navIcon(icon: any, size = 16) {
	return typeof icon === 'string' ? <Icon name={icon} size={size} /> : icon
}

/** TopNav — the app's top navigation bar. Native leaf: the same three
 *  render modes — `default` full bar, `mobile-bar` (heading + end +
 *  toggle), `drawer` (content inside MobileNav). Hover-driven menus open on
 *  tap on pointer platforms. */
export function TopNav(props: TopNavProps) @{
	const renderMode = useTopNavRenderMode()
	const mobileContent = useTopNavMobileContent()
	const label = props.label ?? 'Top navigation'
	const startContent = props.startContent ?? props.children
	const hasCenter = props.centerContent != null

	@if (renderMode === 'mobile-bar') {
		<masonview
			ref={(v: any) => applyEscapeProps(v, props)}
			id={props.id}
			className={cx('vx-topnav', 'vx-topnav--mobilebar', props.className)}
			style={mergeStyle({ display: 'flex' }, props.style)}
			accessibilityLabel={label}
		>
			{props.heading}
			<masonview
				className="vx-topnav-mobilebar-end"
				style={mergeStyle(
					{ flexDirection: 'row', alignItems: 'center', flexGrow: 1, justifyContent: 'flex-end' },
					{ display: 'flex' },
				)}
			>
				{props.endContent}
			</masonview>
			<MobileNavToggle />
		</masonview>
	} @else {
		@if (renderMode === 'drawer') {
			<MobileNav
				label={label}
				className={cx('vx-topnav', 'vx-topnav--drawer', props.className)}
				style={props.style}
			>
				{props.heading}
				{startContent}
				{props.centerContent}
				{props.endContent}
				{mobileContent}
			</MobileNav>
		} @else {
			@if (hasCenter) {
				<masonview
					ref={(v: any) => applyEscapeProps(v, props)}
					id={props.id}
					className={cx('vx-topnav', 'vx-topnav--grid', props.className)}
					style={mergeStyle({ display: 'grid', gridTemplateColumns: '1fr auto 1fr' }, props.style)}
					accessibilityLabel={label}
				>
					<TopNavSlotProvider value="start">
						<masonview
							className="vx-topnav-start"
							style={mergeStyle(
								{ flexDirection: 'row', alignItems: 'center', gridColumn: '1' },
								{ display: 'flex' },
							)}
						>
							{props.heading}
							{startContent}
						</masonview>
					</TopNavSlotProvider>
					<TopNavSlotProvider value="center">
						<masonview
							className="vx-topnav-center"
							style={mergeStyle(
								{
									flexDirection: 'row',
									alignItems: 'center',
									justifyContent: 'center',
									gridColumn: '2',
								},
								{ display: 'flex' },
							)}
						>
							{props.centerContent}
						</masonview>
					</TopNavSlotProvider>
					<TopNavSlotProvider value="end">
						<masonview
							className="vx-topnav-end"
							style={mergeStyle(
								{
									flexDirection: 'row',
									alignItems: 'center',
									justifyContent: 'flex-end',
									gridColumn: '3',
								},
								{ display: 'flex' },
							)}
						>
							{props.endContent}
						</masonview>
					</TopNavSlotProvider>
				</masonview>
			} @else {
				<masonview
					ref={(v: any) => applyEscapeProps(v, props)}
					id={props.id}
					className={cx('vx-topnav', props.className)}
					style={mergeStyle({ display: 'flex' }, props.style)}
					accessibilityLabel={label}
				>
					<TopNavSlotProvider value="start">
						<masonview
							className="vx-topnav-start"
							style={mergeStyle(
								{ flexDirection: 'row', alignItems: 'center', flexGrow: 1 },
								{ display: 'flex' },
							)}
						>
							{props.heading}
							{startContent}
						</masonview>
					</TopNavSlotProvider>
					<TopNavSlotProvider value="end">
						<masonview
							className="vx-topnav-end"
							style={mergeStyle(
								{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
								{ display: 'flex' },
							)}
						>
							{props.endContent}
						</masonview>
					</TopNavSlotProvider>
				</masonview>
			}
		}
	}
}

/** TopNavHeading — the brand block: logo + heading link with optional
 *  super/subheading lines and an optional heading menu popover. */
export function TopNavHeading(props: TopNavHeadingProps) @{
	const anchor = useRef<any>(null)
	const [menuOpen, setMenuOpen] = useState(false)
	const hasLinks = !!(props.headingHref || props.superheadingHref || props.subheadingHref)
	const hasMenu = props.menu != null
	const headerIsTrigger = hasMenu && !hasLinks
	const closeMenu = useCallback(() => setMenuOpen(false), [])
	const closeCtx = useMemo(() => ({ closeMenu }), [closeMenu])

	const activate = (href?: string) => {
		if (href) {
			followHref(href)
		}
	}

	const lines = (
		<>
			{props.superheading ? (
				<Pressable
					disabled={!props.superheadingHref}
					onPress={() => activate(props.superheadingHref)}
				>
					<Text className="vx-topnav-heading-super">{props.superheading}</Text>
				</Pressable>
			) : null}
			{props.heading ? (
				<Pressable disabled={!props.headingHref} onPress={() => activate(props.headingHref)}>
					<Text className="vx-topnav-heading-title">{props.heading}</Text>
				</Pressable>
			) : null}
			{props.subheading ? (
				<Pressable disabled={!props.subheadingHref} onPress={() => activate(props.subheadingHref)}>
					<Text className="vx-topnav-heading-sub">{props.subheading}</Text>
				</Pressable>
			) : null}
		</>
	)

	const logo =
		props.logo != null ? (
			<Pressable
				disabled={!props.headingHref}
				accessibilityLabel={props.logoLabel}
				onPress={() => activate(props.headingHref)}
			>
				<masonview className="vx-topnav-heading-logo" style={{ display: 'flex' }}>
					{props.logo}
				</masonview>
			</Pressable>
		) : null

	<masonview
		ref={(v: any) => applyEscapeProps(v, props)}
		id={props.id}
		className={cx('vx-topnav-heading', props.className)}
		style={mergeStyle({ display: 'flex' }, props.style)}
	>
		{headerIsTrigger ? (
			<Pressable
				ref={(v: any) => {
					anchor.current = v
				}}
				className="vx-topnav-heading-trigger"
				onPress={() => setMenuOpen(!menuOpen)}
				accessibilityLabel={props.heading ?? props.logoLabel}
			>
				<masonview
					style={mergeStyle(
						{ flexDirection: 'row', alignItems: 'center', gap: 8 },
						{ display: 'flex' },
					)}
				>
					{logo}
					<masonview style={mergeStyle({ flexDirection: 'column' }, { display: 'flex' })}>
						{lines}
					</masonview>
					<Icon name="xplat-chevron-down" size={16} />
				</masonview>
			</Pressable>
		) : (
			<>
				{logo}
				<masonview style={mergeStyle({ flexDirection: 'column' }, { display: 'flex' })}>
					{lines}
				</masonview>
			</>
		)}
		{hasMenu && !headerIsTrigger ? (
			<Pressable
				ref={(v: any) => {
					anchor.current = v
				}}
				className="vx-topnav-heading-menubtn"
				onPress={() => setMenuOpen(!menuOpen)}
				accessibilityLabel="Open heading menu"
			>
				<Icon name="xplat-chevron-down" size={16} />
			</Pressable>
		) : null}
		{props.headerEndContent}
		<NavHeadingCloseProvider value={closeCtx}>
			<Popover
				anchor={anchor}
				open={menuOpen}
				placement="bottom"
				onDismiss={() => setMenuOpen(false)}
				className="vx-headingmenu-pop"
			>
				{props.menu}
			</Popover>
		</NavHeadingCloseProvider>
	</masonview>
}

/** TopNavItem — one nav link in the bar. Native leaf: Pressable rows;
 *  `href` routes through `followHref`. */
export function TopNavItem<
	Contracts = RegisteredRouteContracts,
	Stacks extends string = keyof AppRouteStacks & string,
	Transitions extends string = RouteTransitionName,
>(props: TopNavItemProps<Contracts, Stacks, Transitions>): any

export function TopNavItem(props: NavigationItemImplementation<TopNavItemProps>) @{
	const link = useNavigationItem(props)
	const renderMode = useTopNavRenderMode()
	const isDrawer = renderMode === 'drawer'
	const isDisabled = link.disabled
	const size = props.size ?? 'md'

	const activate = () => link.activateNative(followHref)

	<Pressable
		ref={(v: any) => applyEscapeProps(v, props)}
		id={props.id}
		className={cx(
			'vx-topnav-item',
			'vx-topnav-item--' + size,
			isDrawer && 'vx-topnav-item--drawer',
			link.selected && 'vx-topnav-item--selected',
			props.isIconOnly && 'vx-topnav-item--icon',
			isDisabled && 'vx-topnav-item--disabled',
			props.className,
		)}
		style={props.style}
		disabled={isDisabled}
		accessibilityRole={link.href != null ? 'link' : 'button'}
		accessibilityLabel={props.isIconOnly ? props.label : undefined}
		accessibilityState={{ disabled: isDisabled, selected: link.selected }}
		onPress={activate}
	>
		<masonview
			style={mergeStyle(
				{ flexDirection: 'row', alignItems: 'center', gap: 6 },
				{ display: 'flex' },
			)}
		>
			{props.icon != null ? (
				<masonview className="vx-topnav-item-icon" style={{ display: 'flex' }}>
					{navIcon(props.icon)}
				</masonview>
			) : null}
			{props.isIconOnly
				? null
				: (props.children ?? <Text className="vx-topnav-item-label">{props.label}</Text>)}
		</masonview>
	</Pressable>
}

/** TopNavMenu — trigger that opens a list popover on press (hover platforms
 *  get hover intent in the web leaf). */
function TopNavMenuRow(props: {
	item: NavigationItemImplementation<TopNavMenuItemData>
	close(): void
}) @{
	const link = useNavigationItem(props.item)

	<Pressable
		className="vx-topnavmenu-item"
		accessibilityRole="menuitem"
		disabled={link.disabled}
		accessibilityState={{ disabled: link.disabled, selected: link.selected }}
		onPress={() => {
			if (link.activateNative(followHref)) {
				props.close()
			}
		}}
	>
		<masonview
			style={mergeStyle(
				{ flexDirection: 'row', alignItems: 'center', gap: 8 },
				{ display: 'flex' },
			)}
		>
			{props.item.icon != null ? (
				<masonview className="vx-topnavmenu-item-icon" style={{ display: 'flex' }}>
					{navIcon(props.item.icon)}
				</masonview>
			) : null}
			<masonview style={mergeStyle({ flexDirection: 'column', flexGrow: 1 }, { display: 'flex' })}>
				<Text className="vx-topnavmenu-item-title">{props.item.title}</Text>
				{props.item.description != null ? (
					<Text className="vx-topnavmenu-item-desc">{props.item.description}</Text>
				) : null}
			</masonview>
		</masonview>
	</Pressable>
}

export function TopNavMenu<
	Contracts = RegisteredRouteContracts,
	Stacks extends string = keyof AppRouteStacks & string,
	Transitions extends string = RouteTransitionName,
>(props: TopNavMenuProps<Contracts, Stacks, Transitions>): any

export function TopNavMenu(
	props: NavigationItemsImplementation<TopNavMenuProps, TopNavMenuItemData>,
) @{
	const anchor = useRef<any>(null)
	const [open, setOpen] = useState(false)

	<>
		<Pressable
			ref={(v: any) => {
				anchor.current = v
				applyEscapeProps(v, props)
			}}
			id={props.id}
			className={cx('vx-topnav-item', 'vx-topnavmenu-trigger', props.className)}
			style={props.style}
			onPress={() => setOpen(!open)}
		>
			<masonview
				style={mergeStyle(
					{ flexDirection: 'row', alignItems: 'center', gap: 4 },
					{ display: 'flex' },
				)}
			>
				<Text className="vx-topnav-item-label">{props.label}</Text>
				<Icon name={open ? 'xplat-chevron-up' : 'xplat-chevron-down'} size={16} />
			</masonview>
		</Pressable>
		<Popover
			anchor={anchor}
			open={open}
			placement="bottom"
			onDismiss={() => setOpen(false)}
			className="vx-topnavmenu-pop"
		>
			<MenuSurface
				label={props.label}
				closeMenu={() => setOpen(false)}
				className="vx-topnavmenu"
				style={mergeStyle({ flexDirection: 'column' }, { display: 'flex' })}
			>
				@for (const item of props.items; key item.title) {
					<TopNavMenuRow item={item} close={() => setOpen(false)} />
				}
			</MenuSurface>
		</Popover>
	</>
}

/** TopNavMegaMenu — trigger opening a wide panel with an items grid plus an
 *  optional featured panel. Native leaf: a press-opened anchored popover. */
export function TopNavMegaMenu(props: TopNavMegaMenuProps) @{
	const anchor = useRef<any>(null)
	const [open, setOpen] = useState(false)

	const setOpenTracked = (next: boolean) => {
		if (next !== open) {
			props.onOpenChange?.(next)
		}

		setOpen(next)
	}

	<>
		<Pressable
			ref={(v: any) => {
				anchor.current = v
				applyEscapeProps(v, props)
			}}
			id={props.id}
			className={cx('vx-topnav-item', 'vx-topnavmegamenu-trigger', props.className)}
			style={props.style}
			onPress={() => setOpenTracked(!open)}
		>
			<masonview
				style={mergeStyle(
					{ flexDirection: 'row', alignItems: 'center', gap: 4 },
					{ display: 'flex' },
				)}
			>
				<Text className="vx-topnav-item-label">{props.label}</Text>
				<Icon name={open ? 'xplat-chevron-up' : 'xplat-chevron-down'} size={16} />
			</masonview>
		</Pressable>
		<Popover
			anchor={anchor}
			open={open}
			placement="bottom"
			onDismiss={() => setOpenTracked(false)}
			className="vx-topnavmegamenu-pop"
		>
			<masonview
				className="vx-topnavmegamenu"
				style={mergeStyle({ flexDirection: 'row' }, { display: 'flex' })}
			>
				<MenuSurface
					className="vx-topnavmegamenu-items"
					label={props.label}
					closeMenu={() => setOpenTracked(false)}
					style={{ display: 'flex', flexDirection: 'column' }}
				>
					{props.items}
				</MenuSurface>
				{props.featured != null ? (
					<masonview className="vx-topnavmegamenu-featured" style={{ display: 'flex' }}>
						{props.featured}
					</masonview>
				) : null}
			</masonview>
		</Popover>
	</>
}

/** TopNavMegaMenuItem — one link in the mega menu items grid. */
export function TopNavMegaMenuItem<
	Contracts = RegisteredRouteContracts,
	Stacks extends string = keyof AppRouteStacks & string,
	Transitions extends string = RouteTransitionName,
>(props: TopNavMegaMenuItemProps<Contracts, Stacks, Transitions>): any

export function TopNavMegaMenuItem(
	props: NavigationItemImplementation<TopNavMegaMenuItemProps>,
) @{
	const link = useNavigationItem(props)
	const menu = useDropdownMenuContext()
	const activate = () => {
		if (link.activateNative(followHref)) {
			menu?.closeMenu()
		}
	}

	<Pressable
		ref={(v: any) => applyEscapeProps(v, props)}
		id={props.id}
		className={cx('vx-topnavmegamenu-item', props.className)}
		style={props.style}
		accessibilityRole={link.href != null ? 'link' : 'button'}
		disabled={link.disabled}
		accessibilityState={{ disabled: link.disabled, selected: link.selected }}
		onPress={activate}
	>
		<masonview
			style={mergeStyle(
				{ flexDirection: 'row', alignItems: 'center', gap: 8 },
				{ display: 'flex' },
			)}
		>
			{props.icon != null ? (
				<masonview className="vx-topnavmegamenu-item-icon" style={{ display: 'flex' }}>
					{navIcon(props.icon, 20)}
				</masonview>
			) : null}
			<masonview style={mergeStyle({ flexDirection: 'column', flexGrow: 1 }, { display: 'flex' })}>
				<Text className="vx-topnavmegamenu-item-title">{props.title}</Text>
				{props.description != null ? (
					<Text className="vx-topnavmegamenu-item-desc">{props.description}</Text>
				) : null}
			</masonview>
		</masonview>
	</Pressable>
}

/** TopNavMegaMenuFeaturedCard — the marketing card inside a mega menu's
 *  featured panel. */
export function TopNavMegaMenuFeaturedCard(props: TopNavMegaMenuFeaturedCardProps) @{
	<masonview
		ref={(v: any) => applyEscapeProps(v, props)}
		id={props.id}
		className={cx('vx-topnavmegamenu-card', props.className)}
		style={mergeStyle({ display: 'flex' }, props.style)}
	>
		{props.image != null ? (
			<Image src={props.image} className="vx-topnavmegamenu-card-image" />
		) : null}
		<masonview
			className="vx-topnavmegamenu-card-body"
			style={mergeStyle({ flexDirection: 'column' }, { display: 'flex' })}
		>
			<Text className="vx-topnavmegamenu-card-title">{props.title}</Text>
			{props.description != null ? (
				<Text className="vx-topnavmegamenu-card-desc">{props.description}</Text>
			) : null}
			{props.linkHref != null && props.linkLabel != null ? (
				<Pressable onPress={() => followHref(props.linkHref!)}>
					<Text className="vx-topnavmegamenu-card-link">{props.linkLabel}</Text>
				</Pressable>
			) : null}
			{props.children}
		</masonview>
	</masonview>
}
