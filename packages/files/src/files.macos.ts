// Files — AppKit host leaf. The dev host has no picker or save panel wired.
import type { FileRef } from './types'

export const files = {
	async pick(): Promise<FileRef | null> {
		throw new Error('unsupported: the AppKit host does not provide a file picker')
	},
	async pickMultiple(): Promise<FileRef[]> {
		throw new Error('unsupported: the AppKit host does not provide a file picker')
	},
	async readText(_file: FileRef): Promise<string> {
		throw new Error('unsupported: AppKit file access is not wired')
	},
	async writeText(_name: string, _text: string): Promise<FileRef> {
		throw new Error('unsupported: the AppKit host does not provide a save panel')
	},
	release(_file: FileRef): void {},
}
