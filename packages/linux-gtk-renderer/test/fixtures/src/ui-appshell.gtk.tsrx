/** @jsxImportSource @octane-xplat/jsx */
import { useRef, useState } from 'octane'
import {
	AppShell,
	TopNav,
	TopNavHeading,
	TopNavItem,
	TopNavMenu,
	SideNav,
	SideNavHeading,
	SideNavSection,
	SideNavItem,
	NavIcon,
	NavHeadingMenu,
	NavHeadingMenuItem,
	SafeArea,
	KeyboardAvoiding,
	useSafeAreaInsets,
	useKeyboardInset,
	useContainerReveal,
	useImageMode,
	useResizable,
	ResizeHandle,
	useAppShellMobile,
	useSideNavCollapse,
	Text,
	Pressable,
} from '@octane-xplat/ui'

/** Compiled child-window component for openWindow checks. */
export function ChildWindow(props: any) @{
	<masonview style={{ display: 'flex', flexDirection: 'column' }}>
		<Text id="child-content">{'CHILD ' + (props?.data?.tag ?? 'none')}</Text>
	</masonview>
}

export const events: string[] = []
export const state: Record<string, any> = {
	insets: null,
	kbinset: null,
	reveal: null,
	imgmode: null,
	mobile: null,
	size: 0,
	collapsed: false,
	navPick: null,
}

function HookProbe() {
	state.insets = useSafeAreaInsets()
	state.kbinset = useKeyboardInset()
	state.reveal = useContainerReveal()
	state.imgmode = useImageMode(null, { fallback: 'dark' })
	state.mobile = useAppShellMobile()
	return null
}

/** Reads the SideNav collapse context — mounted inside the SideNav so the
 *  provider's value is visible. */
function CollapseProbe() {
	const c = useSideNavCollapse()
	state.collapsed = c?.isCollapsed ?? null
	return null
}

/** Standalone resizable region — a drag on its handle must change the size. */
function ResizablePanel() {
	const host = useRef<any>(null)
	const region = useResizable({
		defaultSize: 200,
		minSize: 120,
		maxSize: 400,
		direction: 'horizontal',
		containerRef: host,
		onSizeChange: (s: number) => {
			state.size = s
			events.push('size:' + Math.round(s))
		},
	})
	state.size = region.size
	return (
		<masonview
			ref={(v: any) => {
				host.current = v
			}}
			style={{ display: 'flex', flexDirection: 'row', flexGrow: 1 }}
		>
			<masonview
				id="resize-panel"
				style={{ display: 'flex', width: region.size, flexDirection: 'column' }}
			>
				<Text>RESIZE PANEL</Text>
			</masonview>
			<ResizeHandle
				id="resize-handle"
				resizable={region.props}
				isAlwaysVisible
				style={{ width: 12, height: 60 }}
			/>
			<masonview style={{ display: 'flex', flexGrow: 1 }}>
				<Text>SIBLING</Text>
			</masonview>
		</masonview>
	)
}

export function AppShellProbe() @{
	const [pick, setPick] = useState<string | null>(null)
	state.navPick = pick
	// Imperative collapse handle — a labeled control in the content area drives
	// expand with real input (the icon-only rail button is not reliably
	// hit-testable in this fixture's layout).
	const collapseHandle = useRef<any>(null)
	<AppShell
		id="shell"
		variant="section"
		mobileNav={{ breakpoint: 'md' }}
		topNav={
			<TopNav
				id="topnav"
				heading={
					<TopNavHeading
						id="topnavheading"
						heading="Acme"
						superheading="Internal"
						menu={
							<NavHeadingMenu id="navmenu">
								<NavHeadingMenuItem
									id="nhm-a"
									label="Workspace"
									onClick={() => setPick('workspace')}
								/>
								<NavHeadingMenuItem id="nhm-b" label="Settings" href="/settings" />
							</NavHeadingMenu>
						}
					/>
				}
				centerContent={
					<TopNavItem id="tn-docs" label="Docs" onClick={() => setPick('docs')} />
				}
				endContent={
					<TopNavMenu
						id="tnmenu"
						label="Products"
						items={[
							{ title: 'Alpha', onClick: () => setPick('alpha') },
							{ title: 'Beta', href: '/beta' },
						]}
					/>
				}
			/>
		}
		sideNav={
			<SideNav
				id="sidenav"
				collapsible
				handleRef={collapseHandle}
				resizable={{ defaultWidth: 240, minWidth: 180, maxWidth: 320 }}
				header={<SideNavHeading heading="Acme" icon={<NavIcon icon="xplat-check" />} />}
				footer={<Text>FOOTER</Text>}
			>
				<SideNavSection title="Main">
					<CollapseProbe />
					<SideNavItem id="sn-home" label="Home" onClick={() => setPick('home')} />
					<SideNavItem id="sn-docs" label="Docs" href="/docs" />
				</SideNavSection>
			</SideNav>
		}
	>
		<SafeArea id="safe">
			<KeyboardAvoiding id="kav">
				<HookProbe />
				<Pressable id="content-btn" onPress={() => events.push('content:press')}>
					<Text>CONTENT BTN</Text>
				</Pressable>
				<Pressable
					id="nav-toggle"
					onPress={() => collapseHandle.current?.getCollapseState()?.toggle()}
				>
					<Text>NAV TOGGLE</Text>
				</Pressable>
				<ResizablePanel />
			</KeyboardAvoiding>
		</SafeArea>
	</AppShell>
}
