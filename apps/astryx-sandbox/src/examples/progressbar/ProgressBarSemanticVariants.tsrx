// Port of upstream ProgressBar/ProgressBarSemanticVariants.tsx (Astryx 0.6.4, MIT).
import { ProgressBar, VStack } from '@octane-xplat/ui'

export function ProgressBarSemanticVariants() @{
	<VStack gap={4} width="100%" style={{ maxWidth: 300 }}>
		<ProgressBar value={60} label="Accent" variant="accent" hasValueLabel />
		<ProgressBar value={80} label="Positive" variant="success" hasValueLabel />
		<ProgressBar value={50} label="Warning" variant="warning" hasValueLabel />
		<ProgressBar value={92} label="Negative" variant="error" hasValueLabel />
		<ProgressBar value={35} label="Neutral" variant="neutral" hasValueLabel />
	</VStack>
}
