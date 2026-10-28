/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { Button, TabList, Tab, TabMenu, Text, VStack } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'
export default function TabMenuProbe() {
	const [value, setValue] = useState('overview'), [empty, setEmpty] = useState(false)
	return <VStack gap={2}>
		<Text>Use strip arrows to reach More; Down/Up opens first/last options. Try menu arrows, Home/End, typeahead and Enter/Space; Tab/Shift-Tab and Escape request return. Navigation alone should not select. This runner synthesizes no keys or native focus.</Text>
		<TabList id="overflow-tabs" role="tablist" layout="fill" value={value} onChange={setValue}>
			<Tab value="overview" label="Overview" />
			<TabMenu id="overflow-more" label="More" options={empty ? [] : [{ value: 'settings', label: 'Settings' }, { value: 'support', label: 'Support' }]} />
		</TabList>
		<Button label="Toggle empty overflow" clickAction={() => setEmpty(!empty)} />
		<Text>{value}</Text>
	</VStack>
}
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('overflow-more'))
	ctx.record('qualification', 'fixture mounted only; native strip/menu keys/ref/focus/Tab/return/AX remain unqualified')
}
