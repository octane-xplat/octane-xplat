import { createContext, useContext } from 'octane'
import type {
	AppShellMobileContextValue,
	NavHeadingCloseContextValue,
	NavHeadingMenuContextValue,
	NavHeadingMenuSize,
	SideNavCollapseState,
	SideNavRenderMode,
	TabListContextValue,
	TopNavRenderMode,
	TopNavSlot,
	ToolbarSize,
} from './props'

/** AppShell → MobileNav/MobileNavToggle/TopNav mobile state. The default is
 *  the disabled, non-mobile value so consumers outside an AppShell behave
 *  sanely (the toggle renders nothing). */
const defaultAppShellMobile: AppShellMobileContextValue = {
	isMobile: false,
	isMobileNavOpen: false,
	toggleMobileNav: () => {},
	openMobileNav: () => {},
	closeMobileNav: () => {},
	isMobileNavEnabled: false,
	hasAutoToggle: true,
}

export const AppShellMobileContext = createContext<AppShellMobileContextValue>(defaultAppShellMobile)

export function useAppShellMobile(): AppShellMobileContextValue {
	return useContext(AppShellMobileContext) ?? defaultAppShellMobile
}

/** AppShell sets this so TopNav can switch between the full bar, the
 *  reduced mobile bar, and drawer rendering below the breakpoint. */
export const TopNavRenderContext = createContext<TopNavRenderMode>('default')

export function useTopNavRenderMode(): TopNavRenderMode {
	return useContext(TopNavRenderContext) ?? 'default'
}

/** Which TopNav slot an item renders in — items use it for slot-specific
 *  styling (e.g. drawer layouts stretch items full width). */
export const TopNavSlotContext = createContext<TopNavSlot>('start')

export function useTopNavSlot(): TopNavSlot {
	return useContext(TopNavSlotContext) ?? 'start'
}

/** Extra drawer content AppShell hands to TopNav's drawer render — the
 *  SideNav's items travel this way when the drawer is combined. */
export const TopNavMobileContentContext = createContext<any>(null)

export function useTopNavMobileContent(): any {
	return useContext(TopNavMobileContentContext) ?? null
}

/** AppShell sets this so SideNav can switch between the full sidebar, the
 *  horizontal topbar, and the two drawer renderings. */
export const SideNavRenderContext = createContext<SideNavRenderMode>('default')

export function useSideNavRenderMode(): SideNavRenderMode {
	return useContext(SideNavRenderContext) ?? 'default'
}

/** SideNav collapse state shared with collapse buttons and items. */
export const SideNavCollapseContext = createContext<SideNavCollapseState | null>(null)

export function useSideNavCollapse(): SideNavCollapseState | null {
	return useContext(SideNavCollapseContext)
}

/** TabList → Tab/TabMenu selection contract. Throws when read outside a
 *  TabList, matching upstream. */
export const TabListContext = createContext<TabListContextValue | null>(null)

export function useTabListContext(): TabListContextValue {
	const ctx = useContext(TabListContext)
	if (ctx == null) {
		throw new Error('useTabListContext must be used within TabList. Wrap your Tab/TabMenu in <TabList>.')
	}

	return ctx
}

/** Heading-popover close callback — NavHeadingMenu reads it to dismiss the
 *  popover on item selection and Escape. */
export const NavHeadingCloseContext = createContext<NavHeadingCloseContextValue | null>(null)

export function useNavHeadingCloseContext(): NavHeadingCloseContextValue | null {
	return useContext(NavHeadingCloseContext)
}

/** NavHeadingMenu → its items: size + the close callback. */
export const NavHeadingMenuContext = createContext<NavHeadingMenuContextValue | null>(null)

export function useNavHeadingMenuContext(): NavHeadingMenuContextValue | null {
	return useContext(NavHeadingMenuContext)
}

export type { NavHeadingMenuSize }

/** Toolbar → family children that want the resolved size. This is the
 *  local seam standing in for Astryx's SizeContext until the shared size
 *  context lands with the forms/layout task. */
export const ToolbarSizeContext = createContext<ToolbarSize | null>(null)

export function useToolbarSize(): ToolbarSize | null {
	return useContext(ToolbarSizeContext)
}

/* Provider aliases typed `any` — native JSX typing rejects bare Context
 *  objects as element types; the framework convention (field-context.ts)
 *  is an `any`-typed provider alias. */
export const AppShellMobileProvider: any = AppShellMobileContext
export const SideNavRenderProvider: any = SideNavRenderContext
export const TopNavRenderProvider: any = TopNavRenderContext
export const TopNavSlotProvider: any = TopNavSlotContext
export const TopNavMobileContentProvider: any = TopNavMobileContentContext
export const SideNavCollapseProvider: any = SideNavCollapseContext
export const NavHeadingCloseProvider: any = NavHeadingCloseContext
export const NavHeadingMenuProvider: any = NavHeadingMenuContext
export const TabListProvider: any = TabListContext
export const ToolbarSizeProvider: any = ToolbarSizeContext
