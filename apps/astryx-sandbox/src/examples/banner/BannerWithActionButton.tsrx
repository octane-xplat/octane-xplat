// Port of upstream Banner/BannerWithActionButton.tsx (Astryx 0.6.4, MIT).
import { Banner, Button, Stack } from '@octane-xplat/ui'

export function BannerWithActionButton() @{
	<Stack direction="vertical" gap={3}>
		<Banner
			status="info"
			title="Your trial expires in 3 days"
			description="Upgrade now to keep access to all features."
			endContent={<Button label="Upgrade" variant="secondary" size="sm" />}
		/>
		<Banner
			status="warning"
			title="API key expires soon"
			description="Generate a new key before December 1 to avoid service interruption."
			endContent={<Button label="Renew key" variant="secondary" size="sm" />}
		/>
		<Banner
			status="error"
			title="Payment failed"
			description="We could not process your last payment."
			endContent={<Button label="Retry" variant="secondary" size="sm" />}
		/>
	</Stack>
}
