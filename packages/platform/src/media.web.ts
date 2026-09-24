// Media picking — web leaf. <input type=file accept="image/*"> → FileRef
// (object URL). Multi-select stays out of v1.
import type { FileRef } from './types';
import { files } from './files';

export const media = {
	async pickImage(): Promise<FileRef | null> {
		return files.pick('image/*');
	},
};
