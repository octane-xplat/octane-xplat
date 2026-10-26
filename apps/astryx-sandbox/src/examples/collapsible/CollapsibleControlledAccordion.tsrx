// Port of upstream Collapsible/CollapsibleControlledAccordion.tsx (Astryx 0.6.4, MIT).
import { useState } from 'octane'
import { Button, Card, Collapsible, CollapsibleGroup, Stack, Text } from '@octane-xplat/ui'

const STEPS = ['profile', 'security', 'billing'] as const

export function CollapsibleControlledAccordion() @{
	const [open, setOpen] = useState<string>('profile')
	const index = STEPS.indexOf(open as any)
	const handle = (value: string | string[]) => { if (typeof value === 'string' && (STEPS as readonly string[]).includes(value)) setOpen(value) }
	<Stack gap={3} maxWidth={440}>
		<Stack direction="horizontal" gap={2} vAlign="center">
			<Button label="Previous" variant="secondary" size="sm" isDisabled={index <= 0} clickAction={() => setOpen(STEPS[Math.max(0, index - 1)])} />
			<Button label="Next" variant="secondary" size="sm" isDisabled={index >= STEPS.length - 1} clickAction={() => setOpen(STEPS[Math.min(STEPS.length - 1, index + 1)])} />
			<Text type="supporting">Step {index + 1} of {STEPS.length}</Text>
		</Stack>
		<CollapsibleGroup type="single" value={open} onChange={handle}>
			<Stack gap={2}>
				<Card><Collapsible trigger="Profile" value="profile"><Text type="body" color="secondary">Name, email, and photo. Changes save as you type; the email address needs confirmation from the new inbox before it takes effect.</Text></Collapsible></Card>
				<Card><Collapsible trigger="Security" value="security"><Text type="body" color="secondary">Two-factor authentication, active sessions, and recent login history. Signing out of a session revokes its token immediately.</Text></Collapsible></Card>
				<Card><Collapsible trigger="Billing" value="billing"><Text type="body" color="secondary">Invoices, payment method, and plan. Invoices stay downloadable for seven years, including after a downgrade.</Text></Collapsible></Card>
			</Stack>
		</CollapsibleGroup>
	</Stack>
}
