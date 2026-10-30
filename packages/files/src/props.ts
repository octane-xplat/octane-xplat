import type { Octane } from 'octane/jsx-runtime'

import type { FieldControlProps, FieldStatusInfo, FieldStatusType } from '@octane-xplat/ui'
import type { FileRef } from './types'

/** A portable selected file. The browser File is only present on web. */
export interface FileInputFile extends FileRef {
	/** Byte size when the picker knows it. */
	size?: number
	/** MIME type when known. */
	mimeType?: string
	/** The underlying browser File — web only, absent on native. */
	file?: any
}

/** Field status payload re-exported from ui's field contract. */
export type FileInputStatus = FieldStatusInfo
/** Field status kind re-exported from ui's field contract. */
export type FileInputStatusType = FieldStatusType

/** Picker override signature — return the picked file(s) or null on
 *  cancel; receives the effective accept/multiple filters. */
export type FileInputPick = (options: {
	/** `accept`-style filter forwarded from the prop. */
	accept?: string
	/** Whether multi-select is allowed. */
	multiple?: boolean
}) => Promise<FileInputFile[] | FileInputFile | null>

/** Imperative handle exposed through the FileInput `ref`. */
export interface FileInputHandle {
	/** Present the picker UI programmatically. */
	open(): void
	/** The platform widget — `any` deliberately (input element / native picker). */
	native: any
}

/** Props for the `<FileInput>` element — a pickable file field with input
 *  and dropzone presentations. */
export interface FileInputProps extends FieldControlProps {
	/** Class list applied to the field element. */
	className?: any
	/** Inline style (string CSS or object). */
	style?: any
	/** Element id passed through to the host element. */
	id?: string
	/** Spoken name for assistive tech. */
	accessibilityLabel?: string
	/** Spoken hint describing what activating does. */
	accessibilityHint?: string
	/** `input` is a compact field row; `dropzone` a larger target that
	 *  accepts drag/drop on pointer platforms. @default 'input' */
	mode?: 'input' | 'dropzone'
	/** Controlled selection — single file, array under `isMultiple`, or null. */
	value: FileInputFile | FileInputFile[] | null
	/** Fires when the user changes the selection. */
	onChange: (value: FileInputFile | FileInputFile[] | null) => void
	/** Async side-effect run after a change (e.g. upload); errors are not
	 *  surfaced back into the field. */
	changeAction?: (value: FileInputFile | FileInputFile[] | null) => void | Promise<void>
	/** `accept`-style filter: `.ext`, `type/subtype`, wildcard subtype, any. */
	accept?: string
	/** When true, `value` and `onChange` use file arrays. */
	isMultiple?: boolean
	/** Max bytes per file; skipped for refs without a `size`. */
	maxSize?: number
	/** Cap on selectable files when `isMultiple`. */
	maxFiles?: number
	/** Empty-state hint text. */
	placeholder?: string
	/** Optional per-instance picker override for cloud or app-specific sources. */
	pick?: FileInputPick
	/** Imperative handle — see FileInputHandle. */
	ref?: Octane.Ref<FileInputHandle>
	/** Platform escape hatches, applied after the shared props. */
	ios?: any
	/** Platform escape hatch — same bag contract as `ios`. */
	android?: any
	/** Platform escape hatch — same bag contract as `ios`. */
	web?: any
}
