/** @jsxImportSource @nativescript-community/octane */
import { useCallback, useId, useMemo, useState } from 'octane';
import type { AppShellProps, MobileNavConfig } from './props';
import { cx } from './cx';
import { applyEscapeProps } from './escape-props';
import { MobileNavToggle } from './MobileNav.tsrx';
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

const BREAKPOINT_DIPS: Record<string, number> = { sm: 640, md: 768, lg: 1024, xl: 1280, '2xl': 1536 };

/** AppShell — frame for `topNav` + `sideNav` + `banner` + content. Below
 *  the configured width point (measured against the shell's own width) the
 *  side nav collapses into a mobile drawer. */
export function AppShell(props: AppShellProps) @{
	const variant = props.variant ?? 'wash';
	const isFill = props.height !== 'auto';
	const hasTopNav = props.topNav != null;
	const hasSideNav = props.sideNav != null;
	const hasBanner = props.banner != null;

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
	const breakpointDips = BREAKPOINT_DIPS[sideNavBreakpoint] ?? 768;

	// Mobile layout = the shell's own measured width below the breakpoint —
	// the viewport analog for windowed/split layouts.
	const [measuredWidth, setMeasuredWidth] = useState<number | null>(null);
	const [isBelowBreakpoint, setBelow] = useState<boolean>(mobileNavConfig?.defaultIsMobile ?? false);
	const onShellLayout = (e: any) => {
		const w = e?.object?.getActualSize?.().width ?? null;
		if (w != null && w !== measuredWidth) {
			setMeasuredWidth(w);
			setBelow(sideNavBreakpoint === 'none' ? false : w < breakpointDips);
		}
	};

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

	const shouldShowAutoToggle = !mobileNavDisabled && mobileNavHasToggle && isBelowBreakpoint;
	const contentPad = props.contentPadding != null ? props.contentPadding * 4 : 0;

	<AppShellMobileProvider value={mobileContextValue}>
		<gridlayout
			ref={(v: any) => applyEscapeProps(v, props)}
			id={props.id}
			rows="auto,*"
			className={cx('vx-appshell', 'vx-appshell--' + variant, isFill ? 'vx-appshell--fill' : 'vx-appshell--auto', props.className)}
			style={props.style}
			onLayoutChanged={onShellLayout}
		>
			<flexboxlayout row={0} flexDirection="column" className="vx-appshell-header">
				{hasBanner ? <flexboxlayout className="vx-appshell-banner">{props.banner}</flexboxlayout> : null}
				{topNavContent}
				{shouldShowAutoToggle && !hasTopNav && hasSideNav ? (
					<flexboxlayout className="vx-appshell-mobilebar" flexDirection="row" alignItems="center" accessibilityLabel="Mobile navigation">
						<SideNavRenderProvider value="topbar">{props.sideNav}</SideNavRenderProvider>
						<MobileNavToggle />
					</flexboxlayout>
				) : null}
			</flexboxlayout>
			<gridlayout row={1} columns={showSideNavInline ? 'auto,*' : '*'} className="vx-appshell-middle">
				{showSideNavInline ? (
					<flexboxlayout col={0} flexDirection="column" className={cx('vx-appshell-sidenav', 'vx-appshell-sidenav--' + variant)}>
						{props.sideNav}
					</flexboxlayout>
				) : null}
				<flexboxlayout col={showSideNavInline ? 1 : 0} flexDirection="column" className="vx-appshell-content" style={{ padding: contentPad }}>
					{props.children}
				</flexboxlayout>
			</gridlayout>
			{/* Drawer overlay — last grid child paints on top of the shell. */}
			{isBelowBreakpoint && !mobileNavDisabled ? (
				<gridlayout row={0} rowSpan={2} col={0} className="vx-appshell-drawerhost">
					{mobileNavReactNode}
					{mobileNavEnabled && mobileNavConfigContent != null ? mobileNavConfigContent : null}
					{mobileNavReactNode == null && mobileNavConfigContent == null ? (
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
				</gridlayout>
			) : null}
		</gridlayout>
	</AppShellMobileProvider>
}
