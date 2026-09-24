// Files — web leaf. Opaque FileRef: a blob/object URL plus a name; reads go
// through FileReader/fetch on the ref's URL.
import type { FileRef } from './types';

export const files = {
	async pick(accept = '*/*'): Promise<FileRef | null> {
		return new Promise((resolve) => {
			const input = document.createElement('input');
			input.type = 'file';
			input.accept = accept;
			input.onchange = () => {
				const f = input.files?.[0];
				resolve(f ? { name: f.name, uri: URL.createObjectURL(f) } : null);
			};

			input.oncancel = () => resolve(null);
			input.click();
		});
	},
	async readText(ref: FileRef): Promise<string> {
		return (await fetch(ref.uri)).text();
	},
	/** "Write" on web = a download. Returns the object URL. */
	async writeText(name: string, text: string): Promise<FileRef> {
		const uri = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
		const a = document.createElement('a');
		a.href = uri;
		a.download = name;
		a.click();
		return { name, uri };
	},
	release(ref: FileRef): void {
		URL.revokeObjectURL(ref.uri);
	},
};
