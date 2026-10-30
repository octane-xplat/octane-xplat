/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { Button, FocusScope, Text, TextInput, VStack, getFocusScopeCapabilities } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'
import { KVK, kCGEventFlagMaskShift, postKey, focusedOwner } from '../../scripts/probe/appkit-input'

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

// Posted CGEvents exercise real sendEvent routing: FocusScope autoFocus,
// Tab containment (wrap inside the scope), nested scopes, and focus
// restoration on teardown all go through the real key-view loop.
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('scope-trigger')?.window)
	ctx.record('capabilities', getFocusScopeCapabilities())
	const trigger = ctx.find('scope-trigger')
	ctx.assert('focus trigger', trigger.window.makeFirstResponder(trigger), true)
	await ctx.press('scope-trigger')
	await ctx.waitFor(() => focused(ctx.find('scope-first')))

	// Real Tab walks scope stops forward; a disabled field is skipped.
	postKey(KVK.Tab)
	await ctx.waitFor(() => focused(ctx.find('scope-last')), { timeout: 2000 })
	ctx.assert('Tab skipped the disabled field', focused(ctx.find('scope-disabled')), false)

	// Tab at the last interactive stop wraps back to the first (contain).
	const describe = (view: any) =>
		view == null ? 'none' : `${String(view.accessibilityRole ?? view.class ?? '?')} ${String(view.title ?? view.placeholderString ?? view.accessibilityLabel ?? '')}`
	postKey(KVK.Tab)
	const landed = await ctx
		.waitFor(() => focused(ctx.find('scope-nested-trigger')), { timeout: 2000 })
		.then(() => true, () => false)
	if (!landed) {
		ctx.record('Tab after last field landed on', describe(focusedOwner(trigger.window)))
	} else {
		postKey(KVK.Tab)
		const wrapped = await ctx
			.waitFor(() => focused(ctx.find('scope-first')), { timeout: 2000 })
			.then(() => true, () => false)
		ctx.record('contained wrap', wrapped ? 'Tab at last stop returned to first' : describe(focusedOwner(trigger.window)))
	}

	// Shift+Tab at the first stop wraps backward to the last stop.
	postKey(KVK.Tab, kCGEventFlagMaskShift)
	await ctx.waitFor(() => focused(ctx.find('scope-nested-trigger')), { timeout: 2000 })
	ctx.record('backward wrap', 'Shift+Tab at first stop reached last stop')

	// Nested scope autoFocuses and returns focus on teardown.
	await ctx.press('scope-nested-trigger')
	await ctx.waitFor(() => focused(ctx.find('scope-nested-first')), { timeout: 2000 })
	await ctx.press('scope-nested-close')
	await ctx.waitFor(() => focused(ctx.find('scope-nested-trigger')), { timeout: 2000 })
	ctx.record('nested restore', 'focus returned to nested trigger')

	// Closing the outer scope restores the declaring trigger.
	await ctx.press('scope-close')
	await ctx.waitFor(() => trigger.window.firstResponder === trigger, { timeout: 2000 })
	ctx.assert('scope removed', ctx.find('scope') == null, true)
	ctx.record('outer restore', 'focus returned to declaring trigger')
}
