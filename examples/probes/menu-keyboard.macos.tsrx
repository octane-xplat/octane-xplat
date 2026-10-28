/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { Button, ContextMenu, DropdownMenu, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuSubMenu, VStack } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'

export default function MenuKeyboardProbe() {
	const [checked, setChecked] = useState(false), [result, setResult] = useState('none')
	const [showAction, setShowAction] = useState(true), [disableAction, setDisableAction] = useState(false)
	return <VStack gap={2}>
		<label text="Focus Actions; Down/Up requests first/last-row opening. Use arrows, Home/End, label prefixes and Enter/Space. Right opens More; Left requests its close. Tab/Shift-Tab request exit to the trigger neighbor. Dynamic actions remove or disable themselves without closing; inspect focus repair without selecting a neighbor." />
		<DropdownMenu id="menu-keys" button={{ label: 'Actions' }}>
			<DropdownMenuItem id="menu-archive" label="Archive" onSelect={() => setResult('archive')} />
			{showAction && <DropdownMenuItem id="menu-remove-self" label="Remove this action" hasCloseOnSelect={false} onSelect={() => setShowAction(false)} />}
			<DropdownMenuItem id="menu-disable-self" label="Disable this action" isDisabled={disableAction} hasCloseOnSelect={false} onSelect={() => setDisableAction(true)} />
			<DropdownMenuItem id="menu-blocked" label="Blocked" isDisabled />
			<DropdownMenuCheckboxItem id="menu-pin" label="Pinned" value={checked} onValueChange={setChecked} />
			<DropdownMenuSubMenu id="menu-more" label="More">
				<DropdownMenuItem id="menu-export" label="Export" onSelect={() => setResult('export')} />
			</DropdownMenuSubMenu>
		</DropdownMenu>
		<Button label="Reset dynamic menu actions" clickAction={() => { setShowAction(true); setDisableAction(false) }} />
		<ContextMenu id="context-keys" label="Document actions" trigger="Context actions"
			menu={<DropdownMenuItem label="Archive" onSelect={() => setResult('context-archive')} />}>
			<Button id="context-item" label="Document — try Shift+F10, Context Menu key, secondary-click or Control-click" clickAction={() => setResult('selected')} />
		</ContextMenu>
		<label id="menu-key-result" text={`${result}; ${checked ? 'pinned' : 'unpinned'}`} />
	</VStack>
}

// This runner entry dispatches only the existing trigger action; it synthesizes no OS keys or mouse events.
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('menu-keys'))
	await ctx.press('menu-keys')
	ctx.record('qualification', 'direct trigger dispatch only; physical keys/popup focus/AX remain unqualified')
}
