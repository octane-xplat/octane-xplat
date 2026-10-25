// Port of upstream Stepper/StepperOnTrackVertical.tsx (Astryx 0.6.4, MIT).
import { Stepper, Step } from '@octane-xplat/ui'
import { useState } from 'octane'

export function StepperOnTrackVertical() @{
	const [active, setActive] = useState(2)
	<div style={{width: '100%', maxWidth: 400}}>
		<Stepper activeStep={active} orientation="vertical" indicatorPosition="on-track" onStepClick={setActive}>
			<Step step={0} label="Create workspace" description="Name and configure your workspace" />
			<Step step={1} label="Invite team members" description="Add collaborators by email" />
			<Step step={2} label="Set up integrations" description="Connect Slack, GitHub, Jira" />
			<Step step={3} label="Import data" description="Bring in existing projects" />
			<Step step={4} label="Launch" description="Go live with your team" />
		</Stepper>
	</div>
}
