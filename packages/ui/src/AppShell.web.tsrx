import { useCallback, useId, useMemo, useState } from 'octane';
import type { AppShellProps, MobileNavConfig } from './props';
import { applyEscapeProps } from './escape-props';
import { useMediaQuery } from './useMediaQuery.web';
import { MobileNavToggle } from './MobileNav.web.tsrx';
import { isMobileNavConfig } from './app-shell-config';
import {
	AppShellMobileContext,
	SideNavRenderContext,
	TopNavMobileContentContext,
	TopNavRenderContext,
	useAppShellMobile,
	AppShellMobileProvider,
	SideNavRenderProvider,
	TopNavRenderProvider,
	TopNavMobileContentProvider,
} from './nav-contexts';

export { AppShellMobileContext, useAppShellMobile };

const BREAKPOINT_PX: Record<string, number> = { sm: 640, md: 768, lg: 1024, xl: 1280, '2xl': 1536 };

const MAIN_CONTENT_ID = 'main';

/** AppShell — frame for `topNav` + `sideNav` + `banner` + content. Below the
 *  configured width breakpoint the side nav collapses into a mobile drawer
 *  owned by the top nav (or rendered standalone for sideNav-only shells). */
export function AppShell(props: AppShellProps) @{
	const variant = props.variant ?? 'wash';
	const isFill = props.height !== 'auto';
	const hasTopNav = props.topNav != null;
	const hasSideNav = props.sideNav != null;
	const hasBanner = props.banner != null;

	// Parse mobileNav: false | config | element.
	const mobileNavDisabled = props.mobileNav === false;
	const mobileNavConfig: MobileNavConfig | null =
		props.mobileNav != null && props.mobileNav !== false && isMobileNavConfig(props.mobileNav)
			? props.mobileNav
			: null;

	const mobileNavReactNode =
		props.mobileNav != null && props.mobileNav !== false && !isMobileNavConfig(props.mobileNav)
			? props.mobileNav
			: null;

	const mobileNavConfigContent = mobileNavConfig?.content ?? null;
	const mobileNavHasToggle = mobileNavConfig?.hasToggle !== false;
	const mobileNavIsControlled = mobileNavConfig?.isOpen !== undefined;

	const hasNavContent = hasTopNav || hasSideNav;
	const mobileNavEnabled = !mobileNavDisabled && hasNavContent && mobileNavReactNode == null;
	const sideNavBreakpoint = mobileNavConfig?.breakpoint ?? 'md';

	const query =
		!mobileNavEnabled && mobileNavReactNode == null ? null : sideNavBreakpoint === 'none' ? null : `(width < ${BREAKPOINT_PX[sideNavBreakpoint] ?? 768}px)`;

	// Hooks are unconditional — a disabled breakpoint subscribes to a
	// never-matching query so the slot count stays fixed.
	const mediaMatch = useMediaQuery(query ?? '(width < 0px)', { defaultIsMobile: mobileNavConfig?.defaultIsMobile });
	const isBelowBreakpoint = query == null ? false : mediaMatch;

	const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
	const isMobileNavOpen = mobileNavConfig?.isOpen ?? uncontrolledOpen;
	const setMobileNavOpen = useCallback(
		(open: boolean) => {
			if (!mobileNavIsControlled) setUncontrolledOpen(open);
			mobileNavConfig?.onOpenChange?.(open);
		},
		[mobileNavIsControlled, mobileNavConfig?.onOpenChange],
	);

	const showSideNavInline = hasSideNav && !isBelowBreakpoint;
	const shouldRenderMobileNavReactNode = mobileNavReactNode != null;
	const shouldRenderConfigContent = mobileNavEnabled && mobileNavConfigContent != null && isBelowBreakpoint;

	const mobileNavId = useId();
	const mobileContextValue = useMemo(
		() => ({
			isMobile: isBelowBreakpoint,
			isMobileNavOpen,
			mobileNavId,
			toggleMobileNav: () => mobileNavEnabled && setMobileNavOpen(!isMobileNavOpen),
			openMobileNav: () => mobileNavEnabled && setMobileNavOpen(true),
			closeMobileNav: () => setMobileNavOpen(false),
			isMobileNavEnabled: mobileNavEnabled,
			hasAutoToggle: mobileNavHasToggle,
		}),
		[isBelowBreakpoint, isMobileNavOpen, mobileNavId, setMobileNavOpen, mobileNavEnabled, mobileNavHasToggle],
	);

	// SideNav content for the drawer (two contexts: auto toggle content vs the
	// drawer-side content always supplied when a sideNav exists).
	const mobileContentValue =
		hasSideNav && mobileNavHasToggle ? (
			<SideNavRenderProvider value="drawer-content">{props.sideNav}</SideNavRenderProvider>
		) : null;

	const drawerMobileContentValue = hasSideNav ? (
		<SideNavRenderProvider value="drawer-content">{props.sideNav}</SideNavRenderProvider>
	) : null;

	const topNavContent = hasTopNav ? (
		isBelowBreakpoint && !mobileNavDisabled && mobileNavReactNode == null ? (
			<TopNavMobileContentProvider value={mobileContentValue}>
				<TopNavRenderProvider value="mobile-bar">{props.topNav}</TopNavRenderProvider>
			</TopNavMobileContentProvider>
		) : (
			props.topNav
		)
	) : null;

	const headerContent = hasTopNav || hasBanner ? (
		<div className={['vx-appshell-header', 'vx-appshell-header--' + variant, isFill && 'vx-appshell-header--sticky']} role="banner">
			{hasBanner ? <div className="vx-appshell-banner">{props.banner}</div> : null}
			{topNavContent}
		</div>
	) : null;

	// sideNav-only shells below the breakpoint: the sidenav renders as a
	// topbar plus the auto toggle.
	const shouldShowAutoToggle = !mobileNavDisabled && mobileNavHasToggle && isBelowBreakpoint;
	const autoMobileTopBar = shouldShowAutoToggle && !hasTopNav && hasSideNav ? (
		<div className={['vx-appshell-header', 'vx-appshell-header--' + variant]} role={headerContent == null ? 'banner' : undefined}>
			<div className="vx-appshell-mobilebar" role="navigation" aria-label="Mobile navigation">
				<SideNavRenderProvider value="topbar">{props.sideNav}</SideNavRenderProvider>
				<MobileNavToggle />
			</div>
		</div>
	) : null;

	const contentPad = props.contentPadding != null ? props.contentPadding * 4 : 0;

	<AppShellMobileProvider value={mobileContextValue}>
		<div
			ref={(el: any) => applyEscapeProps(el, props)}
			id={props.id}
			className={['vx-appshell', 'vx-appshell--' + variant, isFill ? 'vx-appshell--fill' : 'vx-appshell--auto', props.className]}
			style={props.style}
		>
			<a href={'#' + MAIN_CONTENT_ID} className="vx-appshell-skiplink">Skip to content</a>
			<div className={['vx-appshell-body', isFill && 'vx-appshell-body--fill']}>
				{headerContent}
				{autoMobileTopBar}
				<div className="vx-appshell-middle">
					{showSideNavInline ? (
						<div className={['vx-appshell-sidenav', 'vx-appshell-sidenav--' + variant]}>{props.sideNav}</div>
					) : null}
					<div
						id={MAIN_CONTENT_ID}
						className="vx-appshell-content"
						role="main"
						tabIndex={-1}
						style={{ padding: contentPad }}
					>
						{props.children}
					</div>
				</div>
			</div>

			{shouldRenderMobileNavReactNode ? mobileNavReactNode : null}
			{shouldRenderConfigContent ? mobileNavConfigContent : null}
			{isBelowBreakpoint && !mobileNavDisabled && mobileNavReactNode == null && !mobileNavConfigContent ? (
				<>
					{hasSideNav && !hasTopNav ? (
						<SideNavRenderProvider value="drawer">{props.sideNav}</SideNavRenderProvider>
					) : null}
					{hasTopNav ? (
						<TopNavMobileContentProvider value={drawerMobileContentValue}>
							<TopNavRenderProvider value="drawer">{props.topNav}</TopNavRenderProvider>
						</TopNavMobileContentProvider>
					) : null}
				</>
			) : null}
		</div>
	</AppShellMobileProvider>
}
