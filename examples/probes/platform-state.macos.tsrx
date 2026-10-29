/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { useAppState, useBackHandler, useBreakpoints$, useSafeAreaInsets, useWindowSize } from '@octane-xplat/platform'
import { useWindowSize as usePurposeSize } from '@octane-xplat/platform/screen'
import { useAppState as usePurposeActivity } from '@octane-xplat/platform/lifecycle'
import { useSafeAreaInsets as usePurposeInsets } from '@octane-xplat/platform/safe-area'
import { useBreakpoints$ as usePurposeBreakpoints$ } from '@octane-xplat/platform/breakpoints'
import { Button, Text, TextInput, View } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'

const thresholds = { wide: 900 }
function Readers() @{
	const root = useWindowSize(), purpose = usePurposeSize(), state = useAppState(), purposeState = usePurposeActivity()
	const insets = useSafeAreaInsets(), purposeInsets = usePurposeInsets()
	const matches = useBreakpoints$(thresholds), purposeMatches = usePurposeBreakpoints$(thresholds)
	useBackHandler(() => false)
	<View className="gap-3">
		<Text>{`Root ${root.width}×${root.height} ${root.orientation}; purpose ${purpose.width}×${purpose.height} ${purpose.orientation}; same snapshot ${root === purpose}`}</Text>
		<Text>{`Activity root ${state}, purpose ${purposeState}; wide root ${matches.wide}, purpose ${purposeMatches.wide}`}</Text>
		<Text>{`Insets root ${JSON.stringify(insets)}, purpose ${JSON.stringify(purposeInsets)}`}</Text>
		<TextInput label="Keep this draft while manually resizing" />
	</View>
}
export default function PlatformStateProbe() @{
	const [mounted, setMounted] = useState(true)
	<View className="gap-3">
		<Text>AppKit primary-window hooks: manually resize and activate/deactivate after native verification is authorized. Root and purpose values should agree. No automatic window or input actions run.</Text>
		<Button label={mounted ? 'Unmount readers' : 'Mount readers'} clickAction={() => setMounted(!mounted)} />
		@if (mounted) { <Readers /> }
		<Text id="platform-state-status">{mounted ? 'Readers mounted; runtime qualification pending' : 'Readers unmounted'}</Text>
	</View>
}
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('platform-state-status'))
	ctx.record('qualification', 'Mounted readers only; no resize, activity transition, input, AX or native subscription-lifetime verification performed')
}
