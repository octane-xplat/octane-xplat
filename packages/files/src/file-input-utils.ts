/**
 * Shared formatting and validation helpers for this package's FileInput.
 */

import type { FileInputFile } from './props'

export function cx(...values: Array<string | false | null | undefined>): string {
	return values.filter(Boolean).join(' ')
}

export function normalizePicked(result: FileInputFile[] | FileInputFile | null): FileInputFile[] {
	if (result == null) {return []}
	return Array.isArray(result) ? result : [result]
}

// ---------------------------------------------------------------------------
// Validation — `accept` tokens (`.ext`, `type/subtype`, `type/*`, `*/*`),
// `maxSize` bytes, `maxFiles` count. Refs without `size`/`mimeType` skip the
// checks that need them.
// ---------------------------------------------------------------------------

export interface FileValidationOptions {
	accept?: string
	maxSize?: number
	maxFiles?: number
}

export interface FileValidationResult {
	valid: FileInputFile[]
	errors: string[]
}

export function fileAccepts(file: FileInputFile, accept: string | undefined): boolean {
	if (!accept) {return true}
	const tokens = accept.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
	if (!tokens.length) {return true}
	const name = file.name.toLowerCase()
	const mime = (file.mimeType ?? '').toLowerCase()
	return tokens.some((token) => {
		if (token === '*/*') {return true}
		if (token.startsWith('.')) {return name.endsWith(token)}
		if (token.endsWith('/*')) {return mime.startsWith(token.slice(0, -1))}
		return mime === token
	})
}

export function formatFileSize(bytes: number): string {
	if (bytes < 1024) {return `${bytes} B`}
	if (bytes < 1024 * 1024) {return `${(bytes / 1024).toFixed(1)} KB`}
	if (bytes < 1024 * 1024 * 1024) {return `${(bytes / (1024 * 1024)).toFixed(1)} MB`}
	return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

export function validateFiles(files: FileInputFile[], opts: FileValidationOptions): FileValidationResult {
	const errors: string[] = []
	const valid: FileInputFile[] = []
	for (const file of files) {
		if (!fileAccepts(file, opts.accept)) {
			errors.push(`${file.name}: file type not accepted`)
			continue
		}

		if (opts.maxSize != null && file.size != null && file.size > opts.maxSize) {
			errors.push(`${file.name}: file exceeds ${formatFileSize(opts.maxSize)}`)
			continue
		}

		valid.push(file)
	}

	if (opts.maxFiles != null && valid.length > opts.maxFiles) {
		const extra = valid.splice(opts.maxFiles)
		for (const file of extra) {errors.push(`${file.name}: exceeds the ${opts.maxFiles}-file limit`)}
	}

	return { valid, errors }
}
