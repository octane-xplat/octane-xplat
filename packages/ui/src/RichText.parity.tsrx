// Measured parity fixtures — assertions live in RichText.parity.check.ts.
import { RichText } from './RichText'
import { RichTextSpan } from './index.shared'
import type { ParityFixture } from './parity'

function RichTextFixture() @{
	<RichText
		className="parity-rich-text-root"
		style={{
			width: 220,
			height: 32,
			fontSize: 14,
			fontWeight: 500,
			lineHeight: '20px',
			color: '#0a0a0a',
			backgroundColor: '#f5f5f5',
		}}
	>
		<RichTextSpan text="Shared text " />
		<RichTextSpan text="formatted run" style={{ fontWeight: 700 }} />
	</RichText>
}

export const PARITY: ParityFixture[] = [
	{
		name: 'rich-text-fixed-run',
		component: 'RichText',
		renderer: RichTextFixture,
		props: {},
		height: 48,
	},
]
