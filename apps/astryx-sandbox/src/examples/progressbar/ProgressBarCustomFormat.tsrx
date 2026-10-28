// Port of upstream ProgressBar/ProgressBarCustomFormat.tsx (Astryx 0.6.4, MIT).
import { ProgressBar, Text, VStack } from '@octane-xplat/ui'

export function ProgressBarCustomFormat() @{
	<div style={{ width: 300 }}>
		<VStack gap={1}>
			<ProgressBar
				value={3.2}
				max={5}
				label="Disk usage"
				hasValueLabel
				formatValueLabel={(v: number, m: number) => `${v} GB / ${m} GB`}
			/>
			<Text type="supporting" color="secondary">
				1.8 GB remaining
			</Text>
		</VStack>
	</div>
}
