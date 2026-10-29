/** @jsxImportSource @octane-xplat/jsx */
import { useRef } from 'octane'
import { Heading, Outline, ScrollableArea, Text, VStack, type ScrollableAreaHandle } from '@octane-xplat/ui'
import { getOutlineFromViewCapabilities, useOutlineFromView } from '@octane-xplat/ui/macos'
import type { ProbeContext } from '../../scripts/probe/context'

export default function OutlineSnapshotProbe() {
	const content = useRef<ScrollableAreaHandle | null>(null), items = useOutlineFromView(content)
	return <VStack gap={2}>
		<Text>Discovery: {getOutlineFromViewCapabilities().mode}; {items.length} headings</Text>
		<ScrollableArea id="outline-snapshot" ref={content} height={180} label="Guide content">
			<VStack gap={2}>
				<Heading id="intro" level={1}>Introduction</Heading><Text>Guide contents.</Text>
				<Heading id="account" level={2}>Your <Text weight="bold">account</Text></Heading><Text>Account details.</Text>
			</VStack>
		</ScrollableArea>
		<Outline items={items} hasScrollOnClick={false} />
		<Text>Snapshot discovery only. Check native IDs, levels, plain/rich labels and root replacement separately. This fixture does not qualify Outline scrolling, scroll spy, input or VoiceOver.</Text>
	</VStack>
}
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('outline-snapshot'))
	ctx.record('qualification', 'Outline snapshot controls mounted; native discovery/navigation unqualified')
}
