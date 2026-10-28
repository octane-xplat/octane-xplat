/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { Button, Tab, TabList, Text, VStack } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'

const sections = ['overview', 'details', 'history', 'activity', 'settings', 'archive']
export default function TabListProbe() {
	const [value, setValue] = useState('overview')
	return <VStack gap={2}>
		<TabList id="sections" role="tablist" value={value} onChange={setValue} style={{ width: 280 }}>
			{sections.map((key) => <Tab key={key} id={`section-${key}`} value={key} label={key} isDisabled={key === 'history'} />)}
		</TabList>
		<Text id="tab-state">{value}</Text>
		<Button id="select-archive" label="Select archive" clickAction={() => setValue('archive')} />
	</VStack>
}

// Handler dispatch and state only: not physical arrows/Tab, scroll visibility or VoiceOver.
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('section-overview'))
	await ctx.press('select-archive')
	await ctx.waitFor(() => String(ctx.find('tab-state').stringValue) === 'archive')
	ctx.assert('controlled selection applied', String(ctx.find('tab-state').stringValue), 'archive')
}
