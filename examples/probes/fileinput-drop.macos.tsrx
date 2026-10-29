/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { Button, VStack } from '@octane-xplat/ui'
import { FileInput, files } from '@octane-xplat/files'
import type { FileInputFile } from '@octane-xplat/files'
import type { ProbeContext } from '../../scripts/probe/context'

const filters = ['.txt,.pdf', 'image/*,.pdf', 'text/*', 'video/*', 'application/json', '*/*,.png', '.pdf,application/x-octane-unregistered']

export default function FileDropProbe() {
	const [value, setValue] = useState<FileInputFile | FileInputFile[] | null>([])
	const [disabled, setDisabled] = useState(false), [dropzone, setDropzone] = useState(true)
	const [filter, setFilter] = useState(0), [service, setService] = useState('No service pick yet')
	const [busy, setBusy] = useState(false)
	const accept = filters[filter]
	async function choose(multiple: boolean) {
		setBusy(true)
		try {
			const refs = multiple ? await files.pickMultiple(accept) : [await files.pick(accept)].filter(file => file != null)
			setService(JSON.stringify(refs))
			for (const ref of refs) files.release(ref)
		} catch (error) {
			setService(error instanceof Error && error.name === 'UnsupportedFileTypeError' ? 'UnsupportedFileTypeError (panel must stay closed)' : 'Picker failed')
		} finally { setBusy(false) }
	}
	return <VStack gap={2}>
		<label text="Choose a filter; compare single/multiple service picks with Attachments validation and filename MIME hints. Try cancel, any-type after a restricted pick, the unresolved filter, disabled state, both presentations and a directory drop. All panels and drops require human input." />
		<label id="attachment-filter" text={accept} />
		<Button label="Next accept filter" isDisabled={busy} clickAction={() => setFilter((filter + 1) % filters.length)} />
		<Button label="Service single pick" isDisabled={busy || disabled} clickAction={() => choose(false)} />
		<Button label="Service multiple pick" isDisabled={busy || disabled} clickAction={() => choose(true)} />
		<label id="service-pick-result" text={service} />
		<Button label="Toggle disabled" clickAction={() => setDisabled(!disabled)} />
		<Button label="Toggle dropzone/input" clickAction={() => setDropzone(!dropzone)} />
		<FileInput id="attachments" label="Attachments" mode={dropzone ? 'dropzone' : 'input'} isDisabled={disabled}
			value={value} onChange={setValue} isMultiple accept={accept} maxSize={5000000} maxFiles={3} />
		<label id="attachment-result" text={JSON.stringify(value)} />
	</VStack>
}
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('attachments'))
	ctx.record('qualification', 'fixture mounted only; no framework loading, picker filtering, MIME validation, OS drag, file access, focus or AX qualification')
}
