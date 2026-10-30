/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import { useCallback, useId, useMemo, useState } from 'octane'
import type { AppShellProps, MobileNavConfig } from '../../props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps } from '../overlays/escape-props'
import { MobileNavToggle } from '../navigation/MobileNav'
import { isMobileNavConfig } from './app-shell-config'
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
} from '../navigation/nav-contexts'

export { AppShellMobileContext, useAppShellMobile }

const BREAKPOINT_DIPS: Record<string, number> = {
	sm: 640,
	md: 768,
	lg: 1024,
	xl: 1280,
	'2xl': 1536,
}

/** AppShell — frame for `topNav` + `sideNav` + `banner` + content. Below
 *  the configured width point (measured against the shell's own width) the
 *  side nav collapses into a mobile drawer. */
export function AppShell(props: AppShellProps): unknown @{
	const variant = props.variant ?? 'wash'
	const isFill = props.height !== 'auto'
	const hasTopNav = props.topNav != null
	const hasSideNav = props.sideNav != null
	const hasBanner = props.banner != null

	const mobileNavDisabled = props.mobileNav === false
	const mobileNavConfig: MobileNavConfig | null = isMobileNavConfig(props.mobileNav)
		? props.mobileNav
		: null

	const mobileNavConfigContent = mobileNavConfig?.content ?? null
	const mobileNavHasToggle = mobileNavConfig?.hasToggle !== false
	const mobileNavIsControlled = mobileNavConfig?.isOpen !== undefined

	const hasNavContent = hasTopNav || hasSideNav
	const mobileNavEnabled = !mobileNavDisabled && hasNavContent
	const sideNavBreakpoint = mobileNavConfig?.breakpoint ?? 'md'
	const breakpointDips = BREAKPOINT_DIPS[sideNavBreakpoint] ?? 768

	// Mobile layout = the shell's own measured width below the breakpoint —
	// the viewport analog for windowed/split layouts.
	const [measuredWidth, setMeasuredWidth] = useState<number | null>(null)
	const [isBelowBreakpoint, setBelow] = useState<boolean>(mobileNavConfig?.defaultIsMobile ?? false)
	const onShellLayout = (e: any) => {
		const w = e?.object?.getActualSize?.().width ?? null
		if (w != null && w !== measuredWidth) {
			setMeasuredWidth(w)
			setBelow(sideNavBreakpoint === 'none' ? false : w < breakpointDips)
		}
	}

	const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
	const isMobileNavOpen = mobileNavConfig?.isOpen ?? uncontrolledOpen
	const setMobileNavOpen = useCallback(
		(open: boolean) => {
			if (!mobileNavIsControlled) {
				setUncontrolledOpen(open)
			}

			mobileNavConfig?.onOpenChange?.(open)
		},
		[mobileNavIsControlled, mobileNavConfig?.onOpenChange],
	)

	const showSideNavInline = hasSideNav && !isBelowBreakpoint
	const mobileNavId = useId()
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
		[
			isBelowBreakpoint,
			isMobileNavOpen,
			mobileNavId,
			setMobileNavOpen,
			mobileNavEnabled,
			mobileNavHasToggle,
		],
	)

	const mobileContentValue =
		hasSideNav && mobileNavHasToggle ? (
			<SideNavRenderProvider value="drawer-content">{props.sideNav}</SideNavRenderProvider>
		) : null

	const drawerMobileContentValue = hasSideNav ? (
		<SideNavRenderProvider value="drawer-content">{props.sideNav}</SideNavRenderProvider>
	) : null

	const topNavContent = hasTopNav ? (
		isBelowBreakpoint && !mobileNavDisabled ? (
			<TopNavMobileContentProvider value={mobileContentValue}>
				<TopNavRenderProvider value="mobile-bar">{props.topNav}</TopNavRenderProvider>
			</TopNavMobileContentProvider>
		) : (
			props.topNav
		)
	) : null

	const shouldShowAutoToggle = !mobileNavDisabled && mobileNavHasToggle && isBelowBreakpoint
	const contentPad = props.contentPadding != null ? props.contentPadding * 4 : 0

	<AppShellMobileProvider value={mobileContextValue}>
		<masonview
			ref={(v: any) => applyEscapeProps(v, props)}
			id={props.id}
			className={cx(
				'vx-appshell',
				'vx-appshell--' + variant,
				isFill ? 'vx-appshell--fill' : 'vx-appshell--auto',
				props.className,
			)}
			style={mergeStyle({ display: 'grid', gridTemplateRows: 'auto 1fr' }, props.style)}
			onLayoutChanged={onShellLayout}
		>
			<masonview
				style={mergeStyle(
					{ flexDirection: 'column' },
					mergeStyle({ display: 'flex' }, { gridRow: '1' }),
				)}
				className="vx-appshell-header"
			>
				{hasBanner ? (
					<masonview className="vx-appshell-banner" style={{ display: 'flex' }}>
						{props.banner}
					</masonview>
				) : null}
				{topNavContent}
				{shouldShowAutoToggle && !hasTopNav && hasSideNav ? (
					<masonview
						className="vx-appshell-mobilebar"
						accessibilityLabel="Mobile navigation"
						style={mergeStyle({ flexDirection: 'row', alignItems: 'center' }, { display: 'flex' })}
					>
						<SideNavRenderProvider value="topbar">{props.sideNav}</SideNavRenderProvider>
						<MobileNavToggle />
					</masonview>
				) : null}
			</masonview>
			<masonview
				style={mergeStyle(
					{ display: 'grid', gridTemplateColumns: showSideNavInline ? 'auto 1fr' : '1fr' },
					[props.style, { gridRow: '2' }],
				)}
				className="vx-appshell-middle"
			>
				{showSideNavInline ? (
					<masonview
						style={mergeStyle(
							{ flexDirection: 'column' },
							mergeStyle({ display: 'flex' }, { gridColumn: '1' }),
						)}
						className={cx('vx-appshell-sidenav', 'vx-appshell-sidenav--' + variant)}
					>
						{props.sideNav}
					</masonview>
				) : null}
				<masonview
					style={mergeStyle(
						{ flexDirection: 'column' },
						mergeStyle(
							{ display: 'flex' },
							{ padding: contentPad, gridColumn: String((showSideNavInline ? 1 : 0) + 1) },
						),
					)}
					className="vx-appshell-content"
				>
					{props.children}
				</masonview>
			</masonview>
			{/* Drawer overlay — last grid child paints on top of the shell. */}
			{isBelowBreakpoint && !mobileNavDisabled ? (
				<masonview
					className="vx-appshell-drawerhost"
					style={mergeStyle({ gridRow: '1 / span 2', gridColumn: '1' }, { display: 'grid' })}
				>
					{mobileNavEnabled && mobileNavConfigContent != null ? mobileNavConfigContent : null}
					{mobileNavConfigContent == null ? (
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
				</masonview>
			) : null}
		</masonview>
	</AppShellMobileProvider>
}
