// Port of upstream MediaTheme/MediaThemeImageOverlay.tsx (Astryx 0.6.4, MIT).
// Port of Astryx 0.6.4; Copyright (c) Meta Platforms, Inc. (MIT).
import {
	Theme,
	useThemeName,
	getRegisteredTheme,
	AspectRatio,
	Button,
	Section,
	Stack,
	Text,
	Image,
} from '@octane-xplat/ui'

export function MediaThemeImageOverlay() @{
	const theme = getRegisteredTheme(useThemeName())!

	<AspectRatio ratio={16 / 9} className="sb-media-frame">
		<Image
			src="/template-assets/light-scene-horizontal-1.png"
			alt="Landscape"
			className="sb-media-image"
		/>
		<Section variant="transparent" padding={4} className="sb-media-bottom">
			<Theme theme={theme} mode="dark">
				<Stack direction="vertical" gap={2}>
					<Text type="body" weight="bold">
						Product launch livestream
					</Text>
					<Text type="supporting" color="secondary">
						MediaTheme keeps overlay text and controls readable without hard-coded color overrides.
					</Text>
					<Stack direction="horizontal" gap={2}>
						<Button label="Watch" size="sm" />
						<Button label="Details" variant="secondary" size="sm" />
					</Stack>
				</Stack>
			</Theme>
		</Section>
	</AspectRatio>
}
