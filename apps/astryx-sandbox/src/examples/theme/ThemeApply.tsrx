// Port of upstream Theme/ThemeApply.tsx (Astryx 0.6.4, MIT).
// Section/Card/Stack/Text props map to Xplat shapes; text type/color via
// the app's token classes — see sandbox.css.
import { Theme, Card, Button, Section, Stack, Heading, Text } from '@octane-xplat/ui'
import { forestTheme } from './themes'

export function ThemeApply() @{
	return (
		<Section variant="muted" padding={4} maxWidth={420}>
			<Theme theme={forestTheme}>
				<Card padding={4} width="100%">
					<Stack direction="vertical" gap={3}>
						<Heading level={4}>Forest workspace</Heading>
						<Text type="body" color="secondary">
							Wrap any subtree to apply a theme locally.
						</Text>
						<Button label="Create project" />
					</Stack>
				</Card>
			</Theme>
		</Section>
	)
}
