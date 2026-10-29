/** @jsxImportSource @octane-xplat/jsx */
import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
import { useState } from 'octane'
import { CommandPalette } from '../../src/components/overlays/CommandPalette'
import type { ProbeContext } from '../../../../scripts/probe/context'

let changeOpen: (open: boolean) => void
let changeLabel: (label: string) => void
let changePlaceholder: (placeholder: string) => void

export default function Fixture() {
	const [open, setOpen] = useState(false)
	const [label, setLabel] = useState('Initial command')
	const [placeholder, setPlaceholder] = useState('Find commands')
	changeOpen = setOpen
	changeLabel = setLabel
	changePlaceholder = setPlaceholder
	return (
		<masonview id="parity-stage" style={{ width: 320, height: 200 }}>
			<masonview id="cell-command-palette" className="parity-cell">
				<masonview className="parity-box" style={{ width: 320, height: 200 }}>
					<CommandPalette
						id="palette"
						open={open}
						onOpenChange={setOpen}
						className="parity-portal--command-palette"
						placeholder={placeholder}
						style={{ width: 240, height: 160 }}
						maxHeight={60}
						items={[{ key: 'action', label }]}
						renderItem={(item) => <label id="palette-label" text={item.label} />}
					/>
				</masonview>
			</masonview>
		</masonview>
	)
}

export async function run(ctx: ProbeContext) {
	const host = (globalThis as any).__xplatAppKit
	const presentSheet = host.presentSheet
	const handles: any[] = []
	host.presentSheet = (...args: any[]) => {
		const handle = presentSheet(...args)
		handles.push(handle)
		return handle
	}

	ctx.onCleanup(() => {
		host.presentSheet = presentSheet
	})

	const dump = () =>
		(globalThis as any).__xplatMacOSDebug.measureParity([]).cells['command-palette']

	changeOpen(true)
	await ctx.waitFor(() => !!ctx.find('palette-label'))
	ctx.assert('one native sheet', handles.length, 1)
	ctx.assert('sheet contract has no update method', typeof handles[0].update, 'undefined')
	ctx.assert('sheet contract supplies a portal target', !!handles[0].target, true)
	ctx.assert(
		'initial items render in the portal',
		ctx.inspect('palette-label').text,
		'Initial command',
	)

	ctx.assert(
		'portal belongs to the fixture dump',
		dump().some((node: any) => node.id === 'palette'),
		true,
	)

	const query = ctx.find('palette-query')
	changeLabel('Updated command')
	changePlaceholder('Find updated commands')
	await ctx.waitFor(
		() => {
			const label = ctx.inspect('palette-label').text
			const placeholder = String(
				query.placeholderAttributedString?.string ?? query.placeholderString,
			)

			ctx.record('updated props', { label, placeholder })
			return label === 'Updated command' && placeholder === 'Find updated commands'
		},
		{ timeout: 3000 },
	)

	ctx.assert(
		'items update through the owning tree',
		ctx.inspect('palette-label').text,
		'Updated command',
	)

	ctx.assert(
		'input props update through the owning tree',
		String(query.placeholderAttributedString?.string ?? query.placeholderString),
		'Find updated commands',
	)

	ctx.assert('prop updates retain the input', ctx.find('palette-query') === query, true)
	ctx.assert('prop updates retain the sheet', handles.length, 1)
	await ctx.setText('palette-query', 'Updated')
	await ctx.waitFor(() => ctx.inspect('palette-query').value === 'Updated')
	ctx.assert('search remains usable after updates', !!ctx.find('palette-item-action'), true)
	await ctx.press('palette-cancel')
	await ctx.waitFor(() => !ctx.find('palette'))
	ctx.assert(
		'closing removes portal content from the dump',
		dump().some((node: any) => node.id === 'palette'),
		false,
	)

	changeOpen(true)
	await ctx.waitFor(() => !!ctx.find('palette-label'))
	ctx.assert('reopening creates a fresh sheet', handles.length, 2)
	ctx.assert(
		'reopening creates a fresh portal target',
		handles[1].target !== handles[0].target,
		true,
	)

	ctx.assert(
		'reopening retains current items',
		ctx.inspect('palette-label').text,
		'Updated command',
	)

	ctx.record('open command palette geometry', dump())
}
