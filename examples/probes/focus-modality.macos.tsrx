/** @jsxImportSource @octane-xplat/jsx */
import { Text, TextInput, VStack, useFocusRing, useFocusVisible } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'
import { KVK, postKey, postClick } from '../../scripts/probe/appkit-input'

export default function FocusModalityProbe() {
	const modality = useFocusVisible()
	const ring = useFocusRing()
	return <VStack gap={2}>
		<TextInput id="modality-input" label="Search" {...ring.focusProps} />
		<Text id="modality-status">{modality.isSupported ? modality.inputModality : 'unsupported'}</Text>
		<Text id="modality-ring">{ring.isFocusVisible ? 'visible' : 'hidden'}</Text>
	</VStack>
}

// CGEvent posts drive the modality tracker through sendEvent: posted keys
// publish 'keyboard', posted mouse-downs publish 'pointer'. Ring visibility
// requires real focus plus keyboard modality.
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('modality-input')?.window)
	ctx.assert('AppKit input bridge installed', String(ctx.find('modality-status').stringValue) !== 'unsupported', true)
	ctx.record('initial modality', String(ctx.find('modality-status').stringValue))
	ctx.record('initial ring state', String(ctx.find('modality-ring').stringValue))
	const input = ctx.find('modality-input')
	ctx.assert('focus input', input.window.makeFirstResponder(input), true)

	// Posted key → keyboard modality → focus-visible ring.
	postKey(KVK.RightArrow)
	await ctx.waitFor(() => ctx.find('modality-status')?.stringValue === 'keyboard', { timeout: 2000 })
	ctx.assert('ring visible on keyboard', String(ctx.find('modality-ring')?.stringValue), 'visible')

	// Posted click → pointer modality → ring hides again.
	await postClick(input)
	await ctx.waitFor(() => ctx.find('modality-status')?.stringValue === 'pointer', { timeout: 2000 })
	ctx.assert('ring hidden on pointer', String(ctx.find('modality-ring')?.stringValue), 'hidden')

	// Back to keyboard.
	postKey(KVK.LeftArrow)
	await ctx.waitFor(() => ctx.find('modality-status')?.stringValue === 'keyboard', { timeout: 2000 })
	ctx.assert('ring returns on keyboard', String(ctx.find('modality-ring')?.stringValue), 'visible')
}
