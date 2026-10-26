// Port of upstream Stepper/StepperIndicatorModes.tsx (Astryx 0.6.4, MIT).
import { Stepper, Step, Text, Icon } from '@octane-xplat/ui'
import { useState } from 'octane'

export function StepperIndicatorModes() @{
	const [active, setActive] = useState(2)
	<div style={{display: 'flex', gap: 48, flexWrap: 'wrap'}}>
		<div style={{maxWidth: 220}}>
			<Text type="label">None</Text>
			<Stepper activeStep={active} orientation="vertical" onStepClick={setActive}>
				<Step step={0} label="Account" indicator="none" />
				<Step step={1} label="Profile" indicator="none" />
				<Step step={2} label="Settings" indicator="none" />
				<Step step={3} label="Review" indicator="none" />
			</Stepper>
		</div>
		<div style={{maxWidth: 220}}>
			<Text type="label">Auto</Text>
			<Stepper activeStep={active} orientation="vertical" onStepClick={setActive}>
				<Step step={0} label="Account" />
				<Step step={1} label="Profile" />
				<Step step={2} label="Settings" />
				<Step step={3} label="Review" />
			</Stepper>
		</div>
		<div style={{maxWidth: 220}}>
			<Text type="label">Number</Text>
			<Stepper activeStep={active} orientation="vertical" onStepClick={setActive}>
				<Step step={0} label="Account" indicator="number" />
				<Step step={1} label="Profile" indicator="number" />
				<Step step={2} label="Settings" indicator="number" />
				<Step step={3} label="Review" indicator="number" />
			</Stepper>
		</div>
		<div style={{maxWidth: 220}}>
			<Text type="label">Custom icon</Text>
			<Stepper activeStep={active} orientation="vertical" onStepClick={setActive}>
				<Step step={0} label="Account" indicator={<Icon name="sandbox-info" size={14} />} />
				<Step step={1} label="Profile" indicator={<Icon name="sandbox-search" size={14} />} />
				<Step step={2} label="Settings" indicator={<Icon name="sandbox-wrench" size={14} />} />
				<Step step={3} label="Review" indicator={<Icon name="sandbox-check" size={14} />} />
			</Stepper>
		</div>
	</div>
}
