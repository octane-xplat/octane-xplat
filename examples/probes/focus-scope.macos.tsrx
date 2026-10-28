/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { Button, FocusScope, TextInput, VStack, getFocusScopeCapabilities } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'

export default function FocusScopeProbe() {
	const [open, setOpen] = useState(false)
	return <VStack gap={2}>
		<Button id="scope-trigger" label="Edit details" clickAction={() => setOpen(true)} />
		{open ? <FocusScope id="scope" contain autoFocus restoreFocus accessibilityLabel="Details">
			<TextInput id="scope-first" label="Name" />
			<TextInput id="scope-disabled" label="Disabled field" isDisabled />
			<TextInput id="scope-last" label="Notes" />
			<Button id="scope-close" label="Close" clickAction={() => setOpen(false)} />
		</FocusScope> : null}
	</VStack>
}

function focused(field: any): boolean {
	if (!field) return false
	const editor = typeof field.currentEditor === 'function' ? field.currentEditor() : field.currentEditor
	return field.window?.firstResponder === field || (editor != null && field.window?.firstResponder === editor)
}

// Programmatic focus and handler dispatch only; real Tab, IME and VoiceOver
// checks remain separate, and all runtime execution requires authorization.
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('scope-trigger')?.window)
	ctx.record('capabilities', getFocusScopeCapabilities())
	const trigger = ctx.find('scope-trigger')
	ctx.assert('focus trigger', trigger.window.makeFirstResponder(trigger), true)
	await ctx.press('scope-trigger')
	await ctx.waitFor(() => focused(ctx.find('scope-first')))
	await ctx.press('scope-close')
	await ctx.waitFor(() => trigger.window.firstResponder === trigger)
	ctx.assert('scope removed', ctx.find('scope') == null, true)
}
