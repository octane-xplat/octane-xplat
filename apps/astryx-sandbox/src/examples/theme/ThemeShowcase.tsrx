// Port of upstream Theme/ThemeShowcase.tsx (Astryx 0.6.4, MIT).
// Upstream lays the two providers out with Grid columns={{minWidth: 240}};
// the shared grid class stands in (recorded Grid adaptation).
import { Theme, Card, Section, Stack, Heading, Text, Button, Badge } from '@octane-xplat/ui'
import { warmTheme, forestTheme } from './themes'

function ThemeCard(props: { label: string }) @{
	return (
		<Card padding={4} width="100%">
			<Stack direction="vertical" gap={3}>
				<Stack direction="horizontal" gap={2} vAlign="center">
					<Heading level={4}>{props.label}</Heading>
					<Badge className="sb-badge sb-badge--info">Active</Badge>
				</Stack>
				<Text className="sb-type-body sb-color-secondary">
					The same content inherits this provider's colors, typography, radius,
					and component treatment.
				</Text>
				<Stack direction="horizontal" gap={2} wrap="wrap">
					<Button label="Primary" variant="primary" size="sm" />
					<Button label="Secondary" variant="secondary" size="sm" />
					<Button label="Ghost" variant="ghost" size="sm" />
				</Stack>
			</Stack>
		</Card>
	)
}

export function ThemeShowcase() @{
	return (
		<Section variant="muted" padding={4} maxWidth={600}>
			<Stack direction="horizontal" gap={3} wrap="wrap">
				<Theme theme={warmTheme}>
					<ThemeCard label="Warm" />
				</Theme>
				<Theme theme={forestTheme}>
					<ThemeCard label="Forest" />
				</Theme>
			</Stack>
		</Section>
	)
}
