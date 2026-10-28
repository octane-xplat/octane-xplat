// Port of upstream templates/pages/centered-hero/page.tsx (Astryx 0.6.4, MIT) —
// route /templates/centered-hero/.
// GAPS: Text `justify`/`textWrap` props are unported — textAlign/textWrap land
// in style. ArrowRightIcon was 20/solid upstream; the registry carries the
// 24/outline glyph.
import { AspectRatio, Button, Heading, HStack, Icon, Layout, LayoutContent, Section, Text, VStack } from '@octane-xplat/ui'

const IMAGE_URL = '/template-assets/light-scene-horizontal-1.png'

const heroImage = {
	width: '100%',
	height: '100%',
	objectFit: 'cover' as const,
}
const heroFrame = {
	maxWidth: 1200,
	marginInline: 'auto',
	borderRadius: 'var(--radius-page)',
}
const textCenter = {
	textAlign: 'center' as const,
	textWrap: 'balance' as const,
}

export function CenteredHeroTemplate() @{
	<Layout
		content={
			<LayoutContent padding={6}>
				<VStack gap={10}>
					<VStack gap={6} hAlign="center">
						<VStack gap={3} hAlign="center">
							<Heading level={1} type="display-2" style={textCenter}>
								Little joys, everywhere you go
							</Heading>
							<Text type="body" color="secondary" style={textCenter}>
								Sometimes all it takes is one small thing to turn your whole day around.
							</Text>
						</VStack>
						<HStack gap={3}>
							<Button
								label="Get started"
								variant="primary"
								endContent={<Icon name="sandbox-arrow-right" size={16} color="inherit" />}
							/>
							<Button label="Learn more" variant="secondary" />
						</HStack>
					</VStack>
					<Section variant="transparent" padding={0}>
						<AspectRatio ratio={16 / 9} style={heroFrame}>
							<img style={heroImage} src={IMAGE_URL} alt="A bright, colorful lifestyle scene" />
						</AspectRatio>
					</Section>
				</VStack>
			</LayoutContent>
		}
	/>
}
