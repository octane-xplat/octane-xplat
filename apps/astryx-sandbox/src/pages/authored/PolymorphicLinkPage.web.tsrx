// Copyright (c) Meta Platforms, Inc. and affiliates.

import './PolymorphicLinkPage.css'

import { useState } from 'octane'
import type { SandboxLinkProps } from '../../shell/SandboxLink'

import { VStack } from '@octane-xplat/ui'
import { Text, Heading } from '@octane-xplat/ui'
import { Divider } from '@octane-xplat/ui'
import { TopNav, TopNavHeading, TopNavItem } from '@octane-xplat/ui'
import { SideNav, SideNavItem } from '@octane-xplat/ui'
import { Breadcrumbs } from '@octane-xplat/ui'
import { TabList, Tab } from '@octane-xplat/ui'
import { Link, LinkProvider, LinkContext } from '@octane-xplat/ui'

// =============================================================================
// Simulated framework link components
// =============================================================================

/**
 * Simulated Next.js-like Link for demo purposes.
 * Intercepts navigation and logs to console instead of full page reload.
 * Renders with a blue dashed outline to visually identify it.
 */
function SimulatedNextLink(props: SandboxLinkProps) {
	const { href, children, onClick, ...rest } = props
	return (
		<a
			{...rest}
			href={href}
			className="PolymorphicLinkPage-customLinkIndicator"
			onClick={(e) => {
				e.preventDefault()
				console.log(`[SimulatedNextLink] Client-side navigate to: ${href}`)
				onClick?.(e)
			}}
		>
			{children}
		</a>
	)
}

function GreenLink(props: SandboxLinkProps) {
	const { href, children, onClick, ...rest } = props
	return (
		<a
			{...rest}
			href={href}
			className="authored-green-link"
			onClick={(e) => {
				e.preventDefault()
				console.log(`[GreenLink] Navigate to: ${href}`)
				onClick?.(e)
			}}
		>
			{children}
		</a>
	)
}

// =============================================================================
// Demo page
// =============================================================================

export function PolymorphicLinkPage() {
	const [tab, setTab] = useState('overview')

	return (
		<div className={['PolymorphicLinkPage-container'].filter(Boolean).join(' ')}>
			<VStack gap={6}>
				<VStack gap={2}>
					<Heading level={1}>Polymorphic Link</Heading>
					<Text type="body" color="secondary">
						Astryx components that render links can use a custom link component instead of native{' '}
						{'<a>'}. Set it globally via LinkProvider or per-component via the{' '}
						<Text type="body" weight="bold">
							as
						</Text>{' '}
						prop.
					</Text>
				</VStack>

				<Divider />

				{/* ================================================================= */}
				{/* Section 1: Provider Demo */}
				{/* ================================================================= */}
				<VStack gap={3}>
					<Heading level={2}>Provider Demo</Heading>
					<Text type="body" color="secondary">
						All components below are wrapped in{' '}
						<Text type="body" weight="bold">
							LinkProvider
						</Text>{' '}
						with a simulated Next.js Link (blue dashed outline). Open the browser console to see
						navigation logs.
					</Text>

					<LinkProvider component={SimulatedNextLink}>
						<VStack gap={4}>
							{/* TopNav */}
							<VStack gap={1}>
								<Text type="supporting" weight="bold">
									TopNav
								</Text>
								<div className={['PolymorphicLinkPage-navWrapper'].filter(Boolean).join(' ')}>
									<TopNav
										label="Provider demo navigation"
										heading={<TopNavHeading heading="My App" />}
										startContent={
											<>
												<TopNavItem label="Home" href="/" isSelected />
												<TopNavItem label="Products" href="/products" />
												<TopNavItem label="About" href="/about" />
											</>
										}
									/>
								</div>
							</VStack>

							{/* Breadcrumbs */}
							<VStack gap={1}>
								<Text type="supporting" weight="bold">
									Breadcrumbs
								</Text>
								<Breadcrumbs
									accessibilityLabel="Provider breadcrumbs"
									items={[
										{ label: 'Home', href: '/' },
										{ label: 'Products', href: '/products' },
										{ label: 'Widget' },
									]}
								/>
							</VStack>

							{/* TabList */}
							<VStack gap={1}>
								<Text type="supporting" weight="bold">
									TabList (with href)
								</Text>
								<TabList value={tab} onChange={setTab}>
									<Tab value="overview" label="Overview" href="/overview" />
									<Tab value="details" label="Details" href="/details" />
									<Tab value="reviews" label="Reviews" href="/reviews" />
								</TabList>
							</VStack>

							{/* SideNav */}
							<VStack gap={1}>
								<Text type="supporting" weight="bold">
									SideNav
								</Text>
								<div className={['PolymorphicLinkPage-sidenavWrapper'].filter(Boolean).join(' ')}>
									<SideNav aria-label="Provider sidenav">
										<SideNavItem label="Dashboard" href="/dashboard" isSelected />
										<SideNavItem label="Settings" href="/settings" />
										<SideNavItem label="Profile" href="/profile" />
									</SideNav>
								</div>
							</VStack>

							{/* Link */}
							<VStack gap={1}>
								<Text type="supporting" weight="bold">
									Link
								</Text>
								<Link href="/docs">Go to documentation</Link>
							</VStack>
						</VStack>
					</LinkProvider>
				</VStack>

				<Divider />

				{/* ================================================================= */}
				{/* Section 2: Per-component `as` override */}
				{/* ================================================================= */}
				<VStack gap={3}>
					<Heading level={2}>Per-Component Override</Heading>
					<Text type="body" color="secondary">
						The{' '}
						<Text type="body" weight="bold">
							as
						</Text>{' '}
						prop overrides the provider for a single component. Below, the provider sets the blue
						link, but &quot;Products&quot; uses a green link via{' '}
						<Text type="body" weight="bold">
							as={'{GreenLink}'}
						</Text>
						.
					</Text>

					<LinkProvider component={SimulatedNextLink}>
						<div className={['PolymorphicLinkPage-navWrapper'].filter(Boolean).join(' ')}>
							<TopNav
								label="Override demo navigation"
								heading={<TopNavHeading heading="Override Demo" />}
								startContent={
									<>
										<TopNavItem label="Home" href="/" isSelected />
										<TopNavItem label="Products" href="/products" as={GreenLink} />
										<TopNavItem label="About" href="/about" />
									</>
								}
							/>
						</div>
					</LinkProvider>
				</VStack>

				<Divider />

				{/* ================================================================= */}
				{/* Section 3: Default behavior (no provider) */}
				{/* ================================================================= */}
				<VStack gap={3}>
					<Heading level={2}>Default Behavior</Heading>
					<Text type="body" color="secondary">
						Without a provider or{' '}
						<Text type="body" weight="bold">
							as
						</Text>{' '}
						prop, components render native {'<a>'} elements as usual.
					</Text>

					<div className={['PolymorphicLinkPage-navWrapper'].filter(Boolean).join(' ')}>
						<TopNav
							label="Default navigation"
							heading={<TopNavHeading heading="Default" />}
							startContent={
								<>
									<TopNavItem label="Home" href="#home" isSelected />
									<TopNavItem label="Products" href="#products" />
									<TopNavItem label="About" href="#about" />
								</>
							}
						/>
					</div>

					<LinkContext value={null}>
						<Breadcrumbs
							accessibilityLabel="Default breadcrumbs"
							items={[
								{ label: 'Home', href: '#home' },
								{ label: 'Products', href: '#products' },
								{ label: 'Current Page' },
							]}
						/>
					</LinkContext>
				</VStack>
			</VStack>
		</div>
	)
}
