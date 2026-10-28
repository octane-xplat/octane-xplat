/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { RadioList, RadioListItem, Text, VStack } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'

export default function RadioListProbe() {
	const [value, setValue] = useState('free')
	return <VStack gap={2}>
		<RadioList label="Plan" value={value} onValueChange={setValue}
			options={[{ value: 'free', label: 'Free', description: 'Personal use' }, { value: 'locked', label: 'Unavailable', isDisabled: true }]}>
			<RadioListItem id="plan-team" value="team" label="Team" description="Shared projects" />
		</RadioList>
		<Text id="plan-state">{value}</Text>
	</VStack>
}

// Direct native handler/state only: not pointer/keyboard input or VoiceOver.
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('plan-team'))
	await ctx.press('plan-team')
	await ctx.waitFor(() => String(ctx.find('plan-state').stringValue) === 'team')
	ctx.assert('child selection accepted', String(ctx.find('plan-state').stringValue), 'team')
}
