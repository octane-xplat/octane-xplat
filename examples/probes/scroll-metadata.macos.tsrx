/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { Button, ScrollableArea, Text, VStack } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'

export default function ScrollMetadataProbe() {
	const [described, setDescribed] = useState(true), [hidden, setHidden] = useState(false), [renamed, setRenamed] = useState(false)
	return <VStack gap={2}>
		<ScrollableArea id="scroll-metadata" testID={described ? 'trip-notes' : undefined} height={180} width={320}
			label={renamed ? 'Renamed notes' : 'Trip notes'} accessible={!hidden}
			accessibilityHint={described ? 'Scroll to review the notes.' : undefined}
			accessibilityValue={described ? '24 notes' : undefined}>
			<VStack gap={2}>{Array.from({ length: 24 }, (_, index) => <Text key={index}>Note {index + 1}</Text>)}</VStack>
		</ScrollableArea>
		<Button label="Toggle descriptions" clickAction={() => setDescribed((value) => !value)} />
		<Button label="Toggle accessibility visibility" clickAction={() => setHidden((value) => !value)} />
		<Button label="Rename viewport" clickAction={() => setRenamed((value) => !value)} />
		<Text>Manual native metadata fixture. Verify VoiceOver viewport/descendant navigation, descriptions and updates separately from OS scrolling; mounting proves neither.</Text>
	</VStack>
}
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('scroll-metadata'))
	ctx.record('qualification', 'Scroll metadata controls mounted; native scrolling and accessibility unqualified')
}
