// Port of upstream ComplexSelector/ComplexSelectorTreeSearch.tsx (Astryx 0.6.4, MIT).
import { ComplexSelector, TextInput } from '@octane-xplat/ui'
import { useState } from 'octane'

const AREAS = [
	{ id: 'docs', label: 'Documentation' },
	{ id: 'issues', label: 'Issues' },
	{ id: 'prs', label: 'Pull requests' },
	{ id: 'releases', label: 'Releases' },
	{ id: 'files', label: 'Files' },
]

export function ComplexSelectorTreeSearch() @{
	const [category, setCategory] = useState<string | null>(null)
	const [query, setQuery] = useState('')
	const filtered = AREAS.filter((a) => a.label.toLowerCase().includes(query.toLowerCase()))

	<div style={{width: 300}}>
		<ComplexSelector label="Search in" value={category} onChange={setCategory} triggerLabel={AREAS.find((a) => a.id === category)?.label ?? 'All areas'}>
			{({ value, onChange, close }) => (
				<div style={{minWidth: 280}}>
					<div style={{padding: '8px 12px 4px'}}>
						<TextInput label="Filter areas" isLabelHidden value={query} onChange={setQuery} placeholder="Filter…" />
					</div>
					{filtered.map((a) => (
						<div key={a.id} role="option" aria-selected={value === a.id} className="vx-menu-item" onClick={() => { onChange(a.id); setQuery(''); close() }}>
							<span className="vx-menu-item-label">{a.label}</span>
						</div>
					))}
				</div>
			)}
		</ComplexSelector>
	</div>
}
