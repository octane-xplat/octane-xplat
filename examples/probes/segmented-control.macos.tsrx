/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { SegmentedControl, SegmentedControlItem, Text, VStack } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'

export default function SegmentedControlProbe() {
	const [mode, setMode] = useState('inbox')
	return <VStack gap={3}>
		<SegmentedControl id="segments" value={mode} onValueChange={setMode} layout="fill" accessibilityLabel="Mailbox">
			<SegmentedControlItem id="segment-inbox" value="inbox" label="Inbox" />
			<SegmentedControlItem id="segment-disabled" value="disabled" label="Unavailable" isDisabled />
			<SegmentedControlItem id="segment-sent" value="sent" label="Sent" />
		</SegmentedControl>
		<Text id="segment-value">{mode}</Text>
		<SegmentedControl id="segments-options" defaultValue="list" accessibilityLabel="View" options={[
			{ value: 'list', label: 'List' },
			{ value: 'grid', label: 'Grid' },
		]} />
	</VStack>
}

// Direct host dispatch checks selection plumbing only. OS keys, Tab and
// VoiceOver require separate interaction; this probe does not qualify them.
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('segment-sent'))
	await ctx.press('segment-sent')
	await ctx.waitFor(() => String(ctx.find('segment-value')?.stringValue) === 'sent')
	ctx.assert('radio accessibility role', String(ctx.find('segment-sent').accessibilityRole), 'AXRadioButton')
}
