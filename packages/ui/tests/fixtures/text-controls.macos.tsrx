/** @jsxImportSource @octane-xplat/jsx */
import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
import { useState } from 'octane'
// Keep these extensionless imports: parity fixtures and shared components use
// them too, and must resolve to AppKit rather than NativeScript controls.
import { TextArea } from '../../src/TextArea'
import { TextInput } from '../../src/TextInput'
import type { ProbeContext } from '../../../../scripts/probe/context'

let changeRows: (rows: number) => void

export default function Fixture() {
	const [rows, setRows] = useState(2)
	changeRows = setRows
	return (
		<masonview id="parity-stage" style={{ width: 320, height: 360 }}>
			<masonview id="cell-inputs" className="parity-cell">
				<masonview
					className="parity-box"
					style={{ width: 320, height: 360, display: 'flex', flexDirection: 'column' }}
				>
					<TextInput id="natural-input" placeholder="Name" />
					<TextArea id="rows-area" placeholder="Notes" rows={rows} style={{ width: 180 }} />
					<TextArea id="default-area" placeholder="Notes" style={{ width: 180 }} />
				</masonview>
			</masonview>
		</masonview>
	)
}

export async function run(ctx: ProbeContext) {
	const dump = () => (globalThis as any).__xplatMacOSDebug.measureParity([]).cells.inputs
	const node = (id: string) => dump()?.find((value: any) => value.id === id)
	await ctx.waitFor(() => node('default-area')?.box.h > 0)
	ctx.assert('direct TextInput import uses AppKit natural height', node('natural-input').box.h, 20)
	ctx.assert('direct TextArea import sizes two rows', node('rows-area').box.h, 48)
	ctx.assert('default TextArea rows include padding', node('default-area').box.h, 68)
	ctx.assert('textarea inline inset', node('rows-area').contentBox.x - node('rows-area').box.x, 8)
	ctx.assert('textarea block inset', node('rows-area').contentBox.y - node('rows-area').box.y, 4)
	changeRows(3)
	await ctx.waitFor(() => node('rows-area')?.box.h === 68)
	ctx.assert('changing rows refits the AppKit control', node('rows-area').box.h, 68)
	ctx.record('text control geometry', dump())
}
