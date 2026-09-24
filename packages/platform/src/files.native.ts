// Files — native leaf. FileRef wraps a real filesystem path under the app's
// documents folder; picking delegates to the imagepicker/file picker seam.
import { File, knownFolders, path } from '@nativescript/core';
import type { FileRef } from './types';

const docs = () => knownFolders.documents();

export const files = {
	/** Not implemented on native yet — file pickers are plugin-shaped;
	 *  media.pickImage covers the common case. Returns null. */
	async pick(_accept?: string): Promise<FileRef | null> {
		return null;
	},
	async readText(ref: FileRef): Promise<string> {
		return File.fromPath(ref.uri).readText();
	},
	async writeText(name: string, text: string): Promise<FileRef> {
		const p = path.join(docs().path, name);
		const f = File.fromPath(p);
		f.writeTextSync(text);
		return { name, uri: p };
	},
	release(ref: FileRef): void {
		const cachePrefix = knownFolders.temp().path + '/';
		if (!ref.uri.startsWith(cachePrefix)) return;
		try {
			File.fromPath(ref.uri).removeSync();
		} catch {}
	},
};
