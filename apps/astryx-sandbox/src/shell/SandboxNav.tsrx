// Port of upstream SandboxNav.tsx — SideNav with theme/mode controls in the
// header and Sandbox + Audits sections. Current-route selection reads the
// canonical router state instead of react-router's usePathname.

import { useRouterState } from '@octane-xplat/ui/routing'
import { SideNav, SideNavHeading, SideNavItem, SideNavSection, DropdownMenu, Icon, HStack } from '@octane-xplat/ui'
import { auditPages, categories, homePage } from '../data/sandboxPages'
import { SANDBOX_THEMES, setThemeName, setMode, useThemePreference } from '../theme'

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
	const mode = useThemePreference()

	const themeItems = SANDBOX_THEMES.map((t) => ({
		type: 'action' as const,
		key: t.id,
		label: t.label,
		onSelect: () => setThemeName(t.id),
	}))

	const modeItems = [
		{ type: 'action' as const, key: 'light', label: 'Light', onSelect: () => setMode('light') },
		{ type: 'action' as const, key: 'dark', label: 'Dark', onSelect: () => setMode('dark') },
	]

	return (
		<SideNavHeading
			heading="Sandbox"
			icon={<Icon name="sandbox-box" size={20} />}
			headerEndContent={
				<HStack gap={0.5} justify="end" className="sb-nav-controls">
					<DropdownMenu
						button={{
							label: 'Theme',
							icon: <Icon name="sandbox-palette" size={16} color="var(--color-icon-secondary)" />,
							variant: 'ghost',
							size: 'sm',
							isIconOnly: true,
						}}
						menuWidth={160}
						items={themeItems}
					/>
					<DropdownMenu
						button={{
							label: mode === 'dark' ? 'Dark mode' : 'Light mode',
							icon: <Icon name={mode === 'dark' ? 'sandbox-moon' : 'sandbox-sun'} size={16} color="var(--color-icon-secondary)" />,
							variant: 'ghost',
							size: 'sm',
							isIconOnly: true,
						}}
						menuWidth={160}
						items={modeItems}
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
					icon={navPageIcons[homePage.icon]}
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
								icon={categoryIcons[category.slug] ?? 'sandbox-box'}
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
						icon={navPageIcons[page.icon] ?? 'sandbox-box'}
					/>
				))}
			</SideNavSection>
		</SideNav>
	)
}
