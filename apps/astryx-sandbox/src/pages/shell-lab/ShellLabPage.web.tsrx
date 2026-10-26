import './ShellLabPage.inline.css'
import type { Renderable } from '@octane-xplat/ui'
// Copyright (c) Meta Platforms, Inc. and affiliates.

import './ShellLabPage.css'

import { useState, useCallback, useEffect, useMemo } from 'octane'

import { AppShell } from '@octane-xplat/ui'
import type { MobileNavConfig } from '@octane-xplat/ui'
import { SideNav, SideNavHeading, SideNavItem, SideNavSection } from '@octane-xplat/ui'
import {
	TopNav,
	TopNavHeading,
	TopNavItem,
	TopNavMenu,
	TopNavMegaMenu,
	TopNavMegaMenuItem,
	TopNavMegaMenuFeaturedCard,
} from '@octane-xplat/ui'

import { MobileNav, MobileNavToggle } from '@octane-xplat/ui'
import { VStack, HStack } from '@octane-xplat/ui'
import { Text, Heading } from '@octane-xplat/ui'
import { Switch } from '@octane-xplat/ui'
import { Selector } from '@octane-xplat/ui'
import { Card } from '@octane-xplat/ui'
import { Divider } from '@octane-xplat/ui'
import { Badge } from '@octane-xplat/ui'
import { Button } from '@octane-xplat/ui'
import { NavIcon } from '@octane-xplat/ui'
import { Banner } from '@octane-xplat/ui'
import { NavHeadingMenuItem } from '@octane-xplat/ui'

// =============================================================================
// Configuration types
// =============================================================================

// Simple icon components for shell lab demo
const DashboardIcon = (props: Record<string, any>) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth={1.5}
		{...props}
	>
		<rect x="3" y="3" width="7" height="7" rx="1" />
		<rect x="14" y="3" width="7" height="7" rx="1" />
		<rect x="3" y="14" width="7" height="7" rx="1" />
		<rect x="14" y="14" width="7" height="7" rx="1" />
	</svg>
)

const MessagesIcon = (props: Record<string, any>) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth={1.5}
		{...props}
	>
		<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
	</svg>
)

const SettingsIcon = (props: Record<string, any>) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth={1.5}
		{...props}
	>
		<circle cx="12" cy="12" r="3" />
		<path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z" />
	</svg>
)

const ProjectsIcon = (props: Record<string, any>) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth={1.5}
		{...props}
	>
		<path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
	</svg>
)

const DocsIcon = (props: Record<string, any>) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth={1.5}
		{...props}
	>
		<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
		<polyline points="14 2 14 8 20 8" />
		<line x1="16" y1="13" x2="8" y2="13" />
		<line x1="16" y1="17" x2="8" y2="17" />
	</svg>
)

/**
 * A React component that renders null. Simulates the Next.js parallel route
 * pattern where a slot (e.g. @sidebar/default.tsx) returns null — the slot
 * still receives a React element, but it produces no DOM output.
 */
function EmptySlot() {
	return null
}

interface ShellConfig {
	variant: 'wash' | 'surface' | 'section' | 'elevated'
	height: 'fill' | 'auto'
	sideNavBreakpoint: 'sm' | 'md' | 'lg' | 'none'
	sideNavMode: 'show' | 'hide' | 'empty-component'
	topNavMode: 'show' | 'hide' | 'empty-component'
	showBanner: boolean
	showFooter: boolean
	showFooterIcons: boolean
	showTopContent: boolean
	sideNavHeadingStyle: 'none' | 'simple' | 'link' | 'menu' | 'full'
	showSuperheading: boolean
	showSubheading: boolean
	headingIconStyle: 'navicon' | 'icon' | 'none'
	showHeaderEndContent: boolean
	showNestedItems: boolean
	isCollapsible: boolean
	isResizable: boolean
	collapseToggleLocation: 'sidenav' | 'topnav'
	mobileNavMode: 'auto' | 'customContent' | 'customToggle' | 'disabled'
	mobileNavSide: 'auto' | 'start' | 'end'
	topNavAlignment: 'none' | 'start' | 'center' | 'end'
	topNavStyle: 'items' | 'menus' | 'mega'
	showTopNavHeading: boolean
	topNavHeadingStyle: 'none' | 'simple' | 'link' | 'menu' | 'full'
	topNavHeadingIconStyle: 'navicon' | 'icon' | 'none'
	showTopNavSuperheading: boolean
	showTopNavSubheading: boolean
}

const DEFAULT_CONFIG: ShellConfig = {
	variant: 'section',
	height: 'fill',
	sideNavBreakpoint: 'md',
	sideNavMode: 'show',
	topNavMode: 'show',
	showBanner: false,
	showFooter: false,
	showFooterIcons: true,
	showTopContent: true,
	sideNavHeadingStyle: 'link',
	showSuperheading: false,
	showSubheading: false,
	headingIconStyle: 'navicon',
	showHeaderEndContent: false,
	showNestedItems: true,
	isCollapsible: true,
	isResizable: false,
	collapseToggleLocation: 'sidenav',
	mobileNavMode: 'auto',
	mobileNavSide: 'auto',
	topNavAlignment: 'start',
	topNavStyle: 'items',
	showTopNavHeading: true,
	topNavHeadingStyle: 'link',
	topNavHeadingIconStyle: 'navicon',
	showTopNavSuperheading: false,
	showTopNavSubheading: false,
}

// =============================================================================
// Configuration Panel
// =============================================================================

function ConfigPanel({
	config,
	onChange,
}: {
	config: ShellConfig
	onChange: (update: Partial<ShellConfig>) => void
}) {
	return (
		<Card>
			<VStack gap={5} className="ShellLabPage-padding4">
				<Heading level={3}>Shell Configuration</Heading>

				{/* AppShell */}
				<VStack gap={3}>
					<Text type="label" weight="bold">
						AppShell
					</Text>
					<SelectorRow
						label="Variant"
						value={config.variant}
						onChange={(v) => onChange({ variant: v as ShellConfig['variant'] })}
						options={[
							{ value: 'section', label: 'Section' },
							{ value: 'wash', label: 'Wash' },
							{ value: 'surface', label: 'Surface' },
							{ value: 'elevated', label: 'Elevated' },
						]}
					/>
					<SelectorRow
						label="Height"
						value={config.height}
						onChange={(v) => onChange({ height: v as 'fill' | 'auto' })}
						options={[
							{ value: 'fill', label: 'Fill' },
							{ value: 'auto', label: 'Auto' },
						]}
					/>
					<ToggleRow
						label="Banner"
						value={config.showBanner}
						onChange={(v) => onChange({ showBanner: v })}
					/>
				</VStack>

				<Divider />

				{/* SideNav */}
				<VStack gap={3}>
					<Text type="label" weight="bold">
						SideNav
					</Text>
					<SelectorRow
						label="Mode"
						value={config.sideNavMode}
						onChange={(v) =>
							onChange({
								sideNavMode: v as ShellConfig['sideNavMode'],
							})
						}
						options={[
							{ value: 'show', label: 'Show' },
							{ value: 'hide', label: 'Hide' },
							{ value: 'empty-component', label: 'Empty Component' },
						]}
					/>
					<SelectorRow
						label="Heading"
						value={config.sideNavHeadingStyle}
						onChange={(v) =>
							onChange({
								sideNavHeadingStyle: v as ShellConfig['sideNavHeadingStyle'],
							})
						}
						options={[
							{ value: 'none', label: 'None' },
							{ value: 'simple', label: 'Simple' },
							{ value: 'link', label: 'Link' },
							{ value: 'menu', label: 'Menu' },
							{ value: 'full', label: 'Full' },
						]}
					/>
					<SelectorRow
						label="Icon"
						value={config.headingIconStyle}
						onChange={(v) =>
							onChange({
								headingIconStyle: v as ShellConfig['headingIconStyle'],
							})
						}
						options={[
							{ value: 'navicon', label: 'NavIcon' },
							{ value: 'icon', label: 'Icon (24px)' },
							{ value: 'none', label: 'None' },
						]}
					/>
					<ToggleRow
						label="Superheading"
						value={config.showSuperheading}
						onChange={(v) => onChange({ showSuperheading: v })}
					/>
					<ToggleRow
						label="Subheading"
						value={config.showSubheading}
						onChange={(v) => onChange({ showSubheading: v })}
					/>
					<ToggleRow
						label="Header End Content"
						value={config.showHeaderEndContent}
						onChange={(v) => onChange({ showHeaderEndContent: v })}
					/>
					<ToggleRow
						label="Top Content"
						value={config.showTopContent}
						onChange={(v) => onChange({ showTopContent: v })}
					/>
					<ToggleRow
						label="Nested Items"
						value={config.showNestedItems}
						onChange={(v) => onChange({ showNestedItems: v })}
					/>
					<ToggleRow
						label="Footer"
						value={config.showFooter}
						onChange={(v) => onChange({ showFooter: v })}
					/>
					<ToggleRow
						label="Footer Icons"
						value={config.showFooterIcons}
						onChange={(v) => onChange({ showFooterIcons: v })}
					/>
					<ToggleRow
						label="Collapsible"
						value={config.isCollapsible}
						onChange={(v) => onChange({ isCollapsible: v })}
					/>
					{config.isCollapsible && (
						<SelectorRow
							label="Toggle Location"
							value={config.collapseToggleLocation}
							onChange={(v) => onChange({ collapseToggleLocation: v as 'sidenav' | 'topnav' })}
							options={[
								{ value: 'sidenav', label: 'SideNav' },
								{ value: 'topnav', label: 'TopNav' },
							]}
						/>
					)}
					<ToggleRow
						label="Resizable"
						value={config.isResizable}
						onChange={(v) => onChange({ isResizable: v })}
					/>
				</VStack>

				<Divider />

				{/* TopNav */}
				<VStack gap={3}>
					<Text type="label" weight="bold">
						TopNav
					</Text>
					<SelectorRow
						label="Mode"
						value={config.topNavMode}
						onChange={(v) =>
							onChange({
								topNavMode: v as ShellConfig['topNavMode'],
							})
						}
						options={[
							{ value: 'show', label: 'Show' },
							{ value: 'hide', label: 'Hide' },
							{ value: 'empty-component', label: 'Empty Component' },
						]}
					/>
					<ToggleRow
						label="Heading"
						value={config.showTopNavHeading}
						onChange={(v) => onChange({ showTopNavHeading: v })}
					/>
					{config.showTopNavHeading && (
						<>
							<SelectorRow
								label="Heading Style"
								value={config.topNavHeadingStyle}
								onChange={(v) =>
									onChange({
										topNavHeadingStyle: v as ShellConfig['topNavHeadingStyle'],
									})
								}
								options={[
									{ value: 'none', label: 'None' },
									{ value: 'simple', label: 'Simple' },
									{ value: 'link', label: 'Link' },
									{ value: 'menu', label: 'Menu' },
									{ value: 'full', label: 'Full' },
								]}
							/>
							<SelectorRow
								label="Icon"
								value={config.topNavHeadingIconStyle}
								onChange={(v) =>
									onChange({
										topNavHeadingIconStyle: v as ShellConfig['topNavHeadingIconStyle'],
									})
								}
								options={[
									{ value: 'navicon', label: 'NavIcon' },
									{ value: 'icon', label: 'Icon (24px)' },
									{ value: 'none', label: 'None' },
								]}
							/>
							<ToggleRow
								label="Superheading"
								value={config.showTopNavSuperheading}
								onChange={(v) => onChange({ showTopNavSuperheading: v })}
							/>
							<ToggleRow
								label="Subheading"
								value={config.showTopNavSubheading}
								onChange={(v) => onChange({ showTopNavSubheading: v })}
							/>
						</>
					)}
					<SelectorRow
						label="Alignment"
						value={config.topNavAlignment}
						onChange={(v) => onChange({ topNavAlignment: v as ShellConfig['topNavAlignment'] })}
						options={[
							{ value: 'none', label: 'None' },
							{ value: 'start', label: 'Start' },
							{ value: 'center', label: 'Center' },
							{ value: 'end', label: 'End' },
						]}
					/>
					<SelectorRow
						label="Style"
						value={config.topNavStyle}
						onChange={(v) => onChange({ topNavStyle: v as ShellConfig['topNavStyle'] })}
						options={[
							{ value: 'items', label: 'Items' },
							{ value: 'menus', label: 'Menus' },
							{ value: 'mega', label: 'Mega' },
						]}
					/>
				</VStack>

				<Divider />

				{/* Mobile Nav */}
				<VStack gap={3}>
					<Text type="label" weight="bold">
						Mobile Nav
					</Text>
					<SelectorRow
						label="Mode"
						value={config.mobileNavMode}
						onChange={(v) => onChange({ mobileNavMode: v as ShellConfig['mobileNavMode'] })}
						options={[
							{ value: 'auto', label: 'Auto' },
							{ value: 'customContent', label: 'Custom Content' },
							{ value: 'customToggle', label: 'Custom Toggle' },
							{ value: 'disabled', label: 'Disabled' },
						]}
					/>
					{config.mobileNavMode !== 'disabled' && (
						<SelectorRow
							label="Breakpoint"
							value={config.sideNavBreakpoint}
							onChange={(v) =>
								onChange({
									sideNavBreakpoint: v as ShellConfig['sideNavBreakpoint'],
								})
							}
							options={[
								{ value: 'sm', label: 'SM' },
								{ value: 'md', label: 'MD' },
								{ value: 'lg', label: 'LG' },
								{ value: 'none', label: 'None' },
							]}
						/>
					)}
					{config.mobileNavMode === 'customContent' && (
						<SelectorRow
							label="Side"
							value={config.mobileNavSide}
							onChange={(v) => onChange({ mobileNavSide: v as 'auto' | 'start' | 'end' })}
							options={[
								{ value: 'auto', label: 'Auto' },
								{ value: 'start', label: 'Start' },
								{ value: 'end', label: 'End' },
							]}
						/>
					)}
				</VStack>
			</VStack>
		</Card>
	)
}

function ToggleRow({
	label,
	value,
	onChange,
}: {
	label: string
	value: boolean
	onChange: (v: boolean) => void
}) {
	return (
		<HStack gap={4} vAlign="center" hAlign="between">
			<Text type="body">{label}</Text>
			<Switch value={value} onChange={onChange} label={label} />
		</HStack>
	)
}

function SelectorRow({
	label,
	value,
	onChange,
	options,
}: {
	label: string
	value: string
	onChange: (v: string) => void
	options: { value: string; label: string }[]
}) {
	return (
		<HStack gap={4} vAlign="center">
			<Text type="body" className="ShellLabPage-static-1">
				{label}
			</Text>
			<Selector
				label={label}
				isLabelHidden
				value={value}
				onValueChange={(v) => {
					if (v !== null) {
						onChange(v)
					}
				}}
				options={options}
			/>
		</HStack>
	)
}

// =============================================================================
// Sample Nav Content
// =============================================================================

function SampleSideNav({
	config,
	externalCollapsed,
	setExternalCollapsed,
}: {
	config: ShellConfig
	externalCollapsed?: boolean
	setExternalCollapsed?: (v: boolean) => void
}) {
	const appNavIcon = (
		<NavIcon
			icon={
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="currentColor"
					width="16"
					height="16"
				>
					<path d="M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44c-.36.2-.8.2-1.14 0l-7.9-4.44A.991.991 0 013 16.5v-9c0-.38.21-.71.53-.88l7.9-4.44c.36-.2.8-.2 1.14 0l7.9 4.44c.32.17.53.5.53.88v9z" />
				</svg>
			}
		/>
	)

	const appBareIcon = (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="currentColor"
			width="24"
			height="24"
		>
			<path d="M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44c-.36.2-.8.2-1.14 0l-7.9-4.44A.991.991 0 013 16.5v-9c0-.38.21-.71.53-.88l7.9-4.44c.36-.2.8-.2 1.14 0l7.9 4.44c.32.17.53.5.53.88v9z" />
		</svg>
	)

	const appIcon =
		config.headingIconStyle === 'navicon'
			? appNavIcon
			: config.headingIconStyle === 'icon'
				? appBareIcon
				: undefined

	const headingMenu = (
		<>
			<NavHeadingMenuItem label="Sibling Product 1" onClick={() => {}} />
			<NavHeadingMenuItem label="Sibling Product 2" onClick={() => {}} />
			<NavHeadingMenuItem label="Sibling Product 3" onClick={() => {}} />
		</>
	)

	const heading =
		config.sideNavHeadingStyle === 'none' ? undefined : (
			<SideNavHeading
				icon={appIcon}
				heading="Shell Lab"
				headingHref={
					config.sideNavHeadingStyle === 'link' || config.sideNavHeadingStyle === 'full'
						? '#'
						: undefined
				}
				superheading={config.showSuperheading ? 'Acme Suite' : undefined}
				superheadingHref={config.showSuperheading ? '#' : undefined}
				subheading={config.showSubheading ? 'Business Account' : undefined}
				menu={
					config.sideNavHeadingStyle === 'menu' || config.sideNavHeadingStyle === 'full'
						? headingMenu
						: undefined
				}
				headerEndContent={config.showHeaderEndContent ? <Badge>{'Pro'}</Badge> : undefined}
			/>
		)

	return (
		<>
			<SideNav
				collapsible={
					config.isCollapsible
						? config.collapseToggleLocation === 'topnav'
							? {
									isCollapsed: externalCollapsed,
									onCollapsedChange: setExternalCollapsed,
									hasButton: false,
								}
							: true
						: false
				}
				resizable={config.isResizable}
				header={heading}
				topContent={config.showTopContent ? <SideNavItem label="Create New" /> : undefined}
				footer={
					config.showFooter ? (
						<SideNavSection title="Account">
							<SideNavItem label="Jane Smith" />
							<SideNavItem label="Upgrade to Pro" />
						</SideNavSection>
					) : undefined
				}
				footerIcons={
					config.showFooterIcons ? (
						<>
							<Button
								label="Help"
								icon={
									<svg
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth={1.5}
										width="16"
										height="16"
									>
										<circle cx="12" cy="12" r="10" />
										<path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
										<circle cx="12" cy="17" r=".5" fill="currentColor" />
									</svg>
								}
								variant="ghost"
								isIconOnly
							/>
							<Button
								label="Settings"
								icon={
									<svg
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth={1.5}
										width="16"
										height="16"
									>
										<path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z" />
										<circle cx="12" cy="12" r="3" />
									</svg>
								}
								variant="ghost"
								isIconOnly
							/>
						</>
					) : undefined
				}
			>
				<SideNavSection title="Navigation">
					<SideNavItem label="Dashboard" isSelected href="#" icon={DashboardIcon} />
					<SideNavItem
						label="Projects"
						href="#"
						icon={ProjectsIcon}
						endContent={<Badge>{3}</Badge>}
					/>
					<SideNavItem label="Messages" href="#" icon={MessagesIcon} />
					{config.showNestedItems && (
						<SideNavItem label="Settings" href="#" icon={SettingsIcon}>
							<SideNavItem label="General" href="#" />
							<SideNavItem label="Security" href="#" />
							<SideNavItem label="Notifications" href="#" />
						</SideNavItem>
					)}
				</SideNavSection>
				<SideNavSection title="Resources">
					<SideNavItem label="Documentation" href="#" icon={DocsIcon} />
					<SideNavItem label="API Reference" href="#" />
					<SideNavItem label="Support" href="#" />
				</SideNavSection>
			</SideNav>
		</>
	)
}

function SampleTopNav({
	config,
	onToggleCollapse,
}: {
	config: ShellConfig
	onToggleCollapse?: () => void
}) {
	const plainItems = (
		<>
			<TopNavItem label="Home" href="#" isSelected />
			<TopNavItem label="Products" href="#" />
			<TopNavItem label="Team" href="#" />
			<TopNavItem label="Reports" href="#" />
		</>
	)

	const menuItems = (
		<>
			<TopNavItem label="Home" href="#" isSelected />
			<TopNavMenu
				label="Products"
				items={[
					{
						title: 'Analytics',
						description: 'View metrics and dashboards',
						href: '#',
					},
					{
						title: 'Reports',
						description: 'Generate and export reports',
						href: '#',
					},
					{
						title: 'Pipelines',
						description: 'Data processing workflows',
						href: '#',
					},
				]}
			/>
			<TopNavItem label="Team" href="#" />
		</>
	)

	const megaItems = (
		<>
			<TopNavItem label="Home" href="#" isSelected />
			<TopNavMegaMenu
				label="Products"
				items={
					<>
						<TopNavMegaMenuItem
							title="Analytics"
							description="View metrics and dashboards"
							href="#"
						/>
						<TopNavMegaMenuItem
							title="Reports"
							description="Generate and export reports"
							href="#"
						/>
						<TopNavMegaMenuItem
							title="Pipelines"
							description="Data processing workflows"
							href="#"
						/>
						<TopNavMegaMenuItem title="Integrations" description="Connect your tools" href="#" />
					</>
				}
				featured={
					<TopNavMegaMenuFeaturedCard
						title="New: AI Features"
						description="Explore our latest AI-powered analytics tools for faster insights."
						linkLabel="Learn more"
						linkHref="#"
					/>
				}
			/>
			<TopNavItem label="Team" href="#" />
		</>
	)

	const navItems =
		config.topNavStyle === 'mega'
			? megaItems
			: config.topNavStyle === 'menus'
				? menuItems
				: plainItems

	const topNavNavIcon = (
		<NavIcon
			icon={
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="currentColor"
					width="16"
					height="16"
				>
					<path d="M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44c-.36.2-.8.2-1.14 0l-7.9-4.44A.991.991 0 013 16.5v-9c0-.38.21-.71.53-.88l7.9-4.44c.36-.2.8-.2 1.14 0l7.9 4.44c.32.17.53.5.53.88v9z" />
				</svg>
			}
		/>
	)

	const topNavBareIcon = (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="currentColor"
			width="24"
			height="24"
		>
			<path d="M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44c-.36.2-.8.2-1.14 0l-7.9-4.44A.991.991 0 013 16.5v-9c0-.38.21-.71.53-.88l7.9-4.44c.36-.2.8-.2 1.14 0l7.9 4.44c.32.17.53.5.53.88v9z" />
		</svg>
	)

	const topNavLogo =
		config.topNavHeadingIconStyle === 'navicon'
			? topNavNavIcon
			: config.topNavHeadingIconStyle === 'icon'
				? topNavBareIcon
				: undefined

	const topNavHeadingMenu = (
		<>
			<NavHeadingMenuItem label="Sibling Product 1" onClick={() => {}} />
			<NavHeadingMenuItem label="Sibling Product 2" onClick={() => {}} />
			<NavHeadingMenuItem label="Sibling Product 3" onClick={() => {}} />
		</>
	)

	const topNavHeading =
		config.showTopNavHeading && config.topNavHeadingStyle !== 'none' ? (
			<TopNavHeading
				logo={topNavLogo}
				heading="Shell Lab"
				headingHref={
					config.topNavHeadingStyle === 'link' || config.topNavHeadingStyle === 'full'
						? '#'
						: undefined
				}
				superheading={config.showTopNavSuperheading ? 'Acme Suite' : undefined}
				superheadingHref={config.showTopNavSuperheading ? '#' : undefined}
				subheading={config.showTopNavSubheading ? 'Business Account' : undefined}
				menu={
					config.topNavHeadingStyle === 'menu' || config.topNavHeadingStyle === 'full'
						? topNavHeadingMenu
						: undefined
				}
			/>
		) : config.showTopNavHeading ? (
			<TopNavHeading logo={topNavLogo} />
		) : undefined

	return (
		<TopNav
			label="Shell Lab Navigation"
			heading={topNavHeading}
			startContent={config.topNavAlignment === 'start' ? navItems : undefined}
			centerContent={config.topNavAlignment === 'center' ? navItems : undefined}
			endContent={
				<>
					{config.topNavAlignment === 'end' && navItems}
					{onToggleCollapse && (
						<Button
							label="Toggle sidebar"
							variant="ghost"
							icon={
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth={1.5}
									width={16}
									height={16}
								>
									<path d="M3 12h18M3 6h18M3 18h18" />
								</svg>
							}
							clickAction={onToggleCollapse}
							isIconOnly
						/>
					)}
				</>
			}
		/>
	)
}

// =============================================================================
// Main Page
// =============================================================================

// =============================================================================
// URL param serialization helpers
// =============================================================================

function configToParams(config: ShellConfig): URLSearchParams {
	const params = new URLSearchParams()
	for (const [key, value] of Object.entries(config)) {
		const defaultValue = DEFAULT_CONFIG[key as keyof ShellConfig]
		if (value !== defaultValue) {
			params.set(key, String(value))
		}
	}

	return params
}

function paramsToConfig(params: URLSearchParams): ShellConfig {
	const config = { ...DEFAULT_CONFIG }
	for (const [key, value] of params.entries()) {
		if (key in DEFAULT_CONFIG) {
			const defaultValue = DEFAULT_CONFIG[key as keyof ShellConfig]
			if (typeof defaultValue === 'boolean') {
				;(config as Record<string, unknown>)[key] = value === 'true'
			} else {
				;(config as Record<string, unknown>)[key] = value
			}
		}
	}

	return config
}

export function ShellLabPage() {
	return (
		<>
			<ShellLabContent />
		</>
	)
}

function ShellLabContent() {
	const searchParams = new URLSearchParams(window.location.search)

	// Initialize config from URL params on mount
	const initialConfig = useMemo(
		() => paramsToConfig(searchParams),
		[], // only read URL on mount
	)

	const [config, setConfig] = useState<ShellConfig>(initialConfig)
	const [showConfig, setShowConfig] = useState(true)
	const [externalCollapsed, setExternalCollapsed] = useState(false)

	// Sync config changes to URL
	useEffect(() => {
		const params = configToParams(config)
		const paramString = params.toString()
		const newUrl = paramString
			? `${window.location.pathname}?${paramString}`
			: window.location.pathname

		window.history.replaceState(null, '', newUrl)
	}, [config])

	const handleConfigChange = useCallback((update: Partial<ShellConfig>) => {
		setConfig((prev) => ({ ...prev, ...update }))
	}, [])

	// Build the mobileNav prop based on config
	const mobileNav: false | MobileNavConfig | undefined =
		config.mobileNavMode === 'disabled'
			? false
			: config.mobileNavMode === 'customContent'
				? {
						breakpoint: config.sideNavBreakpoint,
						content: (
							<MobileNav header="Custom Nav" side={config.mobileNavSide}>
								<VStack gap={2} className="ShellLabPage-customSearchBar">
									<input
										type="search"
										placeholder="Search navigation..."
										className="ShellLabPage-static-2"
									/>
								</VStack>
								<SideNavSection title="Quick Links">
									<SideNavItem label="Docs" href="#" />
									<SideNavItem label="Help Center" href="#" />
								</SideNavSection>
								<SideNavSection title="Navigation">
									<SideNavItem label="Dashboard" isSelected href="#" icon={DashboardIcon} />
									<SideNavItem label="Projects" href="#" icon={ProjectsIcon} />
									<SideNavItem label="Messages" href="#" icon={MessagesIcon} />
								</SideNavSection>
							</MobileNav>
						),
					}
				: config.mobileNavMode === 'customToggle'
					? { hasToggle: false, breakpoint: config.sideNavBreakpoint } // auto drawer content, but no auto toggle
					: { breakpoint: config.sideNavBreakpoint } // auto with breakpoint

	return (
		<>
			<AppShell
				variant={config.variant}
				height={config.height}
				contentPadding={6}
				topNav={
					config.topNavMode === 'show' ? (
						<SampleTopNav
							config={config}
							onToggleCollapse={
								config.isCollapsible && config.collapseToggleLocation === 'topnav'
									? () => setExternalCollapsed((v) => !v)
									: undefined
							}
						/>
					) : config.topNavMode === 'empty-component' ? (
						<EmptySlot />
					) : undefined
				}
				sideNav={
					config.sideNavMode === 'show' ? (
						<SampleSideNav
							config={config}
							externalCollapsed={externalCollapsed}
							setExternalCollapsed={setExternalCollapsed}
						/>
					) : config.sideNavMode === 'empty-component' ? (
						<EmptySlot />
					) : undefined
				}
				mobileNav={mobileNav}
				banner={
					config.showBanner ? (
						<Banner onDismiss={() => handleConfigChange({ showBanner: false })}>
							<Text>Shell Lab — System announcement banner</Text>
						</Banner>
					) : undefined
				}
			>
				<VStack gap={6} className="ShellLabPage-content">
					<VStack gap={2}>
						<HStack gap={3} vAlign="center">
							{config.mobileNavMode === 'customToggle' && (
								<MobileNavToggle label="Open navigation" />
							)}
							<Heading level={1}>Shell Lab</Heading>
						</HStack>
						<Text type="body" color="secondary">
							Use the configuration panel to experiment with different shell and navigation setups.
							Resize the browser to test responsive behavior and collapse breakpoints.
						</Text>
					</VStack>

					<Card>
						<VStack gap={3} className="ShellLabPage-padding4">
							<Heading level={3}>Active Config</Heading>
							<pre className="ShellLabPage-static-3">{JSON.stringify(config, null, 2)}</pre>
						</VStack>
					</Card>

					{Array.from({ length: 10 }, (_, i) => (
						<Card key={i}>
							<VStack gap={2} className="ShellLabPage-padding4">
								<Heading level={4}>Content Block {i + 1}</Heading>
								<Text type="body" color="secondary">
									Sample content to test scroll behavior in fill vs auto height mode. The shell
									should handle overflow correctly regardless of content length.
								</Text>
							</VStack>
						</Card>
					))}
				</VStack>
			</AppShell>

			{/* Floating config panel */}
			{showConfig && (
				<div className="ShellLabPage-static-4">
					<ConfigPanel config={config} onChange={handleConfigChange} />
				</div>
			)}

			{/* Toggle config visibility */}
			<div className="ShellLabPage-static-5">
				<button onClick={() => setShowConfig((v) => !v)} className="ShellLabPage-static-6">
					{showConfig ? '✕ Hide Config' : '⚙ Config'}
				</button>
			</div>
		</>
	)
}
