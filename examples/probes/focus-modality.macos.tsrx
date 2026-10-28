/** @jsxImportSource @octane-xplat/jsx */
import { Text, TextInput, VStack, useFocusRing, useFocusVisible } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'

export default function FocusModalityProbe() {
	const modality = useFocusVisible()
	const ring = useFocusRing()
	return <VStack gap={2}>
		<TextInput id="modality-input" label="Search" {...ring.focusProps} />
		<Text id="modality-status">{modality.isSupported ? modality.inputModality : 'unsupported'}</Text>
		<Text id="modality-ring">{ring.isFocusVisible ? 'visible' : 'hidden'}</Text>
	</VStack>
}

// This fixture exposes state for real Tab/mouse/deactivation checks. It does
// not synthesize native events or establish physical input/visual evidence.
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('modality-status'))
	ctx.assert('AppKit input bridge installed', String(ctx.find('modality-status').stringValue) !== 'unsupported', true)
	ctx.record('initial modality', String(ctx.find('modality-status').stringValue))
	ctx.record('initial ring state', String(ctx.find('modality-ring').stringValue))
}
