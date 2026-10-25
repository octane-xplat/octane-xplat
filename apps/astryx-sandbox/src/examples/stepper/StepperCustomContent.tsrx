// Port of upstream Stepper/StepperCustomContent.tsx (Astryx 0.6.4, MIT).
import { Stepper, Step, TextInput, Button, Text, Card, Badge, Banner } from '@octane-xplat/ui'
import { useState } from 'octane'

export function StepperCustomContent() @{
	const [active, setActive] = useState(0)
	<div style={{width: 680}}>
		<Stepper activeStep={active} orientation="vertical" onStepClick={setActive}>
			<Step step={0} label="Project details" description="Name it and point us at the source" indicator="number">
				{active === 0 && (
					<div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
						<div style={{display: 'flex', gap: 12}}>
							<TextInput label="Project name" placeholder="My awesome project" value="" width="100%" />
							<TextInput label="Repository URL" placeholder="https://github.com/..." value="" width="100%" />
						</div>
						<div><Button label="Continue" variant="primary" clickAction={() => setActive(1)} /></div>
					</div>
				)}
			</Step>
			<Step step={1} label="Review the build" description="What we detected from your default branch" indicator="number">
				{active === 1 && (
					<div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
						<Card variant="muted" padding={3}>
							<div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
								<div style={{display: 'flex', alignItems: 'center', gap: 8}}>
									<Text className="sb-type-label">Next.js 15</Text>
									<Badge>Detected</Badge>
								</div>
								<Text className="sb-type-supporting">Build command <code>next build</code> · Output <code>.next</code> · Node 20</Text>
							</div>
						</Card>
						<div style={{display: 'flex', gap: 8}}>
							<Button label="Back" variant="secondary" clickAction={() => setActive(0)} />
							<Button label="Looks right" variant="primary" clickAction={() => setActive(2)} />
						</div>
					</div>
				)}
			</Step>
			<Step step={2} label="Deploy" description="Ships to production" indicator="number">
				{active === 2 && (
					<div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
						<Banner icon="sandbox-info">First deploy takes a few minutes — later deploys reuse the build cache.</Banner>
						<div style={{display: 'flex', gap: 8}}>
							<Button label="Back" variant="secondary" clickAction={() => setActive(1)} />
							<Button label="Deploy now" variant="primary" clickAction={() => setActive(3)} />
						</div>
					</div>
				)}
			</Step>
			<Step step={3} label="Live" indicator="number" />
		</Stepper>
	</div>
}
