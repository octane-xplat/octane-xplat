// Port of upstream MediaTheme/MediaThemeLightScrim.tsx (Astryx 0.6.4, MIT).
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

export function MediaThemeLightScrim() @{
	const theme = getRegisteredTheme(useThemeName())!

	<AspectRatio ratio={16 / 9} className="sb-media-frame">
		<Image
			src="/template-assets/light-home-square-1.png"
			alt="Bright room"
			className="sb-media-image"
		/>
		<Section variant="transparent" padding={4} className="sb-media-light">
			<Theme theme={theme} mode="light">
				<Stack direction="vertical" gap={2}>
					<Text type="body" weight="bold">
						Bright media surface
					</Text>
					<Text type="supporting" color="secondary">
						Use mode="light" when content sits on a light card or scrim.
					</Text>
					<Button label="Open" variant="ghost" size="sm" />
				</Stack>
			</Theme>
		</Section>
	</AspectRatio>
}
