// Port of upstream ProgressBar/ProgressBarWithValueLabel.tsx (Astryx 0.6.4, MIT).
import { ProgressBar, VStack } from '@octane-xplat/ui'

export function ProgressBarWithValueLabel() @{
	<VStack gap={3} width={300}>
		<ProgressBar value={40} label="Storage" hasValueLabel />
		<ProgressBar value={75} label="Bandwidth" hasValueLabel />
	</VStack>
}
