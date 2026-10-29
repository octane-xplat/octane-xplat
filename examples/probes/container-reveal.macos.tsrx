/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { Button, HStack, Text, TextInput, VStack, useContainerReveal } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'
function FileRow(props: { name: string; enabled: boolean; children?: any }) @{
	const reveal = useContainerReveal({ isEnabled: props.enabled })
	<HStack {...reveal.getContainerProps()} id={`reveal-${props.name}`} gap={2}>
		<Text>{props.name}</Text>
		<TextInput label={`Notes for ${props.name}`} />
		<HStack {...reveal.getContentRevealProps()}><Button label={`Edit ${props.name}`} /></HStack>
		{props.children}
	</HStack>
}
export default function ContainerRevealProbe() @{
	const [enabled, setEnabled] = useState(true)
	<VStack id="container-reveal-controls" gap={3}>
		<Text>Hover each row or Tab into its notes/actions. Check exit, focus moving among descendants, nested row isolation, hidden/unmounted cleanup and VoiceOver. Actions keep their layout space. This runner mounts controls only.</Text>
		<Button label="Toggle reveal enabled" clickAction={() => setEnabled(!enabled)} />
		<FileRow name="report.pdf" enabled={enabled} />
		<FileRow name="budget.xlsx" enabled={enabled} />
		<FileRow name="outer" enabled={enabled}><FileRow name="inner" enabled={enabled} /></FileRow>
	</VStack>
}
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('container-reveal-controls'))
	ctx.record('qualification', 'Controls mounted only; native hover/focus/opacity/AX remain unqualified')
}
