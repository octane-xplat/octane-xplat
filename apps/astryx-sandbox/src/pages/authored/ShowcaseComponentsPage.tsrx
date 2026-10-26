// Copyright (c) Meta Platforms, Inc. and affiliates. MIT.
// Port of the pinned showcase-components collage. Bars are app-owned marks,
// as upstream; they do not claim chart component coverage.
import { useState } from 'octane'
import {
	VStack,
	HStack,
	View,
	Card,
	Heading,
	Text,
	Button,
	Badge,
	Avatar,
	Switch,
} from '@octane-xplat/ui'

const BAR_HEIGHTS = [28, 40, 22, 48, 34, 18, 44, 30]

export function ShowcaseComponentsPage() @{
	const [lightMode, setLightMode] = useState(true)
	const [animations, setAnimations] = useState(true)
	const [compact, setCompact] = useState(false)

	<View className="authored-showcase">
		<View className="authored-showcase-grid">
			<Card className="authored-showcase-hero" padding={7}>
				<VStack gap={4}>
					<Heading level={2}>Build with Astryx</Heading>
					<Text color="secondary">Open source components for the web and beyond</Text>
					<HStack gap={2}>
						<Button label="Get started" />
						<Button label="Read docs" variant="secondary" />
					</HStack>
				</VStack>
			</Card>
			<Card padding={6}>
				<VStack gap={4}>
					<Text weight="bold">Settings</Text>
					<Switch label="Light mode" value={lightMode} onChange={setLightMode} />
					<Switch label="Animations" value={animations} onChange={setAnimations} />
					<Switch label="Compact" value={compact} onChange={setCompact} />
				</VStack>
			</Card>
			<Card padding={6}>
				<VStack gap={3}>
					<Heading level={3}>Components</Heading>
					<Text type="large" weight="bold">
						48
					</Text>
					<Text color="secondary">+12 this quarter</Text>
					<HStack gap={1} vAlign="end">
						@for (const height of BAR_HEIGHTS; index i; key i) {
							<View className="authored-bar" style={{ height }} />
						}
					</HStack>
					<Text>Coverage → 87%</Text>
					<Text>Adoption → 92%</Text>
				</VStack>
			</Card>
			<Card padding={6}>
				<VStack gap={3}>
					<Badge>{'v0.0.8 Released'}</Badge>
					<Badge>{'Open Source'}</Badge>
					<Badge>{'AI Ready'}</Badge>
				</VStack>
			</Card>
			<Card padding={6}>
				<VStack gap={3}>
					<HStack gap={2}>
						@for (const name of ['Ruby C', 'Cindy Z', 'Alex M', 'Sam K', '+3']; key name) {
							<Avatar fallback={name} />
						}
					</HStack>
					<Text color="secondary">Astryx Core Team</Text>
				</VStack>
			</Card>
		</View>
	</View>
}
