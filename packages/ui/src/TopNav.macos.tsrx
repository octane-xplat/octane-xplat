/** @jsxImportSource @octane-xplat/macos-renderer */
import { mergeStyle } from './style-merge'
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

import { cx } from '@octane-xplat/lib';
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
		<masonview id={props.id} flexDirection="row" alignItems="center" className={cx('vx-topnav', 'vx-topnav--mobilebar', props.className)} style={mergeStyle({display: "flex"}, props.style)} accessibilityLabel={label}>
			{props.heading}
			<masonview className="vx-topnav-mobilebar-end" flexDirection="row" alignItems="center" flexGrow={1} justifyContent="flex-end" style={{display: "flex"}}>
				{props.endContent}
			</masonview>
			<MobileNavToggle />
		</masonview>
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
				<masonview id={props.id} className={cx('vx-topnav', 'vx-topnav--grid', props.className)} style={mergeStyle({display: "grid", gridTemplateColumns: "1fr auto 1fr"}, props.style)} accessibilityLabel={label}>
					<TopNavSlotProvider value="start">
						<masonview col={0} flexDirection="row" alignItems="center" className="vx-topnav-start" style={{display: "flex"}}>
							{props.heading}
							{startContent}
						</masonview>
					</TopNavSlotProvider>
					<TopNavSlotProvider value="center">
						<masonview col={1} flexDirection="row" alignItems="center" justifyContent="center" className="vx-topnav-center" style={{display: "flex"}}>
							{props.centerContent}
						</masonview>
					</TopNavSlotProvider>
					<TopNavSlotProvider value="end">
						<masonview col={2} flexDirection="row" alignItems="center" justifyContent="flex-end" className="vx-topnav-end" style={{display: "flex"}}>
							{props.endContent}
						</masonview>
					</TopNavSlotProvider>
				</masonview>
			} @else {
				<masonview id={props.id} flexDirection="row" alignItems="center" className={cx('vx-topnav', props.className)} style={mergeStyle({display: "flex"}, props.style)} accessibilityLabel={label}>
					<TopNavSlotProvider value="start">
						<masonview flexDirection="row" alignItems="center" flexGrow={1} className="vx-topnav-start" style={{display: "flex"}}>
							{props.heading}
							{startContent}
						</masonview>
					</TopNavSlotProvider>
					<TopNavSlotProvider value="end">
						<masonview flexDirection="row" alignItems="center" justifyContent="flex-end" className="vx-topnav-end" style={{display: "flex"}}>
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
			<masonview className="vx-topnav-heading-logo" style={{display: "flex"}}>{props.logo}</masonview>
		</Pressable>
	) : null;

	<masonview id={props.id} flexDirection="row" alignItems="center" className={cx('vx-topnav-heading', props.className)} style={mergeStyle({display: "flex"}, props.style)}>
		{headerIsTrigger ? (
			<Pressable
				ref={(v: any) => { anchor.current = v; }}
				className="vx-topnav-heading-trigger"
				onPress={() => setMenuOpen(!menuOpen)}
				accessibilityLabel={props.heading ?? props.logoLabel}
			>
				<masonview flexDirection="row" alignItems="center" gap={8} style={{display: "flex"}}>
					{logo}
					<masonview flexDirection="column" style={{display: "flex"}}>{lines}</masonview>
					<Icon name="xplat-chevron-down" size={16} />
				</masonview>
			</Pressable>
		) : (
			<>
				{logo}
				<masonview flexDirection="column" style={{display: "flex"}}>{lines}</masonview>
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
	</masonview>
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
		<masonview flexDirection="row" alignItems="center" gap={6} style={{display: "flex"}}>
			{props.icon != null ? <masonview className="vx-topnav-item-icon" style={{display: "flex"}}>{navIcon(props.icon)}</masonview> : null}
			{props.isIconOnly ? null : (props.children ?? <Text className="vx-topnav-item-label">{props.label}</Text>)}
		</masonview>
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
			<masonview flexDirection="row" alignItems="center" gap={4} style={{display: "flex"}}>
				<Text className="vx-topnav-item-label">{props.label}</Text>
				<Icon name={open ? 'xplat-chevron-up' : 'xplat-chevron-down'} size={16} />
			</masonview>
		</Pressable>
		<Popover anchor={anchor} open={open} placement="bottom" onDismiss={() => setOpen(false)} className="vx-topnavmenu-pop">
			<masonview flexDirection="column" className="vx-topnavmenu" style={{display: "flex"}}>
				@for (const item of props.items; key item.title) {
					<Pressable className="vx-topnavmenu-item" onPress={() => pick(item)}>
						<masonview flexDirection="row" alignItems="center" gap={8} style={{display: "flex"}}>
							{item.icon != null ? <masonview className="vx-topnavmenu-item-icon" style={{display: "flex"}}>{navIcon(item.icon)}</masonview> : null}
							<masonview flexDirection="column" flexGrow={1} style={{display: "flex"}}>
								<Text className="vx-topnavmenu-item-title">{item.title}</Text>
								{item.description != null ? <Text className="vx-topnavmenu-item-desc">{item.description}</Text> : null}
							</masonview>
						</masonview>
					</Pressable>
				}
			</masonview>
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
			<masonview flexDirection="row" alignItems="center" gap={4} style={{display: "flex"}}>
				<Text className="vx-topnav-item-label">{props.label}</Text>
				<Icon name={open ? 'xplat-chevron-up' : 'xplat-chevron-down'} size={16} />
			</masonview>
		</Pressable>
		<Popover anchor={anchor} open={open} placement="bottom" onDismiss={() => setOpenTracked(false)} className="vx-topnavmegamenu-pop">
			<masonview flexDirection="row" className="vx-topnavmegamenu" style={{display: "flex"}}>
				<masonview flexDirection="column" className="vx-topnavmegamenu-items" style={{display: "flex"}}>{props.items}</masonview>
				{props.featured != null ? <masonview className="vx-topnavmegamenu-featured" style={{display: "flex"}}>{props.featured}</masonview> : null}
			</masonview>
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
		<masonview flexDirection="row" alignItems="center" gap={8} style={{display: "flex"}}>
			{props.icon != null ? <masonview className="vx-topnavmegamenu-item-icon" style={{display: "flex"}}>{navIcon(props.icon, 20)}</masonview> : null}
			<masonview flexDirection="column" flexGrow={1} style={{display: "flex"}}>
				<Text className="vx-topnavmegamenu-item-title">{props.title}</Text>
				{props.description != null ? <Text className="vx-topnavmegamenu-item-desc">{props.description}</Text> : null}
			</masonview>
		</masonview>
	</Pressable>
}

/** TopNavMegaMenuFeaturedCard — the marketing card inside a mega menu's
 *  featured panel. */
export function TopNavMegaMenuFeaturedCard(props: TopNavMegaMenuFeaturedCardProps) @{
	<masonview id={props.id} flexDirection="column" className={cx('vx-topnavmegamenu-card', props.className)} style={mergeStyle({display: "flex"}, props.style)}>
		{props.image != null ? <Image src={props.image} className="vx-topnavmegamenu-card-image" /> : null}
		<masonview flexDirection="column" className="vx-topnavmegamenu-card-body" style={{display: "flex"}}>
			<Text className="vx-topnavmegamenu-card-title">{props.title}</Text>
			{props.description != null ? <Text className="vx-topnavmegamenu-card-desc">{props.description}</Text> : null}
			{props.linkHref != null && props.linkLabel != null ? (
				<Pressable onPress={() => followHref(props.linkHref!)}>
					<Text className="vx-topnavmegamenu-card-link">{props.linkLabel}</Text>
				</Pressable>
			) : null}
			{props.children}
		</masonview>
	</masonview>
}
