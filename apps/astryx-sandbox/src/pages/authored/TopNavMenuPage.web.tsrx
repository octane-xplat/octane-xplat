// Copyright (c) Meta Platforms, Inc. and affiliates.

import './TopNavMenuPage.css'

import { VStack } from '@octane-xplat/ui'
import { Text, Heading } from '@octane-xplat/ui'
import { Button } from '@octane-xplat/ui'
import { TopNav, TopNavHeading, TopNavItem, TopNavMenu } from '@octane-xplat/ui'
import { NavIcon } from '@octane-xplat/ui'

const LogoIcon = () => (
	<svg
		width="16"
		height="16"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<circle cx="12" cy="12" r="3" />
		<circle cx="12" cy="5" r="1.5" />
		<circle cx="18.5" cy="8.5" r="1.5" />
		<circle cx="18.5" cy="15.5" r="1.5" />
		<circle cx="12" cy="19" r="1.5" />
		<circle cx="5.5" cy="15.5" r="1.5" />
		<circle cx="5.5" cy="8.5" r="1.5" />
	</svg>
)

const PlaceholderIcon = () => (
	<svg
		width="20"
		height="20"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.5"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<rect x="3" y="3" width="18" height="18" rx="4" />
	</svg>
)

const productItems = [
	{
		title: 'Approach',
		description: 'Microbiome science for human health',
		icon: <PlaceholderIcon />,
		href: '#approach',
	},
	{
		title: 'Platform',
		description: 'End-to-end discovery and development',
		icon: <PlaceholderIcon />,
		href: '#platform',
	},
]

const scienceItems = [
	{
		title: 'Research',
		description: 'Published studies and clinical trials',
		icon: <PlaceholderIcon />,
		href: '#research',
	},
	{
		title: 'Publications',
		description: 'Peer-reviewed papers and white papers',
		icon: <PlaceholderIcon />,
		href: '#publications',
	},
	{
		title: 'Team',
		description: 'Meet our scientific advisory board',
		icon: <PlaceholderIcon />,
		href: '#team',
	},
]

/**
 * Demo page for TopNavMenu — a nav item with hover-triggered overflow menu.
 */
export function TopNavMenuPage() {
	return (
		<div className={['TopNavMenuPage-container'].filter(Boolean).join(' ')}>
			<VStack gap={6}>
				<VStack gap={2}>
					<Heading level={1}>TopNav Menu</Heading>
					<Text type="body" color="secondary">
						A nav item with a hover-triggered overflow menu. Hover over &quot;Products&quot; or
						&quot;Science&quot; to see the popover.
					</Text>
				</VStack>

				{/* Marketing-style nav with overflow menus */}
				<VStack gap={3}>
					<Heading level={2}>Marketing Nav</Heading>
					<div className={['TopNavMenuPage-navWrapper'].filter(Boolean).join(' ')}>
						<TopNav
							label="Marketing navigation"
							heading={
								<TopNavHeading
									heading="Marketing"
									logo={<NavIcon icon={<LogoIcon />} />}
									headingHref="#"
								/>
							}
							startContent={
								<>
									<TopNavMenu label="Products" items={productItems} />
									<TopNavMenu label="Science" items={scienceItems} />
									<TopNavItem label="Learn" href="#" />
								</>
							}
							endContent={
								<>
									<Button label="Login" variant="ghost" />
									<Button label="Get started" variant="primary" />
								</>
							}
						/>
					</div>
				</VStack>

				{/* Simple nav with one overflow menu */}
				<VStack gap={3}>
					<Heading level={2}>Simple Nav</Heading>
					<div className={['TopNavMenuPage-navWrapper'].filter(Boolean).join(' ')}>
						<TopNav
							label="Simple navigation"
							heading={<TopNavHeading heading="App" headingHref="#" />}
							startContent={
								<>
									<TopNavItem label="Home" href="#" isSelected />
									<TopNavMenu
										label="More"
										items={[
											{
												title: 'Settings',
												description: 'Configure your preferences',
												href: '#settings',
											},
											{
												title: 'Help',
												description: 'Documentation and support',
												href: '#help',
											},
										]}
									/>
								</>
							}
						/>
					</div>
				</VStack>
			</VStack>
		</div>
	)
}
