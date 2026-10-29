/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { Button, Text, TextInput, ToggleButton, Toolbar, VStack } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'

export default function ToolbarProbe() {
	const [vertical, setVertical] = useState(false), [named, setNamed] = useState(false)
	const [result, setResult] = useState('none')
	const [disabled, setDisabled] = useState(false), [shown, setShown] = useState(true)
	return <VStack gap={2}>
		<Toolbar id="toolbar-owner" label={named ? 'Document actions' : 'Page actions'} orientation={vertical ? 'vertical' : 'horizontal'}
			startContent={<Button id="toolbar-save" label="Save" isDisabled={disabled} clickAction={() => setResult('save')} />}
			centerContent={<TextInput id="toolbar-editor" placeholder="Keep this draft while rotating" />}
			endContent={<VStack>
				<ToggleButton id="toolbar-pin" label="Pin" />
				{shown ? <Button label="Share" clickAction={() => setResult('share')} /> : null}
				<Toolbar label="Nested actions" startContent={<Button label="Nested action" clickAction={() => setResult('nested')} />} />
			</VStack>} />
		<Button label="Change toolbar label" clickAction={() => setNamed((value) => !value)} />
		<Button label="Change toolbar orientation" clickAction={() => setVertical((value) => !value)} />
		<Button label="Toggle Save disablement" clickAction={() => setDisabled((value) => !value)} />
		<Button label="Remove or restore Share" clickAction={() => setShown((value) => !value)} />
		<Text>{result}</Text>
		<Text>Manually Tab to actions; use Left/Right or Up/Down for the current axis and Home/End. Focus movement must not activate actions. Editors and nested toolbars keep their input. Rotate after editing or pinning; inspect retained state. OS input, Tab and accessibility remain unqualified.</Text>
	</VStack>
}

// Mount metadata only; no click, hardware-key, accessibility automation or visual analysis.
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('toolbar-owner'))
	ctx.record('qualification', 'mounted only; native role queries and keyboard behavior remain unqualified')
}
