// Port of upstream Section/SectionWashHighlight.tsx (Astryx 0.6.4, MIT).
import { Button, Icon, Section, Stack, Text } from '@octane-xplat/ui'

const FEATURES = ['10 team members', 'Unlimited projects', 'Priority support', 'Advanced analytics']

export function SectionWashHighlight() @{
	<Stack direction="vertical" gap={2}>
		<Section variant="section" padding={4}>
			<Stack direction="vertical" gap={3} hAlign="center">
				<Stack direction="vertical" gap={1} hAlign="center">
					<Text type="display-3">Pro Plan</Text>
					<Text type="body" color="secondary">
						Everything you need to scale your team.
					</Text>
				</Stack>
				<Stack direction="vertical" gap={2}>
					{FEATURES.map((feature) => (
						<Stack direction="horizontal" gap={2} vAlign="center">
							<Icon name="sandbox-check" size={16} />
							<Text type="body">{feature}</Text>
						</Stack>
					))}
				</Stack>
			</Stack>
		</Section>
		<Section variant="muted" padding={6}>
			<Stack direction="vertical" gap={2} hAlign="center">
				<Stack direction="horizontal" gap={2} vAlign="center">
					<Text type="display-3">$49</Text>
					<Text type="supporting" color="secondary">
						/ month
					</Text>
				</Stack>
				<Button label="Upgrade" variant="primary" />
			</Stack>
		</Section>
	</Stack>
}
