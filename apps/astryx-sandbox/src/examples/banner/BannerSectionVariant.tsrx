// Port of upstream Banner/BannerSectionVariant.tsx (Astryx 0.6.4, MIT).
import { Banner, Button, Stack } from '@octane-xplat/ui'

export function BannerSectionVariant() @{
	<Stack direction="vertical" gap={3}>
		<Banner
			status="warning"
			title="Scheduled downtime"
			description="All services will be unavailable on Sunday from 2:00–4:00 AM."
			container="section"
			isDismissable
		/>
		<Banner
			status="info"
			title="Welcome to the new dashboard"
			description="We have redesigned the layout based on your feedback."
			container="section"
			endContent={<Button label="Take a tour" variant="secondary" size="sm" />}
		/>
	</Stack>
}
