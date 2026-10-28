// Port of upstream Stepper/StepperWidthResponsiveCollapse.tsx (Astryx 0.6.4, MIT).
import { Stepper, Step } from '@octane-xplat/ui'
import { useState } from 'octane'

export function StepperWidthResponsiveCollapse() @{
	const [active, setActive] = useState(1)

	<div style={{ width: 320 }}>
		<Stepper
			activeStep={active}
			orientation="horizontal"
			onStepClick={setActive}
			horizontalOptions={{ minimumStepWidth: 112, collapsedVariant: 'withLabelAndControls' }}
		>
			<Step step={0} label="Cart" />
			<Step step={1} label="Shipping" description="Where it goes" />
			<Step step={2} label="Delivery" />
			<Step step={3} label="Payment" />
		</Stepper>
	</div>
}
