// Port of upstream MediaTheme/MediaThemeShowcase.tsx (Astryx 0.6.4, MIT).
// Port of Astryx 0.6.4; Copyright (c) Meta Platforms, Inc. (MIT).
import {
	Theme,
	useThemeName,
	getRegisteredTheme,
	Button,
	Section,
	Stack,
	Text,
	Badge,
	Icon,
} from '@octane-xplat/ui'

export function MediaThemeShowcase() @{
	const theme = getRegisteredTheme(useThemeName())!

	<Section variant="transparent" padding={4} className="sb-media-showcase">
		<Theme theme={theme} mode="dark">
			<Stack direction="vertical" gap={3}>
				<Stack direction="horizontal" gap={2}>
					<Icon name="sandbox-info" size={20} />
					<Text weight="bold">Media overlay</Text>
					<Badge className="sb-media-badge">Live</Badge>
				</Stack>
				<Text type="supporting" color="secondary">
					Text, icons, badges, and button variants inherit legible colors on top of the dark image
					treatment.
				</Text>
				<Stack direction="horizontal" gap={2}>
					<Button label="Primary" size="sm" />
					<Button label="Secondary" variant="secondary" size="sm" />
					<Button label="Ghost" variant="ghost" size="sm" />
				</Stack>
			</Stack>
		</Theme>
	</Section>
}
