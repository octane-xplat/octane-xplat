// Port of upstream TopNavMegaMenuItem/TopNavMegaMenuItemShowcase.tsx (Astryx 0.6.4, MIT).
import { Grid, Icon, TopNavMegaMenuItem } from '@octane-xplat/ui'

export function TopNavMegaMenuItemShowcase() @{
	<Grid columns={2} style={{ gap: 8 }}>
		<TopNavMegaMenuItem
			title="Edge Functions"
			description="Run serverless code at the network edge"
			icon={<Icon name="sandbox-arrow-up" size={20} />}
			href="#edge"
		/>
		<TopNavMegaMenuItem
			title="Containers"
			description="Deploy containerized workloads"
			icon={<Icon name="sandbox-box" size={20} />}
			href="#containers"
		/>
		<TopNavMegaMenuItem
			title="Global CDN"
			description="Serve content at the edge worldwide"
			icon={<Icon name="sandbox-globe" size={20} />}
			href="#cdn"
		/>
		<TopNavMegaMenuItem
			title="CLI Tools"
			description="Manage everything from the command line"
			icon={<Icon name="sandbox-wrench" size={20} />}
			href="#cli"
		/>
	</Grid>
}
