// Port of upstream Card/SelectableCardMulti.tsx (Astryx 0.6.4, MIT).
import { useState } from 'octane'
import { Grid, SelectableCard, Text } from '@octane-xplat/ui'

const tags = [
	{ id: 'react', name: 'React', variant: 'blue' },
	{ id: 'typescript', name: 'TypeScript', variant: 'cyan' },
	{ id: 'node', name: 'Node.js', variant: 'green' },
	{ id: 'python', name: 'Python', variant: 'yellow' },
	{ id: 'rust', name: 'Rust', variant: 'orange' },
	{ id: 'go', name: 'Go', variant: 'teal' },
]

export function SelectableCardMulti() @{
	const [selected, setSelected] = useState<Set<string>>(new Set(['react', 'typescript']))
	<Grid columns={3} style={{width: 400, gap: 8}}>
		{tags.map((tag) => (
			<SelectableCard
				key={tag.id}
				label={tag.name}
				isSelected={selected.has(tag.id)}
				variant={tag.variant}
				onChange={(isNow: boolean) => setSelected((prev) => { const n = new Set(prev); isNow ? n.add(tag.id) : n.delete(tag.id); return n })}
			>
				<Text type="body" weight="bold">{tag.name}</Text>
			</SelectableCard>
		))}
	</Grid>
}
