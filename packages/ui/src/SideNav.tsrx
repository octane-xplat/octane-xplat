/** @jsxImportSource @nativescript-community/octane */
import { useCallback, useContext, useMemo, useRef, useState } from 'octane';
import type {
	SideNavCollapseButtonProps,
	SideNavCollapseState,
	SideNavHeadingProps,
	SideNavItemProps,
	SideNavProps,
	SideNavSectionProps,
} from './props';

import { cx } from './cx';
import { applyEscapeProps } from './escape-props';
import { Icon } from './Icon.tsrx';
import { Text } from './Text.tsrx';
import { Pressable } from './Pressable.tsrx';
import { Popover } from './Popover.tsrx';
import { MobileNav } from './MobileNav.tsrx';
import { ResizeHandle } from './ResizeHandle.tsrx';
import { useResizable } from './useResizable.tsrx';
import { followHref } from './nav-href';
import { regionConfigFrom } from './resize-state';
import {
	NavHeadingCloseContext,
	SideNavCollapseContext,
	SideNavRenderContext,
	useSideNavCollapse,
	useSideNavRenderMode,
	SideNavCollapseProvider,
	NavHeadingCloseProvider,
} from './nav-contexts';

export { SideNavRenderContext, SideNavCollapseContext, useSideNavCollapse, useSideNavRenderMode };

const COLLAPSED_RAIL_WIDTH = 56;
const ITEM_HEIGHT: Record<string, number> = { sm: 28, md: 32, lg: 36 };

function navIcon(icon: any, size = 16) {
	return typeof icon === 'string' ? <Icon name={icon} size={size} /> : icon;
}

/** SideNav — the app's side navigation panel. Header/topContent are pinned,
 *  children scroll, footer/footerIcons pin to the bottom. Inside AppShell it
 *  adopts the render mode its context sets (topbar / drawer /
 *  drawer-content). */
export function SideNav(props: SideNavProps) @{
	const renderMode = useSideNavRenderMode();

	const cfg = props.collapsible === true ? {} : props.collapsible === false || props.collapsible == null ? undefined : props.collapsible;
	const isCollapsible = props.collapsible != null && props.collapsible !== false;
	const controlled = cfg?.isCollapsed !== undefined;
	const [uncontrolled, setUncontrolled] = useState(cfg?.defaultIsCollapsed ?? false);
	const collapsed = isCollapsible ? (controlled ? (cfg!.isCollapsed ?? false) : uncontrolled) : false;

	const toggle = useCallback(() => {
		const next = !collapsed;
		if (!controlled) setUncontrolled(next);
		cfg?.onCollapsedChange?.(next);
	}, [collapsed, controlled, cfg]);

	const collapseState = useMemo<SideNavCollapseState>(
		() => ({ isCollapsed: collapsed, toggle, isCollapsible }),
		[collapsed, toggle, isCollapsible],
	);

	if (props.handleRef) {
		props.handleRef.current = { getCollapseState: () => collapseState };
	}

	const resizeConfig = regionConfigFrom(props.resizable === false ? undefined : props.resizable);
	const resizableHook = useResizable(resizeConfig ?? { defaultSize: 0 });
	const showResizeHandle = resizeConfig != null && !collapsed;

	const drawerFooter = props.footer != null || props.footerIcons != null;

	@if (renderMode === 'topbar') {
		<flexboxlayout
			ref={(v: any) => applyEscapeProps(v, props)}
			id={props.id}
			flexDirection="row"
			alignItems="center"
			className={cx('vx-sidenav', 'vx-sidenav--topbar', props.className)}
			style={props.style}
		>
			{props.header}
			<flexboxlayout className="vx-sidenav-topbar-icons" flexDirection="row" alignItems="center" justifyContent="flex-end" flexGrow={1}>
				{props.footerIcons}
			</flexboxlayout>
		</flexboxlayout>
	} @else {
		@if (renderMode === 'drawer') {
			<MobileNav header={props.header} id={props.id} className={cx('vx-sidenav', 'vx-sidenav--drawer', props.className)} style={props.style}>
				{props.topContent}
				{props.children}
				{drawerFooter ? (
					<flexboxlayout className="vx-sidenav-drawerfooter" flexDirection="column">
						{props.footer}
						{props.footerIcons != null ? <flexboxlayout className="vx-sidenav-drawericons" flexDirection="row">{props.footerIcons}</flexboxlayout> : null}
					</flexboxlayout>
				) : null}
			</MobileNav>
		} @else {
			@if (renderMode === 'drawer-content') {
				<>
					{props.topContent}
					{props.children}
					{drawerFooter ? (
						<flexboxlayout className="vx-sidenav-drawerfooter" flexDirection="column">
							{props.footer}
							{props.footerIcons != null ? <flexboxlayout className="vx-sidenav-drawericons" flexDirection="row">{props.footerIcons}</flexboxlayout> : null}
						</flexboxlayout>
					) : null}
				</>
			} @else {
				<SideNavCollapseProvider value={isCollapsible ? collapseState : null}>
					<gridlayout className="vx-sidenav-shell" style={{ width: collapsed ? COLLAPSED_RAIL_WIDTH : resizeConfig ? resizableHook.size : undefined }}>
						<flexboxlayout
							ref={(v: any) => applyEscapeProps(v, props)}
							id={props.id}
							flexDirection="column"
							className={cx('vx-sidenav', collapsed && 'vx-sidenav--collapsed', props.className)}
							style={props.style}
							accessibilityLabel={props.label ?? 'Side navigation'}
						>
							{props.header != null || props.topContent != null ? (
								<flexboxlayout className={cx('vx-sidenav-stickytop', collapsed && 'vx-sidenav-stickytop--collapsed')} flexDirection="column">
									{props.header}
									{props.topContent != null ? <flexboxlayout className="vx-sidenav-topcontent" flexDirection="column">{props.topContent}</flexboxlayout> : null}
								</flexboxlayout>
							) : null}
							<scrollview className="vx-sidenav-scrollable" flexGrow={1}>
								<flexboxlayout flexDirection="column">{props.children}</flexboxlayout>
							</scrollview>
							{props.footer != null || props.footerIcons != null || (isCollapsible && cfg?.hasButton !== false) ? (
								<flexboxlayout className={cx('vx-sidenav-stickybottom', collapsed && 'vx-sidenav-stickybottom--collapsed')} flexDirection="column">
									{props.footer}
									<flexboxlayout className={cx('vx-sidenav-footerrow', collapsed && 'vx-sidenav-footerrow--collapsed')} flexDirection={collapsed ? 'column' : 'row'} alignItems="center" justifyContent="flex-end">
										{isCollapsible && cfg?.hasButton !== false ? <SideNavCollapseButton /> : null}
										{props.footerIcons}
									</flexboxlayout>
								</flexboxlayout>
							) : null}
						</flexboxlayout>
						{showResizeHandle ? (
							<ResizeHandle
								direction="horizontal"
								position="overlay"
								pillPlacement="end"
								label="Resize sidebar"
								resizable={resizableHook.props}
							/>
						) : null}
					</gridlayout>
				</SideNavCollapseProvider>
			}
		}
	}
}

/** SideNavSection — titled group of items inside the scrollable area. */
export function SideNavSection(props: SideNavSectionProps) @{
	<flexboxlayout ref={(v: any) => applyEscapeProps(v, props)} id={props.id} flexDirection="column" className={cx('vx-sidenav-section', props.className)} style={props.style}>
		<flexboxlayout className={cx('vx-sidenav-section-head', props.isHeaderHidden && 'vx-visually-hidden')} flexDirection="row" alignItems="center" justifyContent="space-between">
			<flexboxlayout className="vx-sidenav-section-title-group" flexDirection="column">
				<Text className="vx-sidenav-section-title">{props.title}</Text>
				{props.subtitle != null ? <Text className="vx-sidenav-section-subtitle">{props.subtitle}</Text> : null}
			</flexboxlayout>
			{props.endContent}
		</flexboxlayout>
		<flexboxlayout className="vx-sidenav-section-items" flexDirection="column">{props.children}</flexboxlayout>
	</flexboxlayout>
}

/** SideNavHeading — identity block at the top of the rail. */
export function SideNavHeading(props: SideNavHeadingProps) @{
	const anchor = useRef<any>(null);
	const [menuOpen, setMenuOpen] = useState(false);
	const collapsed = useContext(SideNavCollapseContext)?.isCollapsed ?? false;

	const hasLinks = !!(props.headingHref || props.superheadingHref || props.subheadingHref);
	const hasMenu = props.menu != null;
	const headerIsTrigger = hasMenu && !hasLinks;
	const closeMenu = useCallback(() => setMenuOpen(false), []);
	const closeCtx = useMemo(() => ({ closeMenu }), [closeMenu]);

	const activateHeading = (href?: string) => {
		if (href) followHref(href);
	};

	<flexboxlayout
		ref={(v: any) => applyEscapeProps(v, props)}
		id={props.id}
		flexDirection="row"
		alignItems="center"
		className={cx('vx-sidenav-heading', headerIsTrigger && 'vx-sidenav-heading--button', collapsed && 'vx-sidenav-heading--collapsed', props.className)}
		style={props.style}
	>
		{headerIsTrigger ? (
			<Pressable
				ref={(v: any) => { anchor.current = v; }}
				className="vx-sidenav-heading-trigger"
				onPress={() => setMenuOpen(!menuOpen)}
				accessibilityLabel={props.heading}
				accessibilityHint="Open heading menu"
			>
				<flexboxlayout flexDirection="row" alignItems="center" gap={8} flexGrow={1}>
					{props.icon != null ? <flexboxlayout className="vx-sidenav-heading-icon">{navIcon(props.icon, 20)}</flexboxlayout> : null}
					<flexboxlayout flexDirection="column" flexGrow={1}>
						<Text className="vx-sidenav-heading-title">{props.heading}</Text>
					</flexboxlayout>
					<Icon name="xplat-chevron-down" size={16} />
				</flexboxlayout>
			</Pressable>
		) : (
			<>
				{props.icon != null ? <flexboxlayout className="vx-sidenav-heading-icon">{navIcon(props.icon, 20)}</flexboxlayout> : null}
				<flexboxlayout flexDirection="column" flexGrow={1}>
					{props.superheading ? (
						<Pressable disabled={!props.superheadingHref} onPress={() => activateHeading(props.superheadingHref)}>
							<Text className="vx-sidenav-heading-super">{props.superheading}</Text>
						</Pressable>
					) : null}
					<Pressable disabled={!props.headingHref} onPress={() => activateHeading(props.headingHref)}>
						<Text className="vx-sidenav-heading-title">{props.heading}</Text>
					</Pressable>
					{props.subheading ? (
						<Pressable disabled={!props.subheadingHref} onPress={() => activateHeading(props.subheadingHref)}>
							<Text className="vx-sidenav-heading-sub">{props.subheading}</Text>
						</Pressable>
					) : null}
				</flexboxlayout>
			</>
		)}
		{hasMenu && !headerIsTrigger ? (
			<Pressable
				ref={(v: any) => { anchor.current = v; }}
				className="vx-sidenav-heading-menubtn"
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

/** SideNavItem — one nav row. Native leaf: Pressable rows; `href` routes
 *  through `followHref`. Collapsed rail shows the icon and a flyout for
 *  children via the shared Popover. */
export function SideNavItem(props: SideNavItemProps) @{
	const renderMode = useSideNavRenderMode();
	const collapseCtx = useSideNavCollapse();
	const railCollapsed = collapseCtx?.isCollapsed === true && renderMode === 'default';
	const size = props.size ?? 'md';
	const hasChildren = props.children != null;

	const itemCfg = props.collapsible === true ? {} : typeof props.collapsible === 'object' ? props.collapsible : null;
	const itemControlled = itemCfg?.isCollapsed !== undefined;
	const [uncontrolledCollapsed, setUncontrolledCollapsed] = useState(itemCfg?.defaultIsCollapsed ?? false);
	const childrenCollapsed = hasChildren && itemCfg != null ? (itemControlled ? itemCfg!.isCollapsed! : uncontrolledCollapsed) : false;

	const toggleChildren = () => {
		const next = !childrenCollapsed;
		if (!itemControlled) setUncontrolledCollapsed(next);
		itemCfg?.onCollapsedChange?.(next);
	};

	const anchor = useRef<any>(null);
	const [flyoutOpen, setFlyoutOpen] = useState(false);

	const displayIcon = props.isSelected && props.selectedIcon != null ? props.selectedIcon : props.icon;
	const isDisabled = props.isDisabled ?? false;

	const activate = () => {
		if (isDisabled) return;
		props.onClick?.();
		if (props.href) followHref(props.href);
	};

	const pressMain = () => {
		if (railCollapsed && hasChildren) {
			setFlyoutOpen(!flyoutOpen);
			return;
		}

		activate();
	};

	<flexboxlayout ref={(v: any) => applyEscapeProps(v, props)} id={props.id} flexDirection="column" className={cx('vx-sidenav-item', props.className)} style={props.style}>
		<flexboxlayout className="vx-sidenav-item-row" flexDirection="row" alignItems="center" ref={(v: any) => { if (railCollapsed) anchor.current = v; }}>
			<Pressable
				className={cx('vx-sidenav-item-main', 'vx-sidenav-item--' + size, props.isSelected && 'vx-sidenav-item--selected', isDisabled && 'vx-sidenav-item--disabled', railCollapsed && 'vx-sidenav-item--rail')}
				style={{ minHeight: ITEM_HEIGHT[size] }}
				disabled={isDisabled}
				accessibilityRole="link"
				accessibilityLabel={railCollapsed ? props.label : undefined}
				accessibilityState={{ disabled: isDisabled, selected: props.isSelected }}
				onPress={pressMain}
			>
				<flexboxlayout flexDirection="row" alignItems="center" gap={8} flexGrow={1}>
					{displayIcon != null ? <flexboxlayout className="vx-sidenav-item-icon">{navIcon(displayIcon, size === 'lg' ? 18 : size === 'sm' ? 14 : 16)}</flexboxlayout> : null}
					{!railCollapsed ? <Text className="vx-sidenav-item-label" flexGrow={1}>{props.label}</Text> : null}
					{!railCollapsed && props.endContent != null ? <flexboxlayout className="vx-sidenav-item-end">{props.endContent}</flexboxlayout> : null}
				</flexboxlayout>
			</Pressable>
			{hasChildren && itemCfg != null && !railCollapsed ? (
				<Pressable
					className="vx-sidenav-item-toggle"
					onPress={toggleChildren}
					accessibilityLabel={childrenCollapsed ? 'Expand' : 'Collapse'}
				>
					<Icon name={childrenCollapsed ? 'xplat-chevron-right' : 'xplat-chevron-down'} size={16} />
				</Pressable>
			) : null}
			{!railCollapsed && props.actions != null ? <flexboxlayout className="vx-sidenav-item-actions" flexDirection="row">{props.actions}</flexboxlayout> : null}
		</flexboxlayout>
		{hasChildren && !railCollapsed && !childrenCollapsed ? (
			<flexboxlayout className="vx-sidenav-item-children" flexDirection="column" style={{ paddingLeft: 24 }}>{props.children}</flexboxlayout>
		) : null}
		{railCollapsed && hasChildren ? (
			<Popover anchor={anchor} open={flyoutOpen} placement="right" onDismiss={() => setFlyoutOpen(false)} className="vx-sidenav-flyout">
				<flexboxlayout className="vx-sidenav-flyout-list" flexDirection="column">{props.children}</flexboxlayout>
			</Popover>
		) : null}
	</flexboxlayout>
}

/** SideNavCollapseButton — chevron control bound to the nearest
 *  SideNavCollapseContext. */
export function SideNavCollapseButton(props: SideNavCollapseButtonProps) @{
	const ctx = useSideNavCollapse();
	const extCfg = props.collapsible;
	const extHandle = props.handleRef?.current?.getCollapseState();
	const external: SideNavCollapseState | null = extCfg
		? { isCollapsed: extCfg.isCollapsed, toggle: () => extCfg.onCollapsedChange(!extCfg.isCollapsed), isCollapsible: true }
		: (extHandle ?? null);

	const isCollapsible = ctx?.isCollapsible ?? external?.isCollapsible ?? true;
	const isCollapsed = ctx?.isCollapsed ?? external?.isCollapsed ?? false;
	const toggle = ctx?.toggle ?? external?.toggle ?? (() => {});

	@if (!isCollapsible) {
		null
	} @else {
		<Pressable
			ref={(v: any) => applyEscapeProps(v, props)}
			id={props.id}
			className={cx('vx-sidenav-collapsebtn', props.label == null && 'vx-sidenav-collapsebtn--icon', props.className)}
			style={props.style}
			accessibilityLabel={props.label ?? (isCollapsed ? 'Expand' : 'Collapse')}
			onPress={toggle}
		>
			{props.children ?? (
				<>
					<Icon name={isCollapsed ? 'xplat-chevron-right' : 'xplat-chevron-left'} size={16} />
					{props.label != null ? <Text className="vx-sidenav-collapsebtn-label">{props.label}</Text> : null}
				</>
			)}
		</Pressable>
	}
}
