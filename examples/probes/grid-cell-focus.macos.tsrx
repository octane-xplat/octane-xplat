/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { Button, Text, TextInput, View, useGridFocus } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'

export default function GridCellFocusProbe() @{
	const [disabled, setDisabled] = useState(false), [hidden, setHidden] = useState(false), [removed, setRemoved] = useState(false)
	const [alternate, setAlternate] = useState(false), [nested, setNested] = useState(true), [chosen, setChosen] = useState('none'), [last, setLast] = useState('none')
	const grid = useGridFocus<NSView>({ rows: 3, columns: 3, onFocusChange: (index) => setLast(`${alternate ? 'B' : 'A'}:${index}`) })
	const inner = useGridFocus<NSView>({ rows: 1, columns: 2 })
	<View className="gap-3">
		<Text>Native grid-cell focus: source implementation, OS qualification pending. Use Tab, arrows and Home/End. Cell activation stays on Enter/Space or click; nested fields keep editing keys. This probe records mounting only.</Text>
		<Button label="Focus first cell" clickAction={() => grid.onFocusCell?.(0)} />
		<Button label="Focus last cell" clickAction={() => grid.onFocusCell?.(99)} />
		<Button label="Toggle disabled cell 4" clickAction={() => setDisabled(!disabled)} />
		<Button label="Toggle hidden cell 3" clickAction={() => setHidden(!hidden)} />
		<Button label="Remove/restore cell 7" clickAction={() => setRemoved(!removed)} />
		<Button label="Replace movement callback" clickAction={() => setAlternate(!alternate)} />
		<Button label="Mount/unmount nested grid" clickAction={() => setNested(!nested)} />
		<masonview ref={grid.ref} onKeyDown={grid.onKeyDown} className="cell-focus-grid">
			@for (const number of [0, 1, 2, 3, 4, 5, 6, 7, 8]) {
				@if (!(removed && number === 7)) {
					<masonview data-grid-cell className="cell-focus-cell" accessible accessibilityRole="button"
						accessibilityLabel={`Cell ${number}`} accessibilityState={{ disabled: disabled && number === 4 }}
						style={{ display: hidden && number === 3 ? 'none' : 'flex' }}
						onTap={() => { if (!(disabled && number === 4)) setChosen(String(number)) }}>
						<label text={`Cell ${number}`} />
						@if (number === 8) { <TextInput label="Cell 8 notes" /> }
					</masonview>
				}
			}
			@if (nested) {
				<masonview ref={inner.ref} onKeyDown={inner.onKeyDown} className="cell-focus-inner">
					<masonview data-grid-cell className="cell-focus-cell" accessible accessibilityRole="button" onTap={() => setChosen('nested A')}><label text="Nested A" /></masonview>
					<masonview data-grid-cell className="cell-focus-cell" accessible accessibilityRole="button" onTap={() => setChosen('nested B')}><label text="Nested B" /></masonview>
				</masonview>
			}
		</masonview>
		<Text id="grid-cell-focus-status">{`Hook index ${grid.focusIndex} · handler ${last} · chosen ${chosen} · ${grid.onFocusCell ? 'method available' : 'method unavailable'}`}</Text>
	</View>
}
<style>
	.cell-focus-grid { display: flex; flex-direction: row; flex-wrap: wrap; gap: 8; max-width: 520; }
	.cell-focus-inner { display: flex; flex-direction: row; gap: 8; }
	.cell-focus-cell { display: flex; width: 160; min-height: 40; padding: 8; border-width: 1; border-color: #888; }
</style>

export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('grid-cell-focus-status'))
	ctx.record('qualification', 'Mounted only; native Tab/arrows/Home/End, activation, nested scopes, input, layout and AX not exercised')
}
