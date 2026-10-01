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

import { applyEscapeProps } from './escape-props';
import { Icon } from './Icon.web.tsrx';
import { Text } from './Text.web.tsrx';
import { Popover } from './Popover.web.tsrx';
import { MobileNav, MobileNavToggle } from './MobileNav.web.tsrx';
import {
	AppShellMobileContext,
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

/** TopNav — the app's top navigation bar. Three render modes: `default`
 *  (full bar), `mobile-bar` (heading + end + toggle, set by AppShell below
 *  the breakpoint), and `drawer` (content inside the MobileNav overlay). */
export function TopNav(props: TopNavProps) @{
	const renderMode = useTopNavRenderMode();
	const mobileContent = useTopNavMobileContent();
	const label = props.label ?? 'Top navigation';
	const startContent = props.startContent ?? props.children;
	const hasCenter = props.centerContent != null;

	@if (renderMode === 'mobile-bar') {
		<nav
			ref={(el: any) => applyEscapeProps(el, props)}
			id={props.id}
			className={['vx-topnav', 'vx-topnav--mobilebar', props.className]}
			style={props.style}
			aria-label={label}
		>
			{props.heading}
			<span className="vx-topnav-mobilebar-end">{props.endContent}</span>
			<MobileNavToggle />
		</nav>
	} @else {
		@if (renderMode === 'drawer') {
			<MobileNav label={label} className={['vx-topnav', 'vx-topnav--drawer', props.className]} style={props.style}>
				{props.heading}
				{startContent}
				{props.centerContent}
				{props.endContent}
				{mobileContent}
			</MobileNav>
		} @else {
			<nav
				ref={(el: any) => applyEscapeProps(el, props)}
				id={props.id}
				className={['vx-topnav', hasCenter && 'vx-topnav--grid', props.className]}
				style={props.style}
				aria-label={label}
			>
				<TopNavSlotProvider value="start">
					<div className="vx-topnav-start">
						{props.heading}
						{startContent}
					</div>
				</TopNavSlotProvider>
				{hasCenter ? (
					<TopNavSlotProvider value="center">
						<div className="vx-topnav-center">{props.centerContent}</div>
					</TopNavSlotProvider>
				) : null}
				<TopNavSlotProvider value="end">
					<div className="vx-topnav-end">{props.endContent}</div>
				</TopNavSlotProvider>
			</nav>
		}
	}
}

/** TopNavHeading — the brand block: logo + heading link with optional
 *  super/subheading lines and an optional heading menu popover. */
export function TopNavHeading(props: TopNavHeadingProps) @{
	const anchor = useRef<any>(null);
	const [menuOpen, setMenuOpen] = useState(false);
	const renderMode = useTopNavRenderMode();
	const hasLinks = !!(props.headingHref || props.superheadingHref || props.subheadingHref);
	const hasMenu = props.menu != null;
	const headerIsTrigger = hasMenu && !hasLinks;
	const closeMenu = useCallback(() => setMenuOpen(false), []);
	const closeCtx = useMemo(() => ({ closeMenu }), [closeMenu]);

	const LinkEl: any = props.as ?? 'a';
	const headingLink = props.heading ? (
		<LinkEl className="vx-topnav-heading-title" href={props.headingHref}>{props.heading}</LinkEl>
	) : null;

	const superLink = props.superheading ? (
		<LinkEl className="vx-topnav-heading-super" href={props.superheadingHref}>{props.superheading}</LinkEl>
	) : null;

	const subLink = props.subheading ? (
		<LinkEl className="vx-topnav-heading-sub" href={props.subheadingHref}>{props.subheading}</LinkEl>
	) : null;

	const lines = (
		<>
			{superLink}
			{headingLink}
			{subLink}
		</>
	);

	<div
		ref={(el: any) => applyEscapeProps(el, props)}
		id={props.id}
		className={['vx-topnav-heading', props.className]}
		style={props.style}
	>
		{headerIsTrigger ? (
			<button
				type="button"
				className="vx-topnav-heading-trigger"
				ref={(el: any) => { anchor.current = el; }}
				aria-haspopup="menu"
				aria-expanded={hasMenu ? menuOpen : undefined}
				onClick={() => setMenuOpen(!menuOpen)}
			>
				{props.logo != null ? <span className="vx-topnav-heading-logo" aria-label={props.logoLabel}>{props.logo}</span> : null}
				<span className="vx-topnav-heading-text">{lines}</span>
				<Icon name="xplat-chevron-down" size={16} />
			</button>
		) : (
			<>
				{props.logo != null ? (
					props.headingHref != null ? (
						<LinkEl className="vx-topnav-heading-logo" href={props.headingHref} aria-label={props.logoLabel}>{props.logo}</LinkEl>
					) : (
						<span className="vx-topnav-heading-logo" aria-label={props.logoLabel}>{props.logo}</span>
					)
				) : null}
				<span className="vx-topnav-heading-text">{lines}</span>
			</>
		)}
		{hasMenu && !headerIsTrigger ? (
			<button
				type="button"
				className="vx-topnav-heading-menubtn"
				ref={(el: any) => { anchor.current = el; }}
				aria-haspopup="menu"
				aria-expanded={menuOpen}
				aria-label="Open heading menu"
				onClick={() => setMenuOpen(!menuOpen)}
			>
				<Icon name="xplat-chevron-down" size={16} />
			</button>
		) : null}
		{props.headerEndContent}
		<NavHeadingCloseProvider value={closeCtx}>
			<Popover anchor={anchor} open={menuOpen} placement="bottom" onDismiss={() => setMenuOpen(false)} className="vx-headingmenu-pop">
				{props.menu}
			</Popover>
		</NavHeadingCloseProvider>
	</div>
}

/** TopNavItem — one nav link in the bar (start/center/end slots); in the
 *  drawer render mode it stretches to a full-width row. */
export function TopNavItem(props: TopNavItemProps) @{
	const renderMode = useTopNavRenderMode();
	const slot = useTopNavSlot();
	const isDrawer = renderMode === 'drawer';
	const isDisabled = props.isDisabled ?? false;
	const size = props.size ?? 'md';

	const activate = (e: any) => {
		if (isDisabled) {
			e?.preventDefault?.();
			return;
		}

		props.onClick?.();
	};

	const cls = [
		'vx-topnav-item',
		'vx-topnav-item--' + size,
		isDrawer && 'vx-topnav-item--drawer',
		props.isSelected && 'vx-topnav-item--selected',
		props.isIconOnly && 'vx-topnav-item--icon',
		isDisabled && 'vx-topnav-item--disabled',
		props.className,
	];

	const content = (
		<>
			{props.icon != null ? <span className="vx-topnav-item-icon" aria-hidden="true">{navIcon(props.icon)}</span> : null}
			{props.isIconOnly ? null : (props.children ?? <span className="vx-topnav-item-label">{props.label}</span>)}
		</>
	);

	const shared: any = {
		id: props.id,
		className: cls,
		style: props.style,
		'aria-current': props.isSelected ? 'page' : undefined,
		'aria-disabled': isDisabled || undefined,
		'aria-label': props.isIconOnly ? props.label : undefined,
		onClick: activate,
	};

	const ItemEl: any = props.href != null && !isDisabled ? (props.as ?? 'a') : 'button';

	@if (props.href != null && !isDisabled) {
		<ItemEl
			{...shared}
			href={props.href}
			target={props.target}
			rel={props.rel}
			download={props.download}
			referrerPolicy={props.referrerPolicy}
			ref={(el: any) => applyEscapeProps(el, props)}
		>
			{content}
		</ItemEl>
	} @else {
		<button
			{...shared}
			type="button"
			disabled={isDisabled}
			ref={(el: any) => applyEscapeProps(el, props)}
		>
			{content}
		</button>
	}
}

/** TopNavMenu — trigger that opens a list popover on hover or press. */
export function TopNavMenu(props: TopNavMenuProps) @{
	const anchor = useRef<any>(null);
	const [open, setOpen] = useState(false);
	const delay = props.delay ?? 150;
	const hideDelay = props.hideDelay ?? 200;
	const showTimer = useRef<any>(null);
	const hideTimer = useRef<any>(null);

	const show = () => {
		clearTimeout(hideTimer.current);
		clearTimeout(showTimer.current);
		showTimer.current = setTimeout(() => setOpen(true), delay);
	};

	const hide = () => {
		clearTimeout(showTimer.current);
		clearTimeout(hideTimer.current);
		hideTimer.current = setTimeout(() => setOpen(false), hideDelay);
	};

	const toggle = () => {
		clearTimeout(showTimer.current);
		clearTimeout(hideTimer.current);
		setOpen(!open);
	};

	<>
		<button
			ref={(el: any) => { anchor.current = el; applyEscapeProps(el, props); }}
			id={props.id}
			type="button"
			className={['vx-topnav-item', 'vx-topnavmenu-trigger', props.className]}
			style={props.style}
			aria-haspopup="menu"
			aria-expanded={open}
			onMouseEnter={show}
			onMouseLeave={hide}
			onClick={toggle}
		>
			<span className="vx-topnav-item-label">{props.label}</span>
			<Icon name="xplat-chevron-down" size={16} />
		</button>
		<Popover anchor={anchor} open={open} placement="bottom" onDismiss={() => setOpen(false)} className="vx-topnavmenu-pop">
			<div className="vx-topnavmenu" role="menu" onMouseEnter={() => clearTimeout(hideTimer.current)} onMouseLeave={hide}>
				@for (const item of props.items; key item.title) {
					<a
						className="vx-topnavmenu-item"
						role="menuitem"
						href={item.href}
						tabIndex={-1}
						onClick={(e: any) => {
							item.onClick?.();
							if (!item.href) followItemHref(e, item.href);
							setOpen(false);
						}}
					>
						{item.icon != null ? <span className="vx-topnavmenu-item-icon">{navIcon(item.icon)}</span> : null}
						<span className="vx-topnavmenu-item-text">
							<span className="vx-topnavmenu-item-title">{item.title}</span>
							{item.description != null ? <span className="vx-topnavmenu-item-desc">{item.description}</span> : null}
						</span>
					</a>
				}
			</div>
		</Popover>
	</>
}

function followItemHref(_e: any, _href?: string) {
	// Anchors navigate natively; only needed when a custom element intercepts.
}

/** TopNavMegaMenu — trigger opening a wide panel with an items grid plus an
 *  optional featured panel. */
export function TopNavMegaMenu(props: TopNavMegaMenuProps) @{
	const anchor = useRef<any>(null);
	const [open, setOpen] = useState(false);
	const delay = props.delay ?? 150;
	const hideDelay = props.hideDelay ?? 250;
	const showTimer = useRef<any>(null);
	const hideTimer = useRef<any>(null);

	const setOpenTracked = (next: boolean) => {
		if (next !== open) props.onOpenChange?.(next);
		setOpen(next);
	};

	const show = () => {
		clearTimeout(hideTimer.current);
		clearTimeout(showTimer.current);
		showTimer.current = setTimeout(() => setOpenTracked(true), delay);
	};

	const hide = () => {
		clearTimeout(showTimer.current);
		clearTimeout(hideTimer.current);
		hideTimer.current = setTimeout(() => setOpenTracked(false), hideDelay);
	};

	const toggle = () => {
		clearTimeout(showTimer.current);
		clearTimeout(hideTimer.current);
		setOpenTracked(!open);
	};

	<>
		<button
			ref={(el: any) => { anchor.current = el; applyEscapeProps(el, props); }}
			id={props.id}
			type="button"
			className={['vx-topnav-item', 'vx-topnavmegamenu-trigger', props.className]}
			style={props.style}
			aria-haspopup="menu"
			aria-expanded={open}
			onMouseEnter={show}
			onMouseLeave={hide}
			onClick={toggle}
		>
			<span className="vx-topnav-item-label">{props.label}</span>
			<Icon name="xplat-chevron-down" size={16} />
		</button>
		<Popover anchor={anchor} open={open} placement="bottom" onDismiss={() => setOpenTracked(false)} className="vx-topnavmegamenu-pop">
			<div className="vx-topnavmegamenu" role="menu" onMouseEnter={() => clearTimeout(hideTimer.current)} onMouseLeave={hide}>
				<div className="vx-topnavmegamenu-items" role="none">{props.items}</div>
				{props.featured != null ? <div className="vx-topnavmegamenu-featured">{props.featured}</div> : null}
			</div>
		</Popover>
	</>
}

/** TopNavMegaMenuItem — one link in the mega menu items grid. */
export function TopNavMegaMenuItem(props: TopNavMegaMenuItemProps) @{
	const LinkEl: any = props.as ?? 'a';
	const ItemEl: any = props.href != null ? LinkEl : 'button';

	<ItemEl
		ref={(el: any) => applyEscapeProps(el, props)}
		id={props.id}
		className={['vx-topnavmegamenu-item', props.className]}
		style={props.style}
		role="menuitem"
		tabIndex={-1}
		href={props.href}
		type={props.href == null ? 'button' : undefined}
		onClick={props.onClick}
	>
		{props.icon != null ? <span className="vx-topnavmegamenu-item-icon">{navIcon(props.icon, 20)}</span> : null}
		<span className="vx-topnavmegamenu-item-text">
			<span className="vx-topnavmegamenu-item-title">{props.title}</span>
			{props.description != null ? <span className="vx-topnavmegamenu-item-desc">{props.description}</span> : null}
		</span>
	</ItemEl>
}

/** TopNavMegaMenuFeaturedCard — the marketing card inside a mega menu's
 *  featured panel. */
export function TopNavMegaMenuFeaturedCard(props: TopNavMegaMenuFeaturedCardProps) @{
	<div
		ref={(el: any) => applyEscapeProps(el, props)}
		id={props.id}
		className={['vx-topnavmegamenu-card', props.className]}
		style={props.style}
	>
		{props.image != null ? <img className="vx-topnavmegamenu-card-image" src={props.image} alt={props.imageAlt ?? ''} /> : null}
		<div className="vx-topnavmegamenu-card-body">
			<Text className="vx-topnavmegamenu-card-title">{props.title}</Text>
			{props.description != null ? <Text className="vx-topnavmegamenu-card-desc">{props.description}</Text> : null}
			{props.linkHref != null && props.linkLabel != null ? (
				<a className="vx-topnavmegamenu-card-link" href={props.linkHref}>{props.linkLabel}</a>
			) : null}
			{props.children}
		</div>
	</div>
}
