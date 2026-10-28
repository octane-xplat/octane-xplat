/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { Button, ProgressBar, Text, VStack } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'

export default function ProgressBarProbe() {
	const [unknown, setUnknown] = useState(true), [value, setValue] = useState(25)
	const [disabled, setDisabled] = useState(false), [css, setCSS] = useState(true)
	return <VStack gap={2}>
		<ProgressBar id="upload-progress" label="Upload" value={value} isIndeterminate={unknown}
			isDisabled={disabled} hasValueLabel marks={[{ value: 50, label: 'Halfway' }]}
			accessibilityHint="Keep the app open" style={css ? 'width:240px' : { width: 240 }} />
		<Button label="Toggle known progress" clickAction={() => setUnknown((current) => !current)} />
		<Button label="Advance known progress" clickAction={() => setValue((current) => (current + 25) % 125)} />
		<Button label="Toggle inactive state" clickAction={() => setDisabled((current) => !current)} />
		<Button label="Toggle style form" clickAction={() => setCSS((current) => !current)} />
		<Text>Change the app theme and inspect known/unknown mode, style width and accessibility separately. Unknown progress is a static fill; mounting does not qualify animation, painting or VoiceOver.</Text>
	</VStack>
}

// Mount evidence only. No animation, OS input or accessibility qualification.
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('upload-progress'))
	ctx.record('qualification', 'Progress controls mounted; native behavior remains unqualified')
}
