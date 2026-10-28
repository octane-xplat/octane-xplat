// Measured parity fixtures — assertions live in TextArea.parity.check.ts.
import { TextArea } from './TextArea'
import type { ParityFixture } from './parity'

function TextAreaFixture(props: { value?: string }) @{
	<TextArea
		className="parity-textarea"
		value={props.value}
		placeholder="Notes"
		rows={2}
		style={{ width: 180, height: 48 }}
	/>
}

function TextAreaRowsFixture(props: { value: string; rows?: number }) @{
	<TextArea
		className="parity-textarea"
		value={props.value}
		placeholder="Notes"
		rows={props.rows}
		style={{ width: 180 }}
	/>
}

export const PARITY: ParityFixture[] = [
	{ name: 'text-area', component: 'TextArea', renderer: TextAreaFixture, props: {} },
	{
		name: 'text-area-filled',
		component: 'TextArea',
		renderer: TextAreaFixture,
		props: { value: 'First line\nSecond line' },
	},
	{
		name: 'text-area-rows-2',
		component: 'TextArea',
		renderer: TextAreaRowsFixture,
		props: { value: 'First line\nSecond line', rows: 2 },
	},
	{
		name: 'text-area-rows-default',
		component: 'TextArea',
		renderer: TextAreaRowsFixture,
		props: { value: 'First line\nSecond line' },
	},
]
