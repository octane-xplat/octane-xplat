// Port of upstream Outline/OutlineDeepNesting.tsx (Astryx 0.6.4, MIT).
import { Outline } from '@octane-xplat/ui'

const items = [
	{ id: 'deep-introduction', label: 'Introduction', level: 1 },
	{ id: 'deep-concepts', label: 'Core concepts', level: 2 },
	{ id: 'deep-tokens', label: 'Tokens', level: 3 },
	{ id: 'deep-color', label: 'Color', level: 4 },
	{ id: 'deep-spacing', label: 'Spacing', level: 4 },
	{ id: 'deep-components', label: 'Components', level: 2 },
	{ id: 'deep-primitives', label: 'Primitives', level: 3 },
	{ id: 'deep-patterns', label: 'Patterns', level: 3 },
	{ id: 'deep-resources', label: 'Resources', level: 1 },
]

export function OutlineDeepNesting() @{
	<div style={{ width: 240 }}>
		<Outline items={items} activeId="deep-color" />
	</div>
}
