/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import {
	Button,
	ContextMenu,
	DropdownMenu,
	DropdownMenuLink,
	MoreMenu,
	Text,
	View,
} from '@octane-xplat/ui'
import type { MenuOption } from '@octane-xplat/ui'

export function MenuProbe() @{
	const [lastPick, setLastPick] = useState('none')
	const items: MenuOption[] = [
		{ type: 'action', label: 'Rename', key: 'rename', onSelect: () => setLastPick('rename') },
		{ type: 'action', label: 'Duplicate', key: 'dup', onSelect: () => setLastPick('dup') },
		{ type: 'checkbox', label: 'Show hidden', key: 'hidden', value: true, onValueChange: () => setLastPick('cb') },
		{ type: 'separator', key: 'sep' },
		{ type: 'section', key: 'sec', label: 'Section header', items: [{ type: 'action', key: 'sa', label: 'Section action', onSelect: () => setLastPick('section') }] },
		{
			type: 'radio-group',
			key: 'sort',
			label: 'Sort',
			value: 'name',
			onValueChange: (v: any) => setLastPick('radio:' + v),
			items: [
				{ value: 'name', label: 'By name', key: 'rn' },
				{ value: 'date', label: 'By date', key: 'rd' },
			],
		},
		{ type: 'action', label: 'Disabled action', key: 'noop', isDisabled: true, onSelect: () => setLastPick('pick:noop') },
		{ type: 'submenu', key: 'sub', label: 'Submenu group', items: [{ type: 'action', label: 'Sub action', key: 'subitem', onSelect: () => setLastPick('sub') }] },
	]
	<>
		<DropdownMenu id="dd" label="Actions" button={{ label: 'Open menu' }} items={items}>
			<DropdownMenuLink href="https://example.com/docs" label="Docs link" onSelect={() => setLastPick('link')} />
		</DropdownMenu>
		<ContextMenu id="ctx-off" label="Disabled context" isDisabled items={items}>
			<View id="ctx-off-anchor" style={{ width: 80, height: 40 }}><Text>Disabled zone</Text></View>
		</ContextMenu>
		<ContextMenu id="ctx" label="Context" items={items}>
			<View id="ctx-anchor" style={{ width: 80, height: 40 }}><Text>Right zone</Text></View>
		</ContextMenu>
		<MoreMenu
			id="more"
			label="More"
			items={[
				{ type: 'action', key: 'm1', label: 'More action', onSelect: () => setLastPick('more') },
			]}
		/>
		<MoreMenu
			id="more-adaptive"
			label="Adaptive"
			presentation="adaptive"
			items={[{ type: 'action', key: 'a1', label: 'Adaptive action' }]}
		/>
		<Text id="picked">{lastPick}</Text>
	</>
}

// presentation="bottom-sheet" presents the menu inside a real BottomSheet on GTK.
export function SheetProbe() @{
	<MoreMenu
		id="sheet"
		label="Sheet"
		presentation="bottom-sheet"
		items={[{ type: "action", key: "s1", label: "SheetMenuAction", onSelect: () => {} }]}
	/>
}
