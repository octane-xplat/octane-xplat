// Port of upstream Theme/ThemeSwitcher.tsx (Astryx 0.6.4, MIT).
import { useState } from 'octane'
import { Theme, Card, Button, Section, Stack, Selector, Heading, Text } from '@octane-xplat/ui'
import { warmTheme, forestTheme } from './themes'

const themes = { Warm: warmTheme, Forest: forestTheme }
type ThemeName = keyof typeof themes

export function ThemeSwitcher() @{
	const [themeName, setThemeName] = useState<ThemeName>('Warm')

	return (
		<Section variant="muted" padding={4} maxWidth={420}>
			<Stack direction="vertical" gap={3}>
				<Selector
					label="Theme"
					value={themeName}
					options={Object.keys(themes).map((name) => ({ value: name, label: name }))}
					onValueChange={(next) => next && setThemeName(next as ThemeName)}
				/>
				<Theme theme={themes[themeName]}>
					<Card padding={4} width="100%">
						<Stack direction="vertical" gap={3}>
							<Heading level={4}>{themeName} preview</Heading>
							<Text className="sb-type-body sb-color-secondary">
								Switching the theme object updates all tokens and component
								styles below the provider.
							</Text>
							<Button label="Save changes" />
						</Stack>
					</Card>
				</Theme>
			</Stack>
		</Section>
	)
}
