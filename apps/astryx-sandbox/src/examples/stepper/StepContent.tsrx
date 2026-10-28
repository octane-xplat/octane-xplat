// Port of upstream Step/StepContent.tsx (Astryx 0.6.4, MIT).
import { Stepper, Step, TextInput, Button } from '@octane-xplat/ui'

export function StepContent() @{
	<div style={{ width: 400 }}>
		<Stepper activeStep={1} orientation="vertical">
			<Step step={1} label="Billing address" description="Used for invoices and tax calculation">
				<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
					<TextInput label="Street" placeholder="1 Hacker Way" value="" />
					<TextInput label="City" placeholder="Menlo Park" value="" />
					<div>
						<Button label="Save address" variant="primary" />
					</div>
				</div>
			</Step>
		</Stepper>
	</div>
}
