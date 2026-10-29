/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { Button, PowerSearchFilterEditor, Text, VStack } from '@octane-xplat/ui'
import type { PartialFilter, PowerSearchConfig } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'

const config: PowerSearchConfig = { name: 'scalar-fixture', fields: [
	{ key: 'title', label: 'Title', operators: [{ key: 'contains', label: 'Contains', value: { type: 'string' } }] },
	{ key: 'year', label: 'Year', defaultOperator: 'at_least', operators: [
		{ key: 'is', label: 'Is', value: { type: 'integer' } },
		{ key: 'at_least', label: 'At least', value: { type: 'integer', minValue: 1800, maxValue: 2100, units: 'publication year' } },
	] },
	{ key: 'price', label: 'Price', operators: [{ key: 'is', label: 'Is', value: { type: 'float', minValue: 0, maxValue: 100 } }] },
] }
export default function PowerSearchScalarsProbe() {
	const [filter, setFilter] = useState<PartialFilter>({ field: 'year' })
	const [readonly, setReadonly] = useState(false), [mounted, setMounted] = useState(true), [result, setResult] = useState('No filter applied')
	return <VStack id="power-search-scalar-controls" gap={2}>
		<Button label="Edit title" clickAction={() => setFilter({ field: 'title', value: { type: 'string', value: 'Earthsea' } })} />
		<Button label="Edit year" clickAction={() => setFilter({ field: 'year' })} />
		<Button label="Edit price" clickAction={() => setFilter({ field: 'price' })} />
		<Button label="Unknown field" clickAction={() => setFilter({ field: 'missing' })} />
		<Button label="Toggle read-only" clickAction={() => setReadonly(!readonly)} />
		<Button label="Mount/unmount editor" clickAction={() => setMounted(!mounted)} />
		{mounted ? <PowerSearchFilterEditor config={config} filter={filter} mode="edit" isReadOnly={readonly}
			onSave={(next) => { if (next) { setFilter(next); setResult(JSON.stringify(next)) } }}
			onCancel={() => { setMounted(false); setResult('Cancelled without saving') }} /> : <Text>Editor unmounted</Text>}
		<Text>{result}</Text>
		<Text>Manual qualification only. Try empty, NaN, Infinity, hex, decimals, scientific notation and bounds; year requires an exact safe whole integer. Test filter replacement, default operator, read-only, rapid edits, Cancel, Tab/IME/VoiceOver. Other scalar editors are outside this fixture.</Text>
	</VStack>
}
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('power-search-scalar-controls'))
	ctx.record('qualification', 'Mounted controls only; editing, validation, focus, IME and AX not exercised')
}
