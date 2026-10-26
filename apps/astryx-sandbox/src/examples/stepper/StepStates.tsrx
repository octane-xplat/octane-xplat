// Port of upstream Step/StepStates.tsx (Astryx 0.6.4, MIT).
import { Stepper, Step, Text } from '@octane-xplat/ui'

export function StepStates() @{
	<div style={{display: 'flex', flexWrap: 'wrap', gap: 32}}>
		<div style={{width: 220}}><Text type="label">Completed</Text><Stepper activeStep={1} orientation="vertical"><Step step={0} label="Verify email" /></Stepper></div>
		<div style={{width: 220}}><Text type="label">Current</Text><Stepper activeStep={0} orientation="vertical"><Step step={0} label="Verify email" /></Stepper></div>
		<div style={{width: 220}}><Text type="label">Upcoming</Text><Stepper activeStep={0} orientation="vertical"><Step step={1} label="Add a payment method" /></Stepper></div>
		<div style={{width: 220}}><Text type="label">Disabled</Text><Stepper activeStep={0} orientation="vertical" onStepClick={() => {}}><Step step={1} label="Add a payment method" isDisabled /></Stepper></div>
		<div style={{width: 220}}><Text type="label">Completed, with a status</Text><Stepper activeStep={1} orientation="vertical"><Step step={0} label="Verify email" status="warning" /></Stepper></div>
	</div>
}
