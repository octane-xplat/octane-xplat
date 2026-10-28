/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { CheckboxList, CheckboxListItem, Text, VStack } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'

export default function CheckboxListProbe() {
	const [value, setValue] = useState<string[]>([])
	return <VStack gap={2}>
		<CheckboxList label="Notifications" value={value} onValueChange={setValue}
			options={[{ value: 'email', label: 'Email', description: 'Daily summary' }]}>
			<CheckboxListItem id="check-alerts" value="alerts" label="Alerts" description="Immediate updates" />
			<CheckboxListItem label="All" isChecked={value.length === 0 ? false : value.length === 2 ? true : 'indeterminate'}
				onCheck={(checked) => setValue(checked ? ['email', 'alerts'] : [])} />
		</CheckboxList>
		<Text id="checks-state">{value.join(',')}</Text>
	</VStack>
}

// Direct handler/state only: not pointer/keyboard, mixed VoiceOver or pixels.
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('check-alerts'))
	await ctx.press('check-alerts')
	await ctx.waitFor(() => String(ctx.find('checks-state').stringValue) === 'alerts')
	ctx.assert('child membership accepted', String(ctx.find('checks-state').stringValue), 'alerts')
}
