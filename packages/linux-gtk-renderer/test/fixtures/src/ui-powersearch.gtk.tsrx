/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import {
	PowerSearch,
	View,
	createPowerSearchConfig,
	usePowerSearchConfig,
	type FieldDefinition,
} from '@octane-xplat/ui'

export const state: Record<string, any> = {
	changes: [] as any[],
	queries: [] as string[],
	hookFields: 0,
}

const defs: FieldDefinition[] = [
	{ key: 'name', type: 'string', label: 'Name' },
	{ key: 'count', type: 'number', label: 'Count' },
	{ key: 'status', type: 'enum', label: 'Status', enumValues: [{ value: 'open', label: 'Open' }, { value: 'closed', label: 'Closed' }] },
]

const { config } = createPowerSearchConfig(defs, 'ProbeConfig')

function HookProbe() @{
	const hooked = usePowerSearchConfig(defs, 'HookConfig')
	state.hookFields = hooked.config.fields.length
	return null
}

export function PowerSearchProbe() @{
	const [filters, setFilters] = useState<any[]>([])

	<View style={{ display: 'flex', flexDirection: 'column', width: 600 }}>
		<HookProbe />
		<PowerSearch
			id="ps"
			label="Search"
			config={config}
			filters={filters}
			onChange={(next, changeType, index) => {
				setFilters([...next])
				state.changes.push({ type: changeType, index, field: next[index]?.field })
			}}
			placeholder="Filter…"
		/>
	</View>
}
