// Port of upstream TopNavMegaMenuItem/TopNavMegaMenuItemBasic.tsx (Astryx 0.6.4, MIT).
import { Grid, Icon, TopNavMegaMenuItem } from '@octane-xplat/ui'

export function TopNavMegaMenuItemBasic() @{
	<Grid columns={2} style={{ gap: 8 }}>
		<TopNavMegaMenuItem
			title="Edge Functions"
			description="Run serverless code at the network edge"
			icon={<Icon name="sandbox-arrow-up" size={20} />}
			href="#edge"
		/>
		<TopNavMegaMenuItem
			title="Storage"
			description="Object and file storage for your application"
			icon={<Icon name="sandbox-folder" size={20} />}
			href="#storage"
		/>
	</Grid>
}
