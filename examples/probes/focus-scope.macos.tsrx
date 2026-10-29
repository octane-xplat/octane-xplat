/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { Button, FocusScope, Text, TextInput, VStack, getFocusScopeCapabilities } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'

export default function FocusScopeProbe() {
	const [open, setOpen] = useState(false)
	const [nested, setNested] = useState(false)
	return <VStack gap={2}>
		<Text>Native qualification pending. Open Details, then its nested editor. Check Tab/Shift+Tab ownership and restoration after closing either owner. Repeat in two native windows; this probe does not create another window.</Text>
		<Button id="scope-trigger" label="Edit details" clickAction={() => setOpen(true)} />
		{open ? <FocusScope id="scope" contain autoFocus restoreFocus accessibilityLabel="Details">
			<TextInput id="scope-first" label="Name" />
			<TextInput id="scope-disabled" label="Disabled field" isDisabled />
			<TextInput id="scope-last" label="Notes" />
			<Button id="scope-nested-trigger" label="Open nested editor" clickAction={() => setNested(true)} />
			{nested ? <FocusScope id="scope-nested" contain autoFocus restoreFocus accessibilityLabel="Nested editor">
				<TextInput id="scope-nested-first" label="Nested name" />
				<TextInput id="scope-nested-last" label="Nested notes" />
				<Button id="scope-nested-close" label="Close nested editor" clickAction={() => setNested(false)} />
				<Button label="Close both owners" clickAction={() => { setNested(false); setOpen(false) }} />
			</FocusScope> : null}
			<Button id="scope-close" label="Close" clickAction={() => { setNested(false); setOpen(false) }} />
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
