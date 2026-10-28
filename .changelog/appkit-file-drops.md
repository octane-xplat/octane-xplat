### AppKit attachment file-drop source support

FileInput now receives local regular-file URLs in compact and dropzone presentations through the matching
AppKit renderer and uses the same validation and save ownership as the picker.
Directories, symlinks, uninspectable files and promised/non-file payloads are excluded.

```tsx
import { FileInput } from '@octane-xplat/files'
import type { FileInputFile } from '@octane-xplat/files'

export function Attachments(props: { value: FileInputFile[]; change(value: FileInputFile | FileInputFile[] | null): void }) {
	return <FileInput label="Attachments" mode="dropzone" value={props.value} onChange={props.change} isMultiple />
}
```

Native drag delivery, sandbox access, focus/VoiceOver and packaging remain
unqualified. See [file entry](https://octane-xplat.goddardai.org/platform/date-picker#drop-local-files-on-appkit).
