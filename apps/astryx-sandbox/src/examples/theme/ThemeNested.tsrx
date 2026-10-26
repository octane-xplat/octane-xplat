// Port of upstream Theme/ThemeNested.tsx (Astryx 0.6.4, MIT).
import { Theme, Card, Button, Section, Stack, Heading, Text } from '@octane-xplat/ui'
import { warmTheme, forestTheme } from './themes'

export function ThemeNested() @{
	return (
		<Section variant="muted" padding={4} maxWidth={460}>
			<Theme theme={warmTheme}>
				<Card padding={4} width="100%">
					<Stack direction="vertical" gap={4}>
						<Stack direction="vertical" gap={2}>
							<Heading level={4}>Outer Warm theme</Heading>
							<Text type="body" color="secondary">
								The parent section uses Warm.
							</Text>
						</Stack>
						<Theme theme={forestTheme}>
							<Card padding={3} width="100%">
								<Stack direction="vertical" gap={2}>
									<Text type="body" style={{ fontWeight: 700 }}>
										Nested Forest section
									</Text>
									<Button label="Nested action" size="sm" />
								</Stack>
							</Card>
						</Theme>
					</Stack>
				</Card>
			</Theme>
		</Section>
	)
}
