// Measured parity fixtures — assertions live in Text.parity.check.ts.
import { Text } from './Text'
import { View } from '../layout/View'
import type { ParityFixture } from '../../parity'

function TextClassFixture(props: { sizeClass: string; content: string }) @{
	<Text className={`parity-text ${props.sizeClass}`} style={{ color: '#0a0a0a' }}>
		{props.content}
	</Text>
}

function TextFixture(props: {
	size: number
	weight: number
	lineHeight: number
	content: string
}) @{
	<Text
		className="parity-text"
		style={{
			fontSize: props.size,
			fontWeight: props.weight,
			lineHeight: props.lineHeight,
			color: '#0a0a0a',
		}}
	>
		{props.content}
	</Text>
}

function TextWrapFixture(props: { direction: 'row' | 'column'; align: 'start' | 'center' }) @{
	<View
		className="parity-text-wrap-root"
		alignItems={props.align}
		style={{ display: 'flex', width: 220, flexDirection: props.direction }}
	>
		<Text
			className="parity-text-wrap-content"
			style={{ fontSize: 14, lineHeight: '20px', flexShrink: 1 }}
		>
			Shared typography should wrap within the available space.
		</Text>
	</View>
}

export const PARITY: ParityFixture[] = [
	{
		name: 'text-wrap-start',
		component: 'Text',
		renderer: TextWrapFixture,
		props: { direction: 'column', align: 'start' },
		height: 100,
	},
	{
		name: 'text-wrap-center',
		component: 'Text',
		renderer: TextWrapFixture,
		props: { direction: 'column', align: 'center' },
		height: 100,
	},
	{
		name: 'text-wrap-row',
		component: 'Text',
		renderer: TextWrapFixture,
		props: { direction: 'row', align: 'start' },
		height: 100,
	},
	{
		name: 'text-class-sm',
		component: 'Text',
		renderer: TextClassFixture,
		props: { sizeClass: 'text-sm', content: 'Shared label' },
	},
	{
		name: 'text-class-lg',
		component: 'Text',
		renderer: TextClassFixture,
		props: { sizeClass: 'text-lg', content: 'Shared label' },
	},
	{
		name: 'text-class-xl',
		component: 'Text',
		renderer: TextClassFixture,
		props: { sizeClass: 'text-xl', content: 'Shared label' },
	},
	{
		name: 'text-class-2xl',
		component: 'Text',
		renderer: TextClassFixture,
		props: { sizeClass: 'text-2xl', content: 'Shared label' },
	},
	{
		name: 'text-basic',
		component: 'Text',
		renderer: TextFixture,
		props: { size: 14, weight: 600, lineHeight: 20, content: 'Shared label' },
	},
	{
		name: 'text-bold',
		component: 'Text',
		renderer: TextFixture,
		props: { size: 14, weight: 700, lineHeight: 20, content: 'Shared label' },
	},
	{
		name: 'text-regular',
		component: 'Text',
		renderer: TextFixture,
		props: { size: 14, weight: 400, lineHeight: 20, content: 'Shared label' },
	},
	{
		name: 'text-small',
		component: 'Text',
		renderer: TextFixture,
		props: { size: 12, weight: 400, lineHeight: 16, content: 'Shared label' },
	},
	{
		name: 'text-display',
		component: 'Text',
		renderer: TextFixture,
		props: { size: 18, weight: 700, lineHeight: 24, content: 'Shared label' },
	},
	{
		name: 'text-long',
		component: 'Text',
		renderer: TextFixture,
		props: {
			size: 14,
			weight: 400,
			lineHeight: 20,
			content: 'Shared typography should render the same glyph advances',
		},
		wide: true,
	},
	{
		name: 'text-advance',
		component: 'Text',
		renderer: TextFixture,
		props: {
			size: 14,
			weight: 400,
			lineHeight: 20,
			content: 'The same type should use the same width across targets.',
		},
		width: 520,
	},
]
