import type { Octane } from 'octane/jsx-runtime'

import type { FieldControlProps, FieldStatus, FieldStatusType } from '@octane-xplat/ui'
import type { FileRef } from './types'

/** A portable selected file. The browser File is only present on web. */
export interface FileInputFile extends FileRef {
	size?: number
	mimeType?: string
	file?: any
}

export type FileInputStatus = FieldStatus
export type FileInputStatusType = FieldStatusType

export type FileInputPick = (options: {
	accept?: string
	multiple?: boolean
}) => Promise<FileInputFile[] | FileInputFile | null>

export interface FileInputHandle {
	open(): void
	native: any
}

export interface FileInputProps extends FieldControlProps {
	className?: any
	style?: any
	id?: string
	accessibilityLabel?: string
	accessibilityHint?: string
	/** `input` is a compact field row; `dropzone` a larger target that
	 *  accepts drag/drop on pointer platforms. @default 'input' */
	mode?: 'input' | 'dropzone'
	value: FileInputFile | FileInputFile[] | null
	onChange: (value: FileInputFile | FileInputFile[] | null) => void
	changeAction?: (value: FileInputFile | FileInputFile[] | null) => void | Promise<void>
	/** `accept`-style filter: `.ext`, `type/subtype`, wildcard subtype, any. */
	accept?: string
	/** When true, `value` and `onChange` use file arrays. */
	isMultiple?: boolean
	/** Max bytes per file; skipped for refs without a `size`. */
	maxSize?: number
	maxFiles?: number
	placeholder?: string
	/** Optional per-instance picker override for cloud or app-specific sources. */
	pick?: FileInputPick
	ref?: Octane.Ref<FileInputHandle>
	ios?: any
	android?: any
	web?: any
}
