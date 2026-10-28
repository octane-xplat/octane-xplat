// Port of upstream FileInput/FileInputShowcase.tsx (Astryx 0.6.4, MIT).
import { FileInput } from '@octane-xplat/files'
import type { FileInputFile } from '@octane-xplat/files'
import { useState } from 'octane'

export function FileInputShowcase() @{
	const [value, setValue] = useState<FileInputFile | FileInputFile[] | null>(null)

	<div style={{ width: 350 }}>
		<FileInput
			label="Upload file"
			value={value}
			onChange={setValue}
			placeholder="Drag files here or click to browse"
		/>
	</div>
}
