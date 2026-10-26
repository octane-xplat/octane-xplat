// Port of upstream Step/StepShowcase.tsx (Astryx 0.6.4, MIT).
import { Stepper, Step, Text } from '@octane-xplat/ui'

export function StepShowcase() @{
	<div style={{width: 380}}>
		<Stepper activeStep={1} orientation="vertical">
			<Step step={1} label="Connect a repository" description="Astryx reads your build settings from the default branch" endContent={<Text type="supporting">2 min</Text>} isOptional />
		</Stepper>
	</div>
}
