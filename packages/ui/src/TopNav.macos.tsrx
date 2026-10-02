/** @jsxImportSource @octane-xplat/macos-renderer */
import { useCallback, useContext, useMemo, useRef, useState } from 'octane';
import type {
	TopNavHeadingProps,
	TopNavItemProps,
	TopNavMenuProps,
	TopNavMegaMenuProps,
	TopNavMegaMenuItemProps,
	TopNavMegaMenuFeaturedCardProps,
	TopNavProps,
} from './props';

import { cx } from './cx';
import { Icon } from './Icon.macos.tsrx';
import { Text } from './Text.macos.tsrx';
import { Image } from './Image.macos.tsrx';
import { Pressable } from './Pressable.macos.tsrx';
import { Popover } from './Popover.macos.tsrx';
import { MobileNav, MobileNavToggle } from './MobileNav.macos.tsrx';
import { followHref } from './nav-href';
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
} from './nav-contexts';

export { TopNavRenderContext, TopNavSlotContext, TopNavMobileContentContext, useTopNavRenderMode, useTopNavSlot, useTopNavMobileContent };

function navIcon(icon: any, size = 16) {
	return typeof icon === 'string' ? <Icon name={icon} size={size} /> : icon;
}

/** TopNav — the app's top navigation bar. Native leaf: the same three
 *  render modes — `default` full bar, `mobile-bar` (heading + end +
 *  toggle), `drawer` (content inside MobileNav). Hover-driven menus open on
 *  tap on pointer platforms. */
export function TopNav(props: TopNavProps) @{
	const renderMode = useTopNavRenderMode();
	const mobileContent = useTopNavMobileContent();
	const label = props.label ?? 'Top navigation';
	const startContent = props.startContent ?? props.children;
	const hasCenter = props.centerContent != null;

	@if (renderMode === 'mobile-bar') {
		<flexboxlayout
			id={props.id}
			flexDirection="row"
			alignItems="center"
			className={cx('vx-topnav', 'vx-topnav--mobilebar', props.className)}
			style={props.style}
			accessibilityLabel={label}
		>
			{props.heading}
			<flexboxlayout className="vx-topnav-mobilebar-end" flexDirection="row" alignItems="center" flexGrow={1} justifyContent="flex-end">
				{props.endContent}
			</flexboxlayout>
			<MobileNavToggle />
		</flexboxlayout>
	} @else {
		@if (renderMode === 'drawer') {
			<MobileNav label={label} className={cx('vx-topnav', 'vx-topnav--drawer', props.className)} style={props.style}>
				{props.heading}
				{startContent}
				{props.centerContent}
				{props.endContent}
				{mobileContent}
			</MobileNav>
		} @else {
			@if (hasCenter) {
				<gridlayout
					columns="*,auto,*"
					id={props.id}
					className={cx('vx-topnav', 'vx-topnav--grid', props.className)}
					style={props.style}
					accessibilityLabel={label}
				>
					<TopNavSlotProvider value="start">
						<flexboxlayout col={0} flexDirection="row" alignItems="center" className="vx-topnav-start">
							{props.heading}
							{startContent}
						</flexboxlayout>
					</TopNavSlotProvider>
					<TopNavSlotProvider value="center">
						<flexboxlayout col={1} flexDirection="row" alignItems="center" justifyContent="center" className="vx-topnav-center">
							{props.centerContent}
						</flexboxlayout>
					</TopNavSlotProvider>
					<TopNavSlotProvider value="end">
						<flexboxlayout col={2} flexDirection="row" alignItems="center" justifyContent="flex-end" className="vx-topnav-end">
							{props.endContent}
						</flexboxlayout>
					</TopNavSlotProvider>
				</gridlayout>
			} @else {
				<flexboxlayout
					id={props.id}
					flexDirection="row"
					alignItems="center"
					className={cx('vx-topnav', props.className)}
					style={props.style}
					accessibilityLabel={label}
				>
					<TopNavSlotProvider value="start">
						<flexboxlayout flexDirection="row" alignItems="center" flexGrow={1} className="vx-topnav-start">
							{props.heading}
							{startContent}
						</flexboxlayout>
					</TopNavSlotProvider>
					<TopNavSlotProvider value="end">
						<flexboxlayout flexDirection="row" alignItems="center" justifyContent="flex-end" className="vx-topnav-end">
							{props.endContent}
						</flexboxlayout>
					</TopNavSlotProvider>
				</flexboxlayout>
			}
		}
	}
}

/** TopNavHeading — the brand block: logo + heading link with optional
 *  super/subheading lines and an optional heading menu popover. */
export function TopNavHeading(props: TopNavHeadingProps) @{
	const anchor = useRef<any>(null);
	const [menuOpen, setMenuOpen] = useState(false);
	const hasLinks = !!(props.headingHref || props.superheadingHref || props.subheadingHref);
	const hasMenu = props.menu != null;
	const headerIsTrigger = hasMenu && !hasLinks;
	const closeMenu = useCallback(() => setMenuOpen(false), []);
	const closeCtx = useMemo(() => ({ closeMenu }), [closeMenu]);

	const activate = (href?: string) => {
		if (href) followHref(href);
	};

	const lines = (
		<>
			{props.superheading ? (
				<Pressable disabled={!props.superheadingHref} onPress={() => activate(props.superheadingHref)}>
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
	);

	const logo = props.logo != null ? (
		<Pressable disabled={!props.headingHref} accessibilityLabel={props.logoLabel} onPress={() => activate(props.headingHref)}>
			<flexboxlayout className="vx-topnav-heading-logo">{props.logo}</flexboxlayout>
		</Pressable>
	) : null;

	<flexboxlayout
		id={props.id}
		flexDirection="row"
		alignItems="center"
		className={cx('vx-topnav-heading', props.className)}
		style={props.style}
	>
		{headerIsTrigger ? (
			<Pressable
				ref={(v: any) => { anchor.current = v; }}
				className="vx-topnav-heading-trigger"
				onPress={() => setMenuOpen(!menuOpen)}
				accessibilityLabel={props.heading ?? props.logoLabel}
			>
				<flexboxlayout flexDirection="row" alignItems="center" gap={8}>
					{logo}
					<flexboxlayout flexDirection="column">{lines}</flexboxlayout>
					<Icon name="xplat-chevron-down" size={16} />
				</flexboxlayout>
			</Pressable>
		) : (
			<>
				{logo}
				<flexboxlayout flexDirection="column">{lines}</flexboxlayout>
			</>
		)}
		{hasMenu && !headerIsTrigger ? (
			<Pressable
				ref={(v: any) => { anchor.current = v; }}
				className="vx-topnav-heading-menubtn"
				onPress={() => setMenuOpen(!menuOpen)}
				accessibilityLabel="Open heading menu"
			>
				<Icon name="xplat-chevron-down" size={16} />
			</Pressable>
		) : null}
		{props.headerEndContent}
		<NavHeadingCloseProvider value={closeCtx}>
			<Popover anchor={anchor} open={menuOpen} placement="bottom" onDismiss={() => setMenuOpen(false)} className="vx-headingmenu-pop">
				{props.menu}
			</Popover>
		</NavHeadingCloseProvider>
	</flexboxlayout>
}

/** TopNavItem — one nav link in the bar. Native leaf: Pressable rows;
 *  `href` routes through `followHref`. */
export function TopNavItem(props: TopNavItemProps) @{
	const renderMode = useTopNavRenderMode();
	const isDrawer = renderMode === 'drawer';
	const isDisabled = props.isDisabled ?? false;
	const size = props.size ?? 'md';

	const activate = () => {
		if (isDisabled) return;
		props.onClick?.();
		if (props.href) followHref(props.href);
	};

	<Pressable

		id={props.id}
		className={cx('vx-topnav-item', 'vx-topnav-item--' + size, isDrawer && 'vx-topnav-item--drawer', props.isSelected && 'vx-topnav-item--selected', props.isIconOnly && 'vx-topnav-item--icon', isDisabled && 'vx-topnav-item--disabled', props.className)}
		style={props.style}
		disabled={isDisabled}
		accessibilityRole="link"
		accessibilityLabel={props.isIconOnly ? props.label : undefined}
		accessibilityState={{ disabled: isDisabled, selected: props.isSelected }}
		onPress={activate}
	>
		<flexboxlayout flexDirection="row" alignItems="center" gap={6}>
			{props.icon != null ? <flexboxlayout className="vx-topnav-item-icon">{navIcon(props.icon)}</flexboxlayout> : null}
			{props.isIconOnly ? null : (props.children ?? <Text className="vx-topnav-item-label">{props.label}</Text>)}
		</flexboxlayout>
	</Pressable>
}

/** TopNavMenu — trigger that opens a list popover on press (hover platforms
 *  get hover intent in the web leaf). */
export function TopNavMenu(props: TopNavMenuProps) @{
	const anchor = useRef<any>(null);
	const [open, setOpen] = useState(false);

	const pick = (item: { href?: string; onClick?: () => void }) => {
		item.onClick?.();
		if (item.href) followHref(item.href);
		setOpen(false);
	};

	<>
		<Pressable
			ref={(v: any) => { anchor.current = v; }}
			id={props.id}
			className={cx('vx-topnav-item', 'vx-topnavmenu-trigger', props.className)}
			style={props.style}
			onPress={() => setOpen(!open)}
		>
			<flexboxlayout flexDirection="row" alignItems="center" gap={4}>
				<Text className="vx-topnav-item-label">{props.label}</Text>
				<Icon name={open ? 'xplat-chevron-up' : 'xplat-chevron-down'} size={16} />
			</flexboxlayout>
		</Pressable>
		<Popover anchor={anchor} open={open} placement="bottom" onDismiss={() => setOpen(false)} className="vx-topnavmenu-pop">
			<flexboxlayout flexDirection="column" className="vx-topnavmenu">
				@for (const item of props.items; key item.title) {
					<Pressable className="vx-topnavmenu-item" onPress={() => pick(item)}>
						<flexboxlayout flexDirection="row" alignItems="center" gap={8}>
							{item.icon != null ? <flexboxlayout className="vx-topnavmenu-item-icon">{navIcon(item.icon)}</flexboxlayout> : null}
							<flexboxlayout flexDirection="column" flexGrow={1}>
								<Text className="vx-topnavmenu-item-title">{item.title}</Text>
								{item.description != null ? <Text className="vx-topnavmenu-item-desc">{item.description}</Text> : null}
							</flexboxlayout>
						</flexboxlayout>
					</Pressable>
				}
			</flexboxlayout>
		</Popover>
	</>
}

/** TopNavMegaMenu — trigger opening a wide panel with an items grid plus an
 *  optional featured panel. Native leaf: a press-opened anchored popover. */
export function TopNavMegaMenu(props: TopNavMegaMenuProps) @{
	const anchor = useRef<any>(null);
	const [open, setOpen] = useState(false);

	const setOpenTracked = (next: boolean) => {
		if (next !== open) props.onOpenChange?.(next);
		setOpen(next);
	};

	<>
		<Pressable
			ref={(v: any) => { anchor.current = v; }}
			id={props.id}
			className={cx('vx-topnav-item', 'vx-topnavmegamenu-trigger', props.className)}
			style={props.style}
			onPress={() => setOpenTracked(!open)}
		>
			<flexboxlayout flexDirection="row" alignItems="center" gap={4}>
				<Text className="vx-topnav-item-label">{props.label}</Text>
				<Icon name={open ? 'xplat-chevron-up' : 'xplat-chevron-down'} size={16} />
			</flexboxlayout>
		</Pressable>
		<Popover anchor={anchor} open={open} placement="bottom" onDismiss={() => setOpenTracked(false)} className="vx-topnavmegamenu-pop">
			<flexboxlayout flexDirection="row" className="vx-topnavmegamenu">
				<flexboxlayout flexDirection="column" className="vx-topnavmegamenu-items">{props.items}</flexboxlayout>
				{props.featured != null ? <flexboxlayout className="vx-topnavmegamenu-featured">{props.featured}</flexboxlayout> : null}
			</flexboxlayout>
		</Popover>
	</>
}

/** TopNavMegaMenuItem — one link in the mega menu items grid. */
export function TopNavMegaMenuItem(props: TopNavMegaMenuItemProps) @{
	const activate = () => {
		props.onClick?.();
		if (props.href) followHref(props.href);
	};

	<Pressable

		id={props.id}
		className={cx('vx-topnavmegamenu-item', props.className)}
		style={props.style}
		accessibilityRole="link"
		onPress={activate}
	>
		<flexboxlayout flexDirection="row" alignItems="center" gap={8}>
			{props.icon != null ? <flexboxlayout className="vx-topnavmegamenu-item-icon">{navIcon(props.icon, 20)}</flexboxlayout> : null}
			<flexboxlayout flexDirection="column" flexGrow={1}>
				<Text className="vx-topnavmegamenu-item-title">{props.title}</Text>
				{props.description != null ? <Text className="vx-topnavmegamenu-item-desc">{props.description}</Text> : null}
			</flexboxlayout>
		</flexboxlayout>
	</Pressable>
}

/** TopNavMegaMenuFeaturedCard — the marketing card inside a mega menu's
 *  featured panel. */
export function TopNavMegaMenuFeaturedCard(props: TopNavMegaMenuFeaturedCardProps) @{
	<flexboxlayout
		id={props.id}
		flexDirection="column"
		className={cx('vx-topnavmegamenu-card', props.className)}
		style={props.style}
	>
		{props.image != null ? <Image src={props.image} className="vx-topnavmegamenu-card-image" /> : null}
		<flexboxlayout flexDirection="column" className="vx-topnavmegamenu-card-body">
			<Text className="vx-topnavmegamenu-card-title">{props.title}</Text>
			{props.description != null ? <Text className="vx-topnavmegamenu-card-desc">{props.description}</Text> : null}
			{props.linkHref != null && props.linkLabel != null ? (
				<Pressable onPress={() => followHref(props.linkHref!)}>
					<Text className="vx-topnavmegamenu-card-link">{props.linkLabel}</Text>
				</Pressable>
			) : null}
			{props.children}
		</flexboxlayout>
	</flexboxlayout>
}
