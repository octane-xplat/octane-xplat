/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { Button, PowerSearchFilterEditor, Text, VStack } from '@octane-xplat/ui'
import type { PartialFilter, PowerSearchConfig } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'
const config: PowerSearchConfig = { name: 'range-fixture', fields: [{ key: 'created', label: 'Created', operators: [
	{ key: 'between', label: 'Between', value: { type: 'date_range', intervalDatePresets: [{ label: 'Last 7 days', value: { start: { type: 'RELATIVE', backValue: 7, unit: 'day' }, end: { type: 'NOW' } } }] } },
] }] }
export default function PowerSearchRangeProbe() {
	const [filter, setFilter] = useState<PartialFilter>({ field: 'created', operator: 'between' })
	const [readonly, setReadonly] = useState(false), [mounted, setMounted] = useState(true), [result, setResult] = useState('No range applied')
	return <VStack id="power-search-range-controls" gap={2}>
		<Button label="Toggle read-only" clickAction={() => setReadonly(!readonly)} />
		<Button label="Replace filter" clickAction={() => setFilter({ field: 'created', operator: 'between' })} />
		<Button label="Mount/unmount editor" clickAction={() => setMounted(!mounted)} />
		{mounted ? <PowerSearchFilterEditor config={config} filter={filter} mode="edit" isReadOnly={readonly}
			onSave={(next) => { if (next) { setFilter(next); setResult(JSON.stringify(next.value)) } }} onCancel={() => setResult('Cancelled without saving')} /> : <Text>Editor unmounted</Text>}
		<Text>{result}</Text>
		<Text>Manual AppKit qualification only. Test UTC dates/leap days, relative/now modes, interval preset, reversed/invalid drafts, Tab/IME/VoiceOver, read-only and replacement. Expression presets and timezone-specific display need a custom editor.</Text>
	</VStack>
}
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('power-search-range-controls'))
	ctx.record('qualification', 'Editor controls mounted only; edits, validation, focus, IME and AX not exercised')
}
