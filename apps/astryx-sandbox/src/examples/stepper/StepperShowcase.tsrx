// Port of upstream Stepper/StepperShowcase.tsx (Astryx 0.6.4, MIT).
import { Stepper, Step } from '@octane-xplat/ui'
import { useState } from 'octane'

export function StepperShowcase() @{
	const [active, setActive] = useState(2)

	<div style={{ width: '100%', maxWidth: 640 }}>
		<Stepper activeStep={active} orientation="horizontal" onStepClick={setActive}>
			<Step step={0} label="Cart" />
			<Step step={1} label="Shipping" />
			<Step step={2} label="Payment" />
			<Step step={3} label="Review" />
			<Step step={4} label="Confirm" />
		</Stepper>
	</div>
}
