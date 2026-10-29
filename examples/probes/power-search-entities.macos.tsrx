/** @jsxImportSource @octane-xplat/jsx */
import { useMemo, useState } from 'octane'
import { Button, PowerSearchFilterEditor, Text, VStack } from '@octane-xplat/ui'
import type { PartialFilter, PowerSearchConfig, SearchableItem, SearchSource } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'

const people: SearchableItem[] = [{ id: '1', label: 'Ada' }, { id: '2', label: 'Grace' }, { id: '3', label: 'Lin' }, { id: '4', label: 'Ada' }]
const initial = (): PartialFilter => ({ field: 'owner', operator: 'is', value: { type: 'entity_list', value: [people[0]] } })
export default function PowerSearchEntitiesProbe() {
	const [filter, setFilter] = useState<PartialFilter>(initial()), [result, setResult] = useState('No selection applied')
	const [readonly, setReadonly] = useState(false), [mounted, setMounted] = useState(true)
	const [arbitrary, setArbitrary] = useState(false), [failure, setFailure] = useState(false)
	const source = useMemo<SearchSource>(() => ({
		bootstrap: () => people,
		search: async (query, request) => {
			await new Promise((resolve) => setTimeout(resolve, 600))
			if (request?.signal.aborted) throw Error('Cancelled')
			if (failure) throw Error('Fixture lookup failure')
			return people.filter((person) => person.id === query || person.label.toLowerCase().includes(query.toLowerCase()))
		},
	}), [failure])
	const config = useMemo<PowerSearchConfig>(() => ({ name: 'entity-fixture', fields: [{ key: 'owner', label: 'Owner', operators: [{
		key: 'is', label: 'Is', value: { type: 'entity_list', searchSource: source, isArbitraryStringAllowed: arbitrary, tokenization: { regex: '[,;\\r\\n]+', sort: true }, renderItem: (person) => <label text={`${person.label} (${person.id})`} /> },
	}] }] }), [source, arbitrary])
	return <VStack id="power-search-entity-controls" gap={2}>
		<Button label="Toggle read-only" clickAction={() => setReadonly(!readonly)} />
		<Button label="Toggle arbitrary entries" clickAction={() => setArbitrary(!arbitrary)} />
		<Button label="Toggle source failure" clickAction={() => setFailure(!failure)} />
		<Button label="Replace filter" clickAction={() => setFilter(initial())} />
		<Button label="Mount/unmount editor" clickAction={() => setMounted(!mounted)} />
		{mounted ? <PowerSearchFilterEditor config={config} filter={filter} mode="edit" isReadOnly={readonly}
			onSave={(next) => { if (next) { setFilter(next); setResult(JSON.stringify(next.value)) } }}
			onCancel={() => { setMounted(false); setResult('Cancelled without saving') }} /> : <Text>Editor unmounted</Text>}
		<Text>{result}</Text>
		<Text>Manual qualification only. Select/remove/clear people, then paste “Grace; Lin” and choose Add entries. Try unknown and ambiguous labels, pending Cancel/replacement/read-only/unmount, source failure, Tab/IME and VoiceOver. Apply stores selected entities; it does not run a backend query.</Text>
	</VStack>
}
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('power-search-entity-controls'))
	ctx.record('qualification', 'Mounted controls only; selection, paste, cancellation, input and AX not exercised')
}
