// Port of upstream Step/StepIndicator.tsx (Astryx 0.6.4, MIT).
import { Stepper, Step, Text, Icon, Spinner } from '@octane-xplat/ui'

export function StepIndicator() @{
	<div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
		<div style={{ width: 190 }}>
			<Text type="label">auto (default)</Text>
			<Stepper activeStep={1} orientation="vertical">
				<Step step={0} label="Verify email" />
			</Stepper>
		</div>
		<div style={{ width: 190 }}>
			<Text type="label">number</Text>
			<Stepper activeStep={1} orientation="vertical">
				<Step step={0} label="Verify email" indicator="number" />
			</Stepper>
		</div>
		<div style={{ width: 190 }}>
			<Text type="label">Custom node</Text>
			<Stepper activeStep={1} orientation="vertical">
				<Step step={0} label="Verify email" indicator={<Icon name="sandbox-wrench" size={14} />} />
			</Stepper>
		</div>
		<div style={{ width: 190 }}>
			<Text type="label">none</Text>
			<Stepper activeStep={1} orientation="vertical">
				<Step step={0} label="Verify email" indicator="none" />
			</Stepper>
		</div>
		<div style={{ width: 190 }}>
			<Text type="label">Spinner (in progress)</Text>
			<Stepper activeStep={0} orientation="vertical">
				<Step step={0} label="Verify email" indicator={<Spinner />} />
			</Stepper>
		</div>
	</div>
}
