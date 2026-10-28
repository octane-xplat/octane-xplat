// Port of upstream Section/SectionWithDividers.tsx (Astryx 0.6.4, MIT).
import { Heading, Section, Stack, Text } from '@octane-xplat/ui'

const sections = [
	['Account', 'Manage your profile, email, and password.'],
	['Notifications', 'Choose what updates you receive and how.'],
	['Privacy', 'Control who can see your activity and data.'],
] as const

export function SectionWithDividers() @{
	<Stack direction="vertical" gap={0}>
		{sections.map(([title, body], i) => (
			<Section variant="section" padding={5} dividers={i < 2 ? ['bottom'] : undefined}>
				<Stack direction="vertical" gap={1}>
					<Heading level={4}>{title}</Heading>
					<Text type="body" color="secondary">
						{body}
					</Text>
				</Stack>
			</Section>
		))}
	</Stack>
}
