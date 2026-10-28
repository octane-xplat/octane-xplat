import type { RegisteredRouteContracts, AppRouteStacks, RouteTransitionName } from './props'
import type { NavigationItemImplementation } from './nav-link'
import { useNavigationItem } from './use-navigation-item.shared.tsrx'
import { useLinkComponent } from './use-link-component.web.tsrx'
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'octane'
import type {
	SideNavCollapseButtonProps,
	SideNavCollapseState,
	SideNavHeadingProps,
	SideNavItemProps,
	SideNavProps,
	SideNavSectionProps,
} from './props'

import { applyEscapeProps } from './escape-props'
import { Icon } from './Icon.web.tsrx'
import { Text } from './Text.web.tsrx'
import { Popover } from './Popover.web.tsrx'
import { MobileNav } from './MobileNav.web.tsrx'
import { ResizeHandle } from './ResizeHandle.web.tsrx'
import { useResizable } from './useResizable.web.tsrx'
import { regionConfigFrom } from './resize-state'
import { SizeProvider, useSize } from './size-context'
import {
	NavHeadingCloseContext,
	SideNavCollapseContext,
	SideNavRenderContext,
	useSideNavCollapse,
	useSideNavRenderMode,
	SideNavCollapseProvider,
	NavHeadingCloseProvider,
} from './nav-contexts'

export { SideNavRenderContext, SideNavCollapseContext, useSideNavCollapse, useSideNavRenderMode }

const COLLAPSED_RAIL_WIDTH = 48
const ITEM_HEIGHT: Record<string, number> = { sm: 28, md: 32, lg: 36 }

function navIcon(icon: any, size = 16) {
	return typeof icon === 'string' ? <Icon name={icon} size={size} /> : icon
}

/** Heading-level text → web heading element. */
function HeadingRow(props: {
	as?: any
	href?: string
	className?: any
	ariaLabel?: string
	children?: any
	onClick?: (e: any) => void
}) {
	const LinkEl: any = useLinkComponent(props.as)
	if (props.href != null) {
		return (
			<LinkEl
				className={props.className}
				href={props.href}
				aria-label={props.ariaLabel}
				onClick={props.onClick}
			>
				{props.children}
			</LinkEl>
		)
	}

	return (
		<span className={props.className} aria-label={props.ariaLabel}>
			{props.children}
		</span>
	)
}

/** SideNav — the app's side navigation panel. Header/topContent are sticky,
 *  children scroll, footer/footerIcons pin to the bottom. Inside AppShell it
 *  adopts the render mode its context sets (topbar / drawer /
 *  drawer-content). */
export function SideNav(props: SideNavProps) @{
	const renderMode = useSideNavRenderMode()

	const cfg =
		props.collapsible === true
			? {}
			: props.collapsible === false || props.collapsible == null
				? undefined
				: props.collapsible

	const isCollapsible = props.collapsible != null && props.collapsible !== false
	const controlled = cfg?.isCollapsed !== undefined
	const [uncontrolled, setUncontrolled] = useState(cfg?.defaultIsCollapsed ?? false)
	const collapsed = isCollapsible
		? controlled
			? (cfg!.isCollapsed ?? false)
			: uncontrolled
		: false

	const toggle = useCallback(() => {
		const next = !collapsed
		if (!controlled) {
			setUncontrolled(next)
		}

		cfg?.onCollapsedChange?.(next)
	}, [collapsed, controlled, cfg])

	const collapseState = useMemo<SideNavCollapseState>(
		() => ({ isCollapsed: collapsed, toggle, isCollapsible }),
		[collapsed, toggle, isCollapsible],
	)

	// Deprecated imperative bridge.
	if (props.handleRef) {
		props.handleRef.current = { getCollapseState: () => collapseState }
	}

	// Resizable — the hook runs unconditionally; inert when not resizable.
	const resizeConfig = regionConfigFrom(props.resizable === false ? undefined : props.resizable)
	const resizableHook = useResizable(resizeConfig ?? { defaultSize: 0 })
	const showResizeHandle = resizeConfig != null && !collapsed

	// ---- render modes ----

	@if (renderMode === 'topbar') {
		<div
			ref={(el: any) => applyEscapeProps(el, props)}
			id={props.id}
			className={['vx-sidenav', 'vx-sidenav--topbar', props.className]}
			style={props.style}
		>
			{props.header}
			<div className="vx-sidenav-topbar-icons">{props.footerIcons}</div>
		</div>
	} @else {
		@if (renderMode === 'drawer') {
			<MobileNav
				header={props.header}
				id={props.id}
				className={['vx-sidenav', 'vx-sidenav--drawer', props.className]}
				style={props.style}
			>
				{props.topContent}
				{props.children}
				{props.footer != null || props.footerIcons != null ? (
					<div className="vx-sidenav-drawerfooter">
						{props.footer}
						{props.footerIcons != null ? (
							<div className="vx-sidenav-drawericons">{props.footerIcons}</div>
						) : null}
					</div>
				) : null}
			</MobileNav>
		} @else {
			@if (renderMode === 'drawer-content') {
				<>
					{props.topContent}
					{props.children}
					{props.footer != null || props.footerIcons != null ? (
						<div className="vx-sidenav-drawerfooter">
							{props.footer}
							{props.footerIcons != null ? (
								<div className="vx-sidenav-drawericons">{props.footerIcons}</div>
							) : null}
						</div>
					) : null}
				</>
			} @else {
				<>
					<SideNavCollapseProvider value={isCollapsible ? collapseState : null}>
						<div
							className="vx-sidenav-shell"
							style={
								resizeConfig
									? { width: collapsed ? COLLAPSED_RAIL_WIDTH : resizableHook.size }
									: collapsed
										? { width: COLLAPSED_RAIL_WIDTH }
										: undefined
							}
						>
							<nav
								ref={(el: any) => applyEscapeProps(el, props)}
								id={props.id}
								className={['vx-sidenav', collapsed && 'vx-sidenav--collapsed', props.className]}
								style={props.style}
								aria-label={props.label ?? 'Side navigation'}
							>
								{props.header != null || props.topContent != null ? (
									<div
										className={[
											'vx-sidenav-stickytop',
											collapsed && 'vx-sidenav-stickytop--collapsed',
										]}
									>
										{props.header}
										{props.topContent != null ? (
											<div className="vx-sidenav-topcontent">{props.topContent}</div>
										) : null}
									</div>
								) : null}
								<div
									className={[
										'vx-sidenav-scrollable',
										collapsed && 'vx-sidenav-scrollable--collapsed',
										props.header == null &&
											props.topContent == null &&
											'vx-sidenav-scrollable--notop',
										props.footer == null &&
											props.footerIcons == null &&
											!(isCollapsible && cfg?.hasButton !== false) &&
											'vx-sidenav-scrollable--nobottom',
									]}
								>
									{props.children}
								</div>
								{props.footer != null ||
								props.footerIcons != null ||
								(isCollapsible && cfg?.hasButton !== false) ? (
									<div
										className={[
											'vx-sidenav-stickybottom',
											collapsed && 'vx-sidenav-stickybottom--collapsed',
										]}
									>
										{props.footer}
										<div
											className={[
												'vx-sidenav-footerrow',
												collapsed && 'vx-sidenav-footerrow--collapsed',
											]}
										>
											<SizeProvider value="sm">
												{isCollapsible && cfg?.hasButton !== false ? (
													<SideNavCollapseButton />
												) : null}
												{props.footerIcons}
											</SizeProvider>
										</div>
									</div>
								) : null}
							</nav>
							{showResizeHandle ? (
								<ResizeHandle
									direction="horizontal"
									position="overlay"
									pillPlacement="end"
									label="Resize sidebar"
									resizable={resizableHook.props}
								/>
							) : null}
						</div>
					</SideNavCollapseProvider>
				</>
			}
		}
	}
}

/** SideNavSection — titled group of items inside the scrollable area. */
export function SideNavSection(props: SideNavSectionProps) @{
	const collapsed = useSideNavCollapse()?.isCollapsed === true

	<section className={['vx-sidenav-section', props.className]} style={props.style} id={props.id}>
		<div
			className={[
				'vx-sidenav-section-head',
				(props.isHeaderHidden || collapsed) && 'vx-visually-hidden',
			]}
		>
			<div className="vx-sidenav-section-title-group">
				<Text className="vx-sidenav-section-title">{props.title}</Text>
				{props.subtitle != null ? (
					<Text className="vx-sidenav-section-subtitle">{props.subtitle}</Text>
				) : null}
			</div>
			{props.endContent}
		</div>
		<div className="vx-sidenav-section-items">{props.children}</div>
	</section>
}

/** SideNavHeading — identity block at the top of the rail: icon + linked
 *  heading with optional super/subheading lines, trailing content, and an
 *  optional heading menu popover. */
export function SideNavHeading(props: SideNavHeadingProps) @{
	const anchor = useRef<any>(null)
	const [menuOpen, setMenuOpen] = useState(false)
	const collapsed = useContext(SideNavCollapseContext)?.isCollapsed ?? false

	const hasLinks = !!(props.headingHref || props.superheadingHref || props.subheadingHref)
	const hasMenu = props.menu != null
	// Without hrefs the whole header is the menu trigger; with hrefs only the
	// chevron affordance opens it.
	const headerIsTrigger = hasMenu && !hasLinks
	const closeMenu = useCallback(() => setMenuOpen(false), [])
	const closeCtx = useMemo(() => ({ closeMenu }), [closeMenu])

	const headingEl = (
		<HeadingRow as={props.as} href={props.headingHref} className="vx-sidenav-heading-title">
			{props.heading}
		</HeadingRow>
	)

	<div
		ref={(el: any) => applyEscapeProps(el, props)}
		id={props.id}
		className={[
			'vx-sidenav-heading',
			headerIsTrigger && 'vx-sidenav-heading--button',
			collapsed && 'vx-sidenav-heading--collapsed',
			props.className,
		]}
		style={props.style}
	>
		{headerIsTrigger ? (
			<button
				type="button"
				className="vx-sidenav-heading-trigger"
				ref={(el: any) => {
					anchor.current = el
				}}
				aria-haspopup="menu"
				aria-expanded={hasMenu ? menuOpen : undefined}
				onClick={() => setMenuOpen(!menuOpen)}
			>
				{props.icon != null ? (
					<span className="vx-sidenav-heading-icon">{navIcon(props.icon, 20)}</span>
				) : null}
				<span className="vx-sidenav-heading-text">
					{props.superheading ? (
						<HeadingRow
							as={props.as}
							href={props.superheadingHref}
							className="vx-sidenav-heading-super"
						>
							{props.superheading}
						</HeadingRow>
					) : null}
					{headingEl}
					{props.subheading ? (
						<HeadingRow
							as={props.as}
							href={props.subheadingHref}
							className="vx-sidenav-heading-sub"
						>
							{props.subheading}
						</HeadingRow>
					) : null}
				</span>
				<Icon name="xplat-chevron-down" size={16} />
			</button>
		) : (
			<>
				{props.icon != null ? (
					<span className="vx-sidenav-heading-icon">{navIcon(props.icon, 20)}</span>
				) : null}
				<span className="vx-sidenav-heading-text">
					{props.superheading ? (
						<HeadingRow
							as={props.as}
							href={props.superheadingHref}
							className="vx-sidenav-heading-super"
						>
							{props.superheading}
						</HeadingRow>
					) : null}
					{headingEl}
					{props.subheading ? (
						<HeadingRow
							as={props.as}
							href={props.subheadingHref}
							className="vx-sidenav-heading-sub"
						>
							{props.subheading}
						</HeadingRow>
					) : null}
				</span>
			</>
		)}
		{hasMenu && !headerIsTrigger ? (
			<button
				type="button"
				className="vx-sidenav-heading-menubtn"
				ref={(el: any) => {
					anchor.current = el
				}}
				aria-haspopup="menu"
				aria-expanded={menuOpen}
				aria-label="Open menu"
				onClick={() => setMenuOpen(!menuOpen)}
			>
				<Icon name="xplat-chevron-down" size={16} />
			</button>
		) : null}
		{props.headerEndContent != null ? (
			<span className="vx-sidenav-heading-end">{props.headerEndContent}</span>
		) : null}
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
	</div>
}

/** SideNavItem — one nav row: icon + label + end content + actions +
 *  optional nested children. Renders a link when `href` is set. In a
 *  collapsed rail the icon is the whole item and children open a flyout. */
export function SideNavItem<
	Contracts = RegisteredRouteContracts,
	Stacks extends string = keyof AppRouteStacks & string,
	Transitions extends string = RouteTransitionName,
>(props: SideNavItemProps<Contracts, Stacks, Transitions>): any

export function SideNavItem(props: NavigationItemImplementation<SideNavItemProps>) @{
	const link = useNavigationItem(props)
	const renderMode = useSideNavRenderMode()
	const collapseCtx = useSideNavCollapse()
	const railCollapsed = collapseCtx?.isCollapsed === true && renderMode === 'default'
	const isDrawer = renderMode === 'drawer' || renderMode === 'drawer-content'
	const size = props.size ?? 'md'
	const hasChildren = props.children != null

	const itemCfg =
		props.collapsible === true
			? {}
			: typeof props.collapsible === 'object'
				? props.collapsible
				: null

	const itemControlled = itemCfg?.isCollapsed !== undefined
	const [uncontrolledCollapsed, setUncontrolledCollapsed] = useState(
		itemCfg?.defaultIsCollapsed ?? false,
	)

	const childrenCollapsed =
		hasChildren && itemCfg != null
			? itemControlled
				? itemCfg!.isCollapsed!
				: uncontrolledCollapsed
			: false

	const toggleChildren = () => {
		const next = !childrenCollapsed
		if (!itemControlled) {
			setUncontrolledCollapsed(next)
		}

		itemCfg?.onCollapsedChange?.(next)
	}

	const anchor = useRef<any>(null)
	const [flyoutOpen, setFlyoutOpen] = useState(false)

	const displayIcon = link.selected && props.selectedIcon != null ? props.selectedIcon : props.icon
	const isDisabled = link.disabled

	const activate = (e: any) => link.activateWeb(e)
	// Collapsed rail: children open a flyout popover instead of expanding.
	// A collapsible item without its own action toggles on press; one with a
	// primary action gets an independent chevron toggle beside it.
	const hasPrimaryAction = link.href != null || props.onClick != null
	const independentToggle = hasChildren && itemCfg != null && hasPrimaryAction && !railCollapsed
	const pressMain = (e: any) => {
		if (railCollapsed && hasChildren && !link.preservesBrowserNavigation(e)) {
			if (isDisabled || e?.defaultPrevented) {
				return
			}

			e?.preventDefault?.()
			setFlyoutOpen(!flyoutOpen)
			return
		}

		if (hasChildren && itemCfg != null && !hasPrimaryAction && !railCollapsed) {
			if (isDisabled || e?.defaultPrevented) {
				return
			}

			e?.preventDefault?.()
			toggleChildren()
			return
		}

		activate(e)
	}

	const mainCls = [
		'vx-sidenav-item-main',
		'vx-sidenav-item--' + size,
		link.selected && 'vx-sidenav-item--selected',
		isDisabled && 'vx-sidenav-item--disabled',
		railCollapsed && 'vx-sidenav-item--rail',
	]

	const content = (
		<>
			{displayIcon != null ? (
				<span className="vx-sidenav-item-icon" aria-hidden="true">
					{navIcon(displayIcon, 16)}
				</span>
			) : null}
			{!railCollapsed ? <span className="vx-sidenav-item-label">{props.label}</span> : null}
			{!railCollapsed && props.endContent != null ? (
				<span className="vx-sidenav-item-end">{props.endContent}</span>
			) : null}
			{!railCollapsed && hasChildren && itemCfg != null && !independentToggle ? (
				<span
					className={[
						'vx-sidenav-item-chevron',
						!childrenCollapsed && 'vx-sidenav-item-chevron--expanded',
					]}
				>
					<Icon name="xplat-chevron-down" size={16} />
				</span>
			) : null}
		</>
	)

	const isLink = link.href != null && !isDisabled
	const LinkEl: any = useLinkComponent(props.as)
	const shared: any = {
		className: mainCls,
		style: { minHeight: ITEM_HEIGHT[size] },
		'aria-current': link.selected ? 'page' : undefined,
		'aria-disabled': isDisabled || undefined,
		'aria-label': railCollapsed ? props.label : undefined,
		'aria-expanded':
			hasChildren && itemCfg != null && !independentToggle ? !childrenCollapsed : undefined,
		onClick: pressMain,
	}

	// Astryx drops icon-less items from the collapsed rail entirely.
	if (railCollapsed && props.icon == null) {
		return null
	}

	<div className={['vx-sidenav-item', props.className]} style={props.style} id={props.id}>
		<div
			className="vx-sidenav-item-row"
			ref={(el: any) => {
				if (railCollapsed) {
					anchor.current = el
				}

				applyEscapeProps(el, props)
			}}
		>
			{isLink ? (
				<LinkEl
					{...shared}
					href={link.href}
					target={props.target}
					rel={props.rel}
					download={props.download}
				>
					{content}
				</LinkEl>
			) : (
				<button {...shared} type="button" disabled={isDisabled}>
					{content}
				</button>
			)}
			{independentToggle ? (
				<button
					type="button"
					className={[
						'vx-sidenav-item-toggle',
						!childrenCollapsed && 'vx-sidenav-item-toggle--expanded',
					]}
					aria-label={childrenCollapsed ? `Expand ${props.label}` : `Collapse ${props.label}`}
					aria-expanded={!childrenCollapsed}
					onClick={toggleChildren}
				>
					<Icon name="xplat-chevron-down" size={16} />
				</button>
			) : null}
			{!railCollapsed && props.actions != null ? (
				<span className="vx-sidenav-item-actions">
					<SizeProvider value="sm">{props.actions}</SizeProvider>
				</span>
			) : null}
		</div>
		{hasChildren && !railCollapsed && !childrenCollapsed ? (
			<div className="vx-sidenav-item-children">{props.children}</div>
		) : null}
		{railCollapsed && hasChildren ? (
			<Popover
				anchor={anchor}
				open={flyoutOpen}
				placement="right"
				onDismiss={() => setFlyoutOpen(false)}
				className="vx-sidenav-flyout"
			>
				<div className="vx-sidenav-flyout-title">{props.label}</div>
				<div className="vx-sidenav-flyout-list" role="menu" aria-label={`${props.label} submenu`}>
					{props.children}
				</div>
			</Popover>
		) : null}
	</div>
}

/** SideNavCollapseButton — chevron control bound to the nearest
 *  SideNavCollapseContext, or to an externally-supplied controlled config /
 *  imperative handle when rendered outside the SideNav. */
export function SideNavCollapseButton(props: SideNavCollapseButtonProps) @{
	const ctx = useSideNavCollapse()
	const extCfg = props.collapsible
	const extHandle = props.handleRef?.current?.getCollapseState()
	const external: SideNavCollapseState | null = extCfg
		? {
				isCollapsed: extCfg.isCollapsed,
				toggle: () => extCfg.onCollapsedChange(!extCfg.isCollapsed),
				isCollapsible: true,
			}
		: (extHandle ?? null)

	const isCollapsible = ctx?.isCollapsible ?? external?.isCollapsible ?? true
	const isCollapsed = ctx?.isCollapsed ?? external?.isCollapsed ?? false
	const toggle = ctx?.toggle ?? external?.toggle ?? (() => {})
	const size = useSize(props.size, 'md')

	@if (!isCollapsible) {
		null
	} @else {
		<button
			ref={(el: any) => applyEscapeProps(el, props)}
			id={props.id}
			type="button"
			className={[
				'vx-sidenav-collapsebtn',
				`vx-sidenav-collapsebtn--${size}`,
				props.label == null && 'vx-sidenav-collapsebtn--icon',
				isCollapsed && 'vx-sidenav-collapsebtn--collapsed',
				props.className,
			]}
			style={props.style}
			aria-expanded={!isCollapsed}
			aria-label={props.label ?? (isCollapsed ? 'Expand sidebar' : 'Collapse sidebar')}
			onClick={toggle}
		>
			{props.children ?? (
				<>
					<Icon name="xplat-chevron-left" size={16} />
					{props.label != null ? (
						<span className="vx-sidenav-collapsebtn-label">{props.label}</span>
					) : null}
				</>
			)}
		</button>
	}
}
