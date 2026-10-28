// Port of upstream Card/SelectableCardElevated.tsx (Astryx 0.6.4, MIT).
import { useState } from 'octane'
import { Grid, SelectableCard, Text } from '@octane-xplat/ui'

const PLANS = [
	{ id: 'starter', name: 'Starter' },
	{ id: 'pro', name: 'Pro' },
]

export function SelectableCardElevated() @{
	const [selected, setSelected] = useState('pro')

	<Grid columns={2} style={{ width: 420, gap: 12 }}>
		{PLANS.map((plan) => (
			<SelectableCard
				key={plan.id}
				label={plan.name}
				isSelected={selected === plan.id}
				onChange={() => setSelected(plan.id)}
				elevation="low"
			>
				<Text type="body" weight="bold">
					{plan.name}
				</Text>
				<Text type="supporting" color="secondary">
					The resting shadow stays put — the selection ring layers on top.
				</Text>
			</SelectableCard>
		))}
	</Grid>
}
