/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { GridList, Text, TextInput } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'

const items = ['Alpha', 'Beta', 'Gamma', 'Delta'].map((id) => ({ id }))
export default function GridListProbe() {
	const [action, setAction] = useState('none')
	const [selection, setSelection] = useState('none')
	return <masonview style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
		<Text>Tab into the cards. Use arrows, Home/End, Enter, Space and Shift+Space.</Text>
		<GridList id="grid-native" items={items} columns={2} selectionMode="multiple"
			disabledKeys={['Beta']} renderItem={(item) => <Text>{item.id}</Text>}
			onAction={(key) => setAction(String(key))}
			onSelectionChange={(keys) => setSelection(keys === 'all' ? 'all' : [...keys].join(','))} />
		<Text id="grid-action">{action}</Text>
		<Text id="grid-selection">{selection}</Text>
		<GridList id="grid-editable" items={items.slice(0, 2)} layout="stack" keyboardNavigationBehavior="tab"
			renderItem={(item) => <TextInput label={item.id} />} />
	</masonview>
}

function flag(view: any, name: string): boolean {
	const value = view?.[name]
	return Boolean(typeof value === 'function' ? value.call(view) : value)
}
// Initial native key-view policy and programmatic responder changes only.
// Physical input, scrolling, IME, hit testing and VoiceOver need separate runs.
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('grid-native')?.window)
	const grid = ctx.find('grid-native')
	const row = (index: number) => grid.subviews.objectAtIndex(index)
	await ctx.waitFor(() => Number(grid.subviews.count) === 4)
	await ctx.waitFor(() => flag(row(0), 'canBecomeKeyView') && !flag(row(2), 'canBecomeKeyView'))
	ctx.assert('disabled row excluded', flag(row(1), 'canBecomeKeyView'), false)
	ctx.assert('programmatic focus on roving-excluded row', grid.window.makeFirstResponder(row(2)), true)
	await ctx.waitFor(() => flag(row(2), 'canBecomeKeyView') && !flag(row(0), 'canBecomeKeyView'))
	ctx.record('key-view flags', [0, 1, 2, 3].map((index) => flag(row(index), 'canBecomeKeyView')))
	ctx.record('initial action', ctx.find('grid-action')?.stringValue)
	ctx.record('initial selection', ctx.find('grid-selection')?.stringValue)
}
