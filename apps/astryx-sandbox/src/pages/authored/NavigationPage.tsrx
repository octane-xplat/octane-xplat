// Copyright (c) Meta Platforms, Inc. and affiliates.

'use client'

import { useState } from 'octane'

import { VStack, HStack } from '@octane-xplat/ui'
import { Text, Heading } from '@octane-xplat/ui'
import { Button } from '@octane-xplat/ui'
import { Divider } from '@octane-xplat/ui'
import { TopNav, TopNavHeading, TopNavItem } from '@octane-xplat/ui'
type Alignment = 'start' | 'center' | 'end'

/**
 * Navigation exploration page.
 *
 * Demonstrates TopNav with nav items aligned to start (left),
 * center, or end (right) using the slot-based API.
 */
export function NavigationPage() {
	const [alignment, setAlignment] = useState<Alignment>('start')

	return (
		<VStack className="authored-navigation">
			<VStack gap={6}>
				<VStack gap={2}>
					<Heading level={1}>Navigation Alignment</Heading>
					<Text type="body" color="secondary">
						Explore how nav items can be positioned left, center, or right using TopNav&apos;s
						slot-based API.
					</Text>
				</VStack>

				{/* Alignment picker */}
				<HStack gap={3} vAlign="center">
					<Text type="body" weight="bold">
						Alignment:
					</Text>
					<Button
						label="Left"
						variant={alignment === 'start' ? 'primary' : 'secondary'}
						size="sm"
						clickAction={() => setAlignment('start')}
					/>
					<Button
						label="Center"
						variant={alignment === 'center' ? 'primary' : 'secondary'}
						size="sm"
						clickAction={() => setAlignment('center')}
					/>
					<Button
						label="Right"
						variant={alignment === 'end' ? 'primary' : 'secondary'}
						size="sm"
						clickAction={() => setAlignment('end')}
					/>
				</HStack>

				<Divider />

				{/* Live preview */}
				<VStack gap={3}>
					<Heading level={2}>Preview</Heading>
					<VStack className="authored-nav-frame">
						<NavPreview alignment={alignment} />
					</VStack>
				</VStack>

				<Divider />

				{/* All three side by side */}
				<VStack gap={4}>
					<Heading level={2}>All Alignments</Heading>

					<VStack gap={2}>
						<Text type="supporting" weight="bold">
							Left-aligned (startContent)
						</Text>
						<VStack className="authored-nav-frame">
							<NavPreview alignment="start" />
						</VStack>
					</VStack>

					<VStack gap={2}>
						<Text type="supporting" weight="bold">
							Center-aligned (centerContent)
						</Text>
						<VStack className="authored-nav-frame">
							<NavPreview alignment="center" />
						</VStack>
					</VStack>

					<VStack gap={2}>
						<Text type="supporting" weight="bold">
							Right-aligned (endContent)
						</Text>
						<VStack className="authored-nav-frame">
							<NavPreview alignment="end" />
						</VStack>
					</VStack>
				</VStack>
			</VStack>
		</VStack>
	)
}

function NavItems() {
	return (
		<>
			<TopNavItem label="Home" href="#" isSelected />
			<TopNavItem label="Products" href="#" />
			<TopNavItem label="About" href="#" />
		</>
	)
}

function NavPreview({ alignment }: { alignment: Alignment }) {
	return (
		<TopNav
			label={`${alignment}-aligned navigation`}
			heading={<TopNavHeading heading="My App" />}
			startContent={alignment === 'start' ? <NavItems /> : undefined}
			centerContent={alignment === 'center' ? <NavItems /> : undefined}
			endContent={alignment === 'end' ? <NavItems /> : undefined}
		/>
	)
}
