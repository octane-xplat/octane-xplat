/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { Button, PowerSearch, Text, TextInput, VStack, createPowerSearchConfig } from '@octane-xplat/ui'
import type { PowerSearchFilterFor } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'
const { config } = createPowerSearchConfig([{ key: 'title', type: 'string', label: 'Title' }] as const)
export default function PowerSearchFocusProbe() {
	const [shown, setShown] = useState(true), [requested, setRequested] = useState(true), [disabled, setDisabled] = useState(false), [filters, setFilters] = useState<ReadonlyArray<PowerSearchFilterFor<typeof config>>>([])
	return <VStack gap={2}>
		<Text>Mount the search with initial focus. Switch focus while it attaches; a newer user choice should win. Toggle disabled and the request flag, open a filter editor, and remove/remount the search. Unblocking alone must not rearm autofocus. Native ordering, modal behavior and packaging are unqualified.</Text>
		<TextInput label="Other focus owner" />
		{shown ? <PowerSearch id="power-search-focus-preview" config={config} filters={filters} onChange={setFilters} hasAutoFocus={requested} isDisabled={disabled} /> : null}
		<Button label="Toggle search" clickAction={() => setShown(!shown)} />
		<Button label="Toggle request" clickAction={() => setRequested(!requested)} />
		<Button label="Toggle disabled" clickAction={() => setDisabled(!disabled)} />
	</VStack>
}
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('power-search-focus-preview'))
	ctx.record('qualification', 'mounted only; attachment/notification/focus/caret/IME/modal/AX and packaging remain unqualified')
}
