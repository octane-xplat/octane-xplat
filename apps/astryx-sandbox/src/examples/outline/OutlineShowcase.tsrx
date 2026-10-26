// Port of upstream Outline/OutlineShowcase.tsx (Astryx 0.6.4, MIT).
import { Outline } from '@octane-xplat/ui'

const items = [
	{ id: 'show-introduction', label: 'Introduction', level: 1 },
	{ id: 'show-install', label: 'Installation', level: 2 },
	{ id: 'show-usage', label: 'Usage', level: 2 },
	{ id: 'show-api', label: 'API reference', level: 2 },
]

export function OutlineShowcase() @{
	<div style={{ width: 240 }}>
		<Outline items={items} activeId="show-usage" />
	</div>
}
