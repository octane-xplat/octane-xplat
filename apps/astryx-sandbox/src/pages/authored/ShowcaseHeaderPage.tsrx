// Copyright (c) Meta Platforms, Inc. and affiliates. MIT.
// Port of the pinned showcase-header screen; shared layout replaces StyleX.
import { VStack, HStack, Heading, Text, Badge, StatusDot, View } from '@octane-xplat/ui'

export function ShowcaseHeaderPage() @{
	<VStack className="authored-showcase-header" gap={8}>
		<HStack gap={3}>
			<Badge>{'Open Source'}</Badge>
			<Badge>{'Astryx'}</Badge>
		</HStack>
		<HStack gap={6}>
			<Heading level={1}>Astryx</Heading>
			<View className="authored-connector" />
			<Heading level={1}>Astryx</Heading>
		</HStack>
		<Text type="large" color="secondary">
			A ground-up rebuild for modern React, AI tools, and beyond
		</Text>
		<HStack gap={2}>
			<StatusDot variant="success" label="Available" isPulsing />
			<Text color="secondary">Available now</Text>
		</HStack>
	</VStack>
}
