// Port of upstream FileInput/FileInputBasic.tsx (Astryx 0.6.4, MIT).
import { FileInput } from '@octane-xplat/files'
import type { FileInputFile } from '@octane-xplat/files'
import { useState } from 'octane'

export function FileInputBasic() @{
	const [value, setValue] = useState<FileInputFile | FileInputFile[] | null>(null)

	<div style={{width: 350}}>
		<FileInput label="Resume" value={value} onChange={setValue} accept=".pdf,.docx" description="PDF or Word document, up to 5 MB" maxSize={5 * 1024 * 1024} />
	</div>
}
