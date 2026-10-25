// Port of upstream CheckboxList/CheckboxListSelectAllPattern.tsx (Astryx 0.6.4, MIT).
import { CheckboxList, CheckboxListItem } from '@octane-xplat/ui'
import { useState } from 'octane'

const DOCUMENTS = [
	{ id: 'transactions', label: 'Transaction history' },
	{ id: 'statements', label: 'Account statements' },
	{ id: 'tax', label: 'Tax documents' },
	{ id: 'invoices', label: 'Invoices' },
]
const ALL_IDS = DOCUMENTS.map((d) => d.id)

export function CheckboxListSelectAllPattern() @{
	const [selected, setSelected] = useState<string[]>(['transactions'])
	const allChecked = ALL_IDS.every((id) => selected.includes(id))
	const noneChecked = selected.length === 0
	const selectAllState = allChecked ? true : noneChecked ? false : 'indeterminate' as const
	<CheckboxList label="Include in export" hasDividers>
		<CheckboxListItem label="Select all" isChecked={selectAllState} onCheck={(c) => setSelected(c ? [...ALL_IDS] : [])} />
		{DOCUMENTS.map((doc) => (
			<CheckboxListItem key={doc.id} label={doc.label} isChecked={selected.includes(doc.id)} onCheck={(c) => setSelected((p) => c ? [...p, doc.id] : p.filter((v) => v !== doc.id))} />
		))}
	</CheckboxList>
}
