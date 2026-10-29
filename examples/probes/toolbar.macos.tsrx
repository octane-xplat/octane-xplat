/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { Button, Text, Toolbar, VStack } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'

export default function ToolbarProbe() {
	const [vertical, setVertical] = useState(false), [named, setNamed] = useState(false)
	const [result, setResult] = useState('none')
	return <VStack gap={2}>
		<Toolbar id="toolbar-owner" label={named ? 'Document actions' : 'Page actions'} orientation={vertical ? 'vertical' : 'horizontal'}
			startContent={<Button id="toolbar-save" label="Save" clickAction={() => setResult('save')} />}
			centerContent={<Text>Draft</Text>}
			endContent={<Button label="Share" clickAction={() => setResult('share')} />} />
		<Button label="Change toolbar label" clickAction={() => setNamed((value) => !value)} />
		<Button label="Change toolbar orientation" clickAction={() => setVertical((value) => !value)} />
		<Text>{result}</Text>
		<Text>Inspect the named native toolbar and ordinary actions manually. Roving toolbar keys are not implemented; OS input and accessibility remain unqualified.</Text>
	</VStack>
}

// Mount metadata only; no click, hardware-key, accessibility automation or visual analysis.
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('toolbar-owner'))
	ctx.record('qualification', 'mounted only; native role queries and keyboard behavior remain unqualified')
}
