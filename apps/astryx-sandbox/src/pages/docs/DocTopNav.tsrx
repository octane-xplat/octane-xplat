// Copyright (c) Meta Platforms, Inc. and affiliates. MIT.
import { TopNav, TopNavHeading, TopNavItem } from '@octane-xplat/ui'
import { useRouterState } from '@octane-xplat/ui/routing'
const NAV_ITEMS = [
	{ label: 'Home', href: '/pages/doc-home/' },
	{ label: 'Documentation', href: '/pages/doc-docs/' },
	{ label: 'Discover', href: '/pages/doc-discover/' },
]

export default function DocTopNav() @{
	const path = useRouterState().route?.href ?? ''

	<TopNav
		label="Documentation navigation"
		heading={<TopNavHeading heading="Astryx" headingHref="/pages/doc-home/" />}
		centerContent={
			<>
				@for (const item of NAV_ITEMS; key item.href) {
					<TopNavItem
						label={item.label}
						href={item.href}
						isSelected={path.startsWith(item.href.replace(/\/$/, ''))}
					/>
				}
			</>
		}
	/>
}
