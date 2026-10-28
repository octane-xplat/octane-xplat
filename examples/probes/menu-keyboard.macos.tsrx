/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { DropdownMenu, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuSubMenu, VStack } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'

export default function MenuKeyboardProbe() {
	const [checked, setChecked] = useState(false), [result, setResult] = useState('none')
	return <VStack gap={2}>
		<label text="Focus Actions; Down/Up requests first/last-row opening. Use arrows, Home/End, label prefixes and Enter/Space. Right opens More; Left requests its close." />
		<DropdownMenu id="menu-keys" button={{ label: 'Actions' }}>
			<DropdownMenuItem id="menu-archive" label="Archive" onSelect={() => setResult('archive')} />
			<DropdownMenuItem id="menu-blocked" label="Blocked" isDisabled />
			<DropdownMenuCheckboxItem id="menu-pin" label="Pinned" value={checked} onValueChange={setChecked} />
			<DropdownMenuSubMenu id="menu-more" label="More">
				<DropdownMenuItem id="menu-export" label="Export" onSelect={() => setResult('export')} />
			</DropdownMenuSubMenu>
		</DropdownMenu>
		<label id="menu-key-result" text={`${result}; ${checked ? 'pinned' : 'unpinned'}`} />
	</VStack>
}

// This runner entry dispatches only the existing trigger action; it synthesizes no OS keys.
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('menu-keys'))
	await ctx.press('menu-keys')
	ctx.record('qualification', 'direct trigger dispatch only; physical keys/popup focus/AX remain unqualified')
}
