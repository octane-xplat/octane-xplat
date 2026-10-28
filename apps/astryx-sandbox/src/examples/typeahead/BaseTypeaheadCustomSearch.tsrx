// Port of upstream BaseTypeahead/BaseTypeaheadCustomSearch.tsx (Astryx 0.6.4, MIT).
import { BaseTypeahead, TypeaheadItem, createStaticSource } from '@octane-xplat/ui'
import { useState } from 'octane'

const RECIPIENTS = [
	{ id: '1', label: 'Sarah Chen', auxiliaryData: { email: 'sarah@company.com' } },
	{ id: '2', label: 'Mike Johnson', auxiliaryData: { email: 'mike@company.com' } },
	{ id: '3', label: 'Emma Davis', auxiliaryData: { email: 'emma@company.com' } },
]

const source = createStaticSource(RECIPIENTS, { keywords: (r) => [r.auxiliaryData?.email ?? ''] })

export function BaseTypeaheadCustomSearch() @{
	const [value, setValue] = useState<(typeof RECIPIENTS)[number] | null>(null)

	<div style={{ width: 400 }}>
		<BaseTypeahead
			label="To"
			searchSource={source}
			value={value}
			onChange={setValue}
			placeholder="name@company.com"
			renderItem={(item) => <TypeaheadItem item={item} description={item.auxiliaryData?.email} />}
		/>
	</div>
}
