// Port of upstream SandboxNav.tsx — SideNav with theme/mode controls in the
// header and Sandbox + Audits sections. Current-route selection reads the
// canonical router state instead of react-router's usePathname.

import { useRouterState } from '@octane-xplat/ui/routing'
import { SideNav, SideNavHeading, SideNavItem, SideNavSection, DropdownMenu, Icon, HStack } from '@octane-xplat/ui'
import { auditPages, categories, homePage } from '../data/sandboxPages'
import { SANDBOX_THEMES, setThemeName, setMode, useThemeName, useThemePreference } from '../theme'
import { SandboxLink } from './SandboxLink'

const categoryIcons: Record<string, string> = {
	'components-patterns': 'sandbox-box',
	templates: 'sandbox-app-window',
	blocks: 'sandbox-blocks',
	themes: 'sandbox-palette',
	tools: 'sandbox-wrench',
}

const navPageIcons: Record<string, string> = {
	home: 'sandbox-home',
	templates: 'sandbox-app-window',
	scores: 'xplat-check-double',
}

const pathOf = (href: string | undefined) => (href ?? '').replace(/\/$/, '') || '/'

function SandboxHeader() @{
	const themeName = useThemeName()
	const mode = useThemePreference()

	return (
		<SideNavHeading
			heading="Sandbox"
			icon={<Icon name="sandbox-box" size={20} />}
			headerEndContent={
				<HStack gap={0} className="sb-nav-controls">
					<DropdownMenu
						trigger={<Icon name="sandbox-palette" size={16} />}
						accessibilityLabel="Theme"
						size="sm"
						items={[
							{
								type: 'radio-group',
								key: 'theme',
								value: themeName,
								onValueChange: (v) => setThemeName(v as typeof themeName),
								items: SANDBOX_THEMES.map((t) => ({
									key: t.id,
									label: t.label,
									value: t.id,
								})),
							},
						]}
					/>
					<DropdownMenu
						trigger={<Icon name={mode === 'dark' ? 'sandbox-moon' : 'sandbox-sun'} size={16} />}
						accessibilityLabel={mode === 'dark' ? 'Dark mode' : 'Light mode'}
						size="sm"
						items={[
							{
								type: 'radio-group',
								key: 'mode',
								value: mode,
								onValueChange: (v) => setMode(v as 'light' | 'dark'),
								items: [
									{ key: 'light', label: 'Light', value: 'light' },
									{ key: 'dark', label: 'Dark', value: 'dark' },
								],
							},
						]}
					/>
				</HStack>
			}
		/>
	)
}

export function SandboxNav() @{
	const pathname = pathOf(useRouterState().route?.href)

	return (
		<SideNav
			header={<SandboxHeader />}
			collapsible={{ defaultIsCollapsed: false }}
			resizable={{ defaultWidth: 300, minWidth: 220, maxWidth: 420, autoSaveId: 'sandbox-side-nav' }}
		>
			<SideNavSection title="Sandbox">
				<SideNavItem
					label={homePage.label}
					href={homePage.href}
					isSelected={pathname === '/'}
					as={SandboxLink}
					icon={<Icon name={navPageIcons[homePage.icon]} />}
				/>
				{categories
					.filter((c) => c.slug !== 'templates')
					.map((category) => {
						const href = '/' + category.slug + '/'
						return (
							<SideNavItem
								key={category.slug}
								label={category.label}
								href={href}
								isSelected={pathname === pathOf(href)}
								as={SandboxLink}
								icon={<Icon name={categoryIcons[category.slug] ?? 'sandbox-box'} />}
							/>
						)
					})}
			</SideNavSection>
			<SideNavSection title="Audits">
				{auditPages.map((page) => (
					<SideNavItem
						key={page.href}
						label={page.label}
						href={page.href}
						isSelected={
							page.matchesChildren
								? pathname.startsWith(pathOf(page.href))
								: pathname === pathOf(page.href)
						}
						as={SandboxLink}
						icon={<Icon name={navPageIcons[page.icon] ?? 'sandbox-box'} />}
					/>
				))}
			</SideNavSection>
		</SideNav>
	)
}
