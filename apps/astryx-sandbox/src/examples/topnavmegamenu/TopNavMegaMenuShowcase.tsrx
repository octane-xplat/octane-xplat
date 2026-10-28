// Port of upstream TopNavMegaMenu/TopNavMegaMenuShowcase.tsx (Astryx 0.6.4, MIT).
import {
	Icon,
	TopNav,
	TopNavHeading,
	TopNavItem,
	TopNavMegaMenu,
	TopNavMegaMenuFeaturedCard,
	TopNavMegaMenuItem,
} from '@octane-xplat/ui'

export function TopNavMegaMenuShowcase() @{
	<TopNav
		style={{ width: 600 }}
		label="Main navigation"
		heading={<TopNavHeading heading="DevTools" />}
		startContent={
			<>
				<TopNavItem label="Overview" href="#" isSelected />
				<TopNavMegaMenu
					label="Products"
					items={
						<>
							<TopNavMegaMenuItem
								title="Deploy"
								description="Ship to production in seconds"
								icon={<Icon name="sandbox-arrow-up" size={20} />}
								href="#deploy"
							/>
							<TopNavMegaMenuItem
								title="Documentation"
								description="Guides, references, and tutorials"
								icon={<Icon name="sandbox-code" size={20} />}
								href="#docs"
							/>
							<TopNavMegaMenuItem
								title="Security"
								description="Protect your application"
								icon={<Icon name="sandbox-lock" size={20} />}
								href="#security"
							/>
							<TopNavMegaMenuItem
								title="Search"
								description="Instant full-text search"
								icon={<Icon name="xplat-search" size={20} />}
								href="#search"
							/>
						</>
					}
					featured={
						<TopNavMegaMenuFeaturedCard
							title="New: Edge Functions"
							description="Deploy serverless code closer to your users with our new edge network."
							linkLabel="Learn more"
							linkHref="#edge"
						/>
					}
				/>
				<TopNavItem label="Pricing" href="#" />
			</>
		}
	/>
}
