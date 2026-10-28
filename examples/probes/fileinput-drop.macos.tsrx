/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { Button, VStack } from '@octane-xplat/ui'
import { FileInput } from '@octane-xplat/files'
import type { FileInputFile } from '@octane-xplat/files'
import type { ProbeContext } from '../../scripts/probe/context'

export default function FileDropProbe() {
	const [value, setValue] = useState<FileInputFile | FileInputFile[] | null>([])
	const [disabled, setDisabled] = useState(false), [dropzone, setDropzone] = useState(true)
	return <VStack gap={2}>
		<label text="Drop local text/PDF files on Attachments; verify validation, metadata and parent value. Compare the picker. Try disabled state, both presentations and a directory. No OS drag is synthesized by the runner." />
		<Button label="Toggle disabled" clickAction={() => setDisabled(!disabled)} />
		<Button label="Toggle dropzone/input" clickAction={() => setDropzone(!dropzone)} />
		<FileInput id="attachments" label="Attachments" mode={dropzone ? 'dropzone' : 'input'} isDisabled={disabled}
			value={value} onChange={setValue} isMultiple accept=".txt,.pdf" maxSize={5000000} maxFiles={3} />
		<label id="attachment-result" text={JSON.stringify(value)} />
	</VStack>
}
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('attachments'))
	ctx.record('qualification', 'fixture mounted only; no OS drag, file access, validation, focus or AX qualification')
}
