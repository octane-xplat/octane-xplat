// Measured parity fixtures — assertions live in Heading.parity.check.ts.
import { Heading } from './Heading'
import type { ParityFixture } from '../../parity'

function HeadingFixture(props: {
	level: 1 | 2 | 3 | 4 | 5 | 6
	content: string
	className?: string
}) @{
	<Heading
		className={`parity-heading ${props.className ?? ''}`}
		level={props.level}
		style={{ width: 520 }}
	>
		{props.content}
	</Heading>
}

export const PARITY: ParityFixture[] = [
	{
		name: 'heading-level-1',
		component: 'Heading',
		renderer: HeadingFixture,
		props: { level: 1, content: 'Shared heading' },
		width: 520,
	},
	{
		name: 'heading-level-2',
		component: 'Heading',
		renderer: HeadingFixture,
		props: { level: 2, content: 'Shared heading' },
		width: 520,
	},
	{
		name: 'heading-level-3',
		component: 'Heading',
		renderer: HeadingFixture,
		props: { level: 3, content: 'Shared heading' },
		width: 520,
	},
	{
		name: 'heading-level-4',
		component: 'Heading',
		renderer: HeadingFixture,
		props: { level: 4, content: 'Shared heading' },
		width: 520,
	},
	{
		name: 'heading-level-5',
		component: 'Heading',
		renderer: HeadingFixture,
		props: { level: 5, content: 'Shared heading' },
		width: 520,
	},
	{
		name: 'heading-level-6',
		component: 'Heading',
		renderer: HeadingFixture,
		props: { level: 6, content: 'Shared heading' },
		width: 520,
	},
	{
		name: 'heading-custom-size',
		component: 'Heading',
		renderer: HeadingFixture,
		props: { level: 1, content: 'Shared heading', className: 'text-xl' },
		width: 520,
	},
]
